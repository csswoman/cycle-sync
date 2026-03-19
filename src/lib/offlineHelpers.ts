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
    db.dailyLogs.where('synced').equals(0).count(),
    db.habitLogs.where('synced').equals(0).count(),
    db.pcosEntries.where('synced').equals(0).count(),
  ]);
  return dailyCount + habitCount + pcosCount;
}
