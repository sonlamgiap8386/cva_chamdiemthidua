import React, { useState, useRef } from 'react';
import {
  Users2,
  Search,
  Mail,
  Phone,
  Award,
  Database,
  CloudUpload,
  UserPlus,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Building2,
  GraduationCap,
  Crown,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserProfile, Department, MonthlyScoreRecord } from '../types';
import { StaffEditModal } from './StaffEditModal';
import { DepartmentLeadersModal } from './DepartmentLeadersModal';
import { DEFAULT_PASSWORD, isAdministrator } from '../utils/auth';

interface StaffDirectoryProps {
  users: UserProfile[];
  departments: Department[];
  scores: MonthlyScoreRecord[];
  currentMonth: number;
  currentUser: UserProfile;
  onSaveStaff?: (staff: UserProfile) => Promise<void>;
  onDeleteStaff?: (staffId: string) => Promise<void>;
  onBatchImportStaff?: (staffList: UserProfile[]) => Promise<void>;
  onSyncStaffToFirebase?: () => Promise<void>;
  onSaveDepartmentLeaders?: (leadersMap: { [departmentId: string]: string }) => Promise<void>;
  isFirebaseSyncing?: boolean;
  lastSyncedAt?: Date | null;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({
  users,
  departments,
  scores,
  currentMonth,
  currentUser,
  onSaveStaff,
  onDeleteStaff,
  onBatchImportStaff,
  onSyncStaffToFirebase,
  onSaveDepartmentLeaders,
  isFirebaseSyncing = false,
  lastSyncedAt = null,
}) => {
  const isBgh = currentUser?.role === 'bgh';
  const isAdmin = isAdministrator(currentUser);
  const isTtcm = currentUser?.role === 'ttcm';
  const isTeacher = currentUser?.role === 'gv';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    if (isTeacher && currentUser?.departmentId) {
      return currentUser.departmentId;
    }
    return 'all';
  });
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'bgh' | 'ttcm' | 'gvcn' | 'gv'>('all');
  const [showFullPhone, setShowFullPhone] = useState(isAdmin || isBgh || isTtcm);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message: string } | null>(null);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [isLeadersModalOpen, setIsLeadersModalOpen] = useState(false);

  // File Input Ref for Excel Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter users
  const filteredUsers = users.filter(u => {
    if (selectedDept !== 'all' && u.departmentId !== selectedDept) return false;
    if (selectedRoleFilter === 'bgh' && u.role !== 'bgh') return false;
    if (selectedRoleFilter === 'ttcm' && u.role !== 'ttcm') return false;
    if (selectedRoleFilter === 'gvcn' && !u.isHomeroomTeacher) return false;
    if (selectedRoleFilter === 'gv' && u.role !== 'gv') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q) ||
        (u.subject && u.subject.toLowerCase().includes(q)) ||
        (u.concurrentJob && u.concurrentJob.toLowerCase().includes(q)) ||
        (u.homeroomClass && u.homeroomClass.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleManualSync = async () => {
    if (!onSyncStaffToFirebase) return;
    try {
      setSyncFeedback('Đang đồng bộ danh sách cán bộ lên Firebase Firestore...');
      await onSyncStaffToFirebase();
      setSyncFeedback('Đã đồng bộ thành công dữ liệu cán bộ lên máy chủ Firebase Firestore!');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback(`Lỗi khi lưu Firestore: ${err?.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setIsEditModalOpen(true);
  };

  const renderPhone = (phone?: string) => {
    if (!phone) return 'Chưa cập nhật';
    if (showFullPhone) return phone;
    if (phone.length >= 7) {
      return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
    }
    return '***';
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'STT': 1,
        'Mã CBVC': 'GV001',
        'Họ và tên': 'Nguyễn Văn Hưng',
        'Tổ chuyên môn': 'Ban Giám Hiệu',
        'Chức vụ': 'Hiệu trưởng - Chủ tịch Hội đồng TĐ',
        'Môn giảng dạy': 'Toán',
        'Nhiệm vụ kiêm nhiệm': 'Bí thư Chi bộ, Phụ trách chung',
        'Chủ nhiệm lớp': '',
        'Số điện thoại': '0912345678',
        'Email': 'hungnv@thptchuvanan.edu.vn'
      },
      {
        'STT': 2,
        'Mã CBVC': 'GV002',
        'Họ và tên': 'Trần Thị Mai',
        'Tổ chuyên môn': 'Ban Giám Hiệu',
        'Chức vụ': 'Phó Hiệu trưởng',
        'Môn giảng dạy': 'Ngữ văn',
        'Nhiệm vụ kiêm nhiệm': 'Phụ trách Chuyên môn & Thi đua',
        'Chủ nhiệm lớp': '',
        'Số điện thoại': '0912345679',
        'Email': 'maitt@thptchuvanan.edu.vn'
      },
      {
        'STT': 3,
        'Mã CBVC': 'GV004',
        'Họ và tên': 'Nguyễn Thị Thu Huyền',
        'Tổ chuyên môn': 'Tổ Toán - Tin',
        'Chức vụ': 'Giáo viên',
        'Môn giảng dạy': 'Toán',
        'Nhiệm vụ kiêm nhiệm': 'Bồi dưỡng HSG',
        'Chủ nhiệm lớp': '12A1',
        'Số điện thoại': '0912345681',
        'Email': 'huyenntt@thptchuvanan.edu.vn'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 25 },
      { wch: 22 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 28 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Danh_Sach_CBVC');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_CBVC_THPT_Chu_Van_An.xlsx');
  };

  const handleExportStaffAccounts = () => {
    if (!isAdmin) return;

    const accountRows = users.map((user, index) => ({
      'STT': index + 1,
      'Mã CBVC': user.code,
      'Họ và tên': user.name,
      'Email': user.email,
      'Tổ chuyên môn': user.departmentName,
      'Chức vụ': user.position,
      'Mật khẩu mặc định': DEFAULT_PASSWORD,
    }));
    const worksheet = XLSX.utils.json_to_sheet(accountRows);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 26 }, { wch: 32 },
      { wch: 24 }, { wch: 30 }, { wch: 22 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tai_khoan_CBVC');
    XLSX.writeFile(workbook, 'Danh_sach_tai_khoan_CBVC_THPT_Chu_Van_An.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!data || data.length <= 1) {
          setImportStatus({ success: false, message: 'File Excel không có dữ liệu hoặc định dạng rỗng.' });
          return;
        }

        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(5, data.length); r++) {
          const rowStr = JSON.stringify(data[r]).toLowerCase();
          if (rowStr.includes('tên') || rowStr.includes('mã') || rowStr.includes('chức vụ')) {
            headerRowIdx = r;
            break;
          }
        }

        const headers = (data[headerRowIdx] || []).map(h => String(h || '').trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('tên') || h.includes('họ'));
        const codeIdx = headers.findIndex(h => h.includes('mã'));
        const deptIdx = headers.findIndex(h => h.includes('tổ') || h.includes('phòng') || h.includes('khoa'));
        const posIdx = headers.findIndex(h => h.includes('chức') || h.includes('vị trí'));
        const subjIdx = headers.findIndex(h => h.includes('môn'));
        const jobIdx = headers.findIndex(h => h.includes('kiêm'));
        const classIdx = headers.findIndex(h => h.includes('lớp') || h.includes('chủ nhiệm'));
        const phoneIdx = headers.findIndex(h => h.includes('thoại') || h.includes('sđt') || h.includes('phone'));
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('thư'));

        const parsedStaffList: UserProfile[] = [];

        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const rawName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
          if (!rawName) continue;

          const rawCode = codeIdx !== -1 && row[codeIdx]
            ? String(row[codeIdx]).trim().toUpperCase()
            : `GV${String(users.length + parsedStaffList.length + 1).padStart(3, '0')}`;

          const rawDeptName = deptIdx !== -1 ? String(row[deptIdx] || '').trim() : '';
          const matchedDept = departments.find(d =>
            d.name.toLowerCase().includes(rawDeptName.toLowerCase()) ||
            rawDeptName.toLowerCase().includes(d.name.toLowerCase())
          ) || departments[0];

          const rawPos = posIdx !== -1 ? String(row[posIdx] || 'Giáo viên').trim() : 'Giáo viên';
          const rawSubj = subjIdx !== -1 ? String(row[subjIdx] || '').trim() : undefined;
          const rawJob = jobIdx !== -1 ? String(row[jobIdx] || '').trim() : undefined;
          const rawClass = classIdx !== -1 ? String(row[classIdx] || '').trim() : '';
          const rawPhone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : undefined;
          const rawEmail = emailIdx !== -1 ? String(row[emailIdx] || '').trim() : `${rawCode.toLowerCase()}@thpt.edu.vn`;

          let role: 'bgh' | 'ttcm' | 'gv' = 'gv';
          const posLower = rawPos.toLowerCase();
          if (posLower.includes('hiệu trưởng') || posLower.includes('bgh') || posLower.includes('phó hiệu trưởng')) {
            role = 'bgh';
          } else if (posLower.includes('tổ trưởng') || posLower.includes('ttcm')) {
            role = 'ttcm';
          }

          const existing = users.find(u => u.code === rawCode || u.name.toLowerCase() === rawName.toLowerCase());

          parsedStaffList.push({
            id: existing ? existing.id : `staff-${Date.now()}-${i}`,
            name: rawName,
            code: rawCode,
            role,
            position: rawPos,
            departmentId: matchedDept ? matchedDept.id : 'dept-toan',
            departmentName: matchedDept ? matchedDept.name : 'Tổ Toán - Tin',
            subject: rawSubj || undefined,
            concurrentJob: rawJob || undefined,
            isHomeroomTeacher: !!rawClass,
            homeroomClass: rawClass || undefined,
            phone: rawPhone,
            email: rawEmail,
            avatar: '/thpt-chu-van-an.jpg'
          });
        }

        if (parsedStaffList.length === 0) {
          setImportStatus({ success: false, message: 'Không tìm thấy dòng thông tin giáo viên hợp lệ nào trong file.' });
          return;
        }

        if (onBatchImportStaff) {
          await onBatchImportStaff(parsedStaffList);
          setImportStatus({
            success: true,
            message: `Đã nhập và đồng bộ thành công ${parsedStaffList.length} cán bộ giáo viên từ file Excel!`
          });
          setTimeout(() => setImportStatus(null), 6000);
        }
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setImportStatus({ success: false, message: `Lỗi đọc file Excel: ${err?.message || 'Định dạng không khớp'}` });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>HỒ SƠ CÁN BỘ VIÊN CHỨC & TỔ CHUYÊN MÔN</span>
            <span className="text-emerald-700">·</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              FIREBASE FIRESTORE DATABASE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
            <Users2 className="w-7 h-7 text-amber-400" />
            <span>Danh Sách Cán Bộ, Giáo Viên Toàn Trường</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl">
            Quản lý hồ sơ định danh, phân công chuyên môn và kiểm soát phân quyền xem danh bạ. Dữ liệu được lưu trữ chính thức và bảo mật trên đám mây Firebase Firestore.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Configure Department Leaders (TTCM) Button */}
          {(isAdmin || isBgh) && onSaveDepartmentLeaders && (
            <button
              onClick={() => setIsLeadersModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              title="Cấu hình giáo viên nào làm Tổ trưởng chuyên môn (TTCM) để chấm điểm thi đua"
            >
              <Crown className="w-4 h-4 text-[#031713]" />
              <span>Phân quyền Tổ trưởng (TTCM)</span>
            </button>
          )}

          {(isAdmin || isBgh) && (
            <button
              onClick={handleExportStaffAccounts}
              className="px-3.5 py-2 rounded-xl bg-[#072a23] hover:bg-[#0a382e] text-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer border border-[#0e4438]"
              title="Xuất danh sách tài khoản CB/GV và mật khẩu mặc định"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Xuất tài khoản CB/GV</span>
            </button>
          )}

          {/* Sample template download */}
          {(isAdmin || isBgh) && (
            <button
              onClick={handleDownloadSampleExcel}
              className="px-3.5 py-2 rounded-xl bg-[#072a23] hover:bg-[#0a382e] text-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer border border-[#0e4438]"
              title="Tải file Excel mẫu để nhập danh sách cán bộ giáo viên"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Tải file Excel mẫu</span>
            </button>
          )}

          {/* Import Excel Button */}
          {(isAdmin || isBgh) && onBatchImportStaff && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer border border-emerald-600/50"
                title="Nhập danh sách giáo viên tự động từ file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Nhập từ Excel</span>
              </button>
            </div>
          )}

          {/* Save to Firestore */}
          {onSyncStaffToFirebase && (
            <button
              onClick={handleManualSync}
              disabled={isFirebaseSyncing}
              className="px-3.5 py-2 rounded-xl bg-[#0b483c] hover:bg-[#115e4f] text-emerald-200 hover:text-white border border-[#1b7360] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
              title="Lưu danh bạ chính thức lên Firebase Firestore"
            >
              <CloudUpload className={`w-4 h-4 ${isFirebaseSyncing ? 'animate-bounce text-amber-400' : ''}`} />
              <span>{isFirebaseSyncing ? 'Đang lưu...' : 'Lưu Firestore'}</span>
            </button>
          )}

          {/* Add Staff Button */}
          {(isAdmin || isBgh) && onSaveStaff && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm CBVC Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            importStatus.success
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Firebase Cloud Official Storage Banner */}
      <div className="bg-gradient-to-r from-[#072a23] via-[#05211b] to-[#041d17] text-white rounded-3xl p-5 border border-[#0e4438] shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-wide uppercase text-emerald-400">
                Firestore Cloud: Collection &quot;users&quot;
              </span>
              <span className="text-[10px] bg-[#041d17] px-2 py-0.5 rounded text-emerald-300 font-mono border border-[#0e4438]">
                THPT Chu Văn An
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Đã lưu trữ chính thức:</span>
              <span className="text-amber-400 font-extrabold font-mono text-lg">{users.length} Cán bộ giáo viên</span>
              <span className="text-xs font-normal text-emerald-300/70">trên máy chủ cơ sở dữ liệu</span>
            </div>
            <div className="text-xs text-emerald-300/60">
              {lastSyncedAt ? (
                <span>Thời điểm đồng bộ gần nhất: {lastSyncedAt.toLocaleString('vi-VN')}</span>
              ) : (
                <span>Trạng thái: Dữ liệu đang được kết nối và lắng nghe thời gian thực (Realtime Live Sync)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden md:block text-xs">
              <div className="text-emerald-300/70 font-medium">Phân quyền danh bạ:</div>
              <div className="text-amber-400 font-bold">
                {isAdmin ? 'Quản trị viên' : isBgh ? 'Toàn quyền BGH' : isTtcm ? 'Quyền Tổ trưởng CM' : 'Phân quyền Giáo viên'}
              </div>
            </div>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-3 pt-3 border-t border-[#0e4438] text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Privacy Notice for Standard Teachers */}
      {isTeacher && !isAdmin && (
        <div className="bg-[#072d24] border border-[#145b4c] rounded-2xl p-4 text-xs text-emerald-200 flex items-start gap-3">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white">
              Chế độ bảo mật thông tin cán bộ giáo viên (Quyền: {currentUser?.name || 'Giáo viên'} - {currentUser?.departmentName || 'Tổ Chuyên Môn'})
            </div>
            <div className="text-emerald-200/80 leading-relaxed">
              Hệ thống mặc định hiển thị danh sách các thầy cô trong <strong>{currentUser?.departmentName || 'Tổ Chuyên Môn'}</strong> của bạn. Số điện thoại cá nhân được ẩn bớt để đảm bảo quyền riêng tư. Bạn có thể chọn xem toàn trường để tra cứu chuyên môn khi cần phối hợp công tác.
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#062921] p-4 rounded-2xl border border-[#0e4438] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/70" />
          <input
            type="text"
            placeholder="Tìm theo tên GV, mã CBVC, môn dạy, lớp CN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#041d17] border border-[#104b3e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            <option value="all" className="bg-[#05211b]">Toàn trường ({users.length} CBVC)</option>
            {departments.map(d => {
              const count = users.filter(u => u.departmentId === d.id).length;
              return (
                <option key={d.id} value={d.id} className="bg-[#05211b]">
                  {d.name} ({count} GV)
                </option>
              );
            })}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value as any)}
            className="bg-[#041d17] border border-[#104b3e] rounded-xl px-3 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            <option value="all" className="bg-[#05211b]">Tất cả chức danh</option>
            <option value="bgh" className="bg-[#05211b]">Ban Giám Hiệu</option>
            <option value="ttcm" className="bg-[#05211b]">Tổ trưởng chuyên môn</option>
            <option value="gvcn" className="bg-[#05211b]">Giáo viên chủ nhiệm</option>
            <option value="gv" className="bg-[#05211b]">Giáo viên bộ môn</option>
          </select>

          {/* Phone Visibility Toggle */}
          <button
            onClick={() => setShowFullPhone(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showFullPhone
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : 'bg-[#041d17] border-[#104b3e] text-emerald-300 hover:bg-[#072a23]'
            }`}
            title="Ẩn/Hiện số điện thoại liên hệ"
          >
            {showFullPhone ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{showFullPhone ? 'SĐT: Đầy đủ' : 'SĐT: Đang ẩn'}</span>
          </button>
        </div>
      </div>

      {/* Staff Count Label */}
      <div className="flex items-center justify-between text-xs text-emerald-400/70 px-1">
        <span>
          Hiển thị <strong className="text-amber-300">{filteredUsers.length}</strong> / {users.length} cán bộ giáo viên
        </span>
        {isBgh && (
          <span className="text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
            Quyền BGH: Được phép Thêm, Sửa, Xóa hồ sơ trên Firestore & Nhập Excel
          </span>
        )}
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const score = scores.find(s => s.staffId === user.id && s.month === currentMonth);
          const finalScore = score ? (score.bghApprovedScore ?? score.totalScore) : 230;

          return (
            <div
              key={user.id}
              className="bg-[#05211b] rounded-3xl p-5 border border-[#0e4438] shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-amber-400/50 shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#093c31] border border-amber-400/40 flex items-center justify-center font-bold text-amber-300 shrink-0 font-serif text-sm shadow-2xs group-hover:scale-105 transition-transform">
                      {user.name ? user.name.trim().split(/\s+/).slice(-2).map(n => n[0]).join('').toUpperCase() : 'GV'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm truncate font-serif">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#041d17] text-amber-300 border border-[#0e4438]">
                        {user.code}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300 font-bold mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{user.position}</span>
                      {user.role === 'ttcm' && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span>TTCM · Quyền chấm điểm</span>
                        </span>
                      )}
                      {user.role === 'bgh' && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>BGH</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-300/70">
                      {user.departmentName}
                    </div>
                    {user.subject && (
                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-semibold bg-[#093c31] text-emerald-300 border border-[#1b7360] px-2 py-0.5 rounded-md">
                          Môn: {user.subject}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-200/80 pt-2 border-t border-[#0e4438]">
                  {user.concurrentJob && (
                    <div className="flex items-start gap-1.5 text-amber-300 font-medium text-[11px] bg-[#041d17] p-1.5 rounded-lg border border-[#0e4438]">
                      <Award className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>Kiêm nhiệm: <span className="font-semibold text-white">{user.concurrentJob}</span></span>
                    </div>
                  )}
                  {user.isHomeroomTeacher && (
                    <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                      <span className="font-bold text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/40">GVCN</span>
                      <span>Lớp: <strong className="text-white">{user.homeroomClass}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-emerald-300/70">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300/70">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px] text-white">{renderPhone(user.phone)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Monthly Score & BGH Management Actions */}
              <div className="mt-4 pt-3 border-t border-[#0e4438] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-emerald-400/70">Điểm T0{currentMonth}:</span>
                  <span className="text-xs font-black text-amber-300 font-mono bg-[#093c31] px-2 py-0.5 rounded-md border border-[#1b7360]">
                    {finalScore} đ
                  </span>
                </div>

                {(isAdmin || isBgh) && onSaveStaff && (
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 rounded-lg bg-[#072a23] hover:bg-[#0a382e] text-emerald-200 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#0e4438]"
                    title="Chỉnh sửa thông tin cán bộ giáo viên trên Firebase"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Sửa</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-[#05211b] rounded-2xl p-12 text-center border border-[#0e4438] text-emerald-400/70 space-y-2">
          <Users2 className="w-10 h-10 mx-auto text-emerald-600" />
          <div className="font-bold text-white">Không tìm thấy cán bộ giáo viên nào</div>
          <div className="text-xs">Vui lòng thử tìm kiếm theo từ khóa khác hoặc chọn tất cả tổ chuyên môn.</div>
        </div>
      )}

      {/* Staff Edit Modal */}
      {isEditModalOpen && onSaveStaff && (
        <StaffEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          staff={editingStaff}
          departments={departments}
          existingStaffCount={users.length}
          onSave={onSaveStaff}
          onDelete={onDeleteStaff}
        />
      )}

      {/* Department Leaders & Permissions Config Modal */}
      {isLeadersModalOpen && onSaveDepartmentLeaders && (
        <DepartmentLeadersModal
          isOpen={isLeadersModalOpen}
          onClose={() => setIsLeadersModalOpen(false)}
          departments={departments}
          users={users}
          onSaveDepartmentLeaders={onSaveDepartmentLeaders}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
