import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Crown,
  TrendingUp,
  Building2,
  Star,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MonthlyScoreRecord, UserProfile, Department } from '../types';
import { exportMonthlyScoreToExcel } from '../utils/excelExport';
import {
  SEMESTER_1_MONTHS,
  SEMESTER_2_MONTHS,
  PeriodSelection,
  getSemesterName,
  formatMonthName,
  getPeriodLabel,
  getPeriodShortTitle,
  getPeriodBaseScore,
  aggregateScoresForPeriod
} from '../utils/academicYear';
import { AcademicPeriodSelector } from './AcademicPeriodSelector';

interface RealTimeLeaderboardProps {
  scores: MonthlyScoreRecord[];
  currentMonth: number;
  currentUser: UserProfile;
  departments: Department[];
}

export const RealTimeLeaderboard: React.FC<RealTimeLeaderboardProps> = ({
  scores,
  currentMonth,
  currentUser,
  departments,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(currentMonth);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Aggregate records for the active period (Month, HK1, HK2, or Cả năm)
  const baseScores = useMemo(() => {
    return aggregateScoresForPeriod(scores, selectedPeriod);
  }, [scores, selectedPeriod]);

  // Filter records
  const filteredScores = useMemo(() => {
    return baseScores.filter(s => {
      if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return s.staffName.toLowerCase().includes(q) || s.staffCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [baseScores, selectedDept, searchQuery]);

  // Sort by score descending
  const sorted = useMemo(() => {
    return [...filteredScores].sort((a, b) => {
      const scoreA = a.bghApprovedScore ?? a.totalScore;
      const scoreB = b.bghApprovedScore ?? b.totalScore;
      return scoreB - scoreA;
    });
  }, [filteredScores]);

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  const periodBaseScore = getPeriodBaseScore(selectedPeriod);
  const periodLabel = getPeriodLabel(selectedPeriod);
  const periodShortTitle = getPeriodShortTitle(selectedPeriod);

  // Trigger celebration confetti
  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const top20Quota = Math.max(1, Math.round(sorted.length * 0.2));

  const getTitleBadge = (score: number, rank: number, total: number) => {
    const quota = Math.max(1, Math.round(total * 0.2));

    if (rank <= quota && score >= periodBaseScore) {
      return {
        label: `Hoàn thành Xuất sắc (Top 20% · #${rank})`,
        bg: 'bg-amber-400/20 text-amber-300 border-amber-400/50 font-extrabold',
        star: true
      };
    } else if (score >= periodBaseScore) {
      return {
        label: 'Hoàn thành Tốt nhiệm vụ',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold',
        star: false
      };
    } else if (score >= periodBaseScore - 10) {
      return {
        label: 'Hoàn thành nhiệm vụ',
        bg: 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-semibold',
        star: false
      };
    } else {
      return {
        label: 'Cần nỗ lực thêm',
        bg: 'bg-stone-800 text-stone-300 border-stone-700 font-normal',
        star: false
      };
    }
  };

  const handleExportExcel = () => {
    const periodFileTag =
      selectedPeriod === 'hk1'
        ? 'HocKy1'
        : selectedPeriod === 'hk2'
        ? 'HocKy2'
        : selectedPeriod === 'annual'
        ? 'CaNam'
        : `Thang${selectedPeriod}`;

    exportMonthlyScoreToExcel(
      sorted,
      typeof selectedPeriod === 'number' ? selectedPeriod : 9,
      `2026-2027_${periodFileTag}`,
      'TRƯỜNG THPT CHU VĂN AN'
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BẢNG VINH DANH THỜI GIAN THỰC</span>
            <span className="text-emerald-700">·</span>
            <span className="text-emerald-300">{periodLabel}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
            <span>Bảng Xếp Hạng Thi Đua: {periodShortTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl">
            {selectedPeriod === 'hk1'
              ? 'Xếp hạng tổng điểm Học kỳ I (tổng các tháng 9, 10, 11, 12, 01 - Thang chuẩn 1150đ).'
              : selectedPeriod === 'hk2'
              ? 'Xếp hạng tổng điểm Học kỳ II (tổng các tháng 02, 03, 04, 05 - Thang chuẩn 920đ).'
              : selectedPeriod === 'annual'
              ? 'Xếp hạng Cả năm học 2026–2027 (Tổng HK1 + HK2 = 9 tháng, thang chuẩn 2070đ).'
              : `Toàn bộ điểm số, căn cứ cộng thưởng và quyết định phê duyệt tháng ${selectedPeriod} được công khai minh bạch.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCelebrate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <PartyPopper className="w-4 h-4" />
            <span>Tuyên dương</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer border border-emerald-600/50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel {periodShortTitle}</span>
          </button>
        </div>
      </div>

      {/* Top 20% Quota Guideline Banner */}
      <div className="bg-[#072d24] border border-[#145b4c] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#093c31] border border-[#1b7360] flex items-center justify-center font-bold text-amber-400 shrink-0 shadow-xs">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Chỉ tiêu xếp loại "Hoàn thành Xuất sắc":</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#031713] font-black shadow-xs">
                Tối đa 20% ({top20Quota} / {sorted.length} CBVC)
              </span>
              <span className="text-[11px] text-emerald-300 bg-[#041d17] px-2 py-0.5 rounded-md border border-[#0e4438]">
                Điểm chuẩn: ≥ {periodBaseScore}đ
              </span>
            </div>
            <p className="text-emerald-300/80 mt-0.5 text-[11px]">
              Quy chế thi đua: Toàn bộ cán bộ giáo viên đạt từ điểm chuẩn ({periodBaseScore}đ) trở lên và nằm trong Top 20% có điểm cao nhất (từ hạng 1 đến hạng {top20Quota}) được công nhận danh hiệu Hoàn thành Xuất sắc nhiệm vụ.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-[11px] px-3 py-1 rounded-xl bg-[#041d17] border border-amber-400/50 text-amber-300 font-mono font-extrabold">
            Top 20%: Hạng 1 – #{top20Quota}
          </span>
        </div>
      </div>

      {/* Top 3 Podium (Bục Vinh Quang) */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          <div className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-sm flex flex-col items-center text-center order-2 md:order-1 relative overflow-hidden group hover:border-slate-400 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#072a23] border border-slate-400/50 text-slate-200 font-extrabold text-sm flex items-center justify-center mb-3 shadow-2xs">
              🥈 #2
            </div>
            <div className="text-base font-bold text-white font-serif group-hover:text-amber-300">{top2.staffName}</div>
            <div className="text-xs font-semibold text-emerald-300/80 mt-0.5">{top2.position}</div>
            <div className="text-[11px] text-emerald-400/60">{top2.departmentName}</div>

            <div className="mt-4 px-3.5 py-2 rounded-2xl bg-[#041d17] border border-[#0e4438] w-full flex items-center justify-between">
              <span className="text-xs text-emerald-300/70 font-medium">Điểm thi đua:</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {top2.bghApprovedScore ?? top2.totalScore}đ
              </span>
            </div>
          </div>

          {/* Rank 1 (Gold - Elevated) */}
          <div className="bg-gradient-to-b from-[#093c31] via-[#072d24] to-[#05211b] rounded-3xl p-6 border-2 border-amber-400 shadow-lg shadow-black/30 flex flex-col items-center text-center order-1 md:order-2 relative overflow-hidden -mt-3 group">
            <div className="absolute top-3 right-3 text-amber-400 animate-pulse">
              <Crown className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-[#031713] font-black text-base flex items-center justify-center mb-3 shadow-md shadow-amber-400/20">
              🥇 #1
            </div>
            <div className="text-lg font-extrabold text-white font-serif group-hover:text-amber-300">{top1.staffName}</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">{top1.position}</div>
            <div className="text-[11px] text-emerald-300/70">{top1.departmentName}</div>

            <div className="mt-4 px-4 py-2.5 rounded-2xl bg-[#041d17] border border-amber-400/70 w-full flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold text-amber-300">Dẫn đầu toàn trường:</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {top1.bghApprovedScore ?? top1.totalScore}đ
              </span>
            </div>
            <span className="mt-2 text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-amber-400 text-[#031713] tracking-wide uppercase">
              Thành tích xuất sắc nhất
            </span>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-sm flex flex-col items-center text-center order-3 relative overflow-hidden group hover:border-amber-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#072a23] border border-amber-600/50 text-amber-300 font-extrabold text-sm flex items-center justify-center mb-3 shadow-2xs">
              🥉 #3
            </div>
            <div className="text-base font-bold text-white font-serif group-hover:text-amber-300">{top3.staffName}</div>
            <div className="text-xs font-semibold text-emerald-300/80 mt-0.5">{top3.position}</div>
            <div className="text-[11px] text-emerald-400/60">{top3.departmentName}</div>

            <div className="mt-4 px-3.5 py-2 rounded-2xl bg-[#041d17] border border-[#0e4438] w-full flex items-center justify-between">
              <span className="text-xs text-emerald-300/70 font-medium">Điểm thi đua:</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {top3.bghApprovedScore ?? top3.totalScore}đ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters and controls */}
      <div className="bg-[#062921] p-4 rounded-2xl border border-[#0e4438] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/70" />
            <input
              type="text"
              placeholder="Tìm theo tên cán bộ, giáo viên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#05211b]">Tất cả các tổ chuyên môn</option>
            {departments.map(d => (
              <option key={d.id} value={d.id} className="bg-[#05211b]">
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Period Selector (HK I: T9..T1 | HK II: T2..T5 | Cả năm) */}
        <AcademicPeriodSelector
          selectedPeriod={selectedPeriod}
          onChangePeriod={setSelectedPeriod}
          showAnnual={true}
        />
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#05211b] rounded-2xl border border-[#0e4438] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#062921] text-emerald-300 font-bold uppercase tracking-wider text-[11px] border-b border-[#0e4438]">
                <th className="py-3 px-3 text-center w-16 border-r border-[#0e4438]">Hạng</th>
                <th className="py-3 px-4 min-w-[180px] border-r border-[#0e4438]">Họ và tên</th>
                <th className="py-3 px-4 border-r border-[#0e4438]">Tổ chuyên môn</th>
                <th className="py-3 px-3 text-center w-28 border-r border-[#0e4438]">Thưởng / Phạt</th>
                <th className="py-3 px-3 text-center w-28 border-r border-[#0e4438]">Tổng điểm</th>
                <th className="py-3 px-4 min-w-[200px]">Xếp loại dự kiến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0e4438]">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-emerald-400/70">
                    Không có dữ liệu phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sorted.map((rec, index) => {
                  const finalScore = rec.bghApprovedScore ?? rec.totalScore;
                  const rank = index + 1;
                  const titleInfo = getTitleBadge(finalScore, rank, sorted.length);
                  const isCurrent = rec.staffId === currentUser.id;

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-[#0a382e] transition-colors ${
                        isCurrent ? 'bg-[#093c31]/50 font-medium' : 'bg-[#05211b] even:bg-[#072a23]'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center border-r border-[#0e4438]">
                        {rank === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-[#031713] font-black text-xs inline-flex items-center justify-center shadow-xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-stone-900 font-bold text-xs inline-flex items-center justify-center">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-800/80 text-amber-200 border border-amber-500/50 font-bold text-xs inline-flex items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-400/80 font-semibold">{rank}</span>
                        )}
                      </td>

                      {/* Name & Code */}
                      <td className="py-3 px-4 border-r border-[#0e4438]">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{rec.staffName}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-[#031713] font-bold">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-300/60 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-amber-300/80">{rec.staffCode}</span>
                          <span>·</span>
                          <span>{rec.position}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 border-r border-[#0e4438] text-emerald-200">
                        <div className="font-medium">{rec.departmentName}</div>
                      </td>

                      {/* Bonus & Penalty */}
                      <td className="py-3 px-3 text-center border-r border-[#0e4438] font-mono text-xs">
                        <div className="text-emerald-400 font-bold">+{rec.totalBonus}đ</div>
                        <div className="text-rose-400 font-bold">-{rec.totalPenalty}đ</div>
                      </td>

                      {/* Total Score */}
                      <td className="py-3 px-3 text-center border-r border-[#0e4438]">
                        <span className="text-base font-extrabold text-amber-300 font-mono">
                          {finalScore}
                        </span>
                        <div className="text-[10px] text-emerald-400/60">/ 230đ</div>
                      </td>

                      {/* Title Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${titleInfo.bg}`}
                        >
                          {titleInfo.star && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          <span>{titleInfo.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
