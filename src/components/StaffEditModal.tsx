import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserCheck,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Award,
  BookOpen,
  Save,
  Trash2,
  AlertCircle,
  Upload,
  Camera,
  ImageOff,
  Link2,
  User,
  Check
} from 'lucide-react';
import { UserProfile, Department } from '../types';

interface StaffEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: UserProfile | null; // null means adding new staff
  departments: Department[];
  existingStaffCount: number;
  onSave: (staff: UserProfile) => Promise<void>;
  onDelete?: (staffId: string) => Promise<void>;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  onClose,
  staff,
  departments,
  existingStaffCount,
  onSave,
  onDelete,
}) => {
  const isEditing = !!staff;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-toan');
  const [subject, setSubject] = useState('');
  const [position, setPosition] = useState('Giáo viên');
  const [role, setRole] = useState<'bgh' | 'ttcm' | 'gv'>('gv');
  const [concurrentJob, setConcurrentJob] = useState('');
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [homeroomClass, setHomeroomClass] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlText, setAvatarUrlText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setCode(staff.code || '');
      setDepartmentId(staff.departmentId || departments[0]?.id || 'dept-toan');
      setSubject(staff.subject || '');
      setPosition(staff.position || 'Giáo viên');
      setRole(staff.role || 'gv');
      setConcurrentJob(staff.concurrentJob || '');
      setIsHomeroom(!!staff.isHomeroomTeacher);
      setHomeroomClass(staff.homeroomClass || '');
      setPhone(staff.phone || '');
      setEmail(staff.email || '');
      setAvatar(staff.avatar || '');
      setAvatarUrlText(staff.avatar || '');
    } else {
      // New staff defaults
      setName('');
      setCode(`GV${String(existingStaffCount + 1).padStart(3, '0')}`);
      setDepartmentId(departments[0]?.id || 'dept-toan');
      setSubject('');
      setPosition('Giáo viên');
      setRole('gv');
      setConcurrentJob('');
      setIsHomeroom(false);
      setHomeroomClass('');
      setPhone('');
      setEmail('');
      setAvatar('');
      setAvatarUrlText('');
    }
    setShowUrlInput(false);
    setErrorMsg('');
  }, [staff, departments, existingStaffCount, isOpen]);

  if (!isOpen) return null;

  // Handle uploading avatar image file from computer
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chỉ chọn file hình ảnh (.jpg, .jpeg, .png, .webp)');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh không được vượt quá 2.5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      setAvatarUrlText(base64);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Không thể đọc file ảnh, vui lòng thử lại');
    };
    reader.readAsDataURL(file);
  };

  // Handle deleting personal avatar photo
  const handleRemoveAvatar = () => {
    setAvatar('');
    setAvatarUrlText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle applying image from direct URL
  const handleApplyAvatarUrl = () => {
    if (!avatarUrlText.trim()) {
      handleRemoveAvatar();
      return;
    }
    setAvatar(avatarUrlText.trim());
    setShowUrlInput(false);
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'GV';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên giáo viên');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã CBVC');
      return;
    }

    const selectedDept = departments.find(d => d.id === departmentId);
    const departmentName = selectedDept ? selectedDept.name : 'Tổ Chuyên Môn';

    const cleanStaff: UserProfile = {
      id: staff ? staff.id : `staff-custom-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      role,
      position: position.trim() || 'Giáo viên',
      departmentId,
      departmentName,
      subject: subject.trim() || undefined,
      concurrentJob: concurrentJob.trim() || undefined,
      isHomeroomTeacher: isHomeroom,
      phone: phone.trim() || undefined,
      email: email.trim() || `${code.toLowerCase()}@thpt.edu.vn`,
      avatar: avatar.trim() || undefined
    };

    if (isHomeroom && homeroomClass.trim()) {
      cleanStaff.homeroomClass = homeroomClass.trim();
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSave(cleanStaff);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu lên Firebase Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staff || !onDelete) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa CBVC "${staff.name}" (${staff.code}) khỏi Firebase Firestore?`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    try {
      await onDelete(staff.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xóa khỏi Firebase Firestore');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#05211b] w-full max-w-xl rounded-2xl shadow-2xl border border-[#13594b] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#041d17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#0e4438]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                {isEditing ? 'Cập Nhật Hồ Sơ Cán Bộ Giáo Viên' : 'Thêm Cán Bộ Giáo Viên Mới'}
              </h3>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                Lưu trữ và đồng bộ hóa trực tiếp trên cơ sở dữ liệu Firebase Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#072a23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Management Section (Edit & Delete Photo) */}
          <div className="bg-[#041d17] p-4 rounded-2xl border border-[#0e4438] space-y-3">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                {avatar ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md">
                    <img
                      src={avatar}
                      alt="Ảnh đại diện"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      title="Xóa ảnh cá nhân này"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-rose-300 font-bold transition-opacity cursor-pointer text-[10px]"
                    >
                      <ImageOff className="w-5 h-5 mb-0.5 text-rose-400" />
                      <span>Xóa ảnh</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#093c31] border-2 border-dashed border-[#1b7360] flex flex-col items-center justify-center text-emerald-300/80 shadow-2xs">
                    {name ? (
                      <span className="text-xl font-black font-serif text-amber-300">
                        {getInitials(name)}
                      </span>
                    ) : (
                      <User className="w-8 h-8 text-emerald-400/60" />
                    )}
                    <span className="text-[9px] text-emerald-400/70 mt-0.5">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Action Buttons & Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-bold text-white text-xs">Ảnh đại diện cán bộ giáo viên</span>
                  {avatar ? (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                      Đã thiết lập ảnh
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-stone-800 text-stone-300 border border-stone-700 font-semibold">
                      Ảnh mặc định
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-300/70 mt-0.5">
                  Hỗ trợ tải lên ảnh chân dung (.JPG, .PNG, .WEBP tối đa 2.5MB) hoặc xóa để dùng ảnh mặc định.
                </p>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                {/* Buttons Bar */}
                <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatar ? 'Thay đổi ảnh mới' : 'Tải ảnh từ máy tính'}</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c0d24] hover:bg-[#7a1231] text-rose-200 border border-[#9f1239] text-xs font-bold transition-all cursor-pointer active:scale-95"
                      title="Xóa ảnh chân dung hiện tại"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      <span>Xóa ảnh cá nhân</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#072a23] hover:bg-[#0a382e] text-emerald-300 hover:text-white border border-[#0e4438] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{showUrlInput ? 'Ẩn link' : 'Nhập URL ảnh'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional URL Input */}
            {showUrlInput && (
              <div className="pt-2 border-t border-[#0e4438] flex items-center gap-2">
                <input
                  type="url"
                  value={avatarUrlText}
                  onChange={e => setAvatarUrlText(e.target.value)}
                  placeholder="Dán đường dẫn ảnh trực tiếp (https://...)"
                  className="flex-1 bg-[#05211b] border border-[#104b3e] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-emerald-500/50 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleApplyAvatarUrl}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp dụng</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-300 mb-1">
                Họ và tên CBVC <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-300 mb-1">
                Mã định danh CBVC <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="VD: GV075"
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-300 mb-1">Tổ chuyên môn</label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#05211b]">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-300 mb-1">Môn giảng dạy</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="VD: Toán, Ngữ văn, Vật lý..."
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-300 mb-1">Chức vụ / Vị trí</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="VD: Giáo viên, Tổ trưởng, PHT..."
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-300 mb-1">Vai trò & Phân quyền hệ thống</label>
              <select
                value={role}
                onChange={e => {
                  const newRole = e.target.value as 'bgh' | 'ttcm' | 'gv';
                  setRole(newRole);
                  if (newRole === 'ttcm' && (!position || position === 'Giáo viên')) {
                    setPosition('Tổ trưởng chuyên môn');
                  }
                }}
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="gv" className="bg-[#05211b]">Giáo viên bộ môn (gv) - Xem điểm cá nhân</option>
                <option value="ttcm" className="bg-[#05211b]">👑 Tổ trưởng chuyên môn (ttcm) - Có quyền chấm điểm cho tổ</option>
                <option value="bgh" className="bg-[#05211b]">🏛️ Ban Giám Hiệu (bgh) - Toàn quyền quản trị & duyệt điểm</option>
              </select>
            </div>
          </div>

          {role === 'ttcm' && (
            <div className="p-3 bg-amber-400/10 border border-amber-400/40 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Quyền hạn TTCM:</strong> Tài khoản này sẽ được cấp quyền chấm điểm thi đua hàng tháng cho toàn bộ giáo viên thuộc tổ chuyên môn được phân công.
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-emerald-300 mb-1">Công tác kiêm nhiệm</label>
            <input
              type="text"
              value={concurrentJob}
              onChange={e => setConcurrentJob(e.target.value)}
              placeholder="VD: Bí thư Đoàn, TTCM, CTCĐ, GV bồi dưỡng HSG..."
              className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Homeroom checkbox & class */}
          <div className="p-3 bg-[#041d17] rounded-xl border border-[#0e4438] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-300">
              <input
                type="checkbox"
                checked={isHomeroom}
                onChange={e => setIsHomeroom(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded accent-amber-400"
              />
              <span>Phân công Giáo viên chủ nhiệm (GVCN)</span>
            </label>

            {isHomeroom && (
              <div className="pt-1">
                <input
                  type="text"
                  value={homeroomClass}
                  onChange={e => setHomeroomClass(e.target.value)}
                  placeholder="VD: 10A1, 11B2, 12C3..."
                  className="w-full bg-[#05211b] border border-[#104b3e] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-300 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-300 mb-1">Hòm thư điện tử (Email)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="VD: gv001@thpt.edu.vn"
                className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#0e4438] flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="px-3.5 py-2 rounded-xl bg-[#5c0d24] hover:bg-[#7a1231] text-rose-200 border border-[#9f1239] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa khỏi Firebase'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="px-4 py-2 rounded-xl border border-[#145b4c] bg-[#041d17] text-emerald-300 hover:text-white hover:bg-[#072a23] font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu Firebase...' : isEditing ? 'Cập nhật Firebase' : 'Lưu vào Firebase'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
