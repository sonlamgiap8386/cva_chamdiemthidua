import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCheck,
  Clock3,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Users2,
  Building2,
  BarChart3,
  ArrowUpRight,
  Trophy,
  Medal,
  CalendarCheck2
} from 'lucide-react';
import { MonthlyScoreRecord, UserProfile } from '../types';
import { NavTab } from './Sidebar';
import {
  PeriodSelection,
  getPeriodLabel,
  getPeriodShortTitle,
  getPeriodBaseScore,
  aggregateScoresForPeriod,
  formatMonthName
} from '../utils/academicYear';
import { AcademicPeriodSelector } from './AcademicPeriodSelector';

interface DashboardOverviewProps {
  scores: MonthlyScoreRecord[];
  currentMonth: number;
  onChangeMonth: (m: number) => void;
  currentUser: UserProfile;
  onNavigate: (tab: NavTab) => void;
  onSelectRecordToScore: (record: MonthlyScoreRecord) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  scores,
  currentMonth,
  onChangeMonth,
  currentUser,
  onNavigate,
  onSelectRecordToScore,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(currentMonth);

  // Keep the dashboard selector in sync when the month is changed elsewhere.
  useEffect(() => {
    setSelectedPeriod(currentMonth);
  }, [currentMonth]);

  const handlePeriodChange = (period: PeriodSelection) => {
    setSelectedPeriod(period);
    if (typeof period === 'number') {
      onChangeMonth(period);
    }
  };

  const periodBaseScore = getPeriodBaseScore(selectedPeriod);
  const periodLabel = getPeriodLabel(selectedPeriod);
  const periodShortTitle = getPeriodShortTitle(selectedPeriod);
  const isAggregated = typeof selectedPeriod !== 'number';

  const currentPeriodScores = useMemo(() => {
    return aggregateScoresForPeriod(scores, selectedPeriod);
  }, [scores, selectedPeriod]);

  const totalStaff = currentPeriodScores.length;
  const evaluatedCount = currentPeriodScores.filter(s => s.status === 'approved' || s.status === 'locked').length;
  const pendingCount = currentPeriodScores.filter(s => s.status === 'submitted').length;
  const draftCount = currentPeriodScores.filter(s => s.status === 'draft').length;

  const completionPercent = totalStaff > 0 ? Math.round(((evaluatedCount + pendingCount) / totalStaff) * 100) : 0;
  const approvedPercent = totalStaff > 0 ? Math.round((evaluatedCount / totalStaff) * 100) : 0;

  // Average score
  const totalScoreSum = currentPeriodScores.reduce((acc, curr) => acc + (curr.bghApprovedScore ?? curr.totalScore), 0);
  const avgScore = totalStaff > 0 ? (totalScoreSum / totalStaff).toFixed(1) : String(periodBaseScore);

  // Bonus & penalty sums
  const totalBonus = currentPeriodScores.reduce((acc, curr) => acc + curr.totalBonus, 0);
  const totalPenalty = currentPeriodScores.reduce((acc, curr) => acc + curr.totalPenalty, 0);

  // Sorted by score descending for leaderboard preview
  const sortedScores = useMemo(() => {
    return [...currentPeriodScores].sort((a, b) => {
      const scoreA = a.bghApprovedScore ?? a.totalScore;
      const scoreB = b.bghApprovedScore ?? b.totalScore;
      return scoreB - scoreA;
    });
  }, [currentPeriodScores]);

