/*
 * Đồng bộ QUYỀN (Firebase custom claims) từ hồ sơ Firestore `users` sang tài khoản Authentication.
 * KHÔNG đổi mật khẩu của bất kỳ ai (khác với reset-user-passwords.mjs).
 *
 * Cần chạy sau khi: đổi Tổ trưởng chuyên môn, đổi vai trò/tổ của cán bộ, hoặc thêm cán bộ mới
 * (thêm mới cần cấp tài khoản trước: npm run reset:passwords -- --missing-only).
 *
 * Biến môi trường:  FIREBASE_SERVICE_ACCOUNT_PATH=/duong/dan/tuyet-doi/service-account.json
 * Chạy thử:         npm run sync:claims -- --dry-run
 * Chạy thật:        npm run sync:claims
 * Khóa tài khoản không còn hồ sơ (cán bộ đã xóa/nghỉ):  npm run sync:claims -- --disable-orphans
 *   (luôn chạy --dry-run trước để xem danh sách sẽ bị khóa)
 *
 * Người có quyền bị đổi sẽ bị đăng xuất khỏi mọi thiết bị (revokeRefreshTokens) để quyền mới có hiệu lực ngay.
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!keyPath) throw new Error('Set FIREBASE_SERVICE_ACCOUNT_PATH to the service-account JSON file.');
const dryRun = process.argv.includes('--dry-run');
const disableOrphans = process.argv.includes('--disable-orphans');

const serviceAccount = JSON.parse(await readFile(keyPath, 'utf8'));
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const VALID_ROLES = new Set(['bgh', 'ttcm', 'btd', 'gv']);
const desiredClaims = (id, profile) => ({
  role: VALID_ROLES.has(profile.role) ? profile.role : 'gv',
  staffId: id,
  departmentId: profile.departmentId ?? null,
});
const sameClaims = (current, wanted) =>
  !!current &&
  current.role === wanted.role &&
  current.staffId === wanted.staffId &&
  (current.departmentId ?? null) === (wanted.departmentId ?? null);

const profiles = await db.collection('users').get();
const emailsWithProfile = new Set();
const summary = { dryRun, updated: 0, unchanged: 0, skippedNoEmail: 0, noAccount: [], orphanAccounts: [], disabled: 0 };

for (const profileDoc of profiles.docs) {
  const profile = profileDoc.data();
  const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!email) { summary.skippedNoEmail++; continue; }
  emailsWithProfile.add(email);

  let account;
  try {
    account = await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') { summary.noAccount.push(email); continue; }
    throw error;
  }

  const wanted = desiredClaims(profileDoc.id, profile);
  if (sameClaims(account.customClaims, wanted)) { summary.unchanged++; continue; }

  if (!dryRun) {
    await auth.setCustomUserClaims(account.uid, wanted);
    await auth.revokeRefreshTokens(account.uid);
  }
  summary.updated++;
}

let pageToken;
do {
  const page = await auth.listUsers(1000, pageToken);
  for (const account of page.users) {
    const email = account.email?.toLowerCase();
    if (email && emailsWithProfile.has(email)) continue;
    summary.orphanAccounts.push(email ?? account.uid);
    if (disableOrphans && !dryRun && !account.disabled) {
      await auth.updateUser(account.uid, { disabled: true });
      await auth.revokeRefreshTokens(account.uid);
      summary.disabled++;
    }
  }
  pageToken = page.pageToken;
} while (pageToken);

console.log(JSON.stringify(summary, null, 2));
if (summary.noAccount.length > 0) {
  console.log('\nCác hồ sơ CHƯA có tài khoản đăng nhập. Chạy: npm run reset:passwords -- --missing-only');
}
