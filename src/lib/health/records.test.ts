import { describe, it, expect } from 'vitest';
import { aggregateDay, localDate, normalizePayload, type HealthRecord } from './records';

const TZ = 'America/Bogota'; // UTC-5, no DST

describe('localDate', () => {
  it('converts UTC instants to the user timezone', () => {
    expect(localDate('2026-06-03T03:30:00Z', TZ)).toBe('2026-06-02');
    expect(localDate('2026-06-03T12:00:00Z', TZ)).toBe('2026-06-03');
  });
  it('keeps the wall-clock date when an offset is explicit', () => {
    expect(localDate('2026-06-02T23:30:00-05:00', 'UTC')).toBe('2026-06-02');
  });
  it('rejects invalid timestamps', () => {
    expect(localDate('nope', TZ)).toBeNull();
  });
});

describe('normalizePayload', () => {
  const payload = {
    steps: [
      { count: 100, start_time: '2026-06-03T10:00:00Z', end_time: '2026-06-03T10:30:00Z' },
      { count: 100, start_time: '2026-06-03T10:00:00Z', end_time: '2026-06-03T10:30:00Z' },
      { count: 'abc', start_time: '2026-06-03T11:00:00Z', end_time: '2026-06-03T11:30:00Z' },
    ],
    heart_rate: [
      { bpm: 70, time: '2026-06-03T10:00:00Z' },
      { bpm: 9999, time: '2026-06-03T10:01:00Z' },
    ],
    sleep: [
      { session_end_time: '2026-06-03T12:00:00Z', duration_seconds: 28800, stages: [{ stage: 'deep' }] },
    ],
  };

  it('drops duplicates and invalid values', () => {
    const recs = normalizePayload(payload, TZ);
    expect(recs.filter((r) => r.metric === 'steps')).toHaveLength(1);
    expect(recs.filter((r) => r.metric === 'heart_rate')).toHaveLength(1);
  });

  it('is idempotent: same payload yields the same keys', () => {
    const a = normalizePayload(payload, TZ).map((r) => `${r.metric}|${r.start_time}|${r.end_time}`);
    const b = normalizePayload(payload, TZ).map((r) => `${r.metric}|${r.start_time}|${r.end_time}`);
    expect(a).toEqual(b);
  });

  it('derives sleep start from duration and keeps stages', () => {
    const sleep = normalizePayload(payload, TZ).find((r) => r.metric === 'sleep')!;
    expect(sleep.start_time).toBe('2026-06-03T04:00:00.000Z');
    expect(sleep.details).toEqual({ stages: [{ stage: 'deep' }] });
  });

  it('tolerates garbage input', () => {
    expect(normalizePayload(null, TZ)).toEqual([]);
    expect(normalizePayload({ steps: 'x' }, TZ)).toEqual([]);
  });
});

describe('aggregateDay', () => {
  const rec = (r: Partial<HealthRecord> & Pick<HealthRecord, 'metric' | 'source' | 'value'>): HealthRecord => ({
    start_time: '2026-06-03T10:00:00.000Z',
    end_time: '2026-06-03T10:00:00.000Z',
    local_date: '2026-06-03',
    ...r,
  });

  it('sums device steps and ignores manual when the device has data', () => {
    const day = aggregateDay('2026-06-03', [
      rec({ metric: 'steps', source: 'health_connect', value: 3000 }),
      rec({ metric: 'steps', source: 'health_connect', value: 2000, start_time: '2026-06-03T14:00:00.000Z' }),
      rec({ metric: 'steps', source: 'manual', value: 9999 }),
    ]);
    expect(day.steps).toBe(5000);
  });

  it('falls back to manual values when there is no device data', () => {
    const day = aggregateDay('2026-06-03', [
      rec({ metric: 'steps', source: 'manual', value: 7000 }),
      rec({ metric: 'sleep', source: 'manual', value: 25200 }),
      rec({ metric: 'activity', source: 'manual', value: 45, details: { type: 'Yoga', kcal: 150 } }),
    ]);
    expect(day.steps).toBe(7000);
    expect(day.sleep_duration_seconds).toBe(25200);
    expect(day.active_minutes).toBe(45);
    expect(day.active_calories).toBe(150);
    expect(day.source).toBe('manual');
  });

  it('uses the longest device sleep session and the latest resting HR', () => {
    const day = aggregateDay('2026-06-03', [
      rec({ metric: 'sleep', source: 'health_connect', value: 3600 }),
      rec({ metric: 'sleep', source: 'health_connect', value: 27000, details: { stages: [1] } }),
      rec({ metric: 'resting_heart_rate', source: 'health_connect', value: 60, start_time: '2026-06-03T08:00:00.000Z' }),
      rec({ metric: 'resting_heart_rate', source: 'health_connect', value: 58, start_time: '2026-06-03T20:00:00.000Z' }),
    ]);
    expect(day.sleep_duration_seconds).toBe(27000);
    expect(day.sleep_stages).toEqual([1]);
    expect(day.resting_heart_rate).toBe(58);
  });
});
