import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';

// These screens are only needed after navigation. Splitting them keeps the
// first dashboard render responsive, especially because reports includes XLSX.
const MonthlyScoringTable = lazy(() => import('./components/MonthlyScoringTable').then(({ MonthlyScoringTable }) => ({ default: MonthlyScoringTable })));
const ScoringModal = lazy(() => import('./components/ScoringModal').then(({ ScoringModal }) => ({ default: ScoringModal })));
const RealTimeLeaderboard = lazy(() => import('./components/RealTimeLeaderboard').then(({ RealTimeLeaderboard }) => ({ default: RealTimeLeaderboard })));
const CriteriaGuide = lazy(() => import('./components/CriteriaGuide').then(({ CriteriaGuide }) => ({ default: CriteriaGuide })));
const ReportsView = lazy(() => import('./components/ReportsView').then(({ ReportsView }) => ({ default: ReportsView })));
const CloudBackupView = lazy(() => import('./components/CloudBackupView').then(({ CloudBackupView }) => ({ default: CloudBackupView })));
const FutureModulesView = lazy(() => import('./components/FutureModulesView').then(({ FutureModulesView }) => ({ default: FutureModulesView })));
const StaffDirectory = lazy(() => import('./components/StaffDirectory').then(({ StaffDirectory }) => ({ default: StaffDirectory })));
const PushNotificationDrawer = lazy(() => import('./components/PushNotificationDrawer').then(({ PushNotificationDrawer }) => ({ default: PushNotificationDrawer })));
const LoginPage = lazy(() => import('./components/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })));
const ChangeOwnPasswordModal = lazy(() => import('./components/ChangeOwnPasswordModal').then(({ ChangeOwnPasswordModal }) => ({ default: ChangeOwnPasswordModal })));

const LoadingView = () => (
  <div className="py-12 text-center text-sm text-emerald-300">Đang tải dữ liệu…</div>
);

import {
  UserProfile,
  MonthlyScoreRecord,
  AppNotification,
  CloudBackup,
  Department,
  UserRole
} from './types';
import { DEPARTMENT_SKELETON } from './data/departments';
import { SCHOOL_AVATAR, CURRENT_SCHOOL_YEAR, MONTHLY_BASE_SCORE } from './data/constants';
import {
  loadBackups,
  saveBackups,
  loadNotifications,
  saveNotifications,
  loadSettings,
  saveSettings,
  createCloudSnapshot,
  purgeLegacyStorage,
  MAX_LOCAL_BACKUPS,
  AppSettings
} from './utils/storage';
import {
  canListStaff,
  saveStaffBatchToFirestore,
  fetchStaffFromFirestore,
  syncStaffListToFirestore,
  deleteStaffFromFirestore,
  fetchScoresFromFirestore,
  syncScoresToFirestore,
  fetchDepartmentsFromFirestore,
  syncDepartmentsToFirestore,
  saveSingleScoreToFirestore,
  saveMultipleScoresToFirestore,
  subscribeToScores,
  subscribeToStaff,
  subscribeToRankings,
  publishRankings,
  fetchStaffById,
  type DataScope
} from './firebase/firebaseService';
import { isOfficialResult } from './utils/rankings';
import { getAuthorizationClaims, observeAuthState, signOutUser } from './firebase/authService';
import { SCHOOL_YEAR_MONTHS } from './utils/academicYear';

/** Chuyển lỗi Firebase kỹ thuật thành thông báo người dùng hiểu được. */
function describeFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'permission-denied') return 'Bạn không có quyền thực hiện thao tác này, hoặc dữ liệu đã được khóa/duyệt.';
  if (code === 'unavailable' || code === 'network-request-failed') return 'Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  if (code === 'failed-precondition') return 'Truy vấn cần chỉ mục Firestore. Quản trị viên vui lòng xem console trình duyệt để tạo chỉ mục.';
  return (err as { message?: string })?.message || 'Lỗi không xác định.';
}

type Banner = { kind: 'error' | 'info'; text: string };

