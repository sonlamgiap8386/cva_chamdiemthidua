import { Department } from '../types';

/**
 * Khung danh sách tổ chuyên môn (chỉ id + tên, KHÔNG có tên người).
 * Dữ liệu thật (tổ trưởng, số thành viên) được nạp từ Firestore sau khi đăng nhập;
 * khung này chỉ dùng làm giá trị ban đầu khi Firestore chưa có bản ghi `departments`.
 */
export const DEPARTMENT_SKELETON: Department[] = [
  { id: 'tcm-toan', name: 'Tổ Toán' },
  { id: 'tcm-van', name: 'Tổ Ngữ Văn' },
  { id: 'tcm-nn', name: 'Tổ Ngoại Ngữ' },
  { id: 'tcm-vatli', name: 'Tổ Vật lí' },
  { id: 'tcm-hoahoc', name: 'Tổ Hoá học' },
  { id: 'tcm-sinhhoc', name: 'Tổ Sinh học' },
  { id: 'tcm-su-dia-ktpl', name: 'Tổ Sử - Địa - KTPL' },
  { id: 'tcm-tin-cn-mt', name: 'Tổ Tin - CN - MT' },
  { id: 'tcm-theduc', name: 'Tổ Thể Dục - QPAN' },
  { id: 'tcm-vanphong', name: 'Tổ Văn phòng' },
].map(d => ({ ...d, leaderId: '', leaderName: 'Chưa chỉ định', memberCount: 0 }));
