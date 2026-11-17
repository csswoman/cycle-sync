import { describe, it, expect } from 'vitest';
import { premenstrualPattern, LOW_MOOD_KEY } from './premenstrual';

describe('premenstrualPattern', () => {
  const starts = ['2026-07-01', '2026-07-29', '2026-08-26'];

  it('returns symptoms that repeat in the days before the period', () => {
    const logs = [
      { date: '2026-06-28', symptoms: ['Headache', 'Bloating'] },
      { date: '2026-07-26', symptoms: ['Bloating'], mood: 'Down' },
      { date: '2026-08-24', symptoms: ['Headache'], mood: 'Rough' },
    ];
    const p = premenstrualPattern(logs, starts);
    expect(p.cyclesChecked).toBe(3);
    expect(p.symptoms).toEqual([
      { key: 'Bloating', cycles: 2 },
      { key: 'Headache', cycles: 2 },
      { key: LOW_MOOD_KEY, cycles: 2 },
    ]);
  });

  it('ignores logs outside the premenstrual window and one-off symptoms', () => {
    const logs = [
      { date: '2026-07-10', symptoms: ['Headache'] },
      { date: '2026-08-10', symptoms: ['Headache'] },
      { date: '2026-08-25', symptoms: ['Acne Flare'] },
    ];
    const p = premenstrualPattern(logs, starts);
    expect(p.cyclesChecked).toBe(1);
    expect(p.symptoms).toEqual([]);
  });

  it('skips cycles without logs instead of counting them as symptom-free', () => {
    expect(premenstrualPattern([], starts)).toEqual({ symptoms: [], cyclesChecked: 0 });
  });
});
