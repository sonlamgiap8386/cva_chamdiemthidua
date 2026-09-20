import type { MonthlyScoreRecord } from '../types';

/**
 * Bảng xếp hạng CÔNG KHAI (mọi tài khoản đã đăng nhập đều đọc được).
 *
 * Chỉ công bố: họ tên, mã, tổ, chức vụ, điểm chốt và tổng điểm cộng/trừ của kết quả ĐÃ ĐƯỢC BGH
 * DUYỆT hoặc KHÓA SỔ. Nội dung chi tiết từng mục cộng/trừ, ghi chú và ý kiến KHÔNG được công bố.
 * Mỗi tháng một tài liệu `rankings/{năm học}_{tháng}` nên người xem chỉ tốn tối đa 9 lượt đọc.
 */
export const RANKING_COLLECTION = 'rankings';

export interface PublicRankingEntry {
  staffId: string;
  staffName: string;
  staffCode: string;
  departmentId: string;
  departmentName: string;
  position: string;
  baseScore: number;
  totalBonus: number;
  totalPenalty: number;
  /** Điểm chốt của BGH (hoặc tổng điểm nếu BGH duyệt nguyên đề xuất). */
  score: number;
  status: 'approved' | 'locked';
}

export interface PublicRankingDoc {
  year: string;
  month: number;
  entries: PublicRankingEntry[];
  updatedAt: string;
}

export const rankingDocId = (year: string, month: number): string => `${year}_${month}`;

export const isOfficialResult = (record: Pick<MonthlyScoreRecord, 'status'>): boolean =>
  record.status === 'approved' || record.status === 'locked';

export function buildRankingDoc(
  records: MonthlyScoreRecord[],
  year: string,
  month: number,
  now: Date = new Date()
): PublicRankingDoc {
  const entries: PublicRankingEntry[] = records
    .filter(r => r.year === year && r.month === month && isOfficialResult(r))
    .map(r => ({
      staffId: r.staffId,
      staffName: r.staffName,
      staffCode: r.staffCode,
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      position: r.position,
      baseScore: r.baseScore,
      totalBonus: r.totalBonus,
      totalPenalty: r.totalPenalty,
      score: r.bghApprovedScore ?? r.totalScore,
      status: r.status as 'approved' | 'locked',
    }))
    .sort((a, b) => b.score - a.score || a.staffCode.localeCompare(b.staffCode));

  return { year, month, entries, updatedAt: now.toISOString() };
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isString = (v: unknown): v is string => typeof v === 'string';

/** Chuyển tài liệu công khai về dạng MonthlyScoreRecord để dùng lại giao diện xếp hạng (không có chi tiết cộng/trừ). */
export function rankingDocToRecords(data: unknown): MonthlyScoreRecord[] {
  const doc = data as Partial<PublicRankingDoc> | null;
  if (!doc || !isString(doc.year) || !isNumber(doc.month) || !Array.isArray(doc.entries)) return [];
  const { year, month } = doc;

  return doc.entries
    .filter((e): e is PublicRankingEntry =>
      !!e && isString(e.staffId) && isString(e.staffName) && isNumber(e.score) &&
      isNumber(e.baseScore) && isNumber(e.totalBonus) && isNumber(e.totalPenalty))
    .map(e => ({
      id: `rank-${e.staffId}-${year}-${month}`,
      staffId: e.staffId,
      staffName: e.staffName,
      staffCode: e.staffCode ?? '',
      departmentId: e.departmentId ?? '',
      departmentName: e.departmentName ?? '',
      position: e.position ?? '',
      month,
      year,
      baseScore: e.baseScore,
      bonusItems: [],
      penaltyItems: [],
      totalBonus: e.totalBonus,
      totalPenalty: e.totalPenalty,
      totalScore: e.baseScore + e.totalBonus - e.totalPenalty,
      bghApprovedScore: e.score,
      status: e.status === 'locked' ? 'locked' : 'approved',
    }));
}
