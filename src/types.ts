export type UserRole = 'bgh' | 'ttcm' | 'btd' | 'gv';

export interface UserProfile {
  id: string;
  name: string;
  code: string; // Mã cán bộ (CBVC)
  email: string;
  role: UserRole;
  departmentId: string; // Mã tổ chuyên môn
  departmentName: string;
  position: string; // Chức vụ: Hiệu trưởng, TTCM, Giáo viên, Khối trưởng...
  subject?: string; // Môn giảng dạy
  concurrentJob?: string; // Công việc kiêm nhiệm (GVCN, Đoàn trường, Ban TTND, Thư ký...)
  isHomeroomTeacher?: boolean; // Có là GVCN không
  homeroomClass?: string; // Lớp chủ nhiệm
  avatar?: string;
  phone?: string;
  customPassword?: string; // Mật khẩu quản trị viên cấp cho cán bộ
  passwordUpdatedAt?: string; // Thời điểm cập nhật mật khẩu gần nhất
}

export interface Department {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
}

export interface CriterionItem {
  id: string;
  category: 'I' | 'II_1' | 'II_2' | 'II_3' | 'II_4' | 'II_5' | 'II_6' | 'II_7' | 'II_8';
  categoryTitle: string;
  title: string;
  initialPoints?: number;
  maxPerSemester?: number;
  rewardPoints?: number;
  rewardUnit?: string;
  penaltyPoints?: number;
  penaltyUnit?: string;
  trackingDept: string;
  description?: string;
}

export interface ScoreItemDetail {
  id: string;
  criterionId?: string;
  title: string;
  points: number; // positive for bonus, positive number for penalty value
  quantity: number;
  maxAllowed?: number; // Maximum allowable points for this criterion
  note?: string;
  date?: string;
}

export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'locked';

export interface MonthlyScoreRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffCode: string;
  departmentId: string;
  departmentName: string;
  position: string;
  month: number; // 1 -> 9 (hoặc 12)
  year: string; // "2026-2027"
  baseScore: number; // 230
  bonusItems: ScoreItemDetail[];
  penaltyItems: ScoreItemDetail[];
  totalBonus: number;
  totalPenalty: number;
  totalScore: number; // baseScore + totalBonus - totalPenalty
  bghApprovedScore?: number; // Điểm chốt BGH
  bghNotes?: string;
  status: EvaluationStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  feedback?: string; // Ý kiến của giáo viên
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'reminder' | 'approval' | 'feedback' | 'system';
  targetRoles: UserRole[];
  read: boolean;
  actionUrl?: string;
}

export interface CloudBackup {
  id: string;
  createdAt: string;
  filename: string;
  sizeKb: number;
  recordsCount: number;
  staffCount: number;
  isAuto: boolean;
  version: string;
  description: string;
  /** Score data captured at backup time. Older metadata-only backups may not have it. */
  records?: MonthlyScoreRecord[];
}

export interface FutureModule {
  id: string;
  name: string;
  description: string;
  badge: string;
  iconName: string;
  isReady: boolean;
  statsLabel: string;
  statsValue: string;
}
