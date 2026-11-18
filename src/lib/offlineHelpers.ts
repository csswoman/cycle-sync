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
  cravings?: string[];
  cravingIntensity?: number | null;
  motivation?: number | null;
}) {
  // transaction makes check+write atomic, avoiding duplicate rows
  await db.transaction('rw', db.dailyLogs, async () => {
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
  });
}

export async function saveHabitLogOffline(data: {
  userId: string;
  habitId: string;
  date: string;
  value: number | null;
  completed: boolean;
}) {
  // transaction makes check+write atomic, avoiding duplicate rows
  await db.transaction('rw', db.habitLogs, async () => {
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
  });
}

export async function savePMOSEntryOffline(data: {
  userId: string;
  date: string;
  acne: number;
  fatigue: number;
  hirsutism: number;
  hairLoss: number;
  moodSwings: number;
  bloating: number;
}) {
  // transaction makes check+write atomic, avoiding duplicate rows
  await db.transaction('rw', db.pcosEntries, async () => {
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
  });
}

export async function saveWorkoutLogOffline(data: {
  userId: string;
  date: string;
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  feeling: number;
  notes: string | null;
  phase: string | null;
}) {
  const remoteId = crypto.randomUUID();
  await db.workoutLogs.add({
    ...data,
    remoteId,
    synced: false,
    updatedAt: new Date().toISOString(),
  });
  return remoteId;
}
export async function saveCycleSignOffline(data: {
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
  pregnancyTest?: string | null;
  flow: string | null;
  clots: boolean;
  pain: number | null;
  deleted: boolean;
}) {
  await db.transaction('rw', db.cycleSigns, async () => {
    const existing = await db.cycleSigns
      .where('[userId+date]')
      .equals([data.userId, data.date])
      .first();
    const record = { ...data, synced: false, updatedAt: new Date().toISOString() };
    if (existing?.id != null) await db.cycleSigns.update(existing.id, record);
    else await db.cycleSigns.add(record);
  });
}
export async function getPendingSyncCount(): Promise<number> {
  const [dailyCount, habitCount, pmosCount, workoutCount, signCount] = await Promise.all([
    db.dailyLogs.filter((r) => !r.synced).count(),
    db.habitLogs.filter((r) => !r.synced).count(),
    db.pcosEntries.filter((r) => !r.synced).count(),
    db.workoutLogs.filter((r) => !r.synced).count(),
    db.cycleSigns.filter((r) => !r.synced).count(),
  ]);
  return dailyCount + habitCount + pmosCount + workoutCount + signCount;
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

export async function getUnsyncedWorkoutLogs(userId: string) {
  return db.workoutLogs.filter((l) => l.userId === userId && !l.synced).toArray();
}
export async function getUnsyncedPMOSEntries(userId: string, fromDate: string) {
  return db.pcosEntries
    .filter((e) => e.userId === userId && !e.synced && e.date >= fromDate)
    .toArray();
}
