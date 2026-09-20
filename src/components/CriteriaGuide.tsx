import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Search,
  CheckCircle2,
  Award,
  Scale,
  Building2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ShieldCheck,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { CriterionItem, UserProfile } from '../types';
import { CRITERIA_LIST } from '../data/criteria';
import { isAdministrator } from '../utils/auth';

interface CriteriaGuideProps {
  currentUser?: UserProfile | null;
}

const STORAGE_CRITERIA_KEY = 'cva_custom_criteria_v1';

export function loadStoredCriteria(): CriterionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_CRITERIA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading criteria:', e);
  }
  return CRITERIA_LIST;
}

export function saveStoredCriteria(list: CriterionItem[]): void {
  try {
    localStorage.setItem(STORAGE_CRITERIA_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving criteria:', e);
  }
}

export const CriteriaGuide: React.FC<CriteriaGuideProps> = ({ currentUser }) => {
  const [criteria, setCriteria] = useState<CriterionItem[]>(() => loadStoredCriteria());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<CriterionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = isAdministrator(currentUser);

  // Form State
  const [formCategory, setFormCategory] = useState<CriterionItem['category']>('I');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'initial' | 'reward' | 'penalty'>('reward');
  const [formPoints, setFormPoints] = useState<number>(2);
  const [formUnit, setFormUnit] = useState('2 đ/lần');
  const [formMax, setFormMax] = useState<number | ''>('');
  const [formTracking, setFormTracking] = useState('Tổ chuyên môn');
  const [formDesc, setFormDesc] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormCategory('II_1');
    setFormTitle('');
    setFormType('reward');
    setFormPoints(2);
    setFormUnit('2 đ/lần');
    setFormMax('');
    setFormTracking('Tổ chuyên môn');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CriterionItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    if (item.initialPoints) {
      setFormType('initial');
      setFormPoints(item.initialPoints);
      setFormUnit('');
    } else if (item.penaltyPoints) {
      setFormType('penalty');
      setFormPoints(item.penaltyPoints);
      setFormUnit(item.penaltyUnit || `-${item.penaltyPoints} đ/lần`);
    } else {
      setFormType('reward');
      setFormPoints(item.rewardPoints || 1);
      setFormUnit(item.rewardUnit || `${item.rewardPoints} đ/lần`);
    }
    setFormMax(item.maxPerSemester ?? '');
    setFormTracking(item.trackingDept || 'Tổ chuyên môn');
    setFormDesc(item.description || '');
    setIsModalOpen(true);
  };

  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const categoryTitles: Record<string, string> = {
      'I': 'I. Phẩm chất chính trị đạo đức lối sống (80 điểm ban đầu)',
      'II_1': 'II.1. Thực hiện ngày giờ công (Theo dõi nề nếp)',
      'II_2': 'II.2. Xây dựng ngân hàng đề và CSDL',
      'II_3': 'II.3. Bồi dưỡng chuyên môn & hội giảng',
      'II_4': 'II.4. Giáo viên dạy giỏi & Bồi dưỡng HSG',
      'II_5': 'II.5. Công tác chủ nhiệm & kiêm nhiệm',
      'II_6': 'II.6. Tham gia các cuộc thi của ngành',
      'II_7': 'II.7. Sáng kiến kinh nghiệm (SKKN)',
      'II_8': 'II.8. Viết tài liệu ôn thi tốt nghiệp THPT'
    };

    const newItem: CriterionItem = {
      id: editingItem ? editingItem.id : `crit-custom-${Date.now()}`,
      category: formCategory,
      categoryTitle: categoryTitles[formCategory] || 'Tiêu chí thi đua',
      title: formTitle.trim(),
      trackingDept: formTracking.trim() || 'Tổ chuyên môn',
      description: formDesc.trim() || undefined,
      maxPerSemester: formMax !== '' ? Number(formMax) : undefined
    };

    if (formType === 'initial') {
      newItem.initialPoints = Number(formPoints) || 20;
    } else if (formType === 'reward') {
      newItem.rewardPoints = Number(formPoints) || 1;
      newItem.rewardUnit = formUnit.trim() || `${formPoints} đ/lần`;
    } else {
      newItem.penaltyPoints = Number(formPoints) || 2;
      newItem.penaltyUnit = formUnit.trim() || `-${formPoints} đ/lần`;
    }

    let updatedList: CriterionItem[];
    if (editingItem) {
      updatedList = criteria.map(c => c.id === editingItem.id ? newItem : c);
      setFeedback('Đã cập nhật tiêu chí thi đua thành công!');
    } else {
      updatedList = [newItem, ...criteria];
      setFeedback('Đã thêm tiêu chí thi đua mới vào quy chế!');
    }

    setCriteria(updatedList);
    saveStoredCriteria(updatedList);
    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteCriterion = (id: string, title: string) => {
    if (!window.confirm(`Xóa tiêu chí "${title}" khỏi bộ quy chế thi đua?`)) return;
    const updated = criteria.filter(c => c.id !== id);
    setCriteria(updated);
    saveStoredCriteria(updated);
    setFeedback('Đã xóa tiêu chí khỏi bộ quy chế.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetDefault = () => {
    if (!window.confirm('Khôi phục lại toàn bộ tiêu chí thi đua về bản gốc chuẩn ban hành của Nhà trường?')) return;
    setCriteria(CRITERIA_LIST);
    saveStoredCriteria(CRITERIA_LIST);
    setFeedback('Đã khôi phục bộ tiêu chí thi đua gốc ban đầu.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredCriteria = criteria.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.categoryTitle.toLowerCase().includes(q) ||
        (c.trackingDept && c.trackingDept.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 text-stone-100">
      {/* Top Title & Admin Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>VĂN BẢN QUY CHẾ THI ĐUA NỘI BỘ</span>
            <span>·</span>
            <span>NĂM HỌC 2026–2027</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
            <BookOpenCheck className="w-7 h-7 text-amber-400" />
            <span>Hướng Dẫn Chấm Điểm Thi Đua Xếp Loại CBVC</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-3xl leading-relaxed">
            Ban hành kèm theo Quyết định của Hội đồng Thi đua Khen thưởng Trường THPT Chu Văn An. Áp dụng cho toàn thể cán bộ, giáo viên và nhân viên các tổ chuyên môn.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDefault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#0e4438] bg-[#072a23] hover:bg-[#093c31] text-stone-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Khôi phục về bộ tiêu chí mặc định"
            >
              <RotateCcw className="w-4 h-4 text-emerald-300" />
              <span>Khôi phục gốc</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tiêu chí mới</span>
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-[#083329] border border-[#125c4b] text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Principle Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#093c31] border border-[#1b7360] text-amber-300 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-serif">Mục Đích & Nguyên Tắc</h3>
          <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
            Đảm bảo kỉ cương, nền nếp để nâng cao chất lượng giáo dục. Chấm điểm công bằng, công khai, khách quan và bảo mật.
          </p>
        </div>

        <div className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#093c31] border border-[#1b7360] text-sky-300 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-serif">Thang Điểm Chuẩn Tháng</h3>
          <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
            <strong className="text-amber-300">230 điểm nền/tháng</strong> (gồm 80đ Phẩm chất chính trị đạo đức + 150đ Nền nếp chuyên môn và thực hiện quy chế).
          </p>
        </div>

        <div className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#093c31] border border-[#1b7360] text-emerald-300 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-serif">Tiêu Chuẩn Xếp Loại Năm</h3>
          <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
            <strong className="text-amber-300">HTTNV:</strong> Từ 2070đ trở lên (9 tháng x 230đ). <br />
            <strong className="text-amber-300">HTXSNV:</strong> Top 20% toàn trường + hoàn thành 100% chỉ tiêu.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#05211b] p-4 rounded-2xl border border-[#0e4438] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
          <input
            type="text"
            placeholder="Tìm theo nội dung tiêu chí, bộ phận theo dõi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#031713] border border-[#0e4438] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'Tất cả tiêu chí' },
            { id: 'I', label: 'I. Đạo đức lối sống' },
            { id: 'II_1', label: 'II.1. Nề nếp' },
            { id: 'II_2', label: 'II.2. Ra đề & CSDL' },
            { id: 'II_3', label: 'II.3. Hội giảng' },
            { id: 'II_4', label: 'II.4. GVG & HSG' },
            { id: 'II_5', label: 'II.5. Kiêm nhiệm' },
            { id: 'II_6', label: 'II.6. Cuộc thi ngành' },
            { id: 'II_7', label: 'II.7. SKKN' },
            { id: 'II_8', label: 'II.8. Tài liệu TN' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setCategoryFilter(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === btn.id
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'bg-[#072a23] text-emerald-200 border border-[#0e4438] hover:bg-[#093c31]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Criteria Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCriteria.map((c, index) => {
          const isBonus = !!c.rewardPoints;
          const isInitial = !!c.initialPoints;

          return (
            <div
              key={c.id}
              className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-xs hover:border-amber-400/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-[#072a23] border border-[#0e4438] px-2 py-0.5 rounded-md">
                    {c.categoryTitle.split('(')[0]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        isInitial
                          ? 'bg-[#072a23] text-stone-300 border border-[#0e4438]'
                          : isBonus
                          ? 'bg-[#083329] text-emerald-300 border border-[#125c4b]'
                          : 'bg-[#3b0d18] text-rose-300 border border-[#7a1830]'
                      }`}
                    >
                      {isInitial
                        ? `${c.initialPoints}đ gốc`
                        : isBonus
                        ? `+${c.rewardPoints}đ ${c.rewardUnit ? `(${c.rewardUnit})` : ''}`
                        : `-${c.penaltyPoints}đ ${c.penaltyUnit ? `(${c.penaltyUnit})` : ''}`}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1 rounded-md bg-[#072a23] hover:bg-[#0a382e] text-amber-300 border border-[#0e4438] cursor-pointer"
                          title="Sửa tiêu chí này"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCriterion(c.id, c.title)}
                          className="p-1 rounded-md bg-[#5c0d24] hover:bg-[#7a1231] text-rose-200 border border-[#9f1239] cursor-pointer"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm leading-snug">
                  {index + 1}. {c.title}
                </h4>

                {c.description && (
                  <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed bg-[#031713] p-2.5 rounded-xl border border-[#0e4438]">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#0e4438] flex items-center justify-between text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400/70" />
                  <span>Bộ phận theo dõi: <strong className="text-emerald-200">{c.trackingDept}</strong></span>
                </div>
                {c.maxPerSemester && (
                  <span className="font-bold text-amber-300 bg-[#093c31] px-2 py-0.5 rounded border border-[#1b7360]">
                    Tối đa {c.maxPerSemester}đ/kỳ
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Add/Edit Criterion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 text-xs">
          <div className="bg-[#05211b] w-full max-w-xl rounded-3xl shadow-2xl border border-[#13594b] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#041d17] p-4 sm:p-5 flex items-center justify-between border-b border-[#0e4438]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 font-bold">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    {editingItem ? 'Chỉnh Sửa Tiêu Chí Thi Đua' : 'Thêm Tiêu Chí Thi Đua Mới'}
                  </h3>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">
                    Quyền Ban Giám Hiệu / Quản trị viên quy chế
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#072a23] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  Nhóm danh mục tiêu chí <span className="text-amber-400">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer font-medium"
                >
                  <option value="I" className="bg-[#05211b]">I. Phẩm chất chính trị đạo đức lối sống (80đ ban đầu)</option>
                  <option value="II_1" className="bg-[#05211b]">II.1. Thực hiện ngày giờ công (Nề nếp)</option>
                  <option value="II_2" className="bg-[#05211b]">II.2. Xây dựng ngân hàng đề và CSDL</option>
                  <option value="II_3" className="bg-[#05211b]">II.3. Bồi dưỡng chuyên môn & hội giảng</option>
                  <option value="II_4" className="bg-[#05211b]">II.4. Giáo viên dạy giỏi & Bồi dưỡng HSG</option>
                  <option value="II_5" className="bg-[#05211b]">II.5. Công tác chủ nhiệm & kiêm nhiệm</option>
                  <option value="II_6" className="bg-[#05211b]">II.6. Tham gia các cuộc thi của ngành</option>
                  <option value="II_7" className="bg-[#05211b]">II.7. Sáng kiến kinh nghiệm (SKKN)</option>
                  <option value="II_8" className="bg-[#05211b]">II.8. Viết tài liệu ôn thi tốt nghiệp THPT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  Nội dung tiêu chí <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="VD: Ra đề kiểm tra định kỳ đúng ma trận..."
                  className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-emerald-300 mb-1">Loại tiêu chí</label>
                  <select
                    value={formType}
                    onChange={e => {
                      const t = e.target.value as any;
                      setFormType(t);
                      if (t === 'reward') setFormUnit(`${formPoints} đ/lần`);
                      else if (t === 'penalty') setFormUnit(`-${formPoints} đ/lần`);
                    }}
                    className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="reward" className="bg-[#05211b]">Điểm cộng thưởng (+)</option>
                    <option value="penalty" className="bg-[#05211b]">Điểm trừ (-) </option>
                    <option value="initial" className="bg-[#05211b]">Điểm nền gốc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-emerald-300 mb-1">Số điểm quy định</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formPoints}
                    onChange={e => {
                      const p = Number(e.target.value);
                      setFormPoints(p);
                      if (formType === 'reward') setFormUnit(`${p} đ/lần`);
                      else if (formType === 'penalty') setFormUnit(`-${p} đ/lần`);
                    }}
                    className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-300 mb-1">Điểm tối đa / kỳ (nếu có)</label>
                  <input
                    type="number"
                    value={formMax}
                    onChange={e => setFormMax(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="VD: 6 (để trống nếu ko giới hạn)"
                    className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-300 mb-1">Đơn vị hiển thị</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    placeholder="VD: 2 đ/lần, 1 đ/tiết, +10 đ/ĐT..."
                    className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-300 mb-1">Bộ phận theo dõi & minh chứng</label>
                  <input
                    type="text"
                    value={formTracking}
                    onChange={e => setFormTracking(e.target.value)}
                    placeholder="VD: Tổ chuyên môn, BGH, Đoàn trường..."
                    className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-300 mb-1">Ghi chú hướng dẫn chi tiết</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ghi chú điều kiện được cộng/trừ, hồ sơ minh chứng cần nộp..."
                  className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#0e4438] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#145b4c] bg-[#041d17] text-emerald-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Lưu cập nhật' : 'Thêm tiêu chí'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
