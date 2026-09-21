import { UserProfile, Department, MonthlyScoreRecord, UserRole } from '../../src/types';

export interface RawStaffItem {
  stt: number;
  name: string;
  roleCode: string; // TTCM, TPCM, GV, BTĐ, PBTĐ, TK, KT, YT, TV, VP, TBVT
  subject: string;
  deptName: string;
  assignment?: string; // 10A1, 11A3, etc.
}

export const RAW_STAFF_LIST: RawStaffItem[] = [
  { stt: 30, name: 'Trương Thị Quyết', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL', assignment: '10A1' },
  { stt: 76, name: 'Hà Thu Thủy', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '10A10' },
  { stt: 13, name: 'Bùi Thị Ngọc Hà', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '10A11' },
  { stt: 31, name: 'Lại Thị Lệ', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '10A12' },
  { stt: 78, name: 'Đỗ Phương Lan', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '10A13' },
  { stt: 24, name: 'Nguyễn Thị H. Dung', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '10A14' },
  { stt: 8, name: 'Trần Thị Hảo', roleCode: 'GV', subject: 'Địa lí', deptName: 'Sử - Địa - KTPL', assignment: '10A15' },
  { stt: 62, name: 'Nguyễn Thị Trà', roleCode: 'GV', subject: 'KTPL', deptName: 'Sử - Địa - KTPL', assignment: '10A16' },
  { stt: 10, name: 'Đặng Thị My', roleCode: 'TPCM', subject: 'Vật lí', deptName: 'Vật lí', assignment: '10A2' },
  { stt: 79, name: 'Hà Khánh Huyền', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '10A3' },
  { stt: 57, name: 'Phạm Bá Được', roleCode: 'GV', subject: 'Vật lí', deptName: 'Vật lí', assignment: '10A4' },
  { stt: 85, name: 'Nguyễn Thị Lan', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học', assignment: '10A5' },
  { stt: 58, name: 'Lê Thị Thanh Ngân', roleCode: 'GV', subject: 'Sinh học', deptName: 'Sinh học', assignment: '10A6' },
  { stt: 21, name: 'Giáp Thị Tươi', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '10A7' },
  { stt: 51, name: 'Nhiều Hải Nam', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '10A8' },
  { stt: 60, name: 'Bùi Viết Hùng', roleCode: 'GV', subject: 'Địa lí', deptName: 'Sử - Địa - KTPL', assignment: '10A9' },
  { stt: 17, name: 'Vi Thị Nguyệt', roleCode: 'TPCM', subject: 'Sinh học', deptName: 'Sinh học', assignment: '11A1' },
  { stt: 26, name: 'Trần Thị Nghĩa', roleCode: 'GV', subject: 'Sinh học', deptName: 'Sinh học', assignment: '11A10' },
  { stt: 70, name: 'Phạm Hồng Trang', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '11A11' },
  { stt: 18, name: 'Hoàng Thị Xuyến', roleCode: 'GV', subject: 'KTPL', deptName: 'Sử - Địa - KTPL', assignment: '11A12' },
  { stt: 33, name: 'Bùi Thị Anh Chung', roleCode: 'TPCM', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '11A13' },
  { stt: 45, name: 'Vũ Thị Trinh', roleCode: 'TPCM', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '11A14' },
  { stt: 47, name: 'Trương Thị Hải Yến', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '11A15' },
  { stt: 9, name: 'Vũ Thị Thuỳ Linh', roleCode: 'TPCM', subject: 'Tin học', deptName: 'Tin - CN - MT', assignment: '11A2' },
  { stt: 35, name: 'Giáp Thị Hiền', roleCode: 'TTCM', subject: 'Hoá học', deptName: 'Hoá học', assignment: '11A3' },
  { stt: 54, name: 'Nguyễn Thị Lựu', roleCode: 'GV', subject: 'Vật lí', deptName: 'Vật lí', assignment: '11A4' },
  { stt: 39, name: 'Phạm Thị Uyên', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '11A5' },
  { stt: 66, name: 'Nguyễn Việt Phương', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '11A6' },
  { stt: 43, name: 'Nguyễn T Diệu Thiện', roleCode: 'TK', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '11A7' },
  { stt: 7, name: 'Nguyễn Thị Hải', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '11A8' },
  { stt: 53, name: 'Trịnh Thăng Hiền', roleCode: 'GV', subject: 'Tin học', deptName: 'Tin - CN - MT', assignment: '11A9' },
  { stt: 3, name: 'Trần Đức Tuấn', roleCode: 'TPCM', subject: 'Hoá học', deptName: 'Hoá học', assignment: '12A1' },
  { stt: 90, name: 'Đinh Thị Hải Ninh', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '12A10' },
  { stt: 56, name: 'Đinh Thị Đài Trang', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '12A11' },
  { stt: 61, name: 'Nguyễn Thị Thêm', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '12A12' },
  { stt: 55, name: 'Nguyễn Thị Thảo', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '12A13' },
  { stt: 68, name: 'Phạm Thị Huyên', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '12A14' },
  { stt: 19, name: 'Trần Thị Phương', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL', assignment: '12A15' },
  { stt: 73, name: 'Chu Thị Thanh Hoa', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học', assignment: '12A2' },
  { stt: 40, name: 'Hà Thị Hiền', roleCode: 'GV', subject: 'Vật lí', deptName: 'Vật lí', assignment: '12A3' },
  { stt: 74, name: 'Bùi Duy Danh', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '12A4' },
  { stt: 4, name: 'Nguyễn Thị Hoa', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '12A5' },
  { stt: 6, name: 'Nguyễn Thị Huy', roleCode: 'GV', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ', assignment: '12A6' },
  { stt: 36, name: 'Đặng Khắc Hoan', roleCode: 'TPCM', subject: 'CNCN', deptName: 'Tin - CN - MT', assignment: '12A7' },
  { stt: 46, name: 'Trần Thị Hà', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn', assignment: '12A8' },
  { stt: 80, name: 'Nguyễn Thị Thủy', roleCode: 'GV', subject: 'Toán', deptName: 'Toán', assignment: '12A9' },
  { stt: 20, name: 'Ngô Minh Cường', roleCode: 'TT', subject: 'Vật lí', deptName: 'Vật lí' },
  { stt: 22, name: 'Vũ Ngọc Dũng', roleCode: 'PBTĐ', subject: 'Vật lí', deptName: 'Vật lí' },
  { stt: 83, name: 'Trần Văn Hải', roleCode: 'GV', subject: 'Vật lí', deptName: 'Vật lí' },
  { stt: 96, name: 'Phạm Đăng Hoàn', roleCode: 'GV', subject: 'Vật lí', deptName: 'Vật lí' },
  { stt: 91, name: 'Dương Thị Hải', roleCode: 'KT', subject: 'Văn phòng', deptName: 'Văn phòng' },
  { stt: 92, name: 'Lê Thị Hương Giang', roleCode: 'YT', subject: 'Văn phòng', deptName: 'Văn phòng' },
  { stt: 93, name: 'Nguyễn Thị Dậu', roleCode: 'TV', subject: 'Văn phòng', deptName: 'Văn phòng' },
  { stt: 94, name: 'Nông Thị Hiền', roleCode: 'TTCM', subject: 'Văn phòng', deptName: 'Văn phòng' },
  { stt: 16, name: 'Nguyễn Phương Duy', roleCode: 'BTĐ', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 25, name: 'Lê Duy Hải', roleCode: 'GV', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 34, name: 'Vũ Thị Hường', roleCode: 'GV', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 50, name: 'Hà Thị Hạnh', roleCode: 'GV', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 84, name: 'Bùi Công Hùng', roleCode: 'GV', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 89, name: 'Nguyễn Huy Hiếu', roleCode: 'GV', subject: 'Thể Dục', deptName: 'Thể Dục' },
  { stt: 14, name: 'Tăng Xuân Cường', roleCode: 'TPCM', subject: 'QPAN', deptName: 'Thể Dục' },
  { stt: 42, name: 'Hà Văn Vinh', roleCode: 'GV', subject: 'QPAN', deptName: 'Thể Dục' },
  { stt: 48, name: 'Giáp Anh Đàm', roleCode: 'TTCM', subject: 'QPAN', deptName: 'Thể Dục' },
  { stt: 95, name: 'Vi Quang Nguyên', roleCode: 'GV', subject: 'QPAN', deptName: 'Thể Dục' },
  { stt: 15, name: 'Vũ Thị Yên', roleCode: 'GV', subject: 'Toán', deptName: 'Toán' },
  { stt: 27, name: 'Phan Hoàng Ninh', roleCode: 'TTCM', subject: 'Toán', deptName: 'Toán' },
  { stt: 64, name: 'Trần Văn Tân', roleCode: 'TPCM', subject: 'Toán', deptName: 'Toán' },
  { stt: 75, name: 'Lê Anh Tiến', roleCode: 'GV', subject: 'Toán', deptName: 'Toán' },
  { stt: 86, name: 'Nguyễn Xuân Giang', roleCode: 'GV', subject: 'Toán', deptName: 'Toán' },
  { stt: 92, name: 'Trần Hồng Linh', roleCode: 'GV', subject: 'Toán', deptName: 'Toán' },
  { stt: 93, name: 'Nguyễn Anh Hải', roleCode: 'GV', subject: 'Toán', deptName: 'Toán' },
  { stt: 2, name: 'Dương Thành Luân', roleCode: 'TTCM', subject: 'Tin học', deptName: 'Tin - CN - MT' },
  { stt: 5, name: 'Giáp Văn Khiêm', roleCode: 'GV', subject: 'Tin học', deptName: 'Tin - CN - MT' },
  { stt: 67, name: 'Phạm Anh Quý', roleCode: 'GV', subject: 'Tin học', deptName: 'Tin - CN - MT' },
  { stt: 88, name: 'Đỗ Thu Thủy', roleCode: 'GV', subject: 'Tin học', deptName: 'Tin - CN - MT' },
  { stt: 65, name: 'Cao Thị Bích Phượng', roleCode: 'GV', subject: 'MT', deptName: 'Tin - CN - MT' },
  { stt: 28, name: 'Nguyễn Tâm Nhã', roleCode: 'GV', subject: 'CNCN', deptName: 'Tin - CN - MT' },
  { stt: 63, name: 'Nguyễn Thị Lý', roleCode: 'GV', subject: 'CNCN', deptName: 'Tin - CN - MT' },
  { stt: 98, name: 'Phạm Thanh Hải', roleCode: 'GV', subject: 'ÂN', deptName: 'Tin - CN - MT' },
  { stt: 12, name: 'Nguyễn Thị Thu Hoài', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL' },
  { stt: 49, name: 'Nguyễn Thị Hồng Xiêm', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL' },
  { stt: 72, name: 'Lê Thị Thắm', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL' },
  { stt: 87, name: 'Lâm Minh Châu', roleCode: 'GV', subject: 'Lịch sử', deptName: 'Sử - Địa - KTPL' },
  { stt: 29, name: 'Đỗ Thị Ngà', roleCode: 'TTCM', subject: 'KTPL', deptName: 'Sử - Địa - KTPL' },
  { stt: 91, name: 'Lê Anh Tú', roleCode: 'GV', subject: 'KTPL', deptName: 'Sử - Địa - KTPL' },
  { stt: 41, name: 'Lê Thị Hảo', roleCode: 'GV', subject: 'Địa lí', deptName: 'Sử - Địa - KTPL' },
  { stt: 59, name: 'Nguyễn T Minh Lệ', roleCode: 'TPCM', subject: 'Địa lí', deptName: 'Sử - Địa - KTPL' },
  { stt: 23, name: 'Trần Quang Tuấn', roleCode: 'PBTĐ', subject: 'Sinh học', deptName: 'Sinh học' },
  { stt: 37, name: 'Hoàng Trường Giang', roleCode: 'TBVT', subject: 'Sinh học', deptName: 'Sinh học' },
  { stt: 52, name: 'Hoàng Thanh Hường', roleCode: 'TTCM', subject: 'Sinh học', deptName: 'Sinh học' },
  { stt: 71, name: 'Đặng Văn Quyết', roleCode: 'GV', subject: 'Sinh học', deptName: 'Sinh học' },
  { stt: 1, name: 'Giáp Thị Thu Hiền', roleCode: 'TTCM', subject: 'Ngữ Văn', deptName: 'Ngữ Văn' },
  { stt: 69, name: 'Hoàng Thị Hạnh', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn' },
  { stt: 77, name: 'Tăng Thị Hoàn', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn' },
  { stt: 82, name: 'Nguyễn Thị K Oanh', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn' },
  { stt: 94, name: 'Giáp Thị Thủy', roleCode: 'GV', subject: 'Ngữ Văn', deptName: 'Ngữ Văn' },
  { stt: 32, name: 'Nguyễn Anh Tài', roleCode: 'TTCM', subject: 'Ngoại Ngữ', deptName: 'Ngoại Ngữ' },
  { stt: 11, name: 'Vi Xuân Khánh', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học' },
  { stt: 44, name: 'Nguyễn Minh Hải', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học' },
  { stt: 81, name: 'Nguyễn Văn Tài', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học' },
  { stt: 97, name: 'Nguyễn Ngọc Phương', roleCode: 'GV', subject: 'Hoá học', deptName: 'Hoá học' },
];

export const DEPT_MAP: Record<string, { id: string; name: string }> = {
  'Toán': { id: 'tcm-toan', name: 'Tổ Toán' },
  'Ngữ Văn': { id: 'tcm-van', name: 'Tổ Ngữ Văn' },
  'Ngoại Ngữ': { id: 'tcm-nn', name: 'Tổ Ngoại Ngữ' },
  'Vật lí': { id: 'tcm-vatli', name: 'Tổ Vật lí' },
  'Hoá học': { id: 'tcm-hoahoc', name: 'Tổ Hoá học' },
  'Sinh học': { id: 'tcm-sinhhoc', name: 'Tổ Sinh học' },
  'Sử - Địa - KTPL': { id: 'tcm-su-dia-ktpl', name: 'Tổ Sử - Địa - KTPL' },
  'Tin - CN - MT': { id: 'tcm-tin-cn-mt', name: 'Tổ Tin - CN - MT' },
  'Thể Dục': { id: 'tcm-theduc', name: 'Tổ Thể Dục - QPAN' },
  'Văn phòng': { id: 'tcm-vanphong', name: 'Tổ Văn phòng' },
};

export const SCHOOL_AVATAR = '/thpt-chu-van-an.jpg';
const AVATAR_POOL = [SCHOOL_AVATAR];

function convertToSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getPositionLabel(roleCode: string, subject: string): string {
  switch (roleCode) {
    case 'TTCM':
      return 'Tổ trưởng chuyên môn';
    case 'TT':
      return 'Tổ trưởng chuyên môn';
    case 'TPCM':
      return 'Tổ phó chuyên môn';
    case 'BTĐ':
      return 'Bí thư Đoàn trường';
    case 'PBTĐ':
      return 'Phó Bí thư Đoàn trường';
    case 'TK':
      return 'Thư ký Hội đồng';
    case 'KT':
      return 'Kế toán trường';
    case 'YT':
      return 'Cán bộ Y tế học đường';
    case 'TV':
      return 'Cán bộ Thư viện';
    case 'VP':
      return 'Cán bộ Văn phòng';
    case 'TBVT':
      return 'Phụ trách Thiết bị - PTN';
    default:
      return `Giáo viên môn ${subject}`;
  }
}

// Leadership & Management Staff
export const LEADERSHIP_USERS: UserProfile[] = [
  {
    id: 'user-bgh-giap-van-khiem',
    name: 'Giáp Văn Khiêm',
    code: 'BGH00',
    email: 'sonlamgiap@gmail.com',
    role: 'bgh',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    position: 'Ban Giám Hiệu - Quản trị viên',
    subject: 'Quản lý',
    concurrentJob: 'Quản trị viên Hệ thống Thi đua',
    avatar: SCHOOL_AVATAR,
    phone: '0988 888 888'
  },
  {
    id: 'user-bgh-1',
    name: 'Trần Văn Thi',
    code: 'BGH01',
    email: 'tranvanthi@cva.edu.vn',
    role: 'bgh',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    position: 'Hiệu trưởng - Chủ tịch HĐTĐKT',
    subject: 'Văn',
    concurrentJob: 'Chủ tịch Hội đồng Thi đua Khen thưởng',
    avatar: SCHOOL_AVATAR,
    phone: '0912 345 678'
  },
  {
    id: 'user-bgh-2',
    name: 'Nguyễn Đăng Tấn',
    code: 'BGH02',
    email: 'nguyendangtan@cva.edu.vn',
    role: 'bgh',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    position: 'Phó Hiệu trưởng',
    subject: 'Toán',
    concurrentJob: 'Phó Chủ tịch Thường trực HĐTĐKT',
    avatar: SCHOOL_AVATAR,
    phone: '0913 987 654'
  },
  {
    id: 'user-bgh-3',
    name: 'Đặng Vũ Hải',
    code: 'BGH03',
    email: 'dangvuhai@cva.edu.vn',
    role: 'bgh',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    position: 'Phó Hiệu trưởng',
    subject: 'Địa lí',
    concurrentJob: 'Phó Chủ tịch HĐTĐKT',
    avatar: SCHOOL_AVATAR,
    phone: '0915 678 901'
  },
  {
    id: 'user-btd-1',
    name: 'Cán bộ Ban Thi Đua',
    code: 'BTD01',
    email: 'thidua@cva.edu.vn',
    role: 'btd',
    departmentId: 'btd',
    departmentName: 'Thường trực Ban Thi Đua',
    position: 'Thường trực Ban Thi Đua - Khen thưởng',
    concurrentJob: 'Tổng hợp và theo dõi nề nếp thi đua',
    avatar: SCHOOL_AVATAR,
    phone: '0988 112 233'
  }
];

// Transform raw staff list into complete UserProfiles
export const TEACHERS_AND_STAFF_USERS: UserProfile[] = RAW_STAFF_LIST.map((item, idx) => {
  const deptInfo = DEPT_MAP[item.deptName] || { id: 'tcm-khac', name: item.deptName };
  const isLeader = item.roleCode === 'TTCM' || item.roleCode === 'TT';
  const role: UserRole = isLeader ? 'ttcm' : 'gv';
  const isHomeroom = !!item.assignment && /^[1-9][0-2]?[A-Z][0-9]*$/.test(item.assignment.trim());
  const positionLabel = getPositionLabel(item.roleCode, item.subject);
  
  let concurrentJob = item.assignment || '';
  if (isHomeroom) {
    concurrentJob = `GVCN lớp ${item.assignment}`;
  } else if (item.roleCode === 'BTĐ') {
    concurrentJob = 'Bí thư Đoàn trường';
  } else if (item.roleCode === 'PBTĐ') {
    concurrentJob = 'Phó Bí thư Đoàn trường';
  } else if (item.roleCode === 'TBVT') {
    concurrentJob = 'Phụ trách thiết bị & phòng thí nghiệm';
  } else if (item.roleCode === 'TK') {
    concurrentJob = 'Thư ký Hội đồng sư phạm';
  } else if (!concurrentJob) {
    concurrentJob = 'Giảng dạy chuyên môn';
  }

  const nameSlug = convertToSlug(item.name);
  const email = `${nameSlug}.${item.stt}@cva.edu.vn`;
  const code = `GV${String(item.stt).padStart(3, '0')}`;
  const avatar = AVATAR_POOL[(item.stt + idx) % AVATAR_POOL.length];

  const userProfile: UserProfile = {
    id: `staff-${item.stt}-${idx}`,
    name: item.name,
    code,
    email,
    role,
    departmentId: deptInfo.id,
    departmentName: deptInfo.name,
    position: positionLabel,
    subject: item.subject,
    concurrentJob,
    isHomeroomTeacher: isHomeroom,
    avatar,
    phone: `09${Math.floor(10000000 + (item.stt * 7654321) % 90000000)}`
  };

  if (isHomeroom && item.assignment) {
    userProfile.homeroomClass = item.assignment.trim();
  }

  return userProfile;
});

// All Users combined
export const OFFICIAL_ALL_USERS: UserProfile[] = [
  ...LEADERSHIP_USERS,
  ...TEACHERS_AND_STAFF_USERS
];

// Department List calculation based on official users
export const OFFICIAL_DEPARTMENTS: Department[] = Object.values(DEPT_MAP).map(dept => {
  const members = TEACHERS_AND_STAFF_USERS.filter(u => u.departmentId === dept.id);
  const leader = members.find(u => u.role === 'ttcm') || members[0];

  return {
    id: dept.id,
    name: dept.name,
    leaderId: leader ? leader.id : '',
    leaderName: leader ? leader.name : 'Chưa chỉ định',
    memberCount: members.length
  };
});
