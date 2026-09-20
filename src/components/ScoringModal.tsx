import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Award,
  Info,
  Calendar,
  Lock,
  Send,
  HelpCircle,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { MonthlyScoreRecord, UserProfile, CriterionItem, ScoreItemDetail } from '../types';
import { CRITERIA_LIST } from '../data/criteria';
import { formatMonthName, getSemesterName, getSemesterOf } from '../utils/academicYear';

interface ScoringModalProps {
  record: MonthlyScoreRecord | null;
  onClose: () => void;
  onSave: (updatedRecord: MonthlyScoreRecord) => void;
  currentUser: UserProfile;
  allScores?: MonthlyScoreRecord[];
}

export const ScoringModal: React.FC<ScoringModalProps> = ({
  record,
  onClose,
  onSave,
  currentUser,
  allScores = [],
}) => {
  if (!record) return null;

  // Local state for editing
  const [bonusItems, setBonusItems] = useState<ScoreItemDetail[]>([...record.bonusItems]);
  const [penaltyItems, setPenaltyItems] = useState<ScoreItemDetail[]>([...record.penaltyItems]);
  const [bghApprovedScore, setBghApprovedScore] = useState<number | undefined>(
    record.bghApprovedScore ?? record.totalScore
  );
  const [bghNotes, setBghNotes] = useState<string>(record.bghNotes || '');
  const [teacherFeedback, setTeacherFeedback] = useState<string>(record.feedback || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('II_2');
  const [customTitle, setCustomTitle] = useState('');
  const [customPoints, setCustomPoints] = useState<number>(1);
  const [customType, setCustomType] = useState<'bonus' | 'penalty'>('bonus');
  const [customNote, setCustomNote] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Semester info
  const currentSemester: 1 | 2 = getSemesterOf(record.month);
  const semesterMonths: readonly number[] = currentSemester === 1 ? [9, 10, 11, 12, 1] : [2, 3, 4, 5];
  const semesterName = getSemesterName(record.month);

  // Filter other records of this teacher in the same semester
  const otherSemesterRecords = allScores.filter(
    s => s.staffId === record.staffId && s.id !== record.id && semesterMonths.includes(s.month)
  );

  // Helper: Get max allowable points for a criterion in the whole semester
  const getCriterionSemesterMaxLimit = (c: CriterionItem, type: 'bonus' | 'penalty'): number => {
    if (type === 'bonus') {
      if (c.maxPerSemester && c.maxPerSemester > 0) return c.maxPerSemester;
      if (c.rewardPoints) {
        const unit = (c.rewardUnit || '').toLowerCase();
        if (unit.includes('lần') || unit.includes('tiết') || unit.includes('đề') || unit.includes('buổi') || unit.includes('bài')) {
          return c.rewardPoints * 3;
        }
        return c.rewardPoints;
      }
      return 10;
    } else {
      if (c.maxPerSemester && c.maxPerSemester > 0) return c.maxPerSemester;
      if (c.penaltyPoints) {
        const unit = (c.penaltyUnit || '').toLowerCase();
        if (unit.includes('lần') || unit.includes('tiết') || unit.includes('buổi') || unit.includes('lỗi')) {
          return c.penaltyPoints * 5;
        }
        return c.penaltyPoints;
      }
      return 20;
    }
  };

  // Helper: Calculate accumulated points already awarded in OTHER months of this semester
  const getPointsInOtherMonthsOfSemester = (criterionId: string, type: 'bonus' | 'penalty'): number => {
    return otherSemesterRecords.reduce((total, r) => {
      const list = type === 'bonus' ? r.bonusItems : r.penaltyItems;
      const matched = list.filter(item => item.criterionId === criterionId);
      return total + matched.reduce((sum, item) => sum + item.points * item.quantity, 0);
    }, 0);
  };

  // Helper: Calculate effective points of an item in the current month, strictly capped by semester quota
  const getItemEffectivePoints = (item: ScoreItemDetail, type: 'bonus' | 'penalty'): {
    rawPoints: number;
    effectivePoints: number;
    semesterMax: number;
    pastPoints: number;
    isOverLimit: boolean;
  } => {
    const rawPoints = item.points * item.quantity;
    if (!item.criterionId) {
      return {
        rawPoints,
        effectivePoints: Math.min(rawPoints, 10),
        semesterMax: 10,
        pastPoints: 0,
        isOverLimit: rawPoints > 10,
      };
    }

    const c = CRITERIA_LIST.find(crit => crit.id === item.criterionId);
    if (!c) {
      const maxAllowed = item.maxAllowed || 10;
      return {
        rawPoints,
        effectivePoints: Math.min(rawPoints, maxAllowed),
        semesterMax: maxAllowed,
        pastPoints: 0,
        isOverLimit: rawPoints > maxAllowed,
      };
    }

    const semesterMax = getCriterionSemesterMaxLimit(c, type);
    const pastPoints = getPointsInOtherMonthsOfSemester(c.id, type);
    const remainingMonthQuota = Math.max(0, semesterMax - pastPoints);
    const effectivePoints = Math.min(rawPoints, remainingMonthQuota);
    const isOverLimit = rawPoints > remainingMonthQuota;

    return {
      rawPoints,
      effectivePoints,
      semesterMax,
      pastPoints,
      isOverLimit,
    };
  };

  // Calculate live effective totals with semester capping
  const totalBonus = bonusItems.reduce((sum, item) => sum + getItemEffectivePoints(item, 'bonus').effectivePoints, 0);
  const totalPenalty = penaltyItems.reduce((sum, item) => sum + getItemEffectivePoints(item, 'penalty').effectivePoints, 0);
  const calculatedTotal = record.baseScore + totalBonus - totalPenalty;

  const isBgh = currentUser.role === 'bgh';
  const isTtcm = currentUser.role === 'ttcm';
  const isSelf = currentUser.id === record.staffId;
  const isLocked = record.status === 'locked';

  const canEditScores = !isLocked && (isBgh || (isTtcm && currentUser.departmentId === record.departmentId));

  // Helper: Calculate current total raw points for a given criterion in modal state
  const getCurrentPointsForCriterion = (criterionId: string, type: 'bonus' | 'penalty'): number => {
    const list = type === 'bonus' ? bonusItems : penaltyItems;
    return list
      .filter(item => item.criterionId === criterionId)
      .reduce((sum, item) => sum + item.points * item.quantity, 0);
  };

  // Handle adding from standard criteria with SEMESTER-WIDE CAPPING and WARNINGS
  const handleAddCriterion = (c: CriterionItem, type: 'bonus' | 'penalty') => {
    if (!canEditScores) return;
    setLimitWarning(null);

    const semesterMax = getCriterionSemesterMaxLimit(c, type);
    const pastPoints = getPointsInOtherMonthsOfSemester(c.id, type);
    const currentMonthPoints = getCurrentPointsForCriterion(c.id, type);
    const remainingAllowed = Math.max(0, semesterMax - pastPoints);

    if (type === 'bonus' && c.rewardPoints) {
      const step = c.rewardPoints;

      // Check if adding one more step exceeds the semester maximum quota
      if (currentMonthPoints + step > remainingAllowed) {
        if (remainingAllowed <= 0) {
          setLimitWarning(
            `⚠️ CẢNH BÁO QUY CHẾ: Tiêu chí "${c.title}" quy định tối đa ${semesterMax}đ trong ${semesterName}. Giáo viên đã đạt ${pastPoints}đ/${semesterMax}đ ở các tháng khác trong kỳ, không thể cộng thêm điểm.`
          );
        } else {
          setLimitWarning(
            `⚠️ CẢNH BÁO QUY CHẾ: Tiêu chí "${c.title}" quy định tối đa ${semesterMax}đ trong ${semesterName}. Đã tích lũy ${pastPoints}đ ở các tháng khác, tháng này chỉ được cộng tối đa ${remainingAllowed}đ (Hệ thống đã tự động giới hạn ở mức trần ${remainingAllowed}đ).`
          );
        }
      }

      const existingIndex = bonusItems.findIndex(item => item.criterionId === c.id);
      if (existingIndex !== -1) {
        setBonusItems(prev =>
          prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + 1, maxAllowed: remainingAllowed }
              : item
          )
        );
      } else {
        const newItem: ScoreItemDetail = {
          id: `item-${Date.now()}-${Math.random()}`,
          criterionId: c.id,
          title: c.title,
          points: step,
          quantity: 1,
          maxAllowed: remainingAllowed,
          date: new Date().toLocaleDateString('vi-VN'),
          note: c.trackingDept ? `Theo dõi: ${c.trackingDept}` : undefined,
        };
        setBonusItems(prev => [...prev, newItem]);
      }
    } else if (type === 'penalty' && c.penaltyPoints) {
      const step = c.penaltyPoints;

      if (currentMonthPoints + step > remainingAllowed) {
        setLimitWarning(
          `⚠️ CẢNH BÁO QUY CHẾ: Tiêu chí vi phạm "${c.title}" quy định trừ tối đa ${semesterMax}đ trong ${semesterName}. Đã trừ ${pastPoints}đ ở các tháng trước, tháng này trừ tối đa ${remainingAllowed}đ.`
        );
      }

      const existingIndex = penaltyItems.findIndex(item => item.criterionId === c.id);
      if (existingIndex !== -1) {
        setPenaltyItems(prev =>
          prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + 1, maxAllowed: remainingAllowed }
              : item
          )
        );
      } else {
        const newItem: ScoreItemDetail = {
          id: `item-${Date.now()}-${Math.random()}`,
          criterionId: c.id,
          title: c.title,
          points: step,
          quantity: 1,
          maxAllowed: remainingAllowed,
          date: new Date().toLocaleDateString('vi-VN'),
          note: c.trackingDept ? `Bộ phận: ${c.trackingDept}` : undefined,
        };
        setPenaltyItems(prev => [...prev, newItem]);
      }
    }
  };

  // Handle quantity adjustment with semester limit warnings
  const handleUpdateQuantity = (id: string, type: 'bonus' | 'penalty', delta: number) => {
    if (!canEditScores) return;
    setLimitWarning(null);

    const list = type === 'bonus' ? bonusItems : penaltyItems;
    const targetItem = list.find(item => item.id === id);
    if (!targetItem) return;

    const newQty = targetItem.quantity + delta;
    if (newQty <= 0) return;

    if (targetItem.criterionId) {
      const c = CRITERIA_LIST.find(crit => crit.id === targetItem.criterionId);
      if (c) {
        const semesterMax = getCriterionSemesterMaxLimit(c, type);
        const pastPoints = getPointsInOtherMonthsOfSemester(c.id, type);
        const remainingAllowed = Math.max(0, semesterMax - pastPoints);

        if (newQty * targetItem.points > remainingAllowed) {
          setLimitWarning(
            `⚠️ CẢNH BÁO: Tiêu chí "${c.title}" có mức trần ${semesterMax}đ/${semesterName}. Giáo viên làm ${newQty} lần (${newQty * targetItem.points}đ), nhưng theo quy chế chỉ được cộng tối đa ${remainingAllowed}đ trong tháng này.`
          );
        }
      }
    }

    if (type === 'bonus') {
      setBonusItems(prev =>
        prev.map(item => (item.id === id ? { ...item, quantity: newQty } : item))
      );
    } else {
      setPenaltyItems(prev =>
        prev.map(item => (item.id === id ? { ...item, quantity: newQty } : item))
      );
    }
  };

  // Handle adding custom item with point bounds
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditScores || !customTitle.trim()) return;
    setLimitWarning(null);

    let validatedPoints = Math.abs(customPoints);
    if (validatedPoints > 10) {
      validatedPoints = 10;
      setLimitWarning('Điểm cộng đặc thù bổ sung tối đa 10 điểm theo quy định.');
    }
    if (validatedPoints <= 0) validatedPoints = 1;

    const newItem: ScoreItemDetail = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      points: validatedPoints,
      quantity: 1,
      maxAllowed: validatedPoints,
      note: customNote.trim() || 'Minh chứng bổ sung',
      date: new Date().toLocaleDateString('vi-VN'),
    };

    if (customType === 'bonus') {
      setBonusItems(prev => [...prev, newItem]);
    } else {
      setPenaltyItems(prev => [...prev, newItem]);
    }

    setCustomTitle('');
    setCustomNote('');
    setCustomPoints(1);
  };

  const handleRemoveBonus = (id: string) => {
    if (!canEditScores) return;
    setBonusItems(prev => prev.filter(item => item.id !== id));
    setLimitWarning(null);
  };

  const handleRemovePenalty = (id: string) => {
    if (!canEditScores) return;
    setPenaltyItems(prev => prev.filter(item => item.id !== id));
    setLimitWarning(null);
  };

  // Save changes
  const handleSaveAndSubmit = (newStatus: 'draft' | 'submitted' | 'approved') => {
    const updated: MonthlyScoreRecord = {
      ...record,
      bonusItems,
      penaltyItems,
      totalBonus,
      totalPenalty,
      totalScore: calculatedTotal,
      status: newStatus,
      feedback: teacherFeedback,
      reviewedBy: isTtcm ? currentUser.id : record.reviewedBy,
      reviewedByName: isTtcm ? currentUser.name : record.reviewedByName,
      reviewedAt: isTtcm ? new Date().toLocaleString('vi-VN') : record.reviewedAt,
    };

    const finalApprovedScore = isBgh
      ? bghApprovedScore
      : newStatus === 'approved'
      ? calculatedTotal
      : record.bghApprovedScore;
    if (finalApprovedScore !== undefined) {
      updated.bghApprovedScore = Math.min(300, Math.max(0, finalApprovedScore));
    }

    const finalNotes = isBgh ? bghNotes : record.bghNotes;
    if (finalNotes !== undefined && finalNotes.trim()) {
      updated.bghNotes = finalNotes;
    }

    if (isBgh && newStatus === 'approved') {
      updated.approvedBy = currentUser.id;
      updated.approvedByName = currentUser.name;
      updated.approvedAt = new Date().toLocaleString('vi-VN');
    } else if (record.approvedBy) {
      updated.approvedBy = record.approvedBy;
      updated.approvedByName = record.approvedByName;
      updated.approvedAt = record.approvedAt;
    }

    onSave(updated);
    onClose();
  };

  const filteredCriteria = CRITERIA_LIST.filter(c => c.category === selectedCategory);

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // If in printable view mode
  if (showPrintView) {
    const finalScore = bghApprovedScore ?? calculatedTotal;
    let rankTitle = 'Hoàn thành tốt nhiệm vụ';
    if (finalScore >= 235) rankTitle = 'Hoàn thành xuất sắc nhiệm vụ (Dự kiến Top 20%)';
    else if (finalScore < 225) rankTitle = 'Cần phấn đấu thêm';

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-900 space-y-6 max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-full">
          {/* Top Actions for Screen only */}
          <div className="flex items-center justify-between border-b pb-3 print:hidden">
            <h3 className="font-bold text-base text-stone-800 font-serif">Xem Trước Phiếu Đánh Giá Cá Nhân</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu (Print)</span>
              </button>
              <button
                onClick={() => setShowPrintView(false)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </div>

          {/* Official Printable Academic Document */}
          <div className="space-y-6 font-serif">
            {/* Header with School Logo */}
            <div className="flex justify-between items-start text-xs border-b pb-4 border-stone-200">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-chu-van-an.png"
                  alt="Logo Trường THPT Chu Văn An"
                  className="w-14 h-14 object-contain rounded-full shadow-xs border border-stone-200"
                />
                <div className="text-left">
                  <div className="font-bold uppercase text-[11px] text-stone-700">SỞ GIÁO DỤC VÀ ĐÀO TẠO BẮC NINH</div>
                  <div className="font-bold uppercase text-xs text-stone-900">TRƯỜNG THPT CHU VĂN AN</div>
                  <div className="text-[10px] italic text-stone-500 font-sans">Số: ...... /PĐG-CVA</div>
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold uppercase text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-[10px] italic font-sans text-stone-500">Bắc Ninh, ngày ..... tháng ..... năm 2026</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                PHIẾU ĐÁNH GIÁ THI ĐUA CÁ NHÂN {formatMonthName(record.month).toUpperCase()}
              </h2>
              <div className="text-xs font-sans text-stone-600">
                {semesterName} · Năm học 2026–2027 (Thang điểm chuẩn: 230 điểm)
              </div>
            </div>

            {/* Staff Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-sans p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div><strong>Họ và tên:</strong> {record.staffName}</div>
              <div><strong>Mã CBVC:</strong> {record.staffCode}</div>
              <div><strong>Chức vụ / Công tác:</strong> {record.position}</div>
              <div><strong>Tổ chuyên môn:</strong> {record.departmentName}</div>
            </div>

            {/* Summary Scores */}
            <div className="border border-stone-300 rounded-lg overflow-hidden text-xs font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-300 font-bold">
                    <th className="p-2 border-r border-stone-300">Nội dung đánh giá</th>
                    <th className="p-2 border-r border-stone-300 text-center w-24">Chi tiết</th>
                    <th className="p-2 text-right w-28">Điểm tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="p-2 border-r border-stone-200 font-semibold">1. Điểm nền chuẩn tháng</td>
                    <td className="p-2 border-r border-stone-200 text-center">Chuẩn quy định</td>
                    <td className="p-2 text-right font-mono font-bold">230 đ</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-stone-200 font-semibold text-emerald-900">
                      2. Tổng điểm thưởng / Điểm cộng ({semesterName})
                      {bonusItems.length > 0 && (
                        <div className="text-[11px] font-normal text-stone-600 mt-1 pl-2 space-y-0.5">
                          {bonusItems.map((b, i) => {
                            const eff = getItemEffectivePoints(b, 'bonus');
                            return (
                              <div key={i}>
                                • {b.title}: +{eff.effectivePoints}đ {eff.isOverLimit ? `(Ghi nhận ${eff.rawPoints}đ, trần HK: ${eff.semesterMax}đ)` : ''} {b.note ? `(${b.note})` : ''}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-stone-200 text-center font-mono">+{totalBonus} đ</td>
                    <td className="p-2 text-right font-mono text-emerald-700 font-bold">+{totalBonus} đ</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-stone-200 font-semibold text-rose-900">
                      3. Tổng điểm trừ / Vi phạm nề nếp ({semesterName})
                      {penaltyItems.length > 0 && (
                        <div className="text-[11px] font-normal text-stone-600 mt-1 pl-2 space-y-0.5">
                          {penaltyItems.map((p, i) => {
                            const eff = getItemEffectivePoints(p, 'penalty');
                            return (
                              <div key={i}>
                                • {p.title}: -{eff.effectivePoints}đ {eff.isOverLimit ? `(Phạt ${eff.rawPoints}đ, trần trừ: ${eff.semesterMax}đ)` : ''} {p.note ? `(${p.note})` : ''}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-stone-200 text-center font-mono">-{totalPenalty} đ</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">-{totalPenalty} đ</td>
                  </tr>
                  <tr className="bg-stone-50 font-bold">
                    <td className="p-2 border-r border-stone-300">4. TỔNG ĐIỂM THI ĐUA ĐỀ XUẤT</td>
                    <td className="p-2 border-r border-stone-300 text-center">Tính toán</td>
                    <td className="p-2 text-right font-mono text-stone-900 font-extrabold">{calculatedTotal} đ</td>
                  </tr>
                  <tr className="bg-amber-50 font-bold text-amber-950">
                    <td className="p-2 border-r border-stone-300">5. ĐIỂM CHỐT BAN GIÁM HIỆU</td>
                    <td className="p-2 border-r border-stone-300 text-center">Phê duyệt</td>
                    <td className="p-2 text-right font-mono text-base font-extrabold">{finalScore} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Projected Rank & Notes */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs font-sans">
              <div><strong>Xếp loại dự kiến:</strong> <span className="font-bold text-amber-900">{rankTitle}</span></div>
              {bghNotes && <div><strong>Ý kiến chỉ đạo BGH:</strong> {bghNotes}</div>}
              {teacherFeedback && <div><strong>Ý kiến của cá nhân giáo viên:</strong> {teacherFeedback}</div>}
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
              <div className="space-y-12">
                <div className="font-bold uppercase">NGƯỜI TỰ ĐÁNH GIÁ</div>
                <div className="italic text-[11px]">(Ký và ghi rõ họ tên)</div>
                <div className="font-bold">{record.staffName}</div>
              </div>
              <div className="space-y-12">
                <div className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</div>
                <div className="italic text-[11px]">(Ký và ghi rõ họ tên)</div>
                <div className="font-bold">{record.reviewedByName || '................................'}</div>
              </div>
              <div className="space-y-12">
                <div className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</div>
                <div className="italic text-[11px]">(Ký tên và đóng dấu)</div>
                <div className="font-bold">{record.approvedByName || 'TS. Nguyễn Văn Hưng'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#05211b] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#0e4438] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-stone-100">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#072a23] text-white border-b border-[#0e4438] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-lg">
              {record.staffName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-serif text-white">
                  {record.staffName}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[#031713] text-stone-300 font-mono font-bold border border-[#0e4438]">
                  {record.staffCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#093c31] text-amber-300 border border-[#1b7360] font-bold">
                  {semesterName}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {record.departmentName} · {record.position} · {formatMonthName(record.month)} (Năm học 2026–2027)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Preview Button */}
            <button
              onClick={() => setShowPrintView(true)}
              className="p-2 rounded-xl bg-[#093c31] hover:bg-[#0c4e40] border border-[#1b7360] text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="In phiếu thi đua cá nhân định dạng A4"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">In Phiếu</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-[#093c31] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-100 bg-[#05211b]">
          {/* Limit Warning Alert */}
          {limitWarning && (
            <div className="bg-[#331c04] border-2 border-amber-500/80 rounded-xl p-3.5 text-xs text-amber-200 font-medium flex items-start gap-2.5 shadow-xs animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-amber-300 uppercase tracking-wide">Cảnh Báo Giới Hạn Điểm Thi Đua</div>
                <div className="mt-0.5 leading-relaxed">{limitWarning}</div>
              </div>
            </div>
          )}

          {/* Status & Live Score Summary Card */}
          <div className="bg-gradient-to-r from-[#031713] via-[#062921] to-[#072a23] rounded-2xl p-4 text-white shadow-md border border-[#0e4438] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Điểm nền chuẩn
                </div>
                <div className="text-xl font-bold font-mono text-stone-200">
                  {record.baseScore} đ
                </div>
              </div>

              <div className="text-emerald-400/40 text-xl font-thin">+</div>

              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Thưởng (+{totalBonus}đ)
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  +{totalBonus} đ
                </div>
              </div>

              <div className="text-rose-400/40 text-xl font-thin">-</div>

              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  Phạt (-{totalPenalty}đ)
                </div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  -{totalPenalty} đ
                </div>
              </div>

              <div className="text-amber-400/40 text-xl font-thin">=</div>

              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Tổng điểm tháng
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-400">
                  {calculatedTotal} đ
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  record.status === 'approved'
                    ? 'bg-[#083329] text-emerald-300 border border-[#125c4b]'
                    : record.status === 'submitted'
                    ? 'bg-[#0a2540] text-sky-300 border border-[#174673]'
                    : record.status === 'locked'
                    ? 'bg-[#2a133d] text-purple-300 border border-[#4d2270]'
                    : 'bg-[#072a23] text-stone-300 border border-[#0e4438]'
                }`}
              >
                {record.status === 'approved'
                  ? 'BGH Đã Phê Duyệt'
                  : record.status === 'submitted'
                  ? 'Chờ BGH Duyệt'
                  : record.status === 'locked'
                  ? 'Đã Khóa Sổ'
                  : 'Bản Nháp (Tổ CM)'}
              </span>
            </div>
          </div>

          {/* Section 1: Bonus & Penalty Item Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bonus Items Box */}
            <div className="bg-[#072a23]/60 border border-[#1b7360]/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Nội Dung Được Cộng Thưởng (+{totalBonus}đ)</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#093c31] text-emerald-300 border border-[#1b7360] font-bold">
                  {bonusItems.length} mục
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {bonusItems.length === 0 ? (
                  <div className="text-xs text-stone-400 italic py-4 text-center">
                    Chưa có mục điểm thưởng nào trong tháng này.
                  </div>
                ) : (
                  bonusItems.map(item => {
                    const eff = getItemEffectivePoints(item, 'bonus');

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#031713] p-2.5 rounded-xl border flex flex-col gap-1.5 shadow-xs text-xs ${
                          eff.isOverLimit ? 'border-amber-400/80 bg-[#1c1806]' : 'border-[#0e4438]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-emerald-400">
                                Tính: +{eff.effectivePoints}đ
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-stone-400">
                                  ({item.quantity} lần x {item.points}đ = {eff.rawPoints}đ)
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#093c31] text-emerald-300 border border-[#1b7360] font-semibold">
                                Trần {semesterName}: {eff.semesterMax}đ
                              </span>
                              {eff.pastPoints > 0 && (
                                <span className="text-[10px] text-stone-400">
                                  (Đã có {eff.pastPoints}đ tháng khác)
                                </span>
                              )}
                            </div>
                          </div>

                          {canEditScores && (
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-[#0e4438] rounded-lg overflow-hidden bg-[#072a23]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, 'bonus', -1)}
                                  disabled={item.quantity <= 1}
                                  className="px-1.5 py-0.5 text-stone-300 hover:bg-[#093c31] disabled:opacity-40 cursor-pointer"
                                  title="Giảm số lần"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-1.5 text-xs font-mono font-bold text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, 'bonus', 1)}
                                  className="px-1.5 py-0.5 text-stone-300 hover:bg-[#093c31] cursor-pointer"
                                  title="Tăng số lần"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveBonus(item.id)}
                                className="text-stone-400 hover:text-rose-400 p-1 transition-colors ml-1 cursor-pointer"
                                title="Xóa mục thưởng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Visual Cap Warning Badge on the item itself */}
                        {eff.isOverLimit && (
                          <div className="text-[11px] text-amber-200 bg-[#331c04] border border-amber-500/50 rounded-lg px-2 py-1 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              GV thực hiện {eff.rawPoints}đ, nhưng theo quy định cả {semesterName} chỉ cộng tối đa {eff.semesterMax}đ (tháng này tính +{eff.effectivePoints}đ).
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Penalty Items Box */}
            <div className="bg-[#2a0812]/50 border border-[#7a1830]/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Nội Dung Trừ Điểm / Vi Phạm (-{totalPenalty}đ)</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#3b0d18] text-rose-300 border border-[#7a1830] font-bold">
                  {penaltyItems.length} mục
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {penaltyItems.length === 0 ? (
                  <div className="text-xs text-stone-400 italic py-4 text-center">
                    Không có vi phạm hoặc điểm trừ nào trong tháng này.
                  </div>
                ) : (
                  penaltyItems.map(item => {
                    const eff = getItemEffectivePoints(item, 'penalty');

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#031713] p-2.5 rounded-xl border flex flex-col gap-1.5 shadow-xs text-xs ${
                          eff.isOverLimit ? 'border-amber-400/80 bg-[#1c1806]' : 'border-[#0e4438]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-rose-400">
                                Tính: -{eff.effectivePoints}đ
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-stone-400">
                                  ({item.quantity} lần x {item.points}đ = {eff.rawPoints}đ)
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3b0d18] text-rose-300 border border-[#7a1830] font-semibold">
                                Trần trừ {semesterName}: {eff.semesterMax}đ
                              </span>
                              {eff.pastPoints > 0 && (
                                <span className="text-[10px] text-stone-400">
                                  (Đã trừ {eff.pastPoints}đ tháng khác)
                                </span>
                              )}
                            </div>
                          </div>

                          {canEditScores && (
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-[#0e4438] rounded-lg overflow-hidden bg-[#072a23]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, 'penalty', -1)}
                                  disabled={item.quantity <= 1}
                                  className="px-1.5 py-0.5 text-stone-300 hover:bg-[#093c31] disabled:opacity-40 cursor-pointer"
                                  title="Giảm số lần vi phạm"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-1.5 text-xs font-mono font-bold text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, 'penalty', 1)}
                                  className="px-1.5 py-0.5 text-stone-300 hover:bg-[#093c31] cursor-pointer"
                                  title="Tăng số lần vi phạm"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemovePenalty(item.id)}
                                className="text-stone-400 hover:text-rose-400 p-1 transition-colors ml-1 cursor-pointer"
                                title="Xóa mục trừ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {eff.isOverLimit && (
                          <div className="text-[11px] text-amber-200 bg-[#331c04] border border-amber-500/50 rounded-lg px-2 py-1 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              Mức vi phạm {eff.rawPoints}đ đã vượt trần trừ tối đa ({eff.semesterMax}đ/{semesterName}). Tháng này tính trừ -{eff.effectivePoints}đ.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Standard Criteria Picker with Cumulative Semester Tracking */}
          {canEditScores && (
            <div className="bg-[#072a23]/70 rounded-2xl p-4 border border-[#0e4438] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Bộ Tiêu Chí Thi Đua (Theo dõi trần tích lũy {semesterName})</span>
                </div>

                {/* Category selector */}
                <select
                  value={selectedCategory}
                  onChange={e => {
                    setSelectedCategory(e.target.value);
                    setLimitWarning(null);
                  }}
                  className="bg-[#031713] border border-[#0e4438] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="II_2">II.2. Ra đề, kiểm tra, vào điểm, xếp loại</option>
                  <option value="II_1">II.1. Nề nếp chuyên môn & Giảng dạy</option>
                  <option value="II_4">II.4. Hội thi GVG & Bồi dưỡng HSG</option>
                  <option value="II_5">II.5. Công tác Kiêm nhiệm & Phong trào</option>
                  <option value="II_7">II.7. Sáng kiến kinh nghiệm (SKKN)</option>
                  <option value="II_8">II.8. Viết tài liệu ôn thi TN THPT</option>
                  <option value="I">I. Phẩm chất chính trị & Đạo đức lối sống</option>
                </select>
              </div>

              {/* Criteria List Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {filteredCriteria.map(c => {
                  const isBonus = !!c.rewardPoints;
                  const type = isBonus ? 'bonus' : 'penalty';
                  const semesterMax = getCriterionSemesterMaxLimit(c, type);
                  const pastPoints = getPointsInOtherMonthsOfSemester(c.id, type);
                  const currentMonthPoints = getCurrentPointsForCriterion(c.id, type);
                  const totalAccumulatedInSemester = pastPoints + currentMonthPoints;
                  const remainingQuota = Math.max(0, semesterMax - pastPoints);
                  const isCapReached = totalAccumulatedInSemester >= semesterMax;

                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all text-xs ${
                        isCapReached
                          ? 'bg-[#031713]/80 border-[#0e4438] opacity-60'
                          : 'bg-[#031713] border-[#0e4438] hover:border-amber-400/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate" title={c.title}>
                          {c.title}
                        </div>
                        <div className="text-[10px] text-stone-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-amber-300">
                            Trần {semesterName}: {semesterMax}đ
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-emerald-200">
                            Đã tích lũy: {totalAccumulatedInSemester}/{semesterMax}đ
                          </span>
                          {pastPoints > 0 && (
                            <span className="text-stone-400">
                              (tháng khác: {pastPoints}đ)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddCriterion(c, type)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono font-bold text-[11px] shrink-0 transition-colors cursor-pointer ${
                          isCapReached
                            ? 'bg-[#072a23] text-stone-400 hover:bg-[#093c31] hover:text-amber-300'
                            : isBonus
                            ? 'bg-[#083329] hover:bg-[#0b483c] text-emerald-300 border border-[#125c4b]'
                            : 'bg-[#3b0d18] hover:bg-[#521323] text-rose-300 border border-[#7a1830]'
                        }`}
                        title={
                          isCapReached
                            ? `Đã đạt trần ${semesterMax}đ/${semesterName}. Nhấp để kiểm tra cảnh báo.`
                            : `Nhấp để cộng vào tháng này (còn dư hạn ngạch ${remainingQuota - currentMonthPoints}đ)`
                        }
                      >
                        {isCapReached ? 'Đã đủ trần' : isBonus ? `+${c.rewardPoints}đ` : `-${c.penaltyPoints}đ`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Form Custom Item with Point Limits */}
              <form onSubmit={handleAddCustomItem} className="pt-3 border-t border-[#0e4438] flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nhập nội dung cộng/trừ điểm đặc thù..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="flex-1 min-w-[200px] bg-[#031713] border border-[#0e4438] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                />
                <select
                  value={customType}
                  onChange={e => setCustomType(e.target.value as any)}
                  className="bg-[#031713] border border-[#0e4438] rounded-xl px-3 py-1.5 font-bold text-white cursor-pointer"
                >
                  <option value="bonus">+ Cộng thưởng</option>
                  <option value="penalty">- Trừ phạt</option>
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={customPoints}
                    onChange={e => setCustomPoints(Number(e.target.value))}
                    className="w-16 bg-[#031713] border border-[#0e4438] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-amber-300"
                    title="Điểm cộng đặc thù tối đa 10 điểm"
                  />
                  <span className="text-[10px] text-stone-400">(Tối đa 10đ)</span>
                </div>
                <button
                  type="submit"
                  disabled={!customTitle.trim()}
                  className="px-3 py-1.5 bg-amber-400 text-stone-950 rounded-xl font-bold disabled:opacity-50 hover:bg-amber-500 cursor-pointer"
                >
                  Thêm mục
                </button>
              </form>
            </div>
          )}

          {/* Section 3: BGH Approval Input */}
          {isBgh ? (
            <div className="bg-[#093c31]/70 border border-[#1b7360] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <h4 className="text-sm font-bold text-white font-serif">
                  Quyền Phê Duyệt Của Ban Giám Hiệu
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    Điểm chốt BGH (Mặc định bằng điểm tính):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={bghApprovedScore ?? calculatedTotal}
                    onChange={e => setBghApprovedScore(Math.min(300, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-[#031713] border border-[#1b7360] rounded-xl px-3 py-2 text-base font-extrabold text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    Nhận xét / Ý kiến chỉ đạo của Ban Giám Hiệu:
                  </label>
                  <input
                    type="text"
                    value={bghNotes}
                    onChange={e => setBghNotes(e.target.value)}
                    placeholder="VD: BGH duyệt, biểu dương tinh thần trách nhiệm..."
                    className="w-full bg-[#031713] border border-[#1b7360] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            record.bghNotes && (
              <div className="bg-[#093c31]/60 border border-[#1b7360] rounded-xl p-3.5 text-xs text-emerald-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Ý kiến Ban Giám Hiệu:</strong> {record.bghNotes}
                </div>
              </div>
            )
          )}

          {/* Section 4: Teacher's notes / feedback */}
          <div>
            <label className="block text-xs font-bold text-emerald-200 mb-1">
              Phản hồi của giáo viên (Minh chứng hoặc khiếu nại nếu có):
            </label>
            <textarea
              rows={2}
              value={teacherFeedback}
              onChange={e => setTeacherFeedback(e.target.value)}
              disabled={isLocked}
              placeholder="Giáo viên có thể nhập minh chứng bổ sung hoặc ý kiến xác nhận kết quả..."
              className="w-full bg-[#031713] border border-[#0e4438] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-[#072a23] border-t border-[#0e4438] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {record.reviewedByName && (
              <span>
                TTCM rà soát: <strong className="text-white">{record.reviewedByName}</strong>
              </span>
            )}
            {record.approvedByName && (
              <span className="ml-3">
                BGH phê duyệt: <strong className="text-amber-300">{record.approvedByName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:bg-[#093c31] transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {/* TTCM Action: Save draft or submit */}
            {canEditScores && isTtcm && (
              <>
                <button
                  onClick={() => handleSaveAndSubmit('draft')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-200 bg-[#093c31] border border-[#1b7360] hover:bg-[#0c4e40] transition-colors cursor-pointer"
                >
                  Lưu bản nháp
                </button>
                <button
                  onClick={() => handleSaveAndSubmit('submitted')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 transition-colors shadow-xs cursor-pointer"
                >
                  Lưu & Gửi BGH duyệt
                </button>
              </>
            )}

            {/* BGH Action: Approve directly */}
            {isBgh && (
              <button
                onClick={() => handleSaveAndSubmit('approved')}
                className="px-5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Phê duyệt & Chốt điểm</span>
              </button>
            )}

            {/* General Save for teacher note */}
            {!canEditScores && !isLocked && isSelf && (
              <button
                onClick={() => handleSaveAndSubmit(record.status)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 transition-colors cursor-pointer"
              >
                Lưu phản hồi cá nhân
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