  // Department Analytics Breakdown
  const departmentStats = useMemo(() => {
    const map = new Map<string, {
      deptId: string;
      deptName: string;
      teachersCount: number;
      totalScore: number;
      approvedCount: number;
      pendingCount: number;
      draftCount: number;
      topScore: number;
    }>();

    currentPeriodScores.forEach(rec => {
      const existing = map.get(rec.departmentId) || {
        deptId: rec.departmentId,
        deptName: rec.departmentName,
        teachersCount: 0,
        totalScore: 0,
        approvedCount: 0,
        pendingCount: 0,
        draftCount: 0,
        topScore: 0,
      };

      const finalScore = rec.bghApprovedScore ?? rec.totalScore;
      existing.teachersCount += 1;
      existing.totalScore += finalScore;
      if (rec.status === 'approved' || rec.status === 'locked') existing.approvedCount += 1;
      else if (rec.status === 'submitted') existing.pendingCount += 1;
      else existing.draftCount += 1;

      if (finalScore > existing.topScore) existing.topScore = finalScore;

      map.set(rec.departmentId, existing);
    });

    return Array.from(map.values()).map(dept => ({
      ...dept,
      avgScore: dept.teachersCount > 0 ? (dept.totalScore / dept.teachersCount).toFixed(1) : String(periodBaseScore),
      progressPercent: dept.teachersCount > 0 ? Math.round(((dept.approvedCount + dept.pendingCount) / dept.teachersCount) * 100) : 0
    })).sort((a, b) => Number(b.avgScore) - Number(a.avgScore));
  }, [currentPeriodScores, periodBaseScore]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Month selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>HỆ THỐNG THI ĐUA THỜI GIAN THỰC</span>
            <span className="text-emerald-600">·</span>
            <span className="text-emerald-300">{periodLabel.toUpperCase()} (2026–2027)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
            Bảng Điều Khiển Tổng Quan
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
            {selectedPeriod === 'hk1'
              ? 'Tổng hợp điểm Học kỳ I = Tổng điểm các tháng 9, 10, 11, 12, 01 (Thang điểm chuẩn 1150đ).'
              : selectedPeriod === 'hk2'
              ? 'Tổng hợp điểm Học kỳ II = Tổng điểm các tháng 02, 03, 04, 05 (Thang điểm chuẩn 920đ).'
              : selectedPeriod === 'annual'
              ? 'Tổng hợp điểm Cả năm = Tổng điểm Học kỳ I + Học kỳ II (9 tháng: 2070đ).'
              : `Tổng hợp tiến độ chấm điểm, phân tích trung bình 10 tổ chuyên môn và tôn vinh giáo viên xuất sắc tháng ${selectedPeriod}.`}
          </p>
        </div>

        {/* Academic Period Selector Bar */}
        <AcademicPeriodSelector
          selectedPeriod={selectedPeriod}
          onChangePeriod={handlePeriodChange}
          showAnnual={true}
        />
      </div>

      {/* Role Alert Banner if pending approvals */}
      {currentUser.role === 'bgh' && pendingCount > 0 && (
        <div className="bg-gradient-to-r from-[#093c31] to-[#0a483b] border border-amber-400/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#031713] font-bold flex items-center justify-center shrink-0 shadow-xs">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>Có {pendingCount} hồ sơ thi đua đang chờ Ban Giám Hiệu phê duyệt {formatMonthName(currentMonth)}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400 text-[#031713] font-extrabold">Cần xử lý</span>
              </div>
              <div className="text-[11px] text-emerald-200/90 mt-0.5">
                Các tổ chuyên môn đã hoàn tất rà soát minh chứng và nộp bảng điểm lên Hội đồng Thi đua.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('scoring')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] font-bold text-xs transition-all shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Xem & Duyệt ngay</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Điểm trung bình */}
        <div className="bg-[#062921] rounded-2xl p-5 border border-[#0e4438] shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-emerald-300/80 text-xs font-semibold">
            <span>Điểm trung bình toàn trường</span>
            <span className="p-2 rounded-xl bg-[#093c31] text-amber-400 border border-[#1b7360] group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-serif text-amber-300 font-mono">
              {avgScore}
            </span>
            <span className="text-xs font-semibold text-emerald-300/70">/ {periodBaseScore} chuẩn</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
            <span className="font-bold text-emerald-400">+{totalBonus}đ thưởng</span>
            <span className="text-emerald-700">·</span>
            <span className="text-rose-400 font-bold">-{totalPenalty}đ phạt</span>
          </div>
        </div>

        {/* Card 2: Tiến độ đánh giá */}
        <div className="bg-[#062921] rounded-2xl p-5 border border-[#0e4438] shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-emerald-300/80 text-xs font-semibold">
            <span>Tiến độ rà soát chấm điểm</span>
            <span className="p-2 rounded-xl bg-[#093c31] text-emerald-300 border border-[#1b7360] group-hover:scale-110 transition-transform">
              <Clock3 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-serif text-white font-mono">
              {completionPercent}%
            </span>
            <span className="text-xs font-semibold text-emerald-300/70">
              ({evaluatedCount + pendingCount}/{totalStaff})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-300/80 flex items-center gap-1">
            <span className="font-bold text-amber-400">{pendingCount} hồ sơ</span>
            <span>chờ BGH chốt điểm</span>
          </div>
        </div>

        {/* Card 3: Đã chốt điểm BGH */}
        <div className="bg-[#062921] rounded-2xl p-5 border border-[#0e4438] shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-emerald-300/80 text-xs font-semibold">
            <span>Hồ sơ đã chốt điểm</span>
            <span className="p-2 rounded-xl bg-[#093c31] text-emerald-400 border border-[#1b7360] group-hover:scale-110 transition-transform">
              <CheckCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-serif text-white font-mono">
              {evaluatedCount}
            </span>
            <span className="text-xs font-semibold text-emerald-300/70">/ {totalStaff} CBVC</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đạt {approvedPercent}% niêm phong</span>
          </div>
        </div>

        {/* Card 4: Tổng cán bộ giáo viên */}
        <div className="bg-[#062921] rounded-2xl p-5 border border-[#0e4438] shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-emerald-300/80 text-xs font-semibold">
            <span>Tổng nhân sự theo dõi</span>
            <span className="p-2 rounded-xl bg-[#093c31] text-teal-300 border border-[#1b7360] group-hover:scale-110 transition-transform">
              <Users2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-serif text-white font-mono">
              {totalStaff}
            </span>
            <span className="text-xs font-semibold text-emerald-300/70">cán bộ giáo viên</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-300 font-bold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>10 Tổ chuyên môn & Văn phòng</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Department Comparison & Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Comparison Analytics (7 cols) */}
        <div className="lg:col-span-7 bg-[#05211b] rounded-2xl border border-[#0e4438] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#0e4438]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#093c31] text-amber-400 border border-[#1b7360] flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm font-serif">Xếp Hạng 10 Tổ Chuyên Môn {periodShortTitle}</h3>
                <p className="text-[11px] text-emerald-300/70">So sánh điểm trung bình và tiến độ chấm điểm giữa các tổ</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('scoring')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Vào sổ chấm</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {departmentStats.map((dept, index) => {
              const isTop = index === 0;
              return (
                <div
                  key={dept.deptId}
                  className="p-3 rounded-xl border border-[#0e4438] bg-[#072a23] hover:border-amber-400 hover:bg-[#0a382e] transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[11px] font-mono shrink-0 ${
                        isTop
                          ? 'bg-amber-400 text-[#031713] font-extrabold'
                          : index === 1
                          ? 'bg-stone-300 text-stone-900 font-bold'
                          : index === 2
                          ? 'bg-amber-800/40 text-amber-300 font-bold border border-amber-500/40'
                          : 'bg-[#041d17] text-emerald-300 border border-[#0e4438]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-white truncate flex items-center gap-1.5">
                        <span>{dept.deptName}</span>
                        {isTop && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/50">
                            Dẫn đầu
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-300/60 mt-0.5">
                        {dept.teachersCount} giáo viên · Điểm cao nhất: {dept.topScore}đ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-amber-300 font-mono text-sm">
                        {dept.avgScore} <span className="text-[10px] text-emerald-400/70 font-normal">TB</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        Tiến độ {dept.progressPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Top Teachers Podium Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#05211b] rounded-2xl border border-[#0e4438] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#0e4438]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#093c31] text-amber-400 border border-[#1b7360] flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm font-serif">Giáo Viên Dẫn Đầu {periodShortTitle}</h3>
                <p className="text-[11px] text-emerald-300/70">Top thành tích thi đua xuất sắc nhất</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem BXH</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {sortedScores.slice(0, 6).map((rec, index) => {
              const finalScore = rec.bghApprovedScore ?? rec.totalScore;
              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecordToScore(rec)}
                  className="p-3 rounded-xl border border-[#0e4438] bg-[#072a23] hover:border-amber-400 hover:bg-[#0a382e] transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center text-xs font-mono shrink-0 shadow-2xs ${
                        index === 0
                          ? 'bg-amber-400 text-[#031713] font-extrabold'
                          : index === 1
                          ? 'bg-slate-300 text-stone-900 font-bold'
                          : index === 2
                          ? 'bg-amber-800/40 text-amber-300 font-bold border border-amber-500/40'
                          : 'bg-[#041d17] text-emerald-300 border border-[#0e4438]'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-white group-hover:text-amber-300 truncate">
                        {rec.staffName}
                      </div>
                      <div className="text-[10px] text-emerald-300/60 truncate">
                        {rec.position} · {rec.departmentName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold font-mono text-sm text-amber-300">
                      {finalScore} đ
                    </span>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      +{rec.totalBonus}đ thưởng
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
