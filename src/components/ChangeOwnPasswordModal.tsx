import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { changeCurrentPassword } from '../firebase/authService';

interface Props { isOpen: boolean; onClose: () => void; userId: string; }

export const ChangeOwnPasswordModal: React.FC<Props> = ({ isOpen, onClose, userId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return setMessage('Mật khẩu mới cần có ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) return setMessage('Xác nhận mật khẩu chưa khớp.');
    setSaving(true); setMessage('');
    try {
      await changeCurrentPassword(currentPassword, newPassword);
      setMessage('Đổi mật khẩu thành công.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch {
      setMessage('Không thể đổi mật khẩu. Kiểm tra mật khẩu hiện tại hoặc đăng nhập lại.');
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[#145b4c] bg-[#05211b] p-6 text-emerald-100 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="text-amber-400" />Đổi mật khẩu</h2><button type="button" onClick={onClose} aria-label="Đóng"><X /></button></div>
      <div className="space-y-3"><input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Mật khẩu hiện tại" className="w-full rounded-lg border border-[#145b4c] bg-[#031713] p-3" /><input required type="password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới (ít nhất 8 ký tự)" className="w-full rounded-lg border border-[#145b4c] bg-[#031713] p-3" /><input required type="password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới" className="w-full rounded-lg border border-[#145b4c] bg-[#031713] p-3" /></div>
      {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2">Hủy</button><button disabled={saving} className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</button></div>
    </form>
  </div>;
};
