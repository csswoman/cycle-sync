/**
 * Privacy PIN. It only hides the screen; it is not encryption of the stored data.
 * The salted PBKDF2 hash lives in localStorage on this device and never leaves it.
 */
export const PIN_STORAGE_KEY = 'cycle_sync_pin_lock';
export const PBKDF2_ITERATIONS = 150_000;
export const PIN_PATTERN = /^\d{4,8}$/;
/** Minutes without interaction before the lock screen returns. */
export const IDLE_OPTIONS = [1, 5, 15] as const;
export const DEFAULT_IDLE_MINUTES = 5;
/** Failed attempts before the next try is delayed. */
export const FREE_ATTEMPTS = 5;

export interface PinRecord {
  salt: string;
  hash: string;
  iterations: number;
  idleMinutes: number;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export async function createPinRecord(pin: string, idleMinutes: number = DEFAULT_IDLE_MINUTES): Promise<PinRecord> {
  if (!PIN_PATTERN.test(pin)) throw new Error('PIN must be 4 to 8 digits');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: await derive(pin, salt, PBKDF2_ITERATIONS), iterations: PBKDF2_ITERATIONS, idleMinutes };
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  if (!PIN_PATTERN.test(pin)) return false;
  const hash = await derive(pin, fromHex(record.salt), record.iterations);
  if (hash.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

export function parsePinRecord(raw: string | null): PinRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw);
    if (typeof r?.salt === 'string' && typeof r?.hash === 'string' && Number.isInteger(r?.iterations) && r.iterations > 0) {
      const idle = IDLE_OPTIONS.includes(r.idleMinutes) ? r.idleMinutes : DEFAULT_IDLE_MINUTES;
      return { salt: r.salt, hash: r.hash, iterations: r.iterations, idleMinutes: idle };
    }
  } catch { /* corrupt value: treated as no PIN */ }
  return null;
}

export function loadPinRecord(): PinRecord | null {
  if (typeof window === 'undefined') return null;
  return parsePinRecord(window.localStorage.getItem(PIN_STORAGE_KEY));
}
export function savePinRecord(record: PinRecord): void {
  window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
}
export function clearPinRecord(): void {
  window.localStorage.removeItem(PIN_STORAGE_KEY);
}

/** True when the app was left idle (or hidden) for longer than the configured time. */
export function isIdleExpired(lastActiveMs: number, nowMs: number, idleMinutes: number): boolean {
  return nowMs - lastActiveMs >= idleMinutes * 60_000;
}

/** Seconds to wait before the next try: none for the first attempts, then 5 s doubling up to 5 min. */
export function retryDelaySeconds(failedAttempts: number): number {
  if (failedAttempts < FREE_ATTEMPTS) return 0;
  return Math.min(300, 5 * 2 ** (failedAttempts - FREE_ATTEMPTS));
}
