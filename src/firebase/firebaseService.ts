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
import { db, auth, isFirebaseConfigured } from './config';
import { UserProfile, MonthlyScoreRecord, Department, UserRole } from '../types';
import { SCHOOL_AVATAR } from '../data/constants';
import { RANKING_COLLECTION, buildRankingDoc, rankingDocId, rankingDocToRecords } from '../utils/rankings';
import { INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_MONTHLY_SCORES } from '../../scripts/seed/mockData';

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

// ==========================================
// In-memory Mock Data Store (AI Studio Preview)
// ==========================================
let mockStaff: UserProfile[] = [...INITIAL_USERS];
let mockDepartments: Department[] = [...INITIAL_DEPARTMENTS];
let mockScores: MonthlyScoreRecord[] = [...INITIAL_MONTHLY_SCORES];

type Listener<T> = (data: T) => void;
const staffListeners = new Set<{ scope: DataScope; cb: Listener<UserProfile[]> }>();
const scoreListeners = new Set<{ scope: DataScope; cb: Listener<MonthlyScoreRecord[]> }>();
const rankingListeners = new Set<{ year: string; cb: Listener<MonthlyScoreRecord[]> }>();

function notifyStaffListeners() {
  staffListeners.forEach(({ scope, cb }) => {
    try {
      const q = scope.role === 'bgh'
        ? mockStaff
        : mockStaff.filter(u => u.departmentId === (scope.departmentId ?? ''));
      cb([...q].sort((a, b) => a.code.localeCompare(b.code)));
    } catch (e) {
      console.error(e);
    }
  });
}

function notifyScoreListeners() {
  scoreListeners.forEach(({ scope, cb }) => {
    try {
      let filtered = mockScores.filter(s => s.year === scope.year);
      if (scope.role === 'ttcm' && scope.departmentId) {
        filtered = filtered.filter(s => s.departmentId === scope.departmentId);
      } else if (scope.role !== 'bgh') {
        filtered = filtered.filter(s => s.staffId === scope.staffId);
      }
      cb(filtered);
    } catch (e) {
      console.error(e);
    }
  });
}

function notifyRankingListeners(year: string) {
  rankingListeners.forEach(({ year: lYear, cb }) => {
    if (lYear === year) {
      try {
        const approvedOrLocked = mockScores.filter(s => s.year === year && (s.status === 'approved' || s.status === 'locked'));
        cb(approvedOrLocked);
      } catch (e) {
        console.error(e);
      }
    }
  });
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted:', error.message);
      return false;
    }
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
  if (!isFirebaseConfigured) {
    mockDepartments = [...departments];
    return;
  }
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
  if (!isFirebaseConfigured) {
    return [...mockDepartments];
  }
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
export async function saveStaffBatchToFirestore(staffList: UserProfile[]): Promise<void> {
  if (!isFirebaseConfigured) {
    const map = new Map(mockStaff.map(s => [s.id, s]));
    staffList.forEach(s => map.set(s.id, s));
    mockStaff = Array.from(map.values());
    notifyStaffListeners();
    return;
  }
  const chunks = chunkArray(staffList, 200);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(staff => {
      const { avatar: _avatar, ...profile } = staff;
      batch.set(doc(db, 'users', staff.id), cleanDataForFirestore(profile), { merge: true });
    });
    await batch.commit();
  }
}

export async function syncStaffListToFirestore(staffList: UserProfile[]): Promise<{ success: boolean; count: number; syncedAt: string }> {
  if (!isFirebaseConfigured) {
    mockStaff = [...staffList];
    notifyStaffListeners();
    return { success: true, count: staffList.length, syncedAt: new Date().toISOString() };
  }
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
  if (!isFirebaseConfigured) {
    return { lastSyncedAt: new Date().toISOString(), totalStaff: mockStaff.length };
  }
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

/** Xóa hồ sơ nhân sự VÀ toàn bộ bản ghi điểm của người đó */
export async function deleteStaffFromFirestore(staffId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    mockStaff = mockStaff.filter(u => u.id !== staffId);
    mockScores = mockScores.filter(s => s.staffId !== staffId);
    notifyStaffListeners();
    notifyScoreListeners();
    return;
  }
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
  if (!isFirebaseConfigured) {
    return [...mockStaff].sort((a, b) => a.code.localeCompare(b.code));
  }
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
  if (!isFirebaseConfigured) {
    const map = new Map(mockScores.map(s => [s.id, s]));
    scores.forEach(s => map.set(s.id, s));
    mockScores = Array.from(map.values());
    notifyScoreListeners();
    return;
  }
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
  if (!isFirebaseConfigured) {
    return [...mockScores];
  }
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
  const fallback = INITIAL_USERS.find(u => u.id === staffId) || mockStaff.find(u => u.id === staffId);
  if (!isFirebaseConfigured || !auth.currentUser) {
    return fallback ? { ...fallback, avatar: SCHOOL_AVATAR } : null;
  }
  try {
    const snap = await getDoc(doc(db, 'users', staffId));
    if (snap.exists()) {
      return { ...snap.data(), avatar: SCHOOL_AVATAR } as UserProfile;
    }
  } catch (err) {
    console.warn('fetchStaffById fallback to local data:', err);
  }
  return fallback ? { ...fallback, avatar: SCHOOL_AVATAR } : null;
}

