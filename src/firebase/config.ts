import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

import appletConfig from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const STORAGE_KEY = 'cva_firebase_custom_config';

function getStoredCustomConfig(): Partial<FirebaseAppConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const isFirebaseConfigured: boolean = Boolean(
  (appletConfig?.projectId && appletConfig?.apiKey) ||
  (import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) ||
  getStoredCustomConfig()?.apiKey
);

export function getActiveFirebaseConfig(): FirebaseAppConfig {
  const stored = getStoredCustomConfig() || {};
  const envConfig = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  return {
    projectId: stored.projectId || appletConfig.projectId || envConfig.projectId || 'cva-cham-diem-thi-dua',
    appId: stored.appId || appletConfig.appId || envConfig.appId || '1:18946166372:web:cva_thi_dua_web',
    apiKey: stored.apiKey || appletConfig.apiKey || envConfig.apiKey,
    authDomain: stored.authDomain || appletConfig.authDomain || envConfig.authDomain || 'cva-cham-diem-thi-dua.firebaseapp.com',
    firestoreDatabaseId: stored.firestoreDatabaseId || appletConfig.firestoreDatabaseId || envConfig.firestoreDatabaseId || '(default)',
    storageBucket: stored.storageBucket || appletConfig.storageBucket || envConfig.storageBucket || 'cva-cham-diem-thi-dua.firebasestorage.app',
    messagingSenderId: stored.messagingSenderId || appletConfig.messagingSenderId || envConfig.messagingSenderId || '18946166372',
    measurementId: stored.measurementId || appletConfig.measurementId || envConfig.measurementId || '',
  };
}

/** Lưu cấu hình tùy chỉnh vào trình duyệt cho trường hợp người dùng cập nhật thông tin Web App. */
export function saveActiveFirebaseConfig(newConfig: Partial<FirebaseAppConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getActiveFirebaseConfig();
  const merged = { ...current, ...newConfig };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export const firebaseConfig = getActiveFirebaseConfig();

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db: Firestore = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);

export default db;
