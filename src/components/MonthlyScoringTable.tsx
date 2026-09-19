import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Clock,
  ShieldCheck,
  Eye,
  Edit3,
  Send,
  Users,
  Award,
  Layers
} from 'lucide-react';
import { MonthlyScoreRecord, UserProfile, Department } from '../types';
import { exportMonthlyScoreToExcel } from '../utils/excelExport';
import {
  SCHOOL_YEAR_MONTHS,
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
import { isAdministrator } from '../utils/auth';

interface MonthlyScoringTableProps {
  scores: MonthlyScoreRecord[];
  currentMonth: number;
  onChangeMonth: (m: number) => void;
  currentUser: UserProfile;
  departments: Department[];
  onSelectRecordToScore: (record: MonthlyScoreRecord) => void;
  onApproveRecord: (recordId: string, approvedScore?: number, note?: string) => void;
  onApproveAll: (month: number) => void;
  onSubmitToBgh: (month: number, departmentId: string) => void;
  onLockMonth: (month: number) => void;
}

export const MonthlyScoringTable: React.FC<MonthlyScoringTableProps> = ({
  scores,
  currentMonth,
  onChangeMonth,
  currentUser,
  departments,
  onSelectRecordToScore,
  onApproveRecord,
  onApproveAll,
  onSubmitToBgh,
  onLockMonth,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(currentMonth);
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    return currentUser.role === 'ttcm' && currentUser.departmentId ? currentUser.departmentId : 'all';
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'approved'>('all');

  // Sync selectedPeriod if parent currentMonth changes
  useEffect(() => {
    if (typeof selectedPeriod === 'number' && selectedPeriod !== currentMonth) {
      setSelectedPeriod(currentMonth);
    }
  }, [currentMonth]);

  // Automatically update selected department filter when user is TTCM
  useEffect(() => {
    if (currentUser.role === 'ttcm' && currentUser.departmentId) {
      setSelectedDept(currentUser.departmentId);
    }
  }, [currentUser.id, currentUser.role, currentUser.departmentId]);

  // Aggregate records based on active period (Month, HK1, HK2, or Cả năm)
  const basePeriodScores = useMemo(() => {
    return aggregateScoresForPeriod(scores, selectedPeriod);
  }, [scores, selectedPeriod]);

  // Filter records by dept, status, search
  const filteredScores = useMemo(() => {
    return basePeriodScores.filter(s => {
      if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchKeyword.trim() !== '') {
        const kw = searchKeyword.toLowerCase();
        const matchName = s.staffName.toLowerCase().includes(kw);
        const matchCode = s.staffCode.toLowerCase().includes(kw);
        const matchPos = s.position.toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchPos) return false;
      }
      return true;
    });
  }, [basePeriodScores, selectedDept, statusFilter, searchKeyword]);

  const pendingCount = filteredScores.filter(s => s.status === 'submitted').length;
  const draftCount = filteredScores.filter(s => s.status === 'draft').length;
  const approvedCount = filteredScores.filter(s => s.status === 'approved' || s.status === 'locked').length;

  const canEditRecord = (rec: MonthlyScoreRecord) => {
    if (typeof selectedPeriod !== 'number') return false; // In aggregated view, editing is done via single month
    if (isAdministrator(currentUser) || currentUser.role === 'bgh') return true;
    if (currentUser.role === 'ttcm') {
      return currentUser.departmentId === rec.departmentId && rec.status !== 'locked';
    }
    return false;
  };

  const handlePeriodChange = (period: PeriodSelection) => {
    setSelectedPeriod(period);
    if (typeof period === 'number') {
      onChangeMonth(period);
    }
  };

  const periodBaseScore = getPeriodBaseScore(selectedPeriod);
  const periodTitle = getPeriodLabel(selectedPeriod);
  const isAggregated = typeof selectedPeriod !== 'number';

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
      filteredScores,
      typeof selectedPeriod === 'number' ? selectedPeriod : 9,
      `2026-2027_${periodFileTag}`,
      'TRƯỜNG THPT CHU VĂN AN'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>BẢNG THEO DÕI & CHẤM ĐIỂM THI ĐUA</span>
            <span>·</span>
            <span>NĂM HỌC 2026–2027</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-serif flex items-center gap-2 flex-wrap">
            <span>Sổ theo dõi & Tổng hợp: {getPeriodShortTitle(selectedPeriod)}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#093c31] text-emerald-300 border border-[#1b7360] font-semibold">
              {selectedPeriod === 'hk1'
                ? 'Học kỳ I (Tổng 5 tháng)'
                : selectedPeriod === 'hk2'
                ? 'Học kỳ II (Tổng 4 tháng)'
                : selectedPeriod === 'annual'
                ? 'Cả năm (Tổng HK1 + HK2)'
                : getSemesterName(selectedPeriod as number)}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 font-semibold">
              Chuẩn {periodBaseScore}đ/{isAggregated ? 'kỳ' : 'tháng'}
            </span>
          </h2>
          <p className="text-xs text-emerald-200/80 mt-1">
            {selectedPeriod === 'hk1'
              ? 'Điểm Học kỳ I là tổng điểm của các tháng 9, 10, 11, 12, 01 (Thang điểm chuẩn: 1150 điểm).'
              : selectedPeriod === 'hk2'
              ? 'Điểm Học kỳ II là tổng điểm của các tháng 02, 03, 04, 05 (Thang điểm chuẩn: 920 điểm).'
              : selectedPeriod === 'annual'
              ? 'Điểm Cả năm học là tổng điểm của Học kỳ I và Học kỳ II (9 tháng: 2070 điểm).'
              : `Chấm điểm tự động tháng ${selectedPeriod} và ghi nhận các nội dung điểm thưởng, điểm trừ kèm phê duyệt của BGH.`}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Xuất bảng tổng hợp ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel {getPeriodShortTitle(selectedPeriod)}</span>
          </button>

          {/* TTCM Action: Gửi BGH duyệt */}
          {!isAggregated && currentUser.role === 'ttcm' && (
            <button
              onClick={() => onSubmitToBgh(currentMonth, currentUser.departmentId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b483c] hover:bg-[#115e4f] text-emerald-200 hover:text-white border border-[#1b7360] text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Nộp bảng điểm cho BGH</span>
            </button>
          )}

          {/* BGH / Admin Action: Duyệt toàn bộ */}
          {!isAggregated && (isAdministrator(currentUser) || currentUser.role === 'bgh') && pendingCount > 0 && (
            <button
              onClick={() => onApproveAll(currentMonth)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Duyệt tất cả ({pendingCount} hồ sơ)</span>
            </button>
          )}

          {/* BGH / Admin Action: Khóa sổ tháng */}
          {!isAggregated && (isAdministrator(currentUser) || currentUser.role === 'bgh') && (
            <button
              onClick={() => {
                if (window.confirm(`Khóa sổ thi đua Tháng ${currentMonth}? Sau khi khóa, dữ liệu sẽ được niêm phong chính thức.`)) {
                  onLockMonth(currentMonth);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#041d17] hover:bg-[#072a23] text-emerald-300 hover:text-white border border-[#0e4438] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Khóa sổ Tháng {currentMonth}</span>
            </button>
          )}
        </div>
      </div>

      {/* Role and Guidance Banner */}
      {currentUser.role === 'ttcm' ? (
        <div className="bg-[#072d24] border border-[#145b4c] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#093c31] border border-[#1b7360] text-emerald-300 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>Tổ trưởng Chuyên môn</span>
                <span className="text-[11px] bg-[#093c31] text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold border border-[#1b7360]">
                  {currentUser.departmentName}
                </span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/50">
                  Có quyền chấm điểm
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                Thầy/Cô: {currentUser.name} ({currentUser.position})
              </div>
              <div className="text-xs text-emerald-200/80 mt-0.5">
                {isAggregated
                  ? `Đang xem bảng điểm tổng hợp ${periodTitle}. Nhấp chọn từng tháng (T9..T5) để trực tiếp chấm điểm cho tổ.`
                  : `Bạn đang chấm điểm thi đua tháng ${currentMonth} cho các thành viên trong ${currentUser.departmentName}. Nhấp nút "Chấm điểm" màu vàng ở mỗi giáo viên để thực hiện.`}
              </div>
            </div>
          </div>
          {!isAggregated && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => onSubmitToBgh(currentMonth, currentUser.departmentId)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-[#031713] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bảng điểm BGH</span>
              </button>
            </div>
          )}
        </div>
      ) : currentUser.role === 'bgh' ? (
        <div className="bg-[#093c31] border border-amber-400/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#031713] flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>Ban Giám Hiệu</span>
                <span className="text-[11px] bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-extrabold border border-amber-400/50">
                  {currentUser.position}
                </span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/50">
                  Thẩm quyền phê duyệt & Chốt điểm
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {currentUser.name} ({currentUser.code}) {currentUser.subject ? `· Môn ${currentUser.subject}` : ''}
              </div>
              <div className="text-xs text-emerald-200/90 mt-0.5">
                Thẩm quyền: Phê duyệt điểm thi đua toàn trường, chốt điểm, mở/khóa sổ đánh giá ({periodTitle}).
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#062921] border border-[#0e4438] rounded-2xl p-4 flex items-center gap-3 text-xs">
          <Users className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Tài khoản Giáo viên: {currentUser.name}</span>
            <p className="text-emerald-300/70">Quyền xem điểm thi đua cá nhân và theo dõi kết quả thi đua ({periodTitle}).</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar with Academic Period Selector */}
      <div className="bg-[#062921] p-4 rounded-2xl border border-[#0e4438] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/70" />
            <input
              type="text"
              placeholder="Tìm theo tên giáo viên, mã CBVC..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Department Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-300">Tổ:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#05211b]">Tất cả các tổ</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-[#05211b]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-300">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#05211b]">Tất cả ({filteredScores.length})</option>
              <option value="approved" className="bg-[#05211b]">Đã duyệt ({approvedCount})</option>
              <option value="submitted" className="bg-[#05211b]">Chờ duyệt ({pendingCount})</option>
              <option value="draft" className="bg-[#05211b]">Bản nháp ({draftCount})</option>
            </select>
          </div>
        </div>

        {/* Academic Period Selector (HK I: T9..T1 | HK II: T2..T5 | Cả năm) */}
        <AcademicPeriodSelector
          selectedPeriod={selectedPeriod}
          onChangePeriod={handlePeriodChange}
          showAnnual={true}
        />
      </div>

      {/* Main Scoring Table */}
      <div className="bg-[#05211b] rounded-2xl border border-[#0e4438] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#072a23] border-b border-[#0e4438] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>BẢNG ĐIỂM THEO MẪU NHÀ TRƯỜNG</span>
            <span className="text-emerald-600">·</span>
            <span className="text-emerald-300/80 font-normal">
              Hiển thị {filteredScores.length} cán bộ, giáo viên ({getPeriodShortTitle(selectedPeriod)})
            </span>
          </div>
          <div className="text-[11px] text-amber-300/90 italic">
            * Nhấp vào nút <strong>&quot;Chấm điểm / Chi tiết&quot;</strong> để mở phiếu tự động theo bộ tiêu chí.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#062921] text-emerald-300 font-bold uppercase tracking-wider text-[11px] border-b border-[#0e4438]">
                <th className="py-3 px-3 w-12 text-center border-r border-[#0e4438]">STT</th>
                <th className="py-3 px-4 min-w-[180px] border-r border-[#0e4438]">Họ và tên</th>
                <th className="py-3 px-4 min-w-[280px] border-r border-[#0e4438]">
                  <div className="font-bold text-white">Điểm Cộng</div>
                  <div className="text-[10px] font-medium text-emerald-400/80 lowercase">
                    (Ghi rõ nội dung cộng)
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[220px] border-r border-[#0e4438]">
                  <div className="font-bold text-white">Điểm trừ</div>
                  <div className="text-[10px] font-medium text-emerald-400/80 lowercase">
                    (Ghi rõ nội dung trừ)
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28 border-r border-[#0e4438]">
                  <div className="font-bold text-white">Tổng điểm</div>
                  <div className="text-[10px] font-medium text-emerald-400/80 lowercase">
                    (Sau khi cộng trừ)
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28 border-r border-[#0e4438]">
                  <div className="font-bold text-amber-400">Điểm chốt</div>
                  <div className="text-[10px] font-medium text-amber-300 font-sans">
                    BGH
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28 border-r border-[#0e4438]">Trạng thái</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0e4438]">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-emerald-400/70">
                    Không tìm thấy dữ liệu chấm điểm phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredScores.map((record, index) => {
                  const canEdit = canEditRecord(record);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-[#0a382e] transition-colors ${
                        record.staffId === currentUser.id ? 'bg-[#093c31]/50' : 'bg-[#05211b] even:bg-[#072a23]'
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-300 border-r border-[#0e4438]">
                        {index + 1}
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3.5 px-4 border-r border-[#0e4438]">
                        <div className="font-bold text-white text-sm">
                          {record.staffName}
                        </div>
                        <div className="text-[11px] text-emerald-300/70 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-amber-300/80">{record.staffCode}</span>
                          <span>·</span>
                          <span className="text-emerald-200 font-medium">{record.position}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-medium">
                          {record.departmentName}
                        </div>
                      </td>

                      {/* Điểm Cộng */}
                      <td className="py-3.5 px-4 border-r border-[#0e4438] align-top">
                        {record.bonusItems.length > 0 ? (
                          <div className="space-y-1">
                            {record.bonusItems.slice(0, 4).map(b => (
                              <div
                                key={b.id}
                                className="text-xs font-semibold text-emerald-300 flex items-baseline gap-1"
                              >
                                <span className="font-bold text-emerald-400 font-mono">
                                  +{b.points}đ
                                </span>
                                <span>({b.title.replace(/^\+?\d+đ\s*/, '')})</span>
                                {b.note && (
                                  <span className="text-[10px] text-emerald-400/60 font-normal italic">
                                    - {b.note}
                                  </span>
                                )}
                              </div>
                            ))}
                            {record.bonusItems.length > 4 && (
                              <div className="text-[10px] text-emerald-400/70 font-semibold italic">
                                + {record.bonusItems.length - 4} mục cộng khác...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-500/40 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Điểm trừ */}
                      <td className="py-3.5 px-4 border-r border-[#0e4438] align-top">
                        {record.penaltyItems.length > 0 ? (
                          <div className="space-y-1">
                            {record.penaltyItems.slice(0, 4).map(p => (
                              <div
                                key={p.id}
                                className="text-xs font-semibold text-rose-300 flex items-baseline gap-1"
                              >
                                <span className="font-bold text-rose-400 font-mono">
                                  -{p.points}đ
                                </span>
                                <span>({p.title.replace(/^-?\d+đ\s*/, '')})</span>
                                {p.note && (
                                  <span className="text-[10px] text-rose-300/60 font-normal italic">
                                    - {p.note}
                                  </span>
                                )}
                              </div>
                            ))}
                            {record.penaltyItems.length > 4 && (
                              <div className="text-[10px] text-rose-300/70 font-semibold italic">
                                + {record.penaltyItems.length - 4} mục trừ khác...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-500/40 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Tổng điểm */}
                      <td className="py-3.5 px-3 text-center border-r border-[#0e4438]">
                        <span className="text-base font-extrabold text-white font-mono">
                          {record.bghApprovedScore ?? record.totalScore}
                        </span>
                        <div className="text-[10px] text-emerald-400/60 font-mono">
                          ({periodBaseScore} {record.totalBonus > 0 ? `+${record.totalBonus}` : ''}{' '}
                          {record.totalPenalty > 0 ? `-${record.totalPenalty}` : ''})
                        </div>
                      </td>

                      {/* Điểm chốt BGH */}
                      <td className="py-3.5 px-3 text-center border-r border-[#0e4438] bg-[#093c31]/30">
                        {record.bghApprovedScore !== undefined ? (
                          <div className="inline-block px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-extrabold text-base font-mono border border-amber-400/50">
                            {record.bghApprovedScore}
                          </div>
                        ) : (
                          <span className="text-emerald-500/50 text-xs italic">Chưa chốt</span>
                        )}
                        {record.bghNotes && (
                          <div className="text-[10px] text-amber-300 mt-1 truncate max-w-[120px] mx-auto" title={record.bghNotes}>
                            {record.bghNotes}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3 text-center border-r border-[#0e4438]">
                        {record.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                            <ShieldCheck className="w-3 h-3" />
                            Đã chốt
                          </span>
                        ) : record.status === 'submitted' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/50">
                            <Clock className="w-3 h-3" />
                            Chờ BGH
                          </span>
                        ) : record.status === 'locked' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#041d17] text-emerald-300 border border-[#0e4438]">
                            <Lock className="w-3 h-3" />
                            Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#072a23] text-emerald-400 border border-[#0e4438]">
                            Bản nháp
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => onSelectRecordToScore(record)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                            canEdit
                              ? 'bg-amber-400 hover:bg-amber-500 text-[#031713]'
                              : 'bg-[#093c31] hover:bg-[#0c4e40] text-emerald-200 border border-[#1b7360]'
                          }`}
                        >
                          {canEdit ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{currentUser.role === 'bgh' ? 'Duyệt' : 'Chấm điểm'}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem chi tiết</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer notes */}
        <div className="p-4 bg-[#072a23] border-t border-[#0e4438] flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-2">
          <div>
            Quy định phân quyền: TTCM chỉ chấm cho giáo viên trong tổ; BGH có thẩm quyền duyệt điểm chốt toàn trường.
          </div>
          <div className="font-semibold text-amber-400">
            Năm học 2026 - 2027 · THPT Chu Văn An
          </div>
        </div>
      </div>
    </div>
  );
};
