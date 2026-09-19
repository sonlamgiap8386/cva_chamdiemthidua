/*
 * Resets every Firebase Authentication account that has a Firestore `users`
 * profile. Missing Auth accounts are created and every account's claims are
 * synchronized from its profile.
 *
 * Required environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
 *   RESET_PASSWORD=<new shared password>
 *
 * Run: npm run reset:passwords
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const password = process.env.RESET_PASSWORD;

if (!keyPath) throw new Error('Set FIREBASE_SERVICE_ACCOUNT_PATH to the service-account JSON file.');
if (typeof password !== 'string' || password.length < 6) {
  throw new Error('Set RESET_PASSWORD to a password with at least 6 characters.');
}
if (!process.argv.includes('--apply')) {
  throw new Error('Add --apply to confirm the password reset.');
}

const serviceAccount = JSON.parse(await readFile(keyPath, 'utf8'));
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const profiles = await db.collection('users').get();
const missingOnly = process.argv.includes('--missing-only');
const concurrency = missingOnly ? 1 : 8;

async function resetProfile(profileDoc) {
  const profile = profileDoc.data();
  const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!email) {
    return 'skipped';
  }

  let account;
  let wasCreated = false;
  try {
    account = await auth.getUserByEmail(email);
    if (missingOnly) return 'alreadyProvisioned';
    await auth.updateUser(account.uid, { password });
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
    account = await auth.createUser({ email, password, displayName: profile.name ?? undefined });
    wasCreated = true;
  }

  await auth.setCustomUserClaims(account.uid, {
    role: profile.role ?? 'gv',
    staffId: profileDoc.id,
    departmentId: profile.departmentId ?? null,
  });
  return wasCreated ? 'created' : 'updated';
}

const results = new Array(profiles.docs.length);
let nextIndex = 0;
async function worker() {
  while (nextIndex < profiles.docs.length) {
    const index = nextIndex++;
    results[index] = await resetProfile(profiles.docs[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, profiles.docs.length) }, worker));

console.log(JSON.stringify({
  updated: results.filter(result => result === 'updated').length,
  created: results.filter(result => result === 'created').length,
  skipped: results.filter(result => result === 'skipped').length,
  alreadyProvisioned: results.filter(result => result === 'alreadyProvisioned').length,
}, null, 2));