/**
 * Save / Update a single score record in Firestore
 */
export async function saveSingleScoreToFirestore(record: MonthlyScoreRecord): Promise<void> {
  if (!isFirebaseConfigured) {
    const idx = mockScores.findIndex(s => s.id === record.id);
    if (idx >= 0) {
      mockScores[idx] = record;
    } else {
      mockScores.push(record);
    }
    notifyScoreListeners();
    return;
  }
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
  if (!isFirebaseConfigured) {
    const map = new Map(mockScores.map(s => [s.id, s]));
    records.forEach(r => map.set(r.id, r));
    mockScores = Array.from(map.values());
    notifyScoreListeners();
    return;
  }
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
  if (!isFirebaseConfigured) {
    const idx = mockStaff.findIndex(s => s.id === staff.id);
    if (idx >= 0) {
      mockStaff[idx] = staff;
    } else {
      mockStaff.push(staff);
    }
    notifyStaffListeners();
    return;
  }
  try {
    const ref = doc(db, 'users', staff.id);
    const { avatar: _avatar, ...profile } = staff;
    await setDoc(ref, cleanDataForFirestore(profile), { merge: true });
  } catch (err) {
    console.error(`Failed to save staff ${staff.id} to Firestore:`, err);
    throw err;
  }
}

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
  if (!isFirebaseConfigured) {
    const entry = { scope, cb: onUpdate };
    scoreListeners.add(entry);
    // Initial emission
    setTimeout(() => {
      let filtered = mockScores.filter(s => s.year === scope.year);
      if (scope.role === 'ttcm' && scope.departmentId) {
        filtered = filtered.filter(s => s.departmentId === scope.departmentId);
      } else if (scope.role !== 'bgh') {
        filtered = filtered.filter(s => s.staffId === scope.staffId);
      }
      onUpdate(filtered);
    }, 0);
    return () => {
      scoreListeners.delete(entry);
    };
  }

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
  if (!isFirebaseConfigured) {
    const entry = { scope, cb: onUpdate };
    staffListeners.add(entry);
    setTimeout(() => {
      const q = scope.role === 'bgh'
        ? mockStaff
        : mockStaff.filter(u => u.departmentId === (scope.departmentId ?? ''));
      onUpdate([...q].sort((a, b) => a.code.localeCompare(b.code)));
    }, 0);
    return () => {
      staffListeners.delete(entry);
    };
  }

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
 * Bảng xếp hạng công khai.
 */
export async function publishRankings(records: MonthlyScoreRecord[], year: string, months: readonly number[]): Promise<void> {
  const uniqueMonths = Array.from(new Set(months));
  if (uniqueMonths.length === 0) return;

  if (!isFirebaseConfigured) {
    notifyRankingListeners(year);
    return;
  }

  const batch = writeBatch(db);
  uniqueMonths.forEach(month => {
    batch.set(doc(db, RANKING_COLLECTION, rankingDocId(year, month)), cleanDataForFirestore(buildRankingDoc(records, year, month)));
  });
  await batch.commit();
}

/** Mọi tài khoản đã cấp quyền đều nghe được bảng xếp hạng công khai của năm học. */
export function subscribeToRankings(
  year: string,
  onUpdate: (records: MonthlyScoreRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    const entry = { year, cb: onUpdate };
    rankingListeners.add(entry);
    setTimeout(() => {
      const approvedOrLocked = mockScores.filter(s => s.year === year && (s.status === 'approved' || s.status === 'locked'));
      onUpdate(approvedOrLocked);
    }, 0);
    return () => {
      rankingListeners.delete(entry);
    };
  }

  return onSnapshot(
    query(collection(db, RANKING_COLLECTION), where('year', '==', year)),
    snapshot => onUpdate(snapshot.docs.flatMap(d => rankingDocToRecords(d.data()))),
    error => {
      console.warn('Firestore rankings subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Tự động khởi tạo dữ liệu danh sách tổ chuyên môn, 104 cán bộ giáo viên và điểm thi đua
 * lên Firestore nếu cơ sở dữ liệu Cloud còn trống (lần đầu tạo dự án Firebase).
 */
export async function initializeFirestoreIfEmpty(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const metaRef = doc(db, 'system_meta', 'staff_sync');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      console.log('Khởi tạo dữ liệu thực tế ban đầu cho Firestore...');
      await syncDepartmentsToFirestore(INITIAL_DEPARTMENTS);
      await saveStaffBatchToFirestore(INITIAL_USERS);
      await syncScoresToFirestore(INITIAL_MONTHLY_SCORES);
      await publishRankings(INITIAL_MONTHLY_SCORES, '2025-2026', [9, 10, 11, 12, 1, 2, 3, 4, 5]);
      await setDoc(metaRef, {
        lastSyncedAt: new Date().toISOString(),
        totalStaff: INITIAL_USERS.length,
        status: 'officially_stored',
        projectId: 'cva-cham-diem-thi-dua'
      }, { merge: true });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Không thể tự động khởi tạo Firestore (có thể do quyền hạn):', err);
    return false;
  }
}

