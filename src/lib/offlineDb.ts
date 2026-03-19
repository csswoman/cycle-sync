import Dexie, { type EntityTable } from 'dexie';

export interface OfflineDailyLog {
  id?: number;
  remoteId?: string;
  userId: string;
  date: string;
  mood: string | null;
  energyLevel: number | null;
  sleepHours: number | null;
  sleepQuality: string | null;
  symptoms: string[];
  notes: string | null;
  synced: boolean;
  updatedAt: string;
}

export interface OfflineHabitLog {
  id?: number;
  remoteId?: string;
  userId: string;
  habitId: string;
  date: string;
  value: number | null;
  completed: boolean;
  synced: boolean;
  updatedAt: string;
}

export interface OfflinePCOSEntry {
  id?: number;
  remoteId?: string;
  userId: string;
  date: string;
  acne: number;
  fatigue: number;
  hirsutism: number;
  hairLoss: number;
  moodSwings: number;
  bloating: number;
  synced: boolean;
  updatedAt: string;
}

const db = new Dexie('CycleSyncOffline') as Dexie & {
  dailyLogs: EntityTable<OfflineDailyLog, 'id'>;
  habitLogs: EntityTable<OfflineHabitLog, 'id'>;
  pcosEntries: EntityTable<OfflinePCOSEntry, 'id'>;
};

db.version(1).stores({
  dailyLogs: '++id, [userId+date], synced, updatedAt',
  habitLogs: '++id, [userId+habitId+date], synced, updatedAt',
  pcosEntries: '++id, [userId+date], synced, updatedAt',
});

export { db };
