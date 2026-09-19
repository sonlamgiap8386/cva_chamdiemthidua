import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CloudCheck,
  Menu,
  ShieldCheck,
  Award,
  LogOut,
  ChevronDown,
  Mail,
  Phone,
  Building2,
  Medal,
  CalendarDays,
  RefreshCw,
  GraduationCap,
  KeyRound
} from 'lucide-react';
import { UserProfile, UserRole, AppNotification } from '../types';
import { isAdministrator } from '../utils/auth';

interface HeaderProps {
  currentUser: UserProfile;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onTriggerBackup: () => void;
  isBackingUp: boolean;
  onToggleMobileMenu: () => void;
  firebaseConnected?: boolean;
  firebaseSyncing?: boolean;
  onSyncFirebase?: () => void;
  onOpenChangePassword?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  notifications,
  onOpenNotifications,
  onTriggerBackup,
  isBackingUp,
  onToggleMobileMenu,
  firebaseConnected = true,
  firebaseSyncing = false,
  onSyncFirebase,
  onOpenChangePassword,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'bgh':
        return { label: 'Ban Giám Hiệu', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/50', icon: ShieldCheck };
      case 'ttcm':
        return { label: 'Tổ Trưởng CM', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', icon: Award };
      case 'btd':
        return { label: 'Ban Thi Đua', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/50', icon: Medal };
      case 'gv':
        return { label: 'Giáo Viên', bg: 'bg-stone-800 text-emerald-200 border-emerald-700/40', icon: GraduationCap };
    }
  };

  const badge = isAdministrator(currentUser)
    ? { label: 'Quản trị viên', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/50', icon: ShieldCheck }
    : getRoleBadge(currentUser.role);
  const RoleIcon = badge.icon;

  return (
    <header className="sticky top-0 z-30 bg-[#06241e]/95 backdrop-blur-md border-b border-[#0e4438] px-4 sm:px-6 py-2.5 transition-all shadow-md shadow-black/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section: Logo + Mobile Menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-[#0a382e] focus:outline-none transition-colors"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* School Logo */}
          <img
            src="/logo-chu-van-an.png"
            alt="Logo THPT Chu Văn An"
            className="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-amber-400/80 shadow-xs shrink-0 hidden sm:block"
          />

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400/80">
              <span className="hidden sm:inline text-amber-400">THPT CHU VĂN AN (BẮC NINH)</span>
              <span className="hidden sm:inline text-emerald-700">/</span>
            </div>
          </div>
        </div>

        {/* Right Section: Cloud status, Notification, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Firebase Cloud Firestore Auto-sync indicator */}
          <button
            onClick={onSyncFirebase || onTriggerBackup}
            title="Dữ liệu đồng bộ trực tiếp lên Firebase Firestore - Nhấp để đồng bộ ngay"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-200 hover:text-white hover:bg-[#0c4337] border border-[#145b4c] bg-[#072d24] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${firebaseSyncing || isBackingUp ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden lg:inline font-bold text-emerald-400">Firestore:</span>
            <span className="text-emerald-300 flex items-center gap-1 font-semibold">
              <span className={`w-2 h-2 rounded-full ${firebaseSyncing ? 'bg-amber-400 animate-ping' : firebaseConnected ? 'bg-emerald-400' : 'bg-stone-500'}`}></span>
              {firebaseSyncing ? 'Đang đồng bộ...' : firebaseConnected ? 'Đã kết nối' : 'Ngoại tuyến'}
            </span>
          </button>

          {/* Academic Year Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#093c31] text-amber-300 border border-[#1b7360]">
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            <span>Năm học 2026–2027</span>
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-[#0a382e] border border-transparent hover:border-[#145b4c] transition-colors focus:outline-none cursor-pointer"
            title="Thông báo và nhắc nhở"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Button with Logout Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#145b4c] bg-[#072d24] hover:border-amber-400 hover:bg-[#0a382e] shadow-xs transition-all cursor-pointer text-left group"
              title="Nhấp vào để xem thông tin và Đăng xuất"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-amber-400/80 shrink-0 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#093c31] border border-amber-400/80 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0 group-hover:scale-105 transition-transform">
                  {currentUser.name ? currentUser.name.trim().split(/\s+/).slice(-2).map(n => n[0]).join('').toUpperCase() : 'GV'}
                </div>
              )}
              <div className="hidden sm:block text-xs leading-tight">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border flex items-center gap-1 ${badge.bg}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                </div>
                <div className="text-emerald-300/70 text-[11px] truncate max-w-[150px] mt-0.5">
                  {currentUser.position} · {currentUser.departmentName}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 hidden sm:block transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {/* Dropdown Menu when clicked */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-76 bg-[#062921] rounded-2xl shadow-2xl border border-[#13594b] p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-white">
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2.5 bg-[#041d17] rounded-xl border border-[#0e4438] mb-2.5">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-11 h-11 rounded-xl object-cover border border-amber-400/80 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#093c31] border border-amber-400/80 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0 shadow-2xs font-serif">
                      {currentUser.name ? currentUser.name.trim().split(/\s+/).slice(-2).map(n => n[0]).join('').toUpperCase() : 'GV'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate text-sm">{currentUser.name}</div>
                    <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                      <RoleIcon className="w-3 h-3" />
                      <span>{currentUser.position}</span>
                    </div>
                    <div className="text-[10px] text-emerald-300/60 font-mono">Mã CB: {currentUser.code}</div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2 px-2 py-1.5 text-[11px] text-emerald-200/80 border-b border-[#0e4438] pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{currentUser.departmentName}</span>
                  </div>
                  {currentUser.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                  )}
                  {currentUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono">{currentUser.phone}</span>
                    </div>
                  )}
                </div>

                {/* Change Password Button */}
                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenChangePassword();
                    }}
                    className="w-full mb-2 py-2.5 px-3 bg-[#041d17] hover:bg-[#072a23] text-amber-300 hover:text-amber-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#145b4c] hover:border-amber-400/60 cursor-pointer shadow-xs text-xs"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </button>
                )}

                {/* Logout Action Button */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 bg-[#5c0d24] hover:bg-[#7a1231] text-rose-200 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#9f1239] cursor-pointer shadow-xs text-xs"
                >
                  <LogOut className="w-4 h-4 text-rose-300" />
                  <span>Thoát tài khoản (Đăng xuất)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
