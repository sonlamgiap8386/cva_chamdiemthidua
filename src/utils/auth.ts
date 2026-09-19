import { UserProfile } from '../types';

/** Password reset is performed only by Firebase Authentication administration. */
export const DEFAULT_PASSWORD = 'Liên hệ quản trị viên để đặt lại qua Firebase Authentication';

/** UI convenience only; Firestore Rules remain the authorization boundary. */
export function isAdministrator(user: UserProfile | null | undefined): boolean {
  return user?.role === 'bgh';
}
