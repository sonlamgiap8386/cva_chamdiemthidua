/**
 * DỮ LIỆU MẪU CHỈ DÙNG ĐỂ GIEO (SEED) FIRESTORE TRÊN MÁY QUẢN TRỊ.
 * KHÔNG import từ thư mục src/ để tránh đưa danh sách nhân sự vào bundle công khai.
 */
import { UserProfile, Department, MonthlyScoreRecord, AppNotification, CloudBackup } from '../../src/types';
import { OFFICIAL_ALL_USERS, OFFICIAL_DEPARTMENTS } from './staffData';
import { generateComprehensiveMonthlyScores, generateAllSchoolYearScores } from './scoresGenerator';

export const INITIAL_DEPARTMENTS: Department[] = OFFICIAL_DEPARTMENTS;
export const INITIAL_USERS: UserProfile[] = OFFICIAL_ALL_USERS;

export const INITIAL_MONTHLY_SCORES: MonthlyScoreRecord[] = generateAllSchoolYearScores(
  OFFICIAL_ALL_USERS,
  '2026-2027'
);

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Nhắc nhở: Hạn chót hoàn tất chấm điểm thi đua Tháng 01',
    message: 'Tổ trưởng chuyên môn các tổ vui lòng rà soát minh chứng và nộp bảng điểm thi đua trước 17h00 ngày 28/01.',
    timestamp: '2 giờ trước',
    type: 'reminder',
    targetRoles: ['ttcm', 'bgh'],
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Hồ sơ chờ BGH phê duyệt',
    message: 'Tổ Toán - Tin đã gửi 4 hồ sơ đánh giá thi đua Tháng 01. BGH vui lòng kiểm tra và duyệt điểm chốt.',
    timestamp: '5 giờ trước',
    type: 'approval',
    targetRoles: ['bgh'],
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Thông báo: Quy định thi đua năm học 2026 - 2027',
    message: 'Hội đồng Thi đua Khen thưởng đã ban hành bộ tiêu chí chấm điểm mới, thang điểm chuẩn 230đ/tháng.',
    timestamp: '1 ngày trước',
    type: 'system',
    targetRoles: ['bgh', 'ttcm', 'btd', 'gv'],
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Sao lưu dữ liệu tự động thành công',
    message: 'Hệ thống đã tự động sao lưu bản snapshot dữ liệu thi đua lên đám mây lúc 03:00 sáng nay.',
    timestamp: 'Hôm nay lúc 03:00',
    type: 'system',
    targetRoles: ['bgh'],
    read: true,
  }
];

export const INITIAL_BACKUPS: CloudBackup[] = [
  {
    id: 'bak-20260903-0300',
    createdAt: '2026-09-03 03:00:15',
    filename: 'cva_thidua_snapshot_20260903_0300.json',
    sizeKb: 342.6,
    recordsCount: 101,
    staffCount: 104,
    isAuto: true,
    version: 'v2.4.1',
    description: 'Sao lưu tự động định kỳ toàn trường (10 tổ chuyên môn & văn phòng, 104 cán bộ nhân viên)'
  },
  {
    id: 'bak-20260901-1800',
    createdAt: '2026-09-01 18:00:22',
    filename: 'cva_thidua_snapshot_20260901_final.json',
    sizeKb: 318.2,
    recordsCount: 101,
    staffCount: 104,
    isAuto: false,
    version: 'v2.4.0',
    description: 'Sao lưu thủ công trước khi chốt biên chế và thi đua đầu năm'
  },
  {
    id: 'bak-20260815-1030',
    createdAt: '2026-08-15 10:30:00',
    filename: 'cva_thidua_snapshot_20260815_init.json',
    sizeKb: 280.4,
    recordsCount: 101,
    staffCount: 104,
    isAuto: true,
    version: 'v2.3.9',
    description: 'Khởi tạo dữ liệu danh sách biên chế năm học 2026-2027 (101 giáo viên)'
  }
];
