// Quy định tháng và học kỳ năm học trường THPT Chu Văn An
// Năm học có 9 tháng: Tháng 9, 10, 11, 12, 1, 2, 3, 4, 5
// Trong đó:
// - Học kỳ 1: Tháng 9, 10, 11, 12, 1 (5 tháng, chuẩn 1150đ)
// - Học kỳ 2: Tháng 2, 3, 4, 5 (4 tháng, chuẩn 920đ)
// - Cả năm: Tổng HK1 + HK2 (9 tháng, chuẩn 2070đ)

import { MonthlyScoreRecord } from '../types';

export const SCHOOL_YEAR_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5] as const;
export type SchoolMonth = (typeof SCHOOL_YEAR_MONTHS)[number];

export const SEMESTER_1_MONTHS = [9, 10, 11, 12, 1] as const;
export const SEMESTER_2_MONTHS = [2, 3, 4, 5] as const;

export type PeriodSelection = number | 'hk1' | 'hk2' | 'annual';

export interface MonthInfo {
  month: SchoolMonth;
  label: string;
  displayLabel: string;
  semester: 1 | 2;
  semesterName: string;
  calendarYear: string; // '2026' hoặc '2027'
}

export const MONTH_DETAILS: Record<SchoolMonth, MonthInfo> = {
  9: { month: 9, label: 'Tháng 9', displayLabel: 'Tháng 09', semester: 1, semesterName: 'Học kỳ I', calendarYear: '2026' },
  10: { month: 10, label: 'Tháng 10', displayLabel: 'Tháng 10', semester: 1, semesterName: 'Học kỳ I', calendarYear: '2026' },
  11: { month: 11, label: 'Tháng 11', displayLabel: 'Tháng 11', semester: 1, semesterName: 'Học kỳ I', calendarYear: '2026' },
  12: { month: 12, label: 'Tháng 12', displayLabel: 'Tháng 12', semester: 1, semesterName: 'Học kỳ I', calendarYear: '2026' },
  1: { month: 1, label: 'Tháng 1', displayLabel: 'Tháng 01', semester: 1, semesterName: 'Học kỳ I', calendarYear: '2027' },
  2: { month: 2, label: 'Tháng 2', displayLabel: 'Tháng 02', semester: 2, semesterName: 'Học kỳ II', calendarYear: '2027' },
  3: { month: 3, label: 'Tháng 3', displayLabel: 'Tháng 03', semester: 2, semesterName: 'Học kỳ II', calendarYear: '2027' },
  4: { month: 4, label: 'Tháng 4', displayLabel: 'Tháng 04', semester: 2, semesterName: 'Học kỳ II', calendarYear: '2027' },
  5: { month: 5, label: 'Tháng 5', displayLabel: 'Tháng 05', semester: 2, semesterName: 'Học kỳ II', calendarYear: '2027' },
};

export function getSemesterOf(month: number): 1 | 2 {
  return [9, 10, 11, 12, 1].includes(month) ? 1 : 2;
}

export function getSemesterName(month: number): string {
  return getSemesterOf(month) === 1 ? 'Học kỳ I' : 'Học kỳ II';
}

export function formatMonthName(month: number): string {
  return `Tháng ${month}`;
}

export function formatMonthTitle(month: number): string {
  const pad = month < 10 ? `0${month}` : `${month}`;
  const sem = getSemesterName(month);
  return `Tháng ${pad} (${sem})`;
}

export function getPeriodLabel(period: PeriodSelection): string {
  if (period === 'hk1') return 'Học kỳ I (T9, T10, T11, T12, T1)';
  if (period === 'hk2') return 'Học kỳ II (T2, T3, T4, T5)';
  if (period === 'annual') return 'Cả năm học (9 tháng: HK1 + HK2)';
  return formatMonthName(period);
}

export function getPeriodShortTitle(period: PeriodSelection): string {
  if (period === 'hk1') return 'Học kỳ I';
  if (period === 'hk2') return 'Học kỳ II';
  if (period === 'annual') return 'Cả năm học';
  return formatMonthName(period);
}

export function getPeriodMonths(period: PeriodSelection): readonly number[] {
  if (period === 'hk1') return SEMESTER_1_MONTHS;
  if (period === 'hk2') return SEMESTER_2_MONTHS;
  if (period === 'annual') return SCHOOL_YEAR_MONTHS;
  return [period];
}

export function getPeriodBaseScore(period: PeriodSelection): number {
  if (period === 'hk1') return 1150; // 5 * 230đ
  if (period === 'hk2') return 920;  // 4 * 230đ
  if (period === 'annual') return 2070; // 9 * 230đ
  return 230;
}

/**
 * Tổng hợp điểm số cho từng giáo viên theo kỳ:
 * - Tháng cụ thể: điểm của tháng đó.
 * - HK1: tổng điểm của các tháng 9, 10, 11, 12, 01.
 * - HK2: tổng điểm của các tháng 02, 03, 04, 05.
 * - Cả năm: tổng của HK1 và HK2 (tất cả 9 tháng).
 */
export function aggregateScoresForPeriod(
  scores: MonthlyScoreRecord[],
  period: PeriodSelection
): MonthlyScoreRecord[] {
  if (typeof period === 'number') {
    return scores.filter(s => s.month === period);
  }

  const months = getPeriodMonths(period);
  const activeRecords = scores.filter(s => months.includes(s.month));
  const map = new Map<string, MonthlyScoreRecord>();

  activeRecords.forEach(r => {
    const existing = map.get(r.staffId);
    const finalScore = r.bghApprovedScore ?? r.totalScore;

    if (!existing) {
      map.set(r.staffId, {
        ...r,
        id: `${r.staffId}-${period}`,
        month: typeof period === 'number' ? period : (period === 'hk1' ? 1 : period === 'hk2' ? 5 : 9),
        totalScore: finalScore,
        bghApprovedScore: finalScore,
        baseScore: r.baseScore,
        totalBonus: r.totalBonus,
        totalPenalty: r.totalPenalty,
        bonusItems: [...r.bonusItems],
        penaltyItems: [...r.penaltyItems],
      });
    } else {
      const updatedFinal = (existing.bghApprovedScore ?? existing.totalScore) + finalScore;
      const updatedTotal = existing.totalScore + r.totalScore;
      const updatedBonus = existing.totalBonus + r.totalBonus;
      const updatedPenalty = existing.totalPenalty + r.totalPenalty;
      const updatedBase = existing.baseScore + r.baseScore;

      // Combine status: if any is submitted/draft, reflect accordingly
      let combinedStatus = existing.status;
      if (r.status === 'draft') combinedStatus = 'draft';
      else if (r.status === 'submitted' && combinedStatus === 'approved') combinedStatus = 'submitted';

      map.set(r.staffId, {
        ...existing,
        baseScore: updatedBase,
        totalBonus: updatedBonus,
        totalPenalty: updatedPenalty,
        totalScore: updatedTotal,
        bghApprovedScore: updatedFinal,
        status: combinedStatus,
        bonusItems: [...existing.bonusItems, ...r.bonusItems],
        penaltyItems: [...existing.penaltyItems, ...r.penaltyItems],
      });
    }
  });

  return Array.from(map.values());
}

