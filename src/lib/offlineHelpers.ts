import { db } from './offlineDb';

export async function saveDailyLogOffline(data: {
  userId: string;
  date: string;
  mood: string | null;
  energyLevel: number | null;
  sleepHours: number | null;
  sleepQuality: string | null;
  symptoms: string[];
  notes: string | null;
}) {
  const existing = await db.dailyLogs
    .where('[userId+date]')
    .equals([data.userId, data.date])
    .first();

  if (existing?.id != null) {
    await db.dailyLogs.update(existing.id, {
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db.dailyLogs.add({
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function saveHabitLogOffline(data: {
  userId: string;
  habitId: string;
  date: string;
  value: number | null;
  completed: boolean;
}) {
  const existing = await db.habitLogs
    .where('[userId+habitId+date]')
    .equals([data.userId, data.habitId, data.date])
    .first();

  if (existing?.id != null) {
    await db.habitLogs.update(existing.id, {
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db.habitLogs.add({
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function savePCOSEntryOffline(data: {
  userId: string;
  date: string;
  acne: number;
  fatigue: number;
  hirsutism: number;
  hairLoss: number;
  moodSwings: number;
  bloating: number;
}) {
  const existing = await db.pcosEntries
    .where('[userId+date]')
    .equals([data.userId, data.date])
    .first();

  if (existing?.id != null) {
    await db.pcosEntries.update(existing.id, {
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db.pcosEntries.add({
      ...data,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getPendingSyncCount(): Promise<number> {
  const [dailyCount, habitCount, pcosCount] = await Promise.all([
    db.dailyLogs.filter((r) => !r.synced).count(),
    db.habitLogs.filter((r) => !r.synced).count(),
    db.pcosEntries.filter((r) => !r.synced).count(),
  ]);
  return dailyCount + habitCount + pcosCount;
}

/** Unsynced (or any local) records, used to overlay remote data while offline. */
export async function getLocalDailyLog(userId: string, date: string) {
  return db.dailyLogs.where('[userId+date]').equals([userId, date]).first();
}

export async function getUnsyncedHabitLogs(userId: string, fromDate: string) {
  return db.habitLogs
    .filter((l) => l.userId === userId && !l.synced && l.date >= fromDate)
    .toArray();
}

export async function getUnsyncedPCOSEntries(userId: string, fromDate: string) {
  return db.pcosEntries
    .filter((e) => e.userId === userId && !e.synced && e.date >= fromDate)
    .toArray();
}
