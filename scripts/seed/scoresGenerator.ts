import { MonthlyScoreRecord, UserProfile, ScoreItemDetail } from '../../src/types';
import { SCHOOL_YEAR_MONTHS } from '../../src/utils/academicYear';

export function generateComprehensiveMonthlyScores(
  users: UserProfile[],
  month: number = 9,
  year: string = '2026-2027'
): MonthlyScoreRecord[] {
  // Only evaluate teaching and support staff (exclude BGH and BTD from standard teacher evaluation score tables)
  const evaluatableStaff = users.filter(u => u.role !== 'bgh' && u.role !== 'btd');

  return evaluatableStaff.map((staff, idx) => {
    const bonusItems: ScoreItemDetail[] = [];
    const penaltyItems: ScoreItemDetail[] = [];

    // GVCN bonus
    if (staff.isHomeroomTeacher && staff.homeroomClass) {
      bonusItems.push({
        id: `bonus-cn-${staff.id}-${month}`,
        criterionId: 'c-ii5-3',
        title: `Điểm thưởng công tác GVCN ${staff.homeroomClass}`,
        points: 3,
        quantity: 1,
        note: `Nề nếp lớp ${staff.homeroomClass} ổn định, tỷ lệ chuyên cần cao`
      });
    }

    // Tổ trưởng CM bonus
    if (staff.role === 'ttcm') {
      bonusItems.push({
        id: `bonus-tt-${staff.id}-${month}`,
        criterionId: 'c-ii5-1',
        title: 'Thực hiện xuất sắc nhiệm vụ Tổ trưởng CM',
        points: 2,
        quantity: 1,
        note: 'Tổ chức sinh hoạt chuyên môn theo hướng nghiên cứu bài học chất lượng'
      });
    }

    // Đoàn trường bonus
    if (staff.concurrentJob?.includes('Đoàn trường')) {
      bonusItems.push({
        id: `bonus-doan-${staff.id}-${month}`,
        criterionId: 'c-ii5-3',
        title: 'Công tác Đoàn thanh niên năng nổ',
        points: 3,
        quantity: 1,
        note: 'Tổ chức thành công ngày hội thanh niên sáng tạo và tuyên truyền ATGT'
      });
    }

    // Thiết bị / Thư viện / Kế toán bonus
    if (staff.concurrentJob?.includes('thiết bị') || staff.position?.includes('Kế toán') || staff.position?.includes('Thư viện')) {
      bonusItems.push({
        id: `bonus-tb-${staff.id}-${month}`,
        criterionId: 'c-ii5-3',
        title: 'Hoàn thành tốt công tác chuyên trách / hỗ trợ',
        points: 2,
        quantity: 1,
        note: 'Sắp xếp hồ sơ minh bạch, thiết bị phục vụ giảng dạy chu đáo'
      });
    }

    // Substitute teaching or special achievements for sample teachers
    if (idx % 7 === 1) {
      bonusItems.push({
        id: `bonus-dt-${staff.id}-${month}`,
        criterionId: 'c-ii1-1',
        title: 'Dạy thay giáo viên ốm đau, thai sản',
        points: 2,
        quantity: 2,
        note: 'Dạy thay 2 tiết theo phân công của BGH'
      });
    }

    if (idx % 11 === 3) {
      bonusItems.push({
        id: `bonus-hsg-${staff.id}-${month}`,
        criterionId: 'c-ii3-1',
        title: 'Bồi dưỡng học sinh thi chuyên đề xuất sắc',
        points: 4,
        quantity: 1,
        note: 'Đội tuyển đạt thành tích cao trong đợt khảo sát chất lượng mũi nhọn'
      });
    }

    // Rare minor penalty for realistic data
    if (idx === 19) {
      penaltyItems.push({
        id: `pen-${staff.id}-${month}`,
        criterionId: 'c-ii1-4',
        title: 'Chậm nộp giáo án kiểm tra định kỳ',
        points: 2,
        quantity: 1,
        note: 'Nộp giáo án muộn 1 ngày so với lịch quy định của tổ CM'
      });
    }

    const totalBonus = bonusItems.reduce((acc, item) => acc + item.points * item.quantity, 0);
    const totalPenalty = penaltyItems.reduce((acc, item) => acc + item.points * item.quantity, 0);
    const baseScore = 230;
    const totalScore = baseScore + totalBonus - totalPenalty;

    // Status distribution
    let status: 'approved' | 'submitted' | 'draft' = 'submitted';
    if (idx % 3 === 0) {
      status = 'approved';
    } else if (idx % 5 === 4) {
      status = 'draft';
    } else {
      status = 'submitted';
    }

    const record: MonthlyScoreRecord = {
      id: `score-${staff.id}-m${month}`,
      staffId: staff.id,
      staffName: staff.name,
      staffCode: staff.code,
      departmentId: staff.departmentId,
      departmentName: staff.departmentName,
      position: staff.position,
      month,
      year,
      baseScore,
      bonusItems,
      penaltyItems,
      totalBonus,
      totalPenalty,
      totalScore,
      status,
      reviewedBy: 'ttcm-auto',
      reviewedByName: 'Tổ trưởng chuyên môn',
      reviewedAt: '2026-09-26 16:00',
    };

    if (status === 'approved') {
      record.bghApprovedScore = totalScore;
      record.bghNotes = 'BGH phê duyệt: Đạt mức thi đua tốt trong tháng.';
      record.approvedBy = 'user-bgh-1';
      record.approvedByName = 'Trần Văn Thi';
      record.approvedAt = '2026-09-28 10:30';
    }

    return record;
  });
}

export function generateAllSchoolYearScores(
  users: UserProfile[],
  year: string = '2026-2027'
): MonthlyScoreRecord[] {
  // Generate evaluation records across all 9 months of the academic year:
  // HK1: Tháng 9, 10, 11, 12, 1
  // HK2: Tháng 2, 3, 4, 5
  return SCHOOL_YEAR_MONTHS.flatMap(month =>
    generateComprehensiveMonthlyScores(users, month, year)
  );
}

