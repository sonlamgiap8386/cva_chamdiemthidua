import { CriterionItem } from '../types';

export const CRITERIA_LIST: CriterionItem[] = [
  // I. Phẩm chất chính trị đạo đức lối sống (80đ ban đầu)
  {
    id: 'c-i-1',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Chấp hành chính sách, pháp luật của Nhà nước',
    initialPoints: 20,
    trackingDept: 'Chi bộ, BGH, Công đoàn',
    description: 'Chấp hành nghiêm chỉnh chủ trương, đường lối, chính sách của Đảng và Nhà nước'
  },
  {
    id: 'c-i-2',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Giữ gìn phẩm chất, uy tín, danh dự nhà giáo, đối xử công bằng với người học',
    initialPoints: 20,
    trackingDept: 'BGH, TTCM',
    description: 'Tôn trọng nhân cách người học, đối xử công bằng, bảo đảm quyền lợi người học'
  },
  {
    id: 'c-i-3',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Lối sống mẫu mực, uy tín trong đồng nghiệp, học sinh và nhân dân',
    initialPoints: 20,
    trackingDept: 'Đồng nghiệp, Đoàn thể',
    description: 'Tác phong mô phạm, khiêm tốn, hòa nhã, có uy tín sư phạm cao'
  },
  {
    id: 'c-i-4',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Thực hiện nghĩa vụ viên chức, điều lệ và quy chế Nhà trường',
    initialPoints: 20,
    trackingDept: 'BGH, Ban TĐ',
    description: 'Thực hiện đầy đủ nhiệm vụ theo Luật Viên chức và Điều lệ trường THPT'
  },
  {
    id: 'c-i-5',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Tích cực tham gia hoạt động của tổ CM (chuẩn bị giao lưu CM, làm đồ dùng...)',
    rewardPoints: 1,
    rewardUnit: '1 đ/lần',
    maxPerSemester: 10,
    trackingDept: 'Tổ chuyên môn',
    description: 'Điểm thưởng cho giáo viên hăng hái đóng góp vào hoạt động chuyên môn chung'
  },
  {
    id: 'c-i-6',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Không đóng quỹ trong các văn bản quy định, vi phạm pháp luật (như ATGT...)',
    penaltyPoints: 5,
    penaltyUnit: '-5 đ/lần',
    trackingDept: 'Công đoàn, Công an gửi về',
    description: 'Vi phạm ATGT hoặc quy chế tài chính'
  },
  {
    id: 'c-i-7',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Gây mất đoàn kết trong tổ CM, HĐSP; có phản ánh về không công bằng',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/lần',
    trackingDept: 'HĐSP, Phản ánh HS',
    description: 'Phát ngôn gây mất đoàn kết nội bộ hoặc thiếu khách quan khi dạy học'
  },
  {
    id: 'c-i-8',
    category: 'I',
    categoryTitle: 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
    title: 'Có phản ánh của đồng nghiệp, PHHS, học sinh trong lối sống hoặc giảng dạy',
    penaltyPoints: 5,
    penaltyUnit: '-5 đ/lần',
    trackingDept: 'Ban Thanh tra ND, BGH',
    description: 'Đã xác minh có cơ sở vi phạm'
  },

  // II.1. Thực hiện ngày giờ công
  {
    id: 'c-ii1-1',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Được phân công dạy thay cho người đi công tác, nghỉ ốm, luật lao động',
    rewardPoints: 1,
    rewardUnit: '1 đ/tiết',
    maxPerSemester: 8,
    trackingDept: 'Tổ chuyên môn theo dõi sổ nhật ký',
    description: 'Hỗ trợ đồng nghiệp và nhà trường khi có việc đột xuất'
  },
  {
    id: 'c-ii1-2',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Từ chối nhiệm vụ do BGH phân công có lí do không chính đáng',
    penaltyPoints: 10,
    penaltyUnit: '-10 đ/lần',
    trackingDept: 'BGH',
    description: 'Trừ trường hợp liên quan tứ thân phụ mẫu hoặc con cái ốm nằm viện'
  },
  {
    id: 'c-ii1-3',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Từ chối nhiệm vụ do TTCM, Bí thư đoàn phân công không có lý do chính đáng',
    penaltyPoints: 5,
    penaltyUnit: '-5 đ/lần',
    trackingDept: 'TTCM, Đoàn trường'
  },
  {
    id: 'c-ii1-4',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'GVCN không có mặt điều hành HS tham gia trực tuần/lao động/ngoại khóa',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/buổi',
    trackingDept: 'Đoàn trường, Trực ban'
  },
  {
    id: 'c-ii1-5',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'GV bỏ tiết không lí do (Chính khoá, phụ đạo, sau 15 phút trống vào lớp)',
    penaltyPoints: 10,
    penaltyUnit: '-10 đ/tiết',
    trackingDept: 'Giám thị, BGH'
  },
  {
    id: 'c-ii1-6',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Làm việc riêng trong giờ dạy, giờ coi thi',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/tiết',
    trackingDept: 'Thanh tra, BGH'
  },
  {
    id: 'c-ii1-7',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Tự ý đổi giờ (không báo TTCM và BGH), nghỉ việc riêng',
    penaltyPoints: 5,
    penaltyUnit: '-5 đ/tiết',
    trackingDept: 'TTCM, Giáo vụ'
  },
  {
    id: 'c-ii1-8',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Nghỉ họp tổ, sinh hoạt chuyên môn, hội đồng (Không phép)',
    penaltyPoints: 3,
    penaltyUnit: '-3 đ/lần',
    trackingDept: 'Thư ký HĐ, TTCM'
  },
  {
    id: 'c-ii1-9',
    category: 'II_1',
    categoryTitle: 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
    title: 'Đi họp muộn, lên lớp muộn, cho học sinh ra sớm không báo cáo',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/lần',
    trackingDept: 'Trực ban, Đoàn thanh niên'
  },

  // II.2. Ra đề, kiểm tra, vào điểm
  {
    id: 'c-ii2-1',
    category: 'II_2',
    categoryTitle: 'II.2. Ra đề, kiểm tra, vào điểm, xếp loại',
    title: 'Ra đề thi/kiểm tra học sinh toàn khối giữa kỳ, cuối kỳ đúng chuẩn',
    rewardPoints: 2,
    rewardUnit: '+2 đ/lần/đề',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/lần/đề (nếu sai sót)',
    maxPerSemester: 6,
    trackingDept: 'BGH, Hội đồng ra đề'
  },
  {
    id: 'c-ii2-2',
    category: 'II_2',
    categoryTitle: 'II.2. Ra đề, kiểm tra, vào điểm, xếp loại',
    title: 'Phản biện đề + duyệt đề chất lượng cao',
    rewardPoints: 1,
    rewardUnit: '+1 đ/lần/đề',
    penaltyPoints: 1,
    penaltyUnit: '-1 đ/lần/đề',
    maxPerSemester: 6,
    trackingDept: 'TTCM'
  },
  {
    id: 'c-ii2-3',
    category: 'II_2',
    categoryTitle: 'II.2. Ra đề, kiểm tra, vào điểm, xếp loại',
    title: 'Không vào điểm theo kế hoạch trên CSDL (Muộn hạn)',
    penaltyPoints: 3,
    penaltyUnit: '-3 đ/lần/lớp (tối đa -10 đ/kỳ)',
    maxPerSemester: 10,
    trackingDept: 'Quản trị CSDL'
  },
  {
    id: 'c-ii2-4',
    category: 'II_2',
    categoryTitle: 'II.2. Ra đề, kiểm tra, vào điểm, xếp loại',
    title: 'Vào sai/sửa điểm trên CSDL',
    penaltyPoints: 1,
    penaltyUnit: '-1 đ/lỗi (tối đa -5 đ/kỳ)',
    maxPerSemester: 5,
    trackingDept: 'Quản trị CSDL'
  },
  {
    id: 'c-ii2-5',
    category: 'II_2',
    categoryTitle: 'II.2. Ra đề, kiểm tra, vào điểm, xếp loại',
    title: 'Không nộp báo cáo đúng hạn, tổng hợp số liệu báo cáo sai',
    penaltyPoints: 2,
    penaltyUnit: '-2 đ/lần',
    trackingDept: 'Văn phòng, BGH'
  },

  // II.4. Trình độ chuyên môn, GVG, HSG
  {
    id: 'c-ii4-1',
    category: 'II_4',
    categoryTitle: 'II.4. Hội thi GVG, Bồi dưỡng HSG & KHKT',
    title: 'Được công nhận giáo viên giỏi cấp trường (Vòng 2)',
    rewardPoints: 5,
    rewardUnit: '+5 đ/GV',
    trackingDept: 'Hội đồng chấm GVG'
  },
  {
    id: 'c-ii4-2',
    category: 'II_4',
    categoryTitle: 'II.4. Hội thi GVG, Bồi dưỡng HSG & KHKT',
    title: 'Đạt Giáo viên giỏi cấp Tỉnh (Vòng 1: +10đ, Vòng 2: +20đ)',
    rewardPoints: 20,
    rewardUnit: '+10 hoặc +20 đ/GV',
    trackingDept: 'Sở GD&ĐT, BGH'
  },
  {
    id: 'c-ii4-3',
    category: 'II_4',
    categoryTitle: 'II.4. Hội thi GVG, Bồi dưỡng HSG & KHKT',
    title: 'Dạy đội tuyển HSG văn hóa cấp tỉnh (Nhất +20, Nhì +12, Ba +10, KK +8; Trắng giải -10đ)',
    rewardPoints: 20,
    rewardUnit: 'Theo kết quả',
    trackingDept: 'Ban chuyên môn'
  },
  {
    id: 'c-ii4-4',
    category: 'II_4',
    categoryTitle: 'II.4. Hội thi GVG, Bồi dưỡng HSG & KHKT',
    title: 'Hướng dẫn HS thi KHKT cấp tỉnh (Nhất +60đ, Nhì +40đ, Ba +20đ, KK +10đ)',
    rewardPoints: 60,
    rewardUnit: 'Theo kết quả',
    trackingDept: 'Tổ KHKT'
  },

  // II.5. Công tác kiêm nhiệm & phong trào
  {
    id: 'c-ii5-1',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Tổ trưởng chuyên môn (TTCM), Bí thư đoàn trường, Bí thư chi bộ',
    rewardPoints: 6,
    rewardUnit: '+6 đ/kỳ',
    trackingDept: 'BGH'
  },
  {
    id: 'c-ii5-2',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Phụ trách Công nghệ thông tin',
    rewardPoints: 8,
    rewardUnit: '+8 đ/kỳ',
    trackingDept: 'BGH'
  },
  {
    id: 'c-ii5-3',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Phó BT đoàn, Thư ký HĐ, Thư ký CSVC, TPCM, Khối trưởng GVCN, Phòng bộ môn...',
    rewardPoints: 3,
    rewardUnit: '+3 đ/kỳ',
    trackingDept: 'BGH'
  },
  {
    id: 'c-ii5-4',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Giáo viên chủ nhiệm (Xếp loại Giỏi +5đ, Khá +3đ, Đạt +2đ)',
    rewardPoints: 5,
    rewardUnit: '+2 đến +5 đ/kỳ',
    trackingDept: 'Ban nề nếp, Đoàn trường'
  },
  {
    id: 'c-ii5-5',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Hiến máu nhân đạo tình nguyện',
    rewardPoints: 2,
    rewardUnit: '+2 đ/lần',
    trackingDept: 'Hội Chữ thập đỏ'
  },
  {
    id: 'c-ii5-6',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Đăng bài cho Website nhà trường / Bài viết chính luận (đã duyệt)',
    rewardPoints: 1,
    rewardUnit: '+1 đ/bài (tối đa 3đ/kỳ)',
    maxPerSemester: 3,
    trackingDept: 'Ban biên tập Website'
  },
  {
    id: 'c-ii5-7',
    category: 'II_5',
    categoryTitle: 'II.5. Kiêm nhiệm, chủ nhiệm lớp & phong trào',
    title: 'Lỗi điều hành công tác do mình phụ trách',
    penaltyPoints: 1,
    penaltyUnit: '-1 đ/lỗi (tối đa -5đ/kỳ)',
    maxPerSemester: 5,
    trackingDept: 'BGH'
  },

  // II.7. Viết Sáng kiến kinh nghiệm (SKKN)
  {
    id: 'c-ii7-1',
    category: 'II_7',
    categoryTitle: 'II.7. Sáng kiến kinh nghiệm (SKKN)',
    title: 'Được công nhận Sáng kiến kinh nghiệm cấp tỉnh',
    rewardPoints: 40,
    rewardUnit: '+40 đ/ĐT',
    trackingDept: 'Hội đồng SKKN Tỉnh'
  },
  {
    id: 'c-ii7-2',
    category: 'II_7',
    categoryTitle: 'II.7. Sáng kiến kinh nghiệm (SKKN)',
    title: 'Được công nhận Sáng kiến kinh nghiệm cấp ngành / Sở GD&ĐT',
    rewardPoints: 20,
    rewardUnit: '+20 đ/ĐT',
    trackingDept: 'Hội đồng SKKN Ngành'
  },
  {
    id: 'c-ii7-3',
    category: 'II_7',
    categoryTitle: 'II.7. Sáng kiến kinh nghiệm (SKKN)',
    title: 'Được công nhận Sáng kiến kinh nghiệm cấp trường',
    rewardPoints: 10,
    rewardUnit: '+10 đ/ĐT',
    trackingDept: 'Hội đồng SKKN Trường'
  },

  // II.8. Viết tài liệu ôn thi TN THPT
  {
    id: 'c-ii8-1',
    category: 'II_8',
    categoryTitle: 'II.8. Viết tài liệu ôn thi tốt nghiệp THPT',
    title: 'Tài liệu ôn thi tốt nghiệp THPT được đánh giá tốt không quá 100 trang',
    rewardPoints: 10,
    rewardUnit: '10 đ/tài liệu (chia đều người viết)',
    trackingDept: 'Tổ chuyên môn & BGH'
  }
];
