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

export interface OfflinePMOSEntry {
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

export interface OfflineWorkoutLog {
  id?: number;
  /** Client-generated UUID, also the primary key of the remote row. */
  remoteId: string;
  userId: string;
  date: string;
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  feeling: number;
  notes: string | null;
  phase: string | null;
  synced: boolean;
  updatedAt: string;
}
export interface OfflineCycleSign {
  id?: number;
  userId: string;
  date: string;
  spotting: boolean;
  bbtCelsius: number | null;
  bbtDisturbed: boolean;
  cervicalMucus: string | null;
  sexCount: number;
  sexProtection: string | null;
  notes: string | null;
  lhTest: string | null;
  flow: string | null;
  clots: boolean;
  pain: number | null;
  /** True when the day was cleared: sync deletes the remote row instead of upserting it. */
  deleted: boolean;
  synced: boolean;
  updatedAt: string;
}
const db = new Dexie('CycleSyncOffline') as Dexie & {
  dailyLogs: EntityTable<OfflineDailyLog, 'id'>;
  habitLogs: EntityTable<OfflineHabitLog, 'id'>;
  pcosEntries: EntityTable<OfflinePMOSEntry, 'id'>;
  workoutLogs: EntityTable<OfflineWorkoutLog, 'id'>;
  cycleSigns: EntityTable<OfflineCycleSign, 'id'>;
};

// The 'pcosEntries' store name is kept from before the PMOS rename; changing it would orphan unsynced local data.
db.version(1).stores({
  dailyLogs: '++id, [userId+date], synced, updatedAt',
  habitLogs: '++id, [userId+habitId+date], synced, updatedAt',
  pcosEntries: '++id, [userId+date], synced, updatedAt',
});

db.version(2).stores({
  workoutLogs: '++id, &remoteId, [userId+date], synced, updatedAt',
});
db.version(3).stores({
  cycleSigns: '++id, &[userId+date], synced, updatedAt',
});
export { db };
