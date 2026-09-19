import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Send,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppNotification, UserProfile } from '../types';

interface PushNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSendReminder: (title: string, message: string) => void;
  currentUser: UserProfile;
}

export const PushNotificationDrawer: React.FC<PushNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSendReminder,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [reminderTitle, setReminderTitle] = useState('Nhắc nhở: Hạn chót nộp điểm thi đua');
  const [reminderMsg, setReminderMsg] = useState('Đề nghị các Tổ trưởng chuyên môn hoàn tất chấm điểm và nộp về BGH trước 17h00 hôm nay.');
  const [showSendForm, setShowSendForm] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const handleRequestWebPush = async () => {
    if (!('Notification' in window)) {
      setPushStatus('Trình duyệt không hỗ trợ Web Push Notification.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('THPT Chu Văn An - Thi Đua CBVC', {
          body: 'Đã kích hoạt thành công thông báo đẩy trên thiết bị của bạn!',
          icon: '/favicon.ico'
        });
        setPushStatus('Đã cấp quyền thông báo đẩy trên trình duyệt thành công!');
      } else {
        setPushStatus('Quyền thông báo bị từ chối.');
      }
    } catch (e) {
      setPushStatus('Không thể yêu cầu quyền thông báo trong môi trường iFrame.');
    }
  };

  const handleSendCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderMsg.trim()) return;

    onSendReminder(reminderTitle.trim(), reminderMsg.trim());
    setShowSendForm(false);
    setPushStatus('Đã gửi thông báo đẩy đến toàn thể cán bộ, giáo viên!');
    setTimeout(() => setPushStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#05211b] text-stone-100 shadow-2xl border-l border-[#0e4438] flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-[#0e4438] bg-[#072a23] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-serif text-white">Trung Tâm Thông Báo</h3>
                <div className="text-[11px] text-amber-300">Thông báo đẩy & Nhắc nhở hạn chót</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-[#093c31] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Web Push Permission Banner */}
          <div className="p-4 bg-[#093c31] border-b border-[#1b7360] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Bật thông báo đẩy Web Push về điện thoại & PC:</span>
            </div>
            <button
              onClick={handleRequestWebPush}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Kích hoạt
            </button>
          </div>

          {pushStatus && (
            <div className="px-4 py-2 bg-[#083329] text-emerald-200 text-xs font-semibold border-b border-[#125c4b] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{pushStatus}</span>
            </div>
          )}

          {/* Toolbar: Mark all read / Send new reminder */}
          <div className="p-3 bg-[#031713] border-b border-[#0e4438] flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllRead}
              className="font-semibold text-emerald-300 hover:text-white cursor-pointer"
            >
              Đánh dấu đã đọc tất cả
            </button>

            {(currentUser.role === 'bgh' || currentUser.role === 'btd') && (
              <button
                onClick={() => setShowSendForm(!showSendForm)}
                className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Gửi nhắc nhở mới</span>
              </button>
            )}
          </div>

          {/* Send Reminder Form (For BGH or Ban Thi Dua) */}
          {showSendForm && (
            <form
              onSubmit={handleSendCustomReminder}
              className="p-4 bg-[#072a23] border-b border-[#0e4438] space-y-2 text-xs"
            >
              <div className="font-bold text-white">Soạn thông báo đẩy nhắc nhở:</div>
              <input
                type="text"
                value={reminderTitle}
                onChange={e => setReminderTitle(e.target.value)}
                placeholder="Tiêu đề thông báo..."
                className="w-full bg-[#031713] border border-[#0e4438] rounded-lg px-3 py-1.5 font-semibold text-white focus:outline-none focus:border-amber-400"
                required
              />
              <textarea
                rows={2}
                value={reminderMsg}
                onChange={e => setReminderMsg(e.target.value)}
                placeholder="Nội dung chi tiết nhắc nhở hạn chót..."
                className="w-full bg-[#031713] border border-[#0e4438] rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSendForm(false)}
                  className="px-3 py-1 text-stone-300 hover:bg-[#093c31] rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Phát thông báo ngay
                </button>
              </div>
            </form>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#05211b]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Không có thông báo mới nào.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    notif.read
                      ? 'bg-[#031713] border-[#0e4438] text-stone-300'
                      : 'bg-[#072a23] border-[#1b7360] text-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <span>{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
