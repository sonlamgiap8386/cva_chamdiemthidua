import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

export function getActiveFirebaseConfig(): FirebaseAppConfig {
  const config: FirebaseAppConfig = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ?? '(default)',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  if (!config.projectId || !config.appId || !config.apiKey || !config.authDomain) {
    throw new Error('Thiếu cấu hình Firebase. Hãy thiết lập các biến VITE_FIREBASE_* trước khi triển khai.');
  }
  return config;
}

/** Runtime configuration is intentionally immutable; set VITE_FIREBASE_* at build time. */
export function saveActiveFirebaseConfig(_: Partial<FirebaseAppConfig>): never {
  throw new Error('Cấu hình Firebase chỉ được thiết lập bằng biến môi trường khi triển khai.');
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

export const auth = getAuth(app);

export default db;
