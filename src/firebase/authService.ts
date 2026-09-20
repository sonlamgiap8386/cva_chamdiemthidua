import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  getIdTokenResult,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

/** Gửi email đặt lại mật khẩu. Firebase không tiết lộ email có tồn tại hay không. */
export function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export function signOutUser() {
  return signOut(auth);
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export interface AuthorizationClaims {
  role?: 'bgh' | 'ttcm' | 'btd' | 'gv';
  staffId?: string;
  departmentId?: string;
}

/** Authorization is derived from Firebase custom claims, never from browser state. */
export async function getAuthorizationClaims(user: User): Promise<AuthorizationClaims> {
  const token = await getIdTokenResult(user, true);
  return token.claims as AuthorizationClaims;
}

export async function changeCurrentPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
