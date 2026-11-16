import { describe, it, expect } from 'vitest';
import { createPinRecord, verifyPin, parsePinRecord, isIdleExpired, retryDelaySeconds } from './pin';

describe('pin', () => {
  it('accepts the right PIN and rejects a wrong one', async () => {
    const rec = await createPinRecord('4821');
    expect(await verifyPin('4821', rec)).toBe(true);
    expect(await verifyPin('4822', rec)).toBe(false);
    expect(rec.hash).not.toContain('4821');
  });
  it('rejects PINs that are not 4 to 8 digits', async () => {
    await expect(createPinRecord('12')).rejects.toThrow();
    await expect(createPinRecord('abcd')).rejects.toThrow();
    const rec = await createPinRecord('1234');
    expect(await verifyPin('12', rec)).toBe(false);
  });
  it('uses a different salt each time', async () => {
    const a = await createPinRecord('1234');
    const b = await createPinRecord('1234');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
  it('treats corrupt storage as no PIN', () => {
    expect(parsePinRecord(null)).toBeNull();
    expect(parsePinRecord('{oops')).toBeNull();
    expect(parsePinRecord('{"salt":"aa"}')).toBeNull();
  });
  it('detects idle expiry', () => {
    expect(isIdleExpired(0, 4 * 60_000, 5)).toBe(false);
    expect(isIdleExpired(0, 5 * 60_000, 5)).toBe(true);
  });
  it('delays only after repeated failures', () => {
    expect(retryDelaySeconds(4)).toBe(0);
    expect(retryDelaySeconds(5)).toBe(5);
    expect(retryDelaySeconds(6)).toBe(10);
    expect(retryDelaySeconds(30)).toBe(300);
  });
});
