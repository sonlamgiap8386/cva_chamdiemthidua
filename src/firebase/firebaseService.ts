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
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile, MonthlyScoreRecord, Department, UserRole } from '../types';
import { SCHOOL_AVATAR } from '../data/constants';
import { RANKING_COLLECTION, buildRankingDoc, rankingDocId, rankingDocToRecords } from '../utils/rankings';

/**
 * Phạm vi dữ liệu mà một tài khoản được phép đọc. PHẢI khớp firestore.rules:
 * Firestore từ chối cả truy vấn nếu không chứng minh được mọi bản ghi trả về đều được phép,
 * nên tài khoản không phải BGH bắt buộc truy vấn có điều kiện `where`.
 */
export interface DataScope {
  role: UserRole;
  staffId: string;
  departmentId?: string | null;
  year: string;
}

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
    throw err;
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
/** Ghi (merge) một nhóm hồ sơ nhân sự, tự chia lô 200 bản ghi. Chỉ dùng cho tài khoản BGH. */
export async function saveStaffBatchToFirestore(staffList: UserProfile[]): Promise<void> {
  const chunks = chunkArray(staffList, 200);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(staff => {
      // Ảnh đại diện là hằng số của giao diện, không lưu vào Firestore.
      const { avatar: _avatar, ...profile } = staff;
      batch.set(doc(db, 'users', staff.id), cleanDataForFirestore(profile), { merge: true });
    });
    await batch.commit();
  }
}

export async function syncStaffListToFirestore(staffList: UserProfile[]): Promise<{ success: boolean; count: number; syncedAt: string }> {
  try {
    await saveStaffBatchToFirestore(staffList);

    const syncedAt = new Date().toISOString();
    await setDoc(doc(db, 'system_meta', 'staff_sync'), {
      lastSyncedAt: syncedAt,
      totalStaff: staffList.length,
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

/** Xóa hồ sơ nhân sự VÀ toàn bộ bản ghi điểm của người đó (tránh điểm mồ côi trên Firestore). */
export async function deleteStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const scoreSnap = await getDocs(query(collection(db, 'scores'), where('staffId', '==', staffId)));
    for (const chunk of chunkArray(scoreSnap.docs, 400)) {
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', staffId));
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
    const { avatar: _avatar, ...profile } = staff;
    await setDoc(ref, cleanDataForFirestore(profile), { merge: true });
  } catch (err) {
    console.error(`Failed to save staff ${staff.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Real-time subscribers (theo phạm vi quyền)
 * onSnapshot đã trả dữ liệu ban đầu nên không cần getDocs trước đó (tránh đọc trùng, tốn quota).
 */
function scoresQuery(scope: DataScope) {
  const col = collection(db, 'scores');
  if (scope.role === 'bgh') {
    return query(col, where('year', '==', scope.year));
  }
  if (scope.role === 'ttcm' && scope.departmentId) {
    return query(col, where('departmentId', '==', scope.departmentId), where('year', '==', scope.year));
  }
  return query(col, where('staffId', '==', scope.staffId), where('year', '==', scope.year));
}

export function subscribeToScores(
  scope: DataScope,
  onUpdate: (records: MonthlyScoreRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    scoresQuery(scope),
    snapshot => onUpdate(snapshot.docs.map(d => d.data() as MonthlyScoreRecord)),
    error => {
      console.warn('Firestore scores subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/** BGH đọc toàn bộ hồ sơ; Tổ trưởng chỉ đọc tổ mình. Vai trò khác không có quyền liệt kê. */
export function canListStaff(scope: DataScope): boolean {
  return scope.role === 'bgh' || (scope.role === 'ttcm' && !!scope.departmentId);
}

export function subscribeToStaff(
  scope: DataScope,
  onUpdate: (staff: UserProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const col = collection(db, 'users');
  const q = scope.role === 'bgh' ? col : query(col, where('departmentId', '==', scope.departmentId ?? ''));
  return onSnapshot(
    q,
    snapshot => {
      const items = snapshot.docs.map(d => ({ ...d.data(), avatar: SCHOOL_AVATAR } as UserProfile));
      onUpdate(items.sort((a, b) => a.code.localeCompare(b.code)));
    },
    error => {
      console.warn('Firestore staff subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Bảng xếp hạng công khai. BGH công bố lại các tháng bị ảnh hưởng mỗi khi duyệt/khóa/sửa điểm
 * (chỉ kết quả đã duyệt hoặc khóa sổ mới được công bố, xem src/utils/rankings.ts).
 */
export async function publishRankings(records: MonthlyScoreRecord[], year: string, months: readonly number[]): Promise<void> {
  const uniqueMonths = Array.from(new Set(months));
  if (uniqueMonths.length === 0) return;
  const batch = writeBatch(db);
  uniqueMonths.forEach(month => {
    batch.set(doc(db, RANKING_COLLECTION, rankingDocId(year, month)), cleanDataForFirestore(buildRankingDoc(records, year, month)));
  });
  await batch.commit();
}

/** Mọi tài khoản đã cấp quyền đều nghe được bảng xếp hạng công khai của năm học (tối đa 9 tài liệu). */
export function subscribeToRankings(
  year: string,
  onUpdate: (records: MonthlyScoreRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, RANKING_COLLECTION), where('year', '==', year)),
    snapshot => onUpdate(snapshot.docs.flatMap(d => rankingDocToRecords(d.data()))),
    error => {
      console.warn('Firestore rankings subscription error:', error);
      if (onError) onError(error);
    }
  );
}
