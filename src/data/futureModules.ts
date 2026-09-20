import { FutureModule } from '../types';

export const FUTURE_MODULES: FutureModule[] = [
  {
    id: 'mod-skkn',
    name: 'Quản lý Sáng kiến kinh nghiệm (SKKN)',
    description: 'Nộp đề tài, thẩm định trực tuyến, theo dõi chấm điểm SKKN cấp trường, ngành, tỉnh có tích hợp chống trùng lặp văn bản.',
    badge: 'Mở rộng kỳ II',
    iconName: 'BookOpenCheck',
    isReady: true,
    statsLabel: 'Đề tài đang đăng ký',
    statsValue: '14 đề tài'
  },
  {
    id: 'mod-hsg',
    name: 'Bồi dưỡng HSG & Cuộc thi KHKT',
    description: 'Theo dõi tiến độ ôn luyện các đội tuyển văn hóa, KHKT, HKPĐ và tự động ánh xạ kết quả thi vào điểm thi đua giáo viên.',
    badge: 'Đã sẵn sàng',
    iconName: 'Trophy',
    isReady: true,
    statsLabel: 'Đội tuyển tham gia',
    statsValue: '8 đội tuyển'
  },
  {
    id: 'mod-neneep',
    name: 'Nhật ký Nề nếp & Giám sát tức thì',
    description: 'Sổ nhật ký điện tử cho Ban Thanh tra, Cờ đỏ và Ban Thi đua ghi nhận lỗi nề nếp (bỏ tiết, đi muộn) kèm bằng chứng ảnh ngay trong ngày.',
    badge: 'Đang kết nối',
    iconName: 'ClockAlert',
    isReady: true,
    statsLabel: 'Ghi nhận tháng này',
    statsValue: '0 vi phạm'
  },
  {
    id: 'mod-danhgia-dongnghiep',
    name: 'Đánh giá đồng nghiệp 360 độ bảo mật',
    description: 'Bỏ phiếu đánh giá tín nhiệm đồng nghiệp cuối năm học thông qua mã hóa ẩn danh, bảo đảm tính công bằng tuyệt đối.',
    badge: 'Kế hoạch 2027',
    iconName: 'Users',
    isReady: false,
    statsLabel: 'Chu kỳ đánh giá',
    statsValue: 'Cuối năm học'
  }
];
