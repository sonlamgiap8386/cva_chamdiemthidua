import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { signIn, requestPasswordReset, signInWithGoogle } from '../firebase/authService';

interface LoginPageProps {
  /** Lý do phiên đăng nhập bị từ chối sau khi xác thực (thiếu quyền, hồ sơ không khớp...). */
  notice?: string;
}

function describeLoginError(err: unknown): { message: string; isOperationNotAllowed: boolean } {
  const code = (err as { code?: string })?.code ?? '';
  const messageStr = (err as Error)?.message || '';
  if (code === 'auth/operation-not-allowed' || messageStr.includes('operation-not-allowed') || messageStr.includes('PASSWORD_LOGIN_DISABLED')) {
    return {
      message: 'Phương thức "Email/Mật khẩu" hoặc Web API Key chưa khớp với dự án cva-cham-diem-thi-dua trên Firebase.',
      isOperationNotAllowed: true,
    };
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return {
      message: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
      isOperationNotAllowed: false,
    };
  }
  if (code === 'auth/user-not-found') {
    return {
      message: 'Không tìm thấy tài khoản với email này trên Firebase. Vui lòng liên hệ Quản trị viên.',
      isOperationNotAllowed: false,
    };
  }
  if (code === 'auth/invalid-email') {
    return {
      message: 'Định dạng email không hợp lệ. Vui lòng nhập đúng email @cva.edu.vn.',
      isOperationNotAllowed: false,
    };
  }
  if (code === 'auth/too-many-requests') {
    return {
      message: 'Đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại, hoặc dùng "Quên mật khẩu".',
      isOperationNotAllowed: false,
    };
  }
  if (code === 'auth/network-request-failed') {
    return {
      message: 'Không kết nối được máy chủ Firebase. Vui lòng kiểm tra kết nối mạng.',
      isOperationNotAllowed: false,
    };
  }
  if (code === 'auth/user-disabled') {
    return {
      message: 'Tài khoản đã bị vô hiệu hóa trên Firebase. Vui lòng liên hệ Quản trị viên.',
      isOperationNotAllowed: false,
    };
  }
  return {
    message: (err as Error)?.message || 'Email hoặc mật khẩu không chính xác.',
    isOperationNotAllowed: false,
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({ notice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsOperationNotAllowed(false);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg('Vui lòng nhập email công vụ.');
      setLoading(false);
      return;
    }
    try {
      await signIn(normalizedEmail, password);
    } catch (err) {
      const desc = describeLoginError(err);
      setErrorMsg(desc.message);
      if (desc.isOperationNotAllowed) {
        setIsOperationNotAllowed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsOperationNotAllowed(false);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Đã hủy đăng nhập Google.');
      } else {
        const desc = describeLoginError(err);
        setErrorMsg(desc.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setIsOperationNotAllowed(false);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg('Vui lòng nhập email công vụ ở trên để nhận hướng dẫn đặt lại mật khẩu.');
      return;
    }
    try {
      await requestPasswordReset(normalizedEmail);
      setInfoMsg(`Đã gửi liên kết đặt lại mật khẩu tới ${normalizedEmail}. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).`);
    } catch (err) {
      setErrorMsg(describeLoginError(err).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#031713] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-[#05211b] rounded-3xl shadow-2xl overflow-hidden border border-[#0e4438] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Left Side: School Branding Panel with Official Logo */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#062921] via-[#05211b] to-[#093c31] p-8 text-white flex flex-col justify-between relative border-r border-[#0e4438]">
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo-chu-van-an.png"
                alt="Logo THPT Chu Văn An"
                className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-lg border-2 border-amber-400 shrink-0"
              />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  SỞ GD&ĐT BẮC NINH
                </div>
                <div className="font-bold text-lg font-serif text-white">THPT CHU VĂN AN</div>
                <div className="text-[10px] text-emerald-300/80 font-mono">Thành lập 1964</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#0e4438]">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                HỆ THỐNG THI ĐUA NỘI BỘ
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-300 leading-snug">
                Sổ Theo Dõi & Chấm Điểm Thi Đua CBVC
              </h2>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Năm học 2026–2027 · Chuẩn 230 điểm/tháng. Đảm bảo công khai, minh bạch, chính xác và đồng bộ thời gian thực.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#0e4438] text-[11px] text-stone-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cơ sở dữ liệu bảo mật Firebase Firestore</span>
            </div>
            <div className="text-stone-400">Hội đồng Thi đua - Khen thưởng Trường THPT Chu Văn An</div>
          </div>
        </div>

        {/* Right Side: Login Form & Account Quick Selector */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-[#05211b] text-stone-100">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white font-serif">
                Đăng Nhập Cổng Thi Đua
              </h3>
              <p className="text-xs text-emerald-200/70 mt-1">
                Nhập thông tin định danh cán bộ giáo viên để truy cập hồ sơ thi đua
              </p>
            </div>

            {(errorMsg || notice) && (
              <div role="alert" className="mb-4 p-3.5 rounded-xl bg-[#3b0d18] border border-[#7a1830] text-rose-200 text-xs font-semibold space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMsg || notice}</span>
                </div>
                {isOperationNotAllowed && (
                  <div className="mt-2 pt-2 border-t border-rose-800/60 text-[11px] text-rose-300 font-normal space-y-2">
                    <p>
                      <strong>Lưu ý:</strong> Vui lòng đảm bảo cấu hình <em>Web API Key</em> khớp với dự án <em>cva-cham-diem-thi-dua</em> và phương thức <strong>Email/Password</strong> đã được bật trên Firebase Console.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://console.firebase.google.com/project/cva-cham-diem-thi-dua/authentication/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở Firebase Console</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            {infoMsg && !errorMsg && (
              <div role="status" className="mb-4 p-3 rounded-xl bg-[#0b3a2c] border border-[#166a53] text-emerald-200 flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-emerald-200 mb-1">
                  Email công vụ:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ten@thptchuvanan.edu.vn"
                    className="w-full bg-[#031713] border border-[#0e4438] rounded-xl pl-9 pr-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">
                  Mật khẩu / Mã xác thực:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#031713] border border-[#0e4438] rounded-xl pl-9 pr-9 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-stone-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                  <span>Lần đầu đăng nhập, hãy đổi mật khẩu cá nhân trong menu tài khoản.</span>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="ml-2 shrink-0 font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-[#0e4438] text-center text-[10px] text-stone-400">
            Hệ thống Thi đua Cán bộ Viên chức · Trường THPT Chu Văn An (Bắc Ninh) © 2026–2027
          </div>
        </div>
      </div>
    </div>
  );
};
