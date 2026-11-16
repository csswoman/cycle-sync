import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './offlineDb';
import {
  saveDailyLogOffline,
  saveHabitLogOffline,
  savePMOSEntryOffline,
  getPendingSyncCount,
  getUnsyncedHabitLogs,
  getUnsyncedPMOSEntries,
  getLocalDailyLog,
} from './offlineHelpers';

const daily = (over = {}) => ({
  userId: 'u', date: '2025-01-01', mood: 'Okay', energyLevel: 5, sleepHours: 7,
  sleepQuality: null, symptoms: [], notes: null, ...over,
});

beforeEach(async () => {
  await Promise.all([db.dailyLogs.clear(), db.habitLogs.clear(), db.pcosEntries.clear()]);
});

describe('offline storage', () => {
  it('saves a daily log as unsynced and counts it as pending', async () => {
    await saveDailyLogOffline(daily());
    expect(await getPendingSyncCount()).toBe(1);
    expect((await getLocalDailyLog('u', '2025-01-01'))?.synced).toBe(false);
  });

  it('updates the same day instead of duplicating, and re-marks it unsynced', async () => {
    await saveDailyLogOffline(daily());
    const row = await getLocalDailyLog('u', '2025-01-01');
    await db.dailyLogs.update(row!.id!, { synced: true });
    expect(await getPendingSyncCount()).toBe(0);

    await saveDailyLogOffline(daily({ mood: 'Great' }));
    expect(await db.dailyLogs.count()).toBe(1);
    expect((await getLocalDailyLog('u', '2025-01-01'))?.mood).toBe('Great');
    expect(await getPendingSyncCount()).toBe(1);
  });

  it('keeps one habit log per habit and day', async () => {
    const h = { userId: 'u', habitId: 'h1', date: '2025-01-01', value: 3, completed: false };
    await saveHabitLogOffline(h);
    await saveHabitLogOffline({ ...h, value: 8, completed: true });
    const rows = await getUnsyncedHabitLogs('u', '2025-01-01');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ value: 8, completed: true });
  });

  it('filters unsynced records by user and date', async () => {
    await savePMOSEntryOffline({ userId: 'u', date: '2025-01-01', acne: 1, fatigue: 1, hirsutism: 1, hairLoss: 1, moodSwings: 1, bloating: 1 });
    await savePMOSEntryOffline({ userId: 'other', date: '2025-01-05', acne: 1, fatigue: 1, hirsutism: 1, hairLoss: 1, moodSwings: 1, bloating: 1 });
    expect(await getUnsyncedPMOSEntries('u', '2025-01-02')).toHaveLength(0);
    expect(await getUnsyncedPMOSEntries('u', '2025-01-01')).toHaveLength(1);
  });
});