export default function App() {
  // Application state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENT_SKELETON);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [currentMonth, setCurrentMonth] = useState<number>(9);

  // Persistent data state
  const [scores, setScores] = useState<MonthlyScoreRecord[]>([]);
  // Bảng xếp hạng công khai (kết quả đã duyệt) dành cho tài khoản không phải BGH.
  const [publicRankings, setPublicRankings] = useState<MonthlyScoreRecord[]>([]);
  const [backups, setBackups] = useState<CloudBackup[]>(() => loadBackups());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Firebase Live Sync State
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connected: boolean;
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
    teachersCount: number;
    scoresCount: number;
  }>({
    connected: false,
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    teachersCount: 0,
    scoresCount: 0,
  });

  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedRecordToScore, setSelectedRecordToScore] = useState<MonthlyScoreRecord | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    // Xóa dữ liệu điểm/nhân sự khỏi bộ nhớ khi đăng xuất (máy dùng chung trong phòng hội đồng).
    setScores([]);
    setAllUsers([]);
    setBanner(null);
  };

  const reportSaveError = useCallback((action: string, err: unknown) => {
    console.error(`Lỗi khi ${action}:`, err);
    setBanner({ kind: 'error', text: `Không thể ${action}: ${describeFirebaseError(err)}` });
  }, []);

  useEffect(() => { purgeLegacyStorage(); }, []);

  // Công bố lại bảng xếp hạng công khai cho các tháng bị ảnh hưởng (chỉ BGH được ghi).
  const republishRankings = useCallback((nextScores: MonthlyScoreRecord[], months: number[]) => {
    if (currentUser?.role !== 'bgh' || months.length === 0) return;
    publishRankings(nextScores, CURRENT_SCHOOL_YEAR, months)
      .catch(err => reportSaveError('công bố bảng xếp hạng (dùng nút Đồng bộ để công bố lại)', err));
  }, [currentUser?.role, reportSaveError]);

  useEffect(() => observeAuthState(async firebaseUser => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setAuthReady(true);
      return;
    }
    try {
      const claims = await getAuthorizationClaims(firebaseUser);
      if (!claims.staffId || !claims.role) throw new Error('Tài khoản chưa được cấp quyền truy cập. Vui lòng liên hệ Quản trị viên.');
      const profile = await fetchStaffById(claims.staffId);
      if (!profile) throw new Error('Không tìm thấy hồ sơ cán bộ của tài khoản này. Vui lòng liên hệ Quản trị viên.');
      if (profile.role !== claims.role || (claims.role === 'ttcm' && profile.departmentId !== claims.departmentId)) {
        throw new Error('Quyền của tài khoản đang được cập nhật. Vui lòng liên hệ Quản trị viên để đồng bộ quyền (npm run sync:claims) rồi đăng nhập lại.');
      }
      setAuthNotice('');
      setCurrentUser(profile);
    } catch (err) {
      setAuthNotice(
        (err as { code?: string })?.code
          ? describeFirebaseError(err)
          : err instanceof Error ? err.message : 'Không thể xác thực tài khoản.'
      );
      await signOutUser();
      setCurrentUser(null);
    } finally {
      setAuthReady(true);
    }
  }), []);

  // Firestore is the source of truth. Browser storage is never used as an offline
  // fallback for scores, because that would make unsaved changes look official.

  useEffect(() => {
    saveBackups(backups);
  }, [backups]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Tab titles
  const tabTitles: Record<NavTab, string> = {
    overview: 'Tổng quan tháng',
    scoring: 'Chấm điểm tháng',
    leaderboard: 'Bảng xếp hạng (Thời gian thực)',
    staff: 'Danh sách CBVC',
    criteria: 'Bộ tiêu chí thi đua',
    reports: 'Báo cáo & Xuất Excel',
    backup: 'Lưu trữ Firebase Cloud',
    modules: 'Module mở rộng',
  };

  // Perform Cloud Snapshot
  const handlePerformBackup = useCallback((
    isAuto: boolean = false,
    desc: string = 'Sao lưu hệ thống',
    snapshotScores: MonthlyScoreRecord[] = scores
  ) => {
    setIsBackingUp(true);
    setTimeout(() => {
      const newBackup = createCloudSnapshot(snapshotScores, isAuto, desc);
      setBackups(prev => [newBackup, ...prev].slice(0, MAX_LOCAL_BACKUPS));
      setSettings(prev => ({
        ...prev,
        lastBackupAt: newBackup.createdAt
      }));
      setIsBackingUp(false);
    }, 600);
  }, [scores]);

  // Firebase Full Sync
  const handleSyncAllToFirebase = useCallback(async () => {
    setFirebaseStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await Promise.all([
        syncStaffListToFirestore(allUsers),
        syncScoresToFirestore(scores),
        syncDepartmentsToFirestore(departments),
        publishRankings(scores, CURRENT_SCHOOL_YEAR, SCHOOL_YEAR_MONTHS)
      ]);
      setFirebaseStatus(prev => ({
        ...prev,
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date(),
        teachersCount: allUsers.length,
        scoresCount: scores.length
      }));
    } catch (err: any) {
      console.error('Firebase sync error:', err);
      setFirebaseStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Lỗi đồng bộ Firebase'
      }));
      throw err;
    }
  }, [allUsers, scores, departments]);

  // Reload data from Firebase
  const handleReloadFromFirebase = useCallback(async () => {
    setFirebaseStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const [cloudUsers, cloudScores] = await Promise.all([
        fetchStaffFromFirestore(),
        fetchScoresFromFirestore()
      ]);
      if (cloudUsers.length > 0) setAllUsers(cloudUsers);
      if (cloudScores.length > 0) setScores(cloudScores);
      setFirebaseStatus(prev => ({
        ...prev,
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date(),
        teachersCount: cloudUsers.length,
        scoresCount: cloudScores.length
      }));
    } catch (err: any) {
      console.error('Firebase reload error:', err);
      setFirebaseStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Lỗi tải lại từ Firebase'
      }));
      throw err;
    }
  }, []);

  // Kết nối Firestore sau khi đã đăng nhập. Mỗi vai trò chỉ đăng ký nghe đúng phạm vi dữ liệu
  // mà firestore.rules cho phép; onSnapshot đã trả dữ liệu ban đầu nên không cần đọc trước.
  const userId = currentUser?.id;
  const userRole = currentUser?.role;
  const userDepartmentId = currentUser?.departmentId;

  useEffect(() => {
    if (!authReady || !userId || !userRole) return;
    const scope: DataScope = {
      role: userRole,
      staffId: userId,
      departmentId: userDepartmentId,
      year: CURRENT_SCHOOL_YEAR,
    };
    let cancelled = false;
    let scoresReady = false;
    let staffReady = !canListStaff(scope);
    const unsubscribers: Array<() => void> = [];

    setFirebaseStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    const markReady = () => {
      if (scoresReady && staffReady) {
        setFirebaseStatus(prev => ({ ...prev, connected: true, isSyncing: false, lastSyncedAt: new Date(), error: null }));
      }
    };
    const fail = (err: Error) => {
      if (cancelled) return;
      setFirebaseStatus(prev => ({ ...prev, connected: false, isSyncing: false, error: describeFirebaseError(err) }));
    };

    unsubscribers.push(subscribeToScores(scope, records => {
      if (cancelled) return;
      setScores(records);
      scoresReady = true;
      setFirebaseStatus(prev => ({ ...prev, scoresCount: records.length }));
      markReady();
    }, fail));

    if (canListStaff(scope)) {
      unsubscribers.push(subscribeToStaff(scope, staff => {
        if (cancelled) return;
        setAllUsers(staff);
        staffReady = true;
        setFirebaseStatus(prev => ({ ...prev, teachersCount: staff.length }));
        markReady();
      }, fail));
    } else {
      // Giáo viên thường chỉ được đọc hồ sơ của chính mình.
      const self = currentUser;
      if (self) setAllUsers([self]);
    }

    fetchDepartmentsFromFirestore()
      .then(cloudDepartments => { if (!cancelled && cloudDepartments.length > 0) setDepartments(cloudDepartments); })
      .catch(err => console.warn('Không tải được danh sách tổ chuyên môn:', err));

    return () => {
      cancelled = true;
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, userRole, userDepartmentId]);

  // Tài khoản không phải BGH không đọc được điểm của người khác nên xem xếp hạng qua bản công khai.
  useEffect(() => {
    if (!authReady || !userId || !userRole || userRole === 'bgh') return;
    const unsubscribe = subscribeToRankings(
      CURRENT_SCHOOL_YEAR,
      setPublicRankings,
      err => setBanner({ kind: 'error', text: `Không tải được bảng xếp hạng: ${describeFirebaseError(err)}` })
    );
    return () => { unsubscribe(); setPublicRankings([]); };
  }, [authReady, userId, userRole]);

  // Số thành viên / tổ trưởng chỉ tính lại được khi có đủ danh sách (BGH); vai trò khác giữ số liệu từ Firestore.
  const departmentsView = useMemo(() => {
    if (userRole !== 'bgh') return departments;
    return departments.map(dept => {
      const members = allUsers.filter(u => u.departmentId === dept.id);
      const leader = members.find(u => u.role === 'ttcm');
      return {
        ...dept,
        leaderId: leader?.id ?? dept.leaderId,
        leaderName: leader?.name ?? dept.leaderName,
        memberCount: members.length,
      };
    });
  }, [departments, allUsers, userRole]);

  // Restore from Cloud Backup
  const handleRestoreBackup = (backup: CloudBackup) => {
    if (!backup.records) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Không thể khôi phục bản sao lưu cũ',
        message: `${backup.filename} chỉ lưu thông tin mô tả, không chứa dữ liệu điểm để khôi phục.`,
        timestamp: 'Vừa xong',
        type: 'system',
        targetRoles: ['bgh', 'ttcm', 'gv', 'btd'],
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
      return;
    }

    setScores(backup.records);
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Khôi phục dữ liệu thành công',
      message: `Hệ thống đã phục hồi ${backup.records.length} bản ghi từ ${backup.filename}.`,
      timestamp: 'Vừa xong',
      type: 'system',
      targetRoles: ['bgh', 'ttcm', 'gv', 'btd'],
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Staff Management Handlers
  const handleSaveStaff = async (staff: UserProfile) => {
    const canonicalStaff = { ...staff, avatar: SCHOOL_AVATAR };
    const isNew = !allUsers.some(u => u.id === canonicalStaff.id);
    const updatedUsers = isNew
      ? [...allUsers, canonicalStaff]
      : allUsers.map(u => (u.id === canonicalStaff.id ? canonicalStaff : u));

    setAllUsers(updatedUsers);

    if (isNew) {
      // Auto-generate score records for all 9 months for the new staff member
      const newMonthlyRecords: MonthlyScoreRecord[] = SCHOOL_YEAR_MONTHS.map(month => ({
        id: `score-${staff.id}-${month}-${CURRENT_SCHOOL_YEAR}`,
        staffId: staff.id,
        staffName: staff.name,
        staffCode: staff.code,
        departmentId: staff.departmentId,
        departmentName: staff.departmentName,
        position: staff.position,
        month,
        year: CURRENT_SCHOOL_YEAR,
        baseScore: MONTHLY_BASE_SCORE,
        bonusItems: [],
        penaltyItems: [],
        totalBonus: 0,
        totalPenalty: 0,
        totalScore: MONTHLY_BASE_SCORE,
        status: 'draft'
      }));

      const updatedScores = [...scores, ...newMonthlyRecords];
      setScores(updatedScores);

      try {
        await saveStaffBatchToFirestore([canonicalStaff]);
        await saveMultipleScoresToFirestore(newMonthlyRecords);
        setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
        setBanner({ kind: 'info', text: `Đã thêm ${canonicalStaff.name}. Để người này đăng nhập được, quản trị viên cần cấp tài khoản: chạy "npm run reset:passwords -- --missing-only" (xem docs/DEPLOYMENT.md).` });
      } catch (err) {
        reportSaveError('lưu hồ sơ cán bộ mới', err);
      }
    } else {
      // Update staff details in existing monthly scores
      const updatedScores = scores.map(s => {
        if (s.staffId === staff.id) {
          return {
            ...s,
            staffName: staff.name,
            staffCode: staff.code,
            departmentId: staff.departmentId,
            departmentName: staff.departmentName,
            position: staff.position
          };
        }
        return s;
      });
      setScores(updatedScores);

      try {
        await saveStaffBatchToFirestore([canonicalStaff]);
        const affectedScores = updatedScores.filter(s => s.staffId === staff.id);
        if (affectedScores.length > 0) {
          await saveMultipleScoresToFirestore(affectedScores);
          republishRankings(updatedScores, affectedScores.filter(isOfficialResult).map(s => s.month));
        }
        setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
      } catch (err) {
        reportSaveError('cập nhật hồ sơ cán bộ', err);
      }
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const updatedUsers = allUsers.filter(u => u.id !== staffId);
    const updatedScores = scores.filter(s => s.staffId !== staffId);

    setAllUsers(updatedUsers);
    setScores(updatedScores);

    try {
      await deleteStaffFromFirestore(staffId);
      republishRankings(updatedScores, scores.filter(s => s.staffId === staffId && isOfficialResult(s)).map(s => s.month));
      setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
      setBanner({ kind: 'info', text: 'Đã xóa hồ sơ và điểm của cán bộ. Nếu người này đã có tài khoản đăng nhập, hãy vô hiệu hóa trong Firebase Console → Authentication.' });
    } catch (err) {
      reportSaveError('xóa cán bộ', err);
    }
  };

  const handleBatchImportStaff = async (importedStaffList: UserProfile[]) => {
    const existingCodeMap = new Map(allUsers.map(u => [u.code, u]));
    const finalUsers = [...allUsers];
    const newStaffMembers: UserProfile[] = [];
    const changedStaff: UserProfile[] = [];

    importedStaffList.forEach(item => {
      if (existingCodeMap.has(item.code)) {
        const idx = finalUsers.findIndex(u => u.code === item.code);
        if (idx !== -1) {
          finalUsers[idx] = { ...finalUsers[idx], ...item };
          changedStaff.push(finalUsers[idx]);
        }
      } else {
        finalUsers.push(item);
        newStaffMembers.push(item);
        changedStaff.push(item);
      }
    });

    setAllUsers(finalUsers);

    // Create 9-month score records for any new staff
    let updatedScores = [...scores];
    const newScoreRecords: MonthlyScoreRecord[] = [];

    newStaffMembers.forEach(staff => {
      SCHOOL_YEAR_MONTHS.forEach(month => {
        const exists = updatedScores.some(s => s.staffId === staff.id && s.month === month);
        if (!exists) {
          newScoreRecords.push({
            id: `score-${staff.id}-${month}-${CURRENT_SCHOOL_YEAR}`,
            staffId: staff.id,
            staffName: staff.name,
            staffCode: staff.code,
            departmentId: staff.departmentId,
            departmentName: staff.departmentName,
            position: staff.position,
            month,
            year: CURRENT_SCHOOL_YEAR,
            baseScore: MONTHLY_BASE_SCORE,
            bonusItems: [],
            penaltyItems: [],
            totalBonus: 0,
            totalPenalty: 0,
            totalScore: MONTHLY_BASE_SCORE,
            status: 'draft'
          });
        }
      });
    });

    if (newScoreRecords.length > 0) {
      updatedScores = [...updatedScores, ...newScoreRecords];
      setScores(updatedScores);
    }

    try {
      await saveStaffBatchToFirestore(changedStaff);
      if (newScoreRecords.length > 0) {
        await saveMultipleScoresToFirestore(newScoreRecords);
      }
      setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
      if (newStaffMembers.length > 0) {
        setBanner({ kind: 'info', text: `Đã nhập ${newStaffMembers.length} cán bộ mới. Cần cấp tài khoản đăng nhập: chạy "npm run reset:passwords -- --missing-only" (xem docs/DEPLOYMENT.md).` });
      }
    } catch (err) {
      reportSaveError('nhập danh sách cán bộ', err);
    }
  };

  const handleSyncStaffToFirebase = async () => {
    await Promise.all([
      syncStaffListToFirestore(allUsers),
      syncDepartmentsToFirestore(departments)
    ]);
    setFirebaseStatus(prev => ({
      ...prev,
      lastSyncedAt: new Date(),
      teachersCount: allUsers.length
    }));
  };

  // Handler for Admin configuring Department Leaders (TTCM)
  const handleSaveDepartmentLeaders = async (leadersMap: { [departmentId: string]: string }) => {
    // 1. Update allUsers roles & positions
    const updatedUsers = allUsers.map(u => {
      // Check if user is appointed as leader for any department in the map
      const assignedDeptId = Object.keys(leadersMap).find(deptId => leadersMap[deptId] === u.id);
      if (assignedDeptId) {
        const targetDept = departments.find(d => d.id === assignedDeptId);
        return {
          ...u,
          role: 'ttcm' as UserRole,
          departmentId: assignedDeptId,
          departmentName: targetDept?.name || u.departmentName,
          position: u.position.includes('Tổ trưởng') ? u.position : 'Tổ trưởng chuyên môn'
        };
      } else if (u.role === 'ttcm') {
        // If this user was TTCM but is no longer assigned as TTCM for their department
        const isStillLeader = Object.values(leadersMap).includes(u.id);
        if (!isStillLeader) {
          return {
            ...u,
            role: 'gv' as UserRole,
            position: u.position.replace(/Tổ trưởng chuyên môn/gi, 'Giáo viên').replace(/^Tổ trưởng/gi, 'Giáo viên') || `Giáo viên ${u.subject || ''}`
          };
        }
      }
      return u;
    });

    // 2. Update departments state
    const updatedDepartments = departments.map(d => {
      const leaderId = leadersMap[d.id] || '';
      const leaderUser = updatedUsers.find(u => u.id === leaderId);
      const members = updatedUsers.filter(u => u.departmentId === d.id);
      return {
        ...d,
        leaderId,
        leaderName: leaderUser ? leaderUser.name : 'Chưa chỉ định',
        memberCount: members.length
      };
    });

    setAllUsers(updatedUsers);
    setDepartments(updatedDepartments);

    // 3. Update active session user if affected
    if (currentUser) {
      const updatedCurrent = updatedUsers.find(u => u.id === currentUser.id);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
      }
    }

    // 4. Create system notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Cập nhật phân quyền Tổ trưởng chuyên môn',
      message: 'Quản trị viên đã cập nhật phân quyền chấm điểm thi đua cho các Tổ chuyên môn.',
      timestamp: 'Vừa xong',
      type: 'system',
      targetRoles: ['bgh', 'ttcm', 'gv', 'btd'],
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // 5. Chỉ ghi những hồ sơ thực sự thay đổi (không ghi lại cả danh sách)
    try {
      const originalUsers = new Set(allUsers);
      const changedUsers = updatedUsers.filter(u => !originalUsers.has(u));
      await Promise.all([
        saveStaffBatchToFirestore(changedUsers),
        syncDepartmentsToFirestore(updatedDepartments)
      ]);
      setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
      setBanner({ kind: 'info', text: 'Đã lưu phân công Tổ trưởng. Quyền đăng nhập dựa trên Firebase custom claims nên quản trị viên cần chạy "npm run sync:claims" để có hiệu lực (xem docs/DEPLOYMENT.md).' });
    } catch (err) {
      reportSaveError('lưu phân công Tổ trưởng', err);
    }
  };

  // Save individual score record with Firebase sync
  const handleSaveScoreRecord = (updatedRecord: MonthlyScoreRecord) => {
    setScores(prev => prev.map(s => (s.id === updatedRecord.id ? updatedRecord : s)));
    republishRankings(scores.map(s => (s.id === updatedRecord.id ? updatedRecord : s)), [updatedRecord.month]);

    // Sync directly to Firebase Firestore
    saveSingleScoreToFirestore(updatedRecord)
      .then(() => {
        setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() }));
      })
      .catch(err => reportSaveError('lưu điểm', err));

    // Create system notification
    const isApproved = updatedRecord.status === 'approved';
    const isSubmitted = updatedRecord.status === 'submitted';

    if (isApproved || isSubmitted) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: isApproved
          ? `BGH đã phê duyệt điểm: ${updatedRecord.staffName}`
          : `Tổ chuyên môn đã nộp điểm: ${updatedRecord.staffName}`,
        message: isApproved
          ? `Điểm chốt thi đua Tháng 0${updatedRecord.month}: ${updatedRecord.bghApprovedScore ?? updatedRecord.totalScore} điểm.`
          : `Hồ sơ đã được gửi lên BGH với tổng điểm đề xuất là ${updatedRecord.totalScore} điểm.`,
        timestamp: 'Vừa xong',
        type: isApproved ? 'approval' : 'reminder',
        targetRoles: isApproved ? ['gv', 'ttcm'] : ['bgh'],
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Approve single record directly (from table) with Firebase sync
  const handleApproveRecord = (recordId: string, approvedScore?: number, note?: string) => {
    if (!currentUser) return;
    const record = scores.find(s => s.id === recordId);
    if (!record) return;

    const updatedRecord: MonthlyScoreRecord = {
      ...record,
      status: 'approved',
      bghApprovedScore: approvedScore ?? record.totalScore,
      bghNotes: note || 'BGH phê duyệt kết quả thi đua.',
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      approvedAt: new Date().toLocaleString('vi-VN')
    };
    setScores(prev => prev.map(s => (s.id === recordId ? updatedRecord : s)));
    republishRankings(scores.map(s => (s.id === recordId ? updatedRecord : s)), [updatedRecord.month]);

    saveSingleScoreToFirestore(updatedRecord)
      .then(() => setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() })))
      .catch(err => reportSaveError('duyệt hồ sơ', err));
  };

  // BGH Approve All submitted records for the month with Firebase sync
  const handleApproveAll = (month: number) => {
    if (!currentUser) return;
    const approvedAt = new Date().toLocaleString('vi-VN');
    const updatedRecords = scores
      .filter(s => s.month === month && s.status === 'submitted')
      .map(s => ({
        ...s,
        status: 'approved' as const,
        bghApprovedScore: s.totalScore,
        bghNotes: 'BGH duyệt toàn bộ theo đề xuất của Tổ chuyên môn.',
        approvedBy: currentUser.id,
        approvedByName: currentUser.name,
        approvedAt
      }));
    if (updatedRecords.length === 0) return;
    const updatedById = new Map(updatedRecords.map(record => [record.id, record]));
    setScores(prev => prev.map(s => updatedById.get(s.id) ?? s));

    if (updatedRecords.length > 0) {
      saveMultipleScoresToFirestore(updatedRecords)
        .then(() => setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() })))
        .catch(err => reportSaveError('duyệt toàn bộ hồ sơ', err));
      republishRankings(scores.map(s => updatedById.get(s.id) ?? s), [month]);
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `BGH đã duyệt toàn bộ hồ sơ Tháng 0${month}`,
      message: `Hội đồng Thi đua Khen thưởng đã chốt điểm thi đua tháng 0${month} cho toàn thể cán bộ, giáo viên và đồng bộ lên Firebase.`,
      timestamp: 'Vừa xong',
      type: 'approval',
      targetRoles: ['ttcm', 'gv'],
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Trigger auto cloud backup on approval
    handlePerformBackup(
      true,
      `Sao lưu tự động sau khi BGH duyệt toàn bộ Tháng 0${month}`,
      scores.map(score => updatedById.get(score.id) ?? score)
    );
  };

  // TTCM Submit whole department with Firebase sync
  const handleSubmitToBgh = (month: number, departmentId: string) => {
    if (!currentUser) return;
    const reviewedAt = new Date().toLocaleString('vi-VN');
    const updatedRecords = scores
      .filter(s => s.month === month && s.departmentId === departmentId && (s.status === 'draft' || s.status === 'submitted'))
      .map(s => ({
        ...s,
        status: 'submitted' as const,
        reviewedBy: currentUser.id,
        reviewedByName: currentUser.name,
        reviewedAt
      }));
    if (updatedRecords.length === 0) return;
    const updatedById = new Map(updatedRecords.map(record => [record.id, record]));
    setScores(prev => prev.map(s => updatedById.get(s.id) ?? s));

    if (updatedRecords.length > 0) {
      saveMultipleScoresToFirestore(updatedRecords)
        .then(() => setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() })))
        .catch(err => reportSaveError('nộp bảng điểm', err));
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Tổ chuyên môn nộp bảng điểm Tháng 0${month}`,
      message: `${currentUser.name} đã hoàn tất chấm điểm và nộp hồ sơ lên Ban Giám Hiệu.`,
      timestamp: 'Vừa xong',
      type: 'reminder',
      targetRoles: ['bgh'],
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // BGH Lock Month with Firebase sync
  const handleLockMonth = (month: number) => {
    const lockedRecords = scores
      .filter(s => s.month === month && s.status !== 'locked')
      .map(s => ({ ...s, status: 'locked' as const }));
    if (lockedRecords.length === 0) return;
    const lockedById = new Map(lockedRecords.map(record => [record.id, record]));
    setScores(prev => prev.map(s => lockedById.get(s.id) ?? s));

    if (lockedRecords.length > 0) {
      saveMultipleScoresToFirestore(lockedRecords)
        .then(() => setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: new Date() })))
        .catch(err => reportSaveError('khóa sổ tháng', err));
      republishRankings(scores.map(s => lockedById.get(s.id) ?? s), [month]);
    }

    handlePerformBackup(
      true,
      `Khóa sổ và niêm phong dữ liệu thi đua Tháng 0${month}`,
      scores.map(score => lockedById.get(score.id) ?? score)
    );

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Khóa sổ thi đua Tháng 0${month}`,
      message: `Ban Giám Hiệu đã niêm phong kết quả thi đua Tháng 0${month}. Dữ liệu được lưu trữ an toàn tuyệt đối trên Firebase Firestore.`,
      timestamp: 'Vừa xong',
      type: 'system',
      targetRoles: ['bgh', 'ttcm', 'gv', 'btd'],
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Notifications handlers
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSendReminder = (title: string, message: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Vừa xong',
      type: 'reminder',
      targetRoles: ['ttcm', 'gv'],
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // If user is not authenticated / logged out, show Login Portal
  if (!currentUser) {
    return (
      <Suspense fallback={<LoadingView />}>
        <LoginPage notice={authNotice} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#031713] flex flex-col md:flex-row text-emerald-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Logout on Profile click */}
        <Header
          currentUser={currentUser}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onTriggerBackup={() => handlePerformBackup(false, 'Sao lưu thủ công tức thời')}
          isBackingUp={isBackingUp}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          firebaseConnected={firebaseStatus.connected}
          firebaseSyncing={firebaseStatus.isSyncing}
          onSyncFirebase={currentUser.role === 'bgh'
            ? () => { handleSyncAllToFirebase().catch(err => reportSaveError('đồng bộ dữ liệu lên Firebase', err)); }
            : () => {}}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {banner && (
            <div
              role={banner.kind === 'error' ? 'alert' : 'status'}
              className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                banner.kind === 'error'
                  ? 'border-rose-500/50 bg-rose-950/60 text-rose-200'
                  : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
              }`}
            >
              <span>{banner.text}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="shrink-0 rounded px-2 text-xs font-bold hover:bg-white/10 cursor-pointer"
                aria-label="Đóng thông báo"
              >
                Đóng
              </button>
            </div>
          )}
          {firebaseStatus.error && !firebaseStatus.connected && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-500/50 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
              Không tải được dữ liệu từ máy chủ: {firebaseStatus.error}
            </div>
          )}
          <Suspense fallback={<LoadingView />}>
          {currentTab === 'overview' && (
            <DashboardOverview
              scores={scores}
              currentMonth={currentMonth}
              onChangeMonth={setCurrentMonth}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onSelectRecordToScore={record => setSelectedRecordToScore(record)}
            />
          )}

          {currentTab === 'scoring' && (
            <MonthlyScoringTable
              scores={scores}
              currentMonth={currentMonth}
              onChangeMonth={setCurrentMonth}
              currentUser={currentUser}
              departments={departmentsView}
              onSelectRecordToScore={record => setSelectedRecordToScore(record)}
              onApproveRecord={handleApproveRecord}
              onApproveAll={handleApproveAll}
              onSubmitToBgh={handleSubmitToBgh}
              onLockMonth={handleLockMonth}
            />
          )}

          {currentTab === 'leaderboard' && currentUser.role !== 'bgh' && (
            <div role="note" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
              Bảng xếp hạng công khai toàn trường, hiển thị kết quả đã được Ban Giám Hiệu duyệt hoặc khóa sổ.
            </div>
          )}
          {currentTab === 'leaderboard' && (
            <RealTimeLeaderboard
              scores={currentUser.role === 'bgh' ? scores : publicRankings}
              currentMonth={currentMonth}
              currentUser={currentUser}
              departments={departmentsView}
            />
          )}

          {currentTab === 'staff' && (
            <StaffDirectory
              users={allUsers}
              departments={departmentsView}
              scores={scores}
              currentMonth={currentMonth}
              currentUser={currentUser}
              onSaveStaff={handleSaveStaff}
              onDeleteStaff={handleDeleteStaff}
              onBatchImportStaff={handleBatchImportStaff}
              onSyncStaffToFirebase={handleSyncStaffToFirebase}
              onSaveDepartmentLeaders={handleSaveDepartmentLeaders}
              isFirebaseSyncing={firebaseStatus.isSyncing}
              lastSyncedAt={firebaseStatus.lastSyncedAt}
            />
          )}

          {currentTab === 'criteria' && <CriteriaGuide currentUser={currentUser} />}

          {currentTab === 'reports' && (
            <ReportsView
              scores={scores}
              currentMonth={currentMonth}
              departments={departmentsView}
            />
          )}

          {currentTab === 'backup' && (
            <CloudBackupView
              backups={backups}
              scores={scores}
              users={allUsers}
              settings={settings}
              firebaseStatus={firebaseStatus}
              onUpdateSettings={setSettings}
              onPerformBackup={handlePerformBackup}
              onRestoreBackup={handleRestoreBackup}
              onSyncAllToFirebase={handleSyncAllToFirebase}
              onReloadFromFirebase={handleReloadFromFirebase}
            />
          )}

          {currentTab === 'modules' && <FutureModulesView />}
          </Suspense>
        </main>

        {/* Mobile Navigation Bottom Bar */}
        <div className="md:hidden sticky bottom-0 z-30 bg-[#05211b] border-t border-[#0e4438] text-emerald-300 flex items-center justify-around px-2 py-2">
          {[
            { id: 'overview' as NavTab, label: 'Tổng quan' },
            { id: 'scoring' as NavTab, label: 'Chấm điểm' },
            { id: 'leaderboard' as NavTab, label: 'Xếp hạng' },
            { id: 'staff' as NavTab, label: 'Danh bạ' },
            { id: 'reports' as NavTab, label: 'Excel' },
            { id: 'backup' as NavTab, label: 'Firebase' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                currentTab === item.id ? 'text-amber-400 font-extrabold' : 'hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Scoring Modal */}
      {selectedRecordToScore && (
        <Suspense fallback={null}>
          <ScoringModal
            record={selectedRecordToScore}
            onClose={() => setSelectedRecordToScore(null)}
            onSave={handleSaveScoreRecord}
            currentUser={currentUser}
            allScores={scores}
          />
        </Suspense>
      )}

      {/* Push Notification Drawer */}
      {isNotificationsOpen && (
        <Suspense fallback={null}>
          <PushNotificationDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onSendReminder={handleSendReminder}
            currentUser={currentUser}
          />
        </Suspense>
      )}

      {isChangePasswordOpen && (
        <Suspense fallback={null}>
          <ChangeOwnPasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} userId={currentUser.id} />
        </Suspense>
      )}
    </div>
  );
}
