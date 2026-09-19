import {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile, MonthlyScoreRecord, Department } from '../types';
import { SCHOOL_AVATAR } from '../data/staffData';

export interface FirebaseSyncStatus {
  connected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  totalTeachersInCloud: number;
  totalRecordsInCloud: number;
}

// Test Firebase connection as instructed by guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt a light server fetch to confirm connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted:', error.message);
      return false;
    }
    // Often doc not found is still a successful network roundtrip
    return true;
  }
}

// Chunking helper for Firestore batch limit of 500 operations
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Recursively removes any object properties whose values are `undefined`.
 * Firestore WriteBatch.set() and setDoc() throw errors if any field is `undefined`.
 */
export function cleanDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanDataForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) {
      return data;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Sync Departments
 */
export async function syncDepartmentsToFirestore(departments: Department[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    departments.forEach(dept => {
      const ref = doc(db, 'departments', dept.id);
      batch.set(ref, cleanDataForFirestore(dept), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error syncing departments to Firestore:', err);
  }
}

export async function fetchDepartmentsFromFirestore(): Promise<Department[]> {
  try {
    const snap = await getDocs(collection(db, 'departments'));
    if (snap.empty) return [];
    return snap.docs.map(d => d.data() as Department);
  } catch (err) {
    console.error('Error fetching departments from Firestore:', err);
    throw err;
  }
}

/**
 * Sync & Fetch Teachers (User Profiles)
 */
export async function syncStaffListToFirestore(staffList: UserProfile[]): Promise<{ success: boolean; count: number; syncedAt: string }> {
  try {
    const chunks = chunkArray(staffList, 200);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(staff => {
        const ref = doc(db, 'users', staff.id);
        batch.set(ref, cleanDataForFirestore(staff), { merge: true });
      });
      await batch.commit();
    }

    // Save official synchronization metadata record in Firestore
    const syncedAt = new Date().toISOString();
    const metaRef = doc(db, 'system_meta', 'staff_sync');
    await setDoc(metaRef, {
      lastSyncedAt: syncedAt,
      totalStaff: staffList.length,
      syncedDatabase: 'ai-studio-hthngthiuacbvctr-df0f8bb6-ece4-4d07-b7f6-2c28924b8b19',
      status: 'officially_stored'
    }, { merge: true });

    return { success: true, count: staffList.length, syncedAt };
  } catch (err) {
    console.error('Error syncing staff list to Firestore:', err);
    throw err;
  }
}

export async function fetchStaffSyncMetaFromFirestore(): Promise<{ lastSyncedAt: string | null; totalStaff: number } | null> {
  try {
    const metaRef = doc(db, 'system_meta', 'staff_sync');
    const snap = await getDoc(metaRef);
    if (snap.exists()) {
      return snap.data() as { lastSyncedAt: string | null; totalStaff: number };
    }
    return null;
  } catch (err) {
    console.warn('Error fetching staff sync meta:', err);
    return null;
  }
}

export async function deleteStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', staffId);
    await deleteDoc(ref);
  } catch (err) {
    console.error(`Failed to delete staff ${staffId} from Firestore:`, err);
    throw err;
  }
}

export async function fetchStaffFromFirestore(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return [];
    const users = snap.docs.map(d => ({ ...d.data(), avatar: SCHOOL_AVATAR } as UserProfile));
    return users.sort((a, b) => a.code.localeCompare(b.code));
  } catch (err) {
    console.warn('Error fetching staff from Firestore:', err);
    throw err;
  }
}

/**
 * Sync & Fetch Monthly Scores
 */
export async function syncScoresToFirestore(scores: MonthlyScoreRecord[]): Promise<void> {
  try {
    const chunks = chunkArray(scores, 200);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(score => {
        const ref = doc(db, 'scores', score.id);
        batch.set(ref, cleanDataForFirestore(score), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error syncing scores to Firestore:', err);
    throw err;
  }
}

export async function fetchScoresFromFirestore(): Promise<MonthlyScoreRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'scores'));
    if (snap.empty) return [];
    return snap.docs.map(d => d.data() as MonthlyScoreRecord);
  } catch (err) {
    console.warn('Error fetching scores from Firestore:', err);
    throw err;
  }
}

/** Returns the staff profile associated with an authenticated Firebase account. */
export async function fetchStaffById(staffId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', staffId));
  return snap.exists() ? ({ ...snap.data(), avatar: SCHOOL_AVATAR } as UserProfile) : null;
}

/**
 * Save / Update a single score record in Firestore
 */
export async function saveSingleScoreToFirestore(record: MonthlyScoreRecord): Promise<void> {
  try {
    const ref = doc(db, 'scores', record.id);
    await setDoc(ref, cleanDataForFirestore(record), { merge: true });
  } catch (err) {
    console.error(`Failed to save score ${record.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Save multiple score records in Firestore
 */
export async function saveMultipleScoresToFirestore(records: MonthlyScoreRecord[]): Promise<void> {
  try {
    const chunks = chunkArray(records, 200);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(rec => {
        const ref = doc(db, 'scores', rec.id);
        batch.set(ref, cleanDataForFirestore(rec), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to save multiple scores to Firestore:', err);
    throw err;
  }
}

/**
 * Save / Update a single teacher profile
 */
export async function saveSingleStaffToFirestore(staff: UserProfile): Promise<void> {
  try {
    const ref = doc(db, 'users', staff.id);
    await setDoc(ref, cleanDataForFirestore(staff), { merge: true });
  } catch (err) {
    console.error(`Failed to save staff ${staff.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Real-time subscribers
 */
export function subscribeToScores(
  onUpdate: (records: MonthlyScoreRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'scores');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => d.data() as MonthlyScoreRecord);
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Firestore scores subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export function subscribeToStaff(
  onUpdate: (staff: UserProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({ ...d.data(), avatar: SCHOOL_AVATAR } as UserProfile));
        onUpdate(items.sort((a, b) => a.code.localeCompare(b.code)));
      }
    },
    (error) => {
      console.warn('Firestore staff subscription error:', error);
      if (onError) onError(error);
    }
  );
}
