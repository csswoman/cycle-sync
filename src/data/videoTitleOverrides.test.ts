import { describe, it, expect } from 'vitest';
import videos from './workoutVideos.json';
import { displayVideoTitle, VIDEO_TITLE_OVERRIDES } from './videoTitleOverrides';

const FRAMING = /quema(r)?\s+(la\s+)?grasa|quemar|adelgaz|bajar de peso|perder peso|pierde peso|weight loss|burn calories|quema de calor|quemar calor|reduce (grasa|cintura)|reducir grasa|elimina grasa|baja grasa|destroza grasa|adi[oó]s (gordos|flacidez)|high burn|body burn|full body burn/i;

describe('video titles', () => {
  it('leaves no weight-loss framing in any catalog title', () => {
    const bad = (videos as { title: string }[]).map((v) => displayVideoTitle(v.title)).filter((t) => FRAMING.test(t));
    expect(bad).toEqual([]);
  });
  it('overrides only titles that exist in the catalog and never empties one', () => {
    const titles = new Set((videos as { title: string }[]).map((v) => v.title));
    for (const [old, next] of Object.entries(VIDEO_TITLE_OVERRIDES)) {
      expect(titles.has(old)).toBe(true);
      expect(next.trim().length).toBeGreaterThan(10);
    }
  });
  it('keeps other titles as they are', () => {
    expect(displayVideoTitle('Yoga suave de 20 minutos')).toBe('Yoga suave de 20 minutos');
  });
});
