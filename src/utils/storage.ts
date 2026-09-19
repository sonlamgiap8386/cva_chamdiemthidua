import { MonthlyScoreRecord, CloudBackup, AppNotification, UserProfile } from '../types';
import { INITIAL_USERS, INITIAL_MONTHLY_SCORES, INITIAL_BACKUPS, INITIAL_NOTIFICATIONS } from '../data/mockData';

const SCORES_KEY = 'cva_thidua_scores_v4';
const BACKUPS_KEY = 'cva_thidua_backups_v2';
const NOTIFS_KEY = 'cva_thidua_notifs_v1';
const SETTINGS_KEY = 'cva_thidua_settings_v1';
const AUTH_USER_KEY = 'cva_auth_user_v1';

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
  currentYear: '2026-2027',
  autoBackupEnabled: true,
  backupIntervalHours: 24,
  lastBackupAt: '2026-09-03 03:00:15',
  scoringLocked: false,
};

export function loadAuthUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load auth user from storage:', e);
  }
  return null;
}

export function saveAuthUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save auth user:', e);
  }
}

export function loadScores(): MonthlyScoreRecord[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load scores from storage:', e);
  }
  // If first time or upgraded to full roster, seed with all staff scores
  saveScores(INITIAL_MONTHLY_SCORES);
  return INITIAL_MONTHLY_SCORES;
}

export function saveScores(scores: MonthlyScoreRecord[]): void {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error('Failed to save scores to storage:', e);
  }
}

export function loadBackups(): CloudBackup[] {
  try {
    const raw = localStorage.getItem(BACKUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load backups from storage:', e);
  }
  return INITIAL_BACKUPS;
}

export function saveBackups(backups: CloudBackup[]): void {
  try {
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
  } catch (e) {
    console.error('Failed to save backups:', e);
  }
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
  return INITIAL_NOTIFICATIONS;
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
    version: 'v2.4.2',
    description,
    // Store an immutable JSON-compatible copy so restore/download uses the
    // state that existed when the snapshot was created, not current state.
    records: JSON.parse(jsonString) as MonthlyScoreRecord[]
  };

  return backup;
}
