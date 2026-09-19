import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  ShieldCheck,
  Building2,
  Users,
  Check,
  AlertCircle,
  Save,
  Search,
  UserCheck
} from 'lucide-react';
import { UserProfile, Department } from '../types';

interface DepartmentLeadersModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  users: UserProfile[];
  onSaveDepartmentLeaders: (
    leadersMap: { [departmentId: string]: string } // departmentId -> leaderUserId
  ) => Promise<void>;
  currentUser: UserProfile;
}

export const DepartmentLeadersModal: React.FC<DepartmentLeadersModalProps> = ({
  isOpen,
  onClose,
  departments,
  users,
  onSaveDepartmentLeaders,
  currentUser,
}) => {
  const [leadersState, setLeadersState] = useState<{ [deptId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize selected leaders based on existing departments & ttcm users
  useEffect(() => {
    if (isOpen) {
      const initialMap: { [deptId: string]: string } = {};
      departments.forEach(dept => {
        // Look for leaderId in department or user with role 'ttcm' in this department
        const ttcmUser = users.find(u => u.departmentId === dept.id && u.role === 'ttcm');
        initialMap[dept.id] = dept.leaderId || (ttcmUser ? ttcmUser.id : '');
      });
      setLeadersState(initialMap);
      setFeedbackMsg(null);
      setSearchFilter('');
    }
  }, [isOpen, departments, users]);

  if (!isOpen) return null;

  const handleLeaderChange = (deptId: string, newLeaderId: string) => {
    setLeadersState(prev => ({
      ...prev,
      [deptId]: newLeaderId
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveDepartmentLeaders(leadersState);
      setFeedbackMsg({
        type: 'success',
        text: 'Đã lưu và cập nhật thành công phân quyền Tổ trưởng chuyên môn trên toàn hệ thống!'
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Có lỗi xảy ra khi lưu cấu hình phân quyền'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDepartments = departments.filter(d => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const deptMatches = d.name.toLowerCase().includes(q);
    const leaderUser = users.find(u => u.id === leadersState[d.id]);
    const leaderMatches = leaderUser ? leaderUser.name.toLowerCase().includes(q) : false;
    return deptMatches || leaderMatches;
  });

  const getInitials = (fullName: string) => {
    if (!fullName) return 'GV';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#05211b] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#13594b] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#041d17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#0e4438]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                  Cấu Hình Tổ Trưởng Chuyên Môn & Phân Quyền Chấm Điểm
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Dành cho Quản trị viên
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Chỉ định giáo viên làm Tổ trưởng (TTCM). Tổ trưởng sẽ có quyền trực tiếp chấm điểm thi đua tháng cho tất cả giáo viên trong tổ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#072a23] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 sm:p-4 bg-[#041d17]/60 border-b border-[#0e4438] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Tìm kiếm tổ bộ môn hoặc giáo viên..."
              className="w-full bg-[#05211b] border border-[#104b3e] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-emerald-500/50 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-300/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <span>{departments.length} Tổ chuyên môn</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span>{Object.values(leadersState).filter(Boolean).length} Tổ trưởng đã chỉ định</span>
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 mx-4 mt-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Department List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDepartments.map(dept => {
              const deptMembers = users.filter(u => u.departmentId === dept.id);
              const currentLeaderId = leadersState[dept.id] || '';
              const currentLeaderUser = users.find(u => u.id === currentLeaderId);

              return (
                <div
                  key={dept.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    currentLeaderId
                      ? 'bg-[#062921] border-[#166050] hover:border-amber-400/50 shadow-xs'
                      : 'bg-[#041d17] border-[#0e4438]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#093c31] border border-[#1b7360] flex items-center justify-center text-amber-300 font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-serif">{dept.name}</h4>
                        <span className="text-[11px] text-emerald-300/70">
                          {deptMembers.length} thành viên trong tổ
                        </span>
                      </div>
                    </div>

                    {currentLeaderUser ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                        <span>Có quyền chấm điểm</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40 shrink-0">
                        Chưa có TTCM
                      </span>
                    )}
                  </div>

                  {/* Current Leader Preview Card */}
                  {currentLeaderUser ? (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#041d17] border border-[#0e4438] flex items-center gap-3">
                      <div className="relative shrink-0">
                        {currentLeaderUser.avatar ? (
                          <img
                            src={currentLeaderUser.avatar}
                            alt={currentLeaderUser.name}
                            className="w-9 h-9 rounded-xl object-cover border border-amber-400"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#093c31] border border-amber-400/60 flex items-center justify-center text-amber-300 font-bold text-xs">
                            {getInitials(currentLeaderUser.name)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[#031713]">
                          <Crown className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {currentLeaderUser.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-[#093c31] px-1.5 py-0.2 rounded border border-[#1b7360]">
                            {currentLeaderUser.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-300/70 truncate mt-0.5">
                          {currentLeaderUser.position || `Giáo viên ${currentLeaderUser.subject || ''}`}
                          {currentLeaderUser.concurrentJob ? ` · ${currentLeaderUser.concurrentJob}` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#031713]/60 border border-dashed border-[#0e4438] text-center text-[11px] text-emerald-400/60">
                      Chưa chọn giáo viên phụ trách chức danh Tổ trưởng chuyên môn
                    </div>
                  )}

                  {/* Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                      Chỉ định Tổ trưởng chuyên môn (TTCM):
                    </label>
                    <select
                      value={currentLeaderId}
                      onChange={e => handleLeaderChange(dept.id, e.target.value)}
                      className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="" className="bg-[#05211b] text-stone-400">
                        -- Chưa chỉ định (Để trống) --
                      </option>
                      <optgroup label={`Thành viên thuộc ${dept.name}`}>
                        {deptMembers.map(member => (
                          <option key={member.id} value={member.id} className="bg-[#05211b]">
                            {member.name} ({member.code}) - {member.subject || member.position}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Tất cả cán bộ giáo viên khác">
                        {users
                          .filter(u => u.departmentId !== dept.id && u.role !== 'bgh')
                          .map(otherMember => (
                            <option key={otherMember.id} value={otherMember.id} className="bg-[#05211b]">
                              {otherMember.name} ({otherMember.code}) - {otherMember.departmentName}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#041d17] border-t border-[#0e4438] flex items-center justify-between gap-3">
          <div className="text-xs text-emerald-300/70 hidden sm:block">
            <span className="font-semibold text-amber-300">Lưu ý:</span> Khi lưu, giáo viên được chỉ định sẽ lập tức nhận vai trò Tổ trưởng chuyên môn (`ttcm`) và có quyền chấm điểm cho tổ.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#145b4c] bg-[#05211b] text-emerald-300 hover:text-white font-semibold transition-colors cursor-pointer text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-[#031713] font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu phân quyền...' : 'Lưu cấu hình phân quyền'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
