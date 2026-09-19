import React, { useState } from 'react';
import {
  CloudCheck,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  FileJson,
  Download,
  Database,
  RefreshCw,
  Server,
  Lock,
  Users2,
  DatabaseBackup,
  AlertCircle,
  Settings,
  X,
  ExternalLink,
  Copy,
  Key,
  Flame
} from 'lucide-react';
import { CloudBackup, MonthlyScoreRecord, UserProfile } from '../types';
import { AppSettings } from '../utils/storage';
import { firebaseConfig, saveActiveFirebaseConfig } from '../firebase/config';

interface CloudBackupViewProps {
  backups: CloudBackup[];
  scores: MonthlyScoreRecord[];
  users?: UserProfile[];
  settings: AppSettings;
  firebaseStatus?: {
    connected: boolean;
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
    teachersCount: number;
    scoresCount: number;
  };
  onUpdateSettings: (s: AppSettings) => void;
  onPerformBackup: (isAuto: boolean, desc: string) => void;
  onRestoreBackup: (backup: CloudBackup) => void;
  onSyncAllToFirebase?: () => Promise<void>;
  onReloadFromFirebase?: () => Promise<void>;
}

export const CloudBackupView: React.FC<CloudBackupViewProps> = ({
  backups,
  scores,
  users = [],
  settings,
  firebaseStatus,
  onUpdateSettings,
  onPerformBackup,
  onRestoreBackup,
  onSyncAllToFirebase,
  onReloadFromFirebase
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  // Editable Firebase Config State
  const [projectId, setProjectId] = useState(firebaseConfig.projectId || 'cva-cham-diem-thi-dua');
  const [apiKey, setApiKey] = useState(firebaseConfig.apiKey || '');
  const [appId, setAppId] = useState(firebaseConfig.appId || '1:18946166372:web:cva_thi_dua_web');
  const [messagingSenderId, setMessagingSenderId] = useState(firebaseConfig.messagingSenderId || '18946166372');
  const [authDomain, setAuthDomain] = useState(firebaseConfig.authDomain || 'cva-cham-diem-thi-dua.firebaseapp.com');
  const [storageBucket, setStorageBucket] = useState(firebaseConfig.storageBucket || 'cva-cham-diem-thi-dua.firebasestorage.app');

  const handleInstantBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      onPerformBackup(false, 'Sao lưu snapshot thủ công bởi quản trị viên');
      setIsBackingUp(false);
      setSuccessMessage('Đã tạo bản chụp trong trình duyệt. Đây không phải bản sao lưu cloud; hãy dùng Firestore managed export để sao lưu chính thức.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 800);
  };

  const handleSyncFirebase = async () => {
    if (!onSyncAllToFirebase) return;
    setIsSyncingFirebase(true);
    try {
      await onSyncAllToFirebase();
      setSuccessMessage('Đã đồng bộ thành công 100% danh sách GV và điểm thi đua lên Firebase Firestore Project: ' + projectId);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const handleReloadFirebase = async () => {
    if (!onReloadFromFirebase) return;
    setIsSyncingFirebase(true);
    try {
      await onReloadFromFirebase();
      setSuccessMessage('Đã tải lại dữ liệu mới nhất trực tiếp từ cơ sở dữ liệu Firebase Firestore!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const handleSaveConfig = () => {
    saveActiveFirebaseConfig({
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      appId: appId.trim(),
      messagingSenderId: messagingSenderId.trim(),
      authDomain: authDomain.trim(),
      storageBucket: storageBucket.trim(),
      firestoreDatabaseId: '(default)'
    });
    setSuccessMessage('Đã lưu cấu hình Firebase Project mới. Vui lòng tải lại trang để áp dụng kết nối!');
    setIsConfigModalOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const firestoreRulesTemplate = `Triển khai tệp firestore.rules đi kèm dự án. Không dùng quy tắc allow read, write: if true trong môi trường thực tế.`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRulesTemplate);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  const handleDownloadJson = (backup: CloudBackup) => {
    if (!backup.records) {
      setSuccessMessage('Bản sao lưu cũ chỉ có siêu dữ liệu, không có nội dung để tải hoặc khôi phục.');
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup.records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", backup.filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 text-stone-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>PROJECT: {projectId.toUpperCase()}</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">GOOGLE FIREBASE FIRESTORE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
            <DatabaseBackup className="w-7 h-7 text-emerald-400" />
            <span>Trung Tâm Dữ Liệu & Sao Lưu Firebase Cloud</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-3xl leading-relaxed">
            Hệ thống kết nối trực tiếp đến Firebase Project <strong>{projectId}</strong> (Mã dự án: <code>{messagingSenderId}</code>). Dữ liệu điểm thi đua và hồ sơ cán bộ giáo viên được lưu trữ vĩnh viễn, chống mất mát và phục hồi tức thì.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-400/50 bg-[#072d24] hover:bg-[#0a3d31] text-amber-300 hover:text-amber-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Xem và chỉnh sửa cấu hình Firebase Project"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Cài đặt Firebase</span>
          </button>

          {onReloadFromFirebase && (
            <button
              onClick={handleReloadFirebase}
              disabled={isSyncingFirebase}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#0e4438] bg-[#072a23] hover:bg-[#093c31] text-stone-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-300 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
              <span>Tải lại từ Cloud</span>
            </button>
          )}

          {onSyncAllToFirebase && (
            <button
              onClick={handleSyncFirebase}
              disabled={isSyncingFirebase}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <DatabaseBackup className={`w-4 h-4 ${isSyncingFirebase ? 'animate-bounce' : ''}`} />
              <span>{isSyncingFirebase ? 'Đang đồng bộ...' : 'Đồng bộ Firestore ngay'}</span>
            </button>
          )}

          <button
            onClick={handleInstantBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#093c31] border border-[#1b7360] hover:bg-[#0c4e40] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <HardDrive className="w-4 h-4 text-amber-300" />
            <span>{isBackingUp ? 'Đang sao lưu...' : 'Tạo Snapshot Dự phòng'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#083329] border border-[#125c4b] text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Firebase Connection Status Card */}
      <div className="bg-gradient-to-br from-[#05211b] via-[#062921] to-[#093c31] text-white rounded-3xl p-6 border border-[#0e4438] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${firebaseStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
                Firebase Firestore Realtime Engine
              </span>
              <span className="text-[10px] bg-[#031713] px-2 py-0.5 rounded text-amber-300 font-mono border border-[#0e4438]">
                Project: {projectId}
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-3">
              <span>Trạng thái kết nối:</span>
              <span className="text-emerald-400 font-sans">
                {firebaseStatus?.connected ? 'Đang hoạt động ổn định (Live)' : 'Ngoại tuyến / Đang lắng nghe'}
              </span>
            </div>

            <div className="text-xs text-emerald-200/80 max-w-2xl leading-relaxed">
              Toàn bộ hồ sơ <strong>{users.length} cán bộ giáo viên</strong> và bảng điểm thi đua <strong>9 tháng năm học 2026–2027</strong> được đồng bộ tự động lên dự án <strong>{projectId}</strong>.
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-[#031713] rounded-2xl border border-[#0e4438] shrink-0 text-xs font-mono">
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-400">Project Name:</span>
              <span className="text-amber-300 font-bold">CVA-CHAM DIEM THI DUA</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-400">Project ID:</span>
              <span className="text-emerald-300 font-bold">{projectId}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-400">Project Number:</span>
              <span className="text-stone-200">{messagingSenderId}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-400">Collections:</span>
              <span className="text-stone-200">users, scores, departments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Project Settings Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#05211b] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#13594b] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#041d17] p-4 sm:p-5 flex items-center justify-between border-b border-[#0e4438]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                    Cấu Hình Firebase Project Của Bạn
                  </h3>
                  <p className="text-xs text-emerald-300/70 mt-0.5">
                    Quản lý thông tin kết nối và phân quyền cơ sở dữ liệu Firestore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#072a23] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-[#041d17] p-4 rounded-2xl border border-[#0e4438] space-y-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Thông tin Project đang được áp dụng:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-emerald-300 font-bold mb-1">Project ID</label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      className="w-full bg-[#05211b] border border-[#104b3e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 font-bold mb-1">Project Number (Messaging Sender ID)</label>
                    <input
                      type="text"
                      value={messagingSenderId}
                      onChange={e => setMessagingSenderId(e.target.value)}
                      className="w-full bg-[#05211b] border border-[#104b3e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-emerald-300 font-bold mb-1">Web App ID (appId)</label>
                    <input
                      type="text"
                      value={appId}
                      onChange={e => setAppId(e.target.value)}
                      className="w-full bg-[#05211b] border border-[#104b3e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 font-bold mb-1">Web API Key (apiKey)</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full bg-[#05211b] border border-[#104b3e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Firestore Rules Helper */}
              <div className="bg-[#041d17] p-4 rounded-2xl border border-[#0e4438] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Quy tắc bảo mật Firestore (Security Rules):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRules}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#072a23] hover:bg-[#093c31] text-amber-300 border border-[#0e4438] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedRules ? 'Đã sao chép!' : 'Sao chép Rules'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#031713] rounded-xl border border-[#0e4438] font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {firestoreRulesTemplate}
                </pre>
                <p className="text-[11px] text-emerald-300/70">
                  Dán quy tắc trên vào tab <strong>Firestore Database &gt; Rules</strong> trên Firebase Console để cho phép web app đọc/ghi dữ liệu an toàn.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0e4438]">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#145b4c] bg-[#041d17] text-emerald-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#031713] font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Lưu & Áp Dụng Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshots Table */}
      <div className="bg-[#05211b] rounded-3xl border border-[#0e4438] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#072a23] border-b border-[#0e4438] flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-300" />
            <span>BẢN CHỤP CỤC BỘ — KHÔNG PHẢI SAO LƯU CLOUD ({backups.length} BẢN)</span>
          </div>
          <div className="text-xs text-emerald-300/80">
            Dữ liệu định dạng chuẩn JSON mã hóa
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#031713] text-emerald-200 font-bold uppercase tracking-wider text-[11px] border-b border-[#0e4438]">
                <th className="py-3 px-4">Tên tệp bản chụp</th>
                <th className="py-3 px-4">Thời gian tạo</th>
                <th className="py-3 px-3 text-center">Số bản ghi</th>
                <th className="py-3 px-3 text-center">Dung lượng</th>
                <th className="py-3 px-4">Mô tả sao lưu</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0e4438]">
              {backups.map(b => (
                <tr key={b.id} className="hover:bg-[#072a23]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-white flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{b.filename}</span>
                  </td>
                  <td className="py-3 px-4 text-stone-300">{b.createdAt}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">{b.recordsCount}</td>
                  <td className="py-3 px-3 text-center font-mono text-stone-300">{b.sizeKb} KB</td>
                  <td className="py-3 px-4 text-stone-400 text-[11px]">{b.description}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadJson(b)}
                      className="px-2.5 py-1 rounded-lg bg-[#072a23] hover:bg-[#093c31] border border-[#0e4438] text-stone-200 font-semibold text-[11px] cursor-pointer"
                      title="Tải về máy tính định dạng JSON"
                    >
                      Tải JSON
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Phục hồi lại dữ liệu từ bản chụp ${b.filename}?`)) {
                          onRestoreBackup(b);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#093c31] hover:bg-[#0c4e40] border border-[#1b7360] text-amber-300 font-bold text-[11px] cursor-pointer"
                    >
                      Khôi phục
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
