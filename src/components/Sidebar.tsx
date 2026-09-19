import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  Trophy,
  Users2,
  BookOpenCheck,
  FileSpreadsheet,
  DatabaseBackup,
  Layers,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { isAdministrator } from '../utils/auth';

export type NavTab =
  | 'overview'
  | 'scoring'
  | 'leaderboard'
  | 'staff'
  | 'criteria'
  | 'reports'
  | 'backup'
  | 'modules';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isAdmin = isAdministrator(currentUser);
  const navItems = [
    { id: 'overview' as NavTab, label: 'Tổng quan thi đua', icon: LayoutDashboard, badge: null },
    {
      id: 'scoring' as NavTab,
      label: 'Sổ chấm điểm tháng',
      icon: ClipboardCheck,
      badge: currentUser.role === 'bgh' ? 'Duyệt' : currentUser.role === 'ttcm' ? 'Chấm' : null
    },
    { id: 'leaderboard' as NavTab, label: 'Bảng xếp hạng', icon: Trophy, badge: 'Realtime' },
    { id: 'staff' as NavTab, label: 'Danh bạ CBVC', icon: Users2, badge: null },
    { id: 'criteria' as NavTab, label: 'Bộ tiêu chí thi đua', icon: BookOpenCheck, badge: '230đ' },
    { id: 'reports' as NavTab, label: 'Báo cáo & Xuất Excel', icon: FileSpreadsheet, badge: 'XLSX' },
    { id: 'backup' as NavTab, label: 'Trạng thái Firebase & xuất dữ liệu', icon: DatabaseBackup, badge: 'Live' },
    { id: 'modules' as NavTab, label: 'Module mở rộng', icon: Layers, badge: 'Mới' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-950/70 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#05211b] text-emerald-100 flex flex-col border-r border-[#0e4438] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with School Logo */}
        <div className="p-4 border-b border-[#0e4438] flex items-center justify-between bg-[#072a23]">
          <div className="flex items-center gap-3">
            <img
              src="/logo-chu-van-an.png"
              alt="Logo Trường THPT Chu Văn An"
              className="w-11 h-11 object-contain rounded-full bg-white p-0.5 shadow-md border-2 border-amber-400 shrink-0"
            />
            <div>
              <div className="text-[12px] font-bold tracking-wider text-white uppercase font-serif leading-tight">
                THPT CHU VĂN AN
              </div>
              <div className="text-[9px] font-semibold tracking-widest text-amber-400 uppercase mt-0.5">
                BẮC NINH · EST. 1964
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-emerald-400 hover:text-white rounded-lg hover:bg-[#0a382e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[#0e4438]">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-emerald-400/70 uppercase">
              KHÔNG GIAN LÀM VIỆC
            </div>
            <nav className="space-y-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group border ${
                      isActive
                        ? 'bg-[#093c31] text-amber-300 font-bold border-[#1b7360] shadow-sm shadow-black/20'
                        : 'text-emerald-100/80 hover:text-white hover:bg-[#08332a] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-amber-400' : 'text-emerald-400 group-hover:text-amber-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                          isActive
                            ? 'bg-amber-400 text-[#031713] border-amber-500 font-extrabold'
                            : 'bg-[#06241e] text-emerald-300 border-[#104b3e]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Regulations Widget */}
        <div className="p-3">
          <div
            onClick={() => onSelectTab('criteria')}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-[#062921] to-[#041d17] border border-[#0e4438] hover:border-amber-400/80 cursor-pointer transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>QUY CHẾ THI ĐUA 2026</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              Chuẩn 230đ/tháng · Kiểm soát trần điểm theo từng học kỳ.
            </p>
            <div className="mt-2 text-[11px] font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Xem hướng dẫn chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Active User Footer */}
        <div className="p-3 border-t border-[#0e4438] bg-[#031713] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#093c31] border border-[#1b7360] flex items-center justify-center font-bold text-amber-400 text-xs shrink-0 shadow-xs">
            {isAdmin
              ? 'QT'
              : currentUser.role === 'bgh'
              ? 'BGH'
              : currentUser.role === 'ttcm'
              ? 'TT'
              : currentUser.role === 'btd'
              ? 'TĐ'
              : 'GV'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-emerald-300/70 truncate">
              {isAdmin
                ? 'Quản trị viên'
                : currentUser.role === 'bgh'
                ? 'Ban Giám Hiệu'
                : currentUser.role === 'ttcm'
                ? `Tổ trưởng ${currentUser.departmentName}`
                : currentUser.role === 'btd'
                ? 'Thường trực Ban Thi Đua'
                : 'Giáo viên'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
