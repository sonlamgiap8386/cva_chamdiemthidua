import React, { useState } from 'react';
import {
  Layers,
  BookOpenCheck,
  Trophy,
  ClockAlert,
  Users,
  CheckCircle2,
  ExternalLink,
  Plus,
  Shield
} from 'lucide-react';
import { FUTURE_MODULES } from '../data/futureModules';
import { FutureModule } from '../types';

export const FutureModulesView: React.FC = () => {
  const [modules, setModules] = useState<FutureModule[]>(FUTURE_MODULES);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const getIcon = (name: string) => {
    switch (name) {
      case 'BookOpenCheck':
        return BookOpenCheck;
      case 'Trophy':
        return Trophy;
      case 'ClockAlert':
        return ClockAlert;
      case 'Users':
      default:
        return Users;
    }
  };

  const handleToggleModule = (mod: FutureModule) => {
    setActiveMessage(`Module "${mod.name}" đã sẵn sàng kết nối API với hệ thống thi đua.`);
    setTimeout(() => setActiveMessage(null), 3500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 text-stone-100">
      {/* Top Header */}
      <div>
        <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span>KIẾN TRÚC MỞ RỘNG MODULAR</span>
          <span>·</span>
          <span className="text-amber-400 font-semibold">ECOSYSTEM READY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
          <Layers className="w-7 h-7 text-amber-400" />
          <span>Module Chức Năng Mở Rộng</span>
        </h2>
        <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
          Hệ thống được thiết kế theo kiến trúc micro-modules linh hoạt, cho phép nhà trường cắm ghép thêm các phân hệ quản lý giáo dục tiên tiến mà không làm gián đoạn dữ liệu hiện có.
        </p>
      </div>

      {activeMessage && (
        <div className="p-4 rounded-xl bg-[#083329] border border-[#125c4b] text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{activeMessage}</span>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map(mod => {
          const Icon = getIcon(mod.iconName);
          return (
            <div
              key={mod.id}
              className="bg-[#05211b] rounded-2xl p-6 border border-[#0e4438] shadow-xs hover:border-amber-400/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#093c31] border border-[#1b7360] text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#093c31] text-amber-300 border border-[#1b7360]">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white font-serif group-hover:text-amber-300 transition-colors">
                  {mod.name}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0e4438] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400/70">
                    {mod.statsLabel}
                  </div>
                  <div className="text-sm font-extrabold text-amber-300 font-mono">
                    {mod.statsValue}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleModule(mod)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#072a23] hover:bg-amber-400 hover:text-stone-950 text-emerald-200 border border-[#0e4438] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Khám phá</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extensibility Architecture Specifications */}
      <div className="bg-[#05211b] rounded-2xl p-6 border border-[#0e4438] text-xs text-emerald-200/80 space-y-3">
        <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Tiêu Chuẩn Tích Hợp API & Bảo Mật Cơ Sở Dữ Liệu</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#031713] p-3 rounded-xl border border-[#0e4438]">
            <strong className="text-white">1. Kết nối CSDL Ngành:</strong> Tương thích định dạng đồng bộ dữ liệu với cổng CSDL Giáo dục của Sở GD&ĐT.
          </div>
          <div className="bg-[#031713] p-3 rounded-xl border border-[#0e4438]">
            <strong className="text-white">2. Phân quyền đa tầng (RBAC):</strong> Bảo mật vai trò BGH, Tổ trưởng, Ban Thanh tra và từng giáo viên.
          </div>
          <div className="bg-[#031713] p-3 rounded-xl border border-[#0e4438]">
            <strong className="text-white">3. Sẵn sàng Mobile PWA:</strong> Hỗ trợ cài đặt trực tiếp lên điện thoại thông minh của giáo viên với thông báo đẩy thời gian thực.
          </div>
        </div>
      </div>
    </div>
  );
};
