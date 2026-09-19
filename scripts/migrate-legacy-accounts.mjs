/*
 * One-time migration from the legacy Firestore `user_passwords` collection.
 * Requires a Firebase service-account JSON file. It never prints passwords.
 * Run with: FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/key.json node scripts/migrate-legacy-accounts.mjs
 * Add --purge-legacy-passwords only after users have tested sign-in.
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!keyPath) throw new Error('Set FIREBASE_SERVICE_ACCOUNT_PATH to the service-account JSON file.');
const serviceAccount = JSON.parse(await readFile(keyPath, 'utf8'));
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const purge = process.argv.includes('--purge-legacy-passwords');
const [users, passwords] = await Promise.all([db.collection('users').get(), db.collection('user_passwords').get()]);
const passwordById = new Map(passwords.docs.map(doc => [doc.id, doc.data().password]));
let created = 0, existing = 0, skipped = 0;

for (const profileDoc of users.docs) {
  const profile = profileDoc.data();
  const password = passwordById.get(profileDoc.id);
  if (!profile.email || typeof password !== 'string' || password.length < 6) { skipped++; continue; }
  let account;
  try { account = await auth.getUserByEmail(profile.email); existing++; }
  catch {
    account = await auth.createUser({ email: profile.email.trim().toLowerCase(), password, displayName: profile.name ?? undefined });
    created++;
  }
  // Rules authorize from claims, not mutable browser-controlled profile fields.
  await auth.setCustomUserClaims(account.uid, {
    role: profile.role ?? 'gv',
    staffId: profileDoc.id,
    departmentId: profile.departmentId ?? null,
  });
}

if (purge) {
  const batch = db.batch();
  passwords.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}
console.log(JSON.stringify({ created, existing, skipped, legacyPasswordsDeleted: purge }, null, 2));
