import { describe, it, expect } from 'vitest';
import {
  bbtPattern, detectTemperatureShift, emptySign, isEmptySign, isFertileMucus, parseTemperature, readingsInCycle,
  type BBTReading,
} from './fertilitySigns';

const day = (n: number) => `2025-03-${String(n).padStart(2, '0')}`;
const series = (temps: number[], from = 1): BBTReading[] => temps.map((c, i) => ({ date: day(from + i), celsius: c }));

describe('detectTemperatureShift', () => {
  it('confirms ovulation with three readings above the coverline of the six before', () => {
    const r = series([36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.6, 36.7, 36.8]);
    // Days 1-6 are low (coverline 36.5); days 7-9 are higher and day 9 is 0.3 above.
    expect(detectTemperatureShift(r)).toEqual({
      ovulationDate: day(6), coverline: 36.5, firstHighDate: day(7), confirmedDate: day(9),
    });
  });
  it('accepts an exact 0.2 rise on the third high reading', () => {
    const r = series([36.4, 36.4, 36.4, 36.4, 36.4, 36.4, 36.5, 36.5, 36.6]);
    expect(detectTemperatureShift(r)?.confirmedDate).toBe(day(9));
  });
  it('needs the third reading to be 0.2 above the coverline', () => {
    const r = series([36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.6, 36.6, 36.6]);
    expect(detectTemperatureShift(r)).toBeNull();
  });
  it('ignores disturbed readings', () => {
    const r = series([36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.6, 36.7, 36.8]);
    r[7].disturbed = true; // day 8 removed: only two highs left
    expect(detectTemperatureShift(r)).toBeNull();
  });
  it('works with unsorted input', () => {
    const r = series([36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.6, 36.7, 36.8]).reverse();
    expect(detectTemperatureShift(r)?.ovulationDate).toBe(day(6));
  });
});

describe('bbtPattern', () => {
  it('says when there are too few readings, a shift, or a flat chart', () => {
    expect(bbtPattern(series([36.4, 36.5]))).toBe('notEnough');
    expect(bbtPattern(series([36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.6, 36.7, 36.8]))).toBe('shift');
    expect(bbtPattern(series(Array(12).fill(36.4)))).toBe('waiting');
    expect(bbtPattern(series(Array(22).fill(36.4)))).toBe('monophasic');
  });
});

describe('readingsInCycle', () => {
  it('keeps the temperatures of one cycle only', () => {
    const signs = [
      { ...emptySign(day(1)), bbtCelsius: 36.4 },
      { ...emptySign(day(5)), bbtCelsius: 36.5, bbtDisturbed: true },
      { ...emptySign(day(6)), spotting: true },
      { ...emptySign(day(20)), bbtCelsius: 36.8 },
    ];
    expect(readingsInCycle(signs, day(2), day(20))).toEqual([{ date: day(5), celsius: 36.5, disturbed: true }]);
  });
});

describe('helpers', () => {
  it('parses Celsius with a comma and converts Fahrenheit', () => {
    expect(parseTemperature('36,55')).toBe(36.55);
    expect(parseTemperature('97.7')).toBe(36.5);
    expect(parseTemperature('30')).toBeNull();
    expect(parseTemperature('')).toBeNull();
  });
  it('recognises fertile mucus and empty rows', () => {
    expect(isFertileMucus('eggwhite')).toBe(true);
    expect(isFertileMucus('creamy')).toBe(false);
    expect(isEmptySign(emptySign(day(1)))).toBe(true);
    expect(isEmptySign({ ...emptySign(day(1)), sexCount: 1 })).toBe(false);
  });
});
