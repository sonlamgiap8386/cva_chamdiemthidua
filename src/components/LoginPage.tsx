import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { signIn, requestPasswordReset } from '../firebase/authService';

interface LoginPageProps {
  /** Lý do phiên đăng nhập bị từ chối sau khi xác thực (thiếu quyền, hồ sơ không khớp...). */
  notice?: string;
}

function describeLoginError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/too-many-requests') return 'Đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại, hoặc dùng "Quên mật khẩu".';
  if (code === 'auth/network-request-failed') return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng.';
  if (code === 'auth/user-disabled') return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.';
  return 'Email hoặc mật khẩu không chính xác. Nếu quên mật khẩu, hãy dùng "Quên mật khẩu" hoặc liên hệ Quản trị viên.';
}

export const LoginPage: React.FC<LoginPageProps> = ({ notice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg('Vui lòng nhập email công vụ.');
      return;
    }
    try {
      await signIn(normalizedEmail, password);
    } catch (err) {
      setErrorMsg(describeLoginError(err));
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg('Nhập email công vụ vào ô Email rồi bấm "Quên mật khẩu".');
      return;
    }
    try {
      await requestPasswordReset(normalizedEmail);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/network-request-failed' || code === 'auth/too-many-requests') {
        setErrorMsg(describeLoginError(err));
        return;
      }
    }
    // Luôn báo giống nhau để không lộ email nào có tài khoản.
    setInfoMsg('Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư (cả mục Spam).');
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
              <div role="alert" className="mb-4 p-3 rounded-xl bg-[#3b0d18] border border-[#7a1830] text-rose-200 flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg || notice}</span>
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
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Đăng Nhập Vào Hệ Thống</span>
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
