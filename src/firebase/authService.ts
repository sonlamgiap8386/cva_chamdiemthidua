import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { INITIAL_USERS } from '../../scripts/seed/mockData';

export interface AuthorizationClaims {
  role?: 'bgh' | 'ttcm' | 'btd' | 'gv';
  staffId?: string;
  departmentId?: string;
}

// In-memory mock authentication state for AI Studio preview
type AuthListener = (user: User | null) => void;
const mockAuthListeners = new Set<AuthListener>();
let currentMockUser: User | null = null;

function getStoredMockUser(): User | null {
  if (typeof window === 'undefined') return null;
  const storedId = sessionStorage.getItem('demo_user_id');
  if (!storedId) return null;
  const staff = INITIAL_USERS.find(u => u.id === storedId || u.email.toLowerCase() === storedId.toLowerCase());
  if (!staff) return null;
  return {
    uid: staff.id,
    email: staff.email,
    displayName: staff.name,
  } as unknown as User;
}

// Khôi phục phiên làm việc xem trước nếu có trong sessionStorage
if (typeof window !== 'undefined') {
  currentMockUser = getStoredMockUser();
}

function notifyMockListeners(user: User | null) {
  currentMockUser = user;
  mockAuthListeners.forEach(listener => {
    try {
      listener(user);
    } catch (err) {
      console.error('Error in mock auth listener:', err);
    }
  });
}

/** Đăng nhập trực tiếp bằng tài khoản Google (OAuth popup). */
export async function signInWithGoogle() {
  if (isFirebaseConfigured) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('demo_user_id');
    }
    currentMockUser = null;
    return result;
  }
  throw new Error('Cấu hình Firebase chưa sẵn sàng.');
}

/** Đăng nhập nhanh chế độ xem trước dành cho cán bộ giáo viên nhà trường. */
export function signInPreviewStaff(emailOrId: string) {
  const normalized = emailOrId.trim().toLowerCase();
  const matchedUser = INITIAL_USERS.find(
    u => u.id.toLowerCase() === normalized || u.email.toLowerCase() === normalized
  );
  if (!matchedUser) {
    throw new Error('Email không tồn tại trong danh sách cán bộ giáo viên nhà trường.');
  }

  const mockUser = {
    uid: matchedUser.id,
    email: matchedUser.email,
    displayName: matchedUser.name,
  } as unknown as User;

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('demo_user_id', matchedUser.id);
  }

  notifyMockListeners(mockUser);
  return { user: mockUser };
}

export async function signIn(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isFirebaseConfigured) {
    throw new Error('Dự án chưa được kết nối Firebase. Vui lòng kiểm tra lại cấu hình.');
  }

  // Xác thực trực tiếp 100% với máy chủ Google Firebase Authentication
  const res = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('demo_user_id');
  }
  currentMockUser = null;
  return res;
}

/** Gửi email đặt lại mật khẩu. */
export function requestPasswordReset(email: string) {
  if (isFirebaseConfigured) {
    return sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }
  return Promise.resolve();
}

export function signOutUser() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('demo_user_id');
  }
  currentMockUser = null;
  notifyMockListeners(null);
  if (isFirebaseConfigured) {
    return signOut(auth).catch(() => {});
  }
  return Promise.resolve();
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (isFirebaseConfigured) {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        callback(user);
      } else if (currentMockUser) {
        callback(currentMockUser);
      } else {
        callback(null);
      }
    });
    mockAuthListeners.add(callback);
    // Nếu đang có phiên làm việc xem trước cục bộ:
    if (currentMockUser && !auth.currentUser) {
      setTimeout(() => callback(currentMockUser), 0);
    }
    return () => {
      unsub();
      mockAuthListeners.delete(callback);
    };
  }

  mockAuthListeners.add(callback);
  setTimeout(() => {
    callback(currentMockUser);
  }, 0);

  return () => {
    mockAuthListeners.delete(callback);
  };
}

/** Authorization is derived from Firebase custom claims, or mock profiles in demo mode. */
export async function getAuthorizationClaims(user: User): Promise<AuthorizationClaims> {
  let claims: AuthorizationClaims = {};
  if (isFirebaseConfigured) {
    try {
      const token = await getIdTokenResult(user, true);
      claims = (token.claims || {}) as AuthorizationClaims;
    } catch (err) {
      console.warn('getIdTokenResult error:', err);
    }
  }

  if (claims.role && claims.staffId) {
    return claims;
  }

  // Tra cứu theo danh sách nhân sự nhà trường nếu claims chưa được gán qua Admin SDK
  const staff = INITIAL_USERS.find(u => u.id === user.uid || u.email.toLowerCase() === user.email?.toLowerCase());
  if (!staff) {
    return claims;
  }

  return {
    role: staff.role,
    staffId: staff.id,
    departmentId: staff.departmentId,
  };
}

export async function changeCurrentPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (isFirebaseConfigured) {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return;
  }
  // In demo preview, mock successful password change
  return Promise.resolve();
}
