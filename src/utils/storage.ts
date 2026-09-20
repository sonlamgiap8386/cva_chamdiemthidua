import { MonthlyScoreRecord, CloudBackup, AppNotification } from '../types';
import { CURRENT_SCHOOL_YEAR } from '../data/constants';

const BACKUPS_KEY = 'cva_thidua_backups_v2';
const NOTIFS_KEY = 'cva_thidua_notifs_v1';
const SETTINGS_KEY = 'cva_thidua_settings_v1';

export interface AppSettings {
  currentMonth: number;
  currentYear: string;
  autoBackupEnabled: boolean;
  backupIntervalHours: number;
  lastBackupAt: string;
  scoringLocked: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  currentMonth: 9,
  currentYear: CURRENT_SCHOOL_YEAR,
  autoBackupEnabled: true,
  backupIntervalHours: 24,
  lastBackupAt: '',
  scoringLocked: false,
};

/** Số bản sao lưu tối đa giữ trong trình duyệt (localStorage giới hạn ~5 MB). */
export const MAX_LOCAL_BACKUPS = 5;

export function loadBackups(): CloudBackup[] {
  try {
    const raw = localStorage.getItem(BACKUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load backups from storage:', e);
  }
  return [];
}

export function saveBackups(backups: CloudBackup[]): void {
  // Mỗi bản sao lưu chứa toàn bộ điểm nên rất nặng: chỉ giữ vài bản mới nhất
  // và nếu vẫn vượt hạn mức thì bỏ dần bản cũ thay vì im lặng mất dữ liệu.
  let kept = backups.slice(0, MAX_LOCAL_BACKUPS);
  while (kept.length > 0) {
    try {
      localStorage.setItem(BACKUPS_KEY, JSON.stringify(kept));
      return;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
  try { localStorage.removeItem(BACKUPS_KEY); } catch { /* ignore */ }
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
  return [];
}

export function saveNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function createCloudSnapshot(
  scores: MonthlyScoreRecord[],
  isAuto: boolean = false,
  description: string = 'Sao lưu tức thời lên Cloud'
): CloudBackup {
  const date = new Date();
  const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const formattedTime = date.toISOString().replace('T', ' ').slice(0, 19);
  const jsonString = JSON.stringify(scores);
  const sizeKb = parseFloat((jsonString.length / 1024).toFixed(1));

  const backup: CloudBackup = {
    id: `bak-${Date.now()}`,
    createdAt: formattedTime,
    filename: `cva_thidua_snapshot_${dateStr}.json`,
    sizeKb: Math.max(12, sizeKb),
    recordsCount: scores.length,
    staffCount: new Set(scores.map(s => s.staffId)).size,
    isAuto,
    version: 'v2.5.0',
    description,
    // Store an immutable JSON-compatible copy so restore/download uses the
    // state that existed when the snapshot was created, not current state.
    records: JSON.parse(jsonString) as MonthlyScoreRecord[]
  };

  return backup;
}

/** Xóa dữ liệu cũ do các phiên bản trước để lại trong trình duyệt (hồ sơ người dùng, điểm mẫu). */
export function purgeLegacyStorage(): void {
  try {
    localStorage.removeItem('cva_auth_user_v1');
    localStorage.removeItem('cva_thidua_scores_v4');
  } catch {
    /* localStorage không khả dụng */
  }
}
