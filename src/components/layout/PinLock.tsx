'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { signOutAndClearDevice } from '@/lib/signOut';
import { Icon } from '@/components/ui/Icon';
import {
  PIN_PATTERN, clearPinRecord, isIdleExpired, loadPinRecord, retryDelaySeconds, verifyPin, type PinRecord,
} from '@/lib/privacy/pin';

export const PIN_CHANGED_EVENT = 'cycle-sync-pin-changed';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

/** Privacy screen: asks for the PIN when the app opens and after the idle time. Not encryption. */
export default function PinLock() {
  const { language } = useLanguage();
  const es = language === 'es';
  const [record, setRecord] = useState<PinRecord | null>(null);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [failed, setFailed] = useState(0);
  const [wait, setWait] = useState(0);
  const lastActive = useRef(Date.now());
  const recordRef = useRef<PinRecord | null>(null);
  recordRef.current = record;

  const refresh = useCallback((lockNow: boolean) => {
    const rec = loadPinRecord();
    setRecord(rec);
    setLocked(rec ? lockNow : false);
    lastActive.current = Date.now();
  }, []);

  useEffect(() => {
    refresh(true);
    const onChange = () => refresh(false);
    window.addEventListener(PIN_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PIN_CHANGED_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    if (!record || locked) return;
    const touch = () => { lastActive.current = Date.now(); };
    const check = () => {
      const rec = recordRef.current;
      if (rec && isIdleExpired(lastActive.current, Date.now(), rec.idleMinutes)) setLocked(true);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, 5_000);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [record, locked]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((w) => w - 1), 1_000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  if (!record || !locked) return null;

  const signOutAndClear = async () => {
    if (!(await signOutAndClearDevice(es))) return;
    clearPinRecord();
    refresh(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wait > 0 || !PIN_PATTERN.test(pin)) return;
    if (await verifyPin(pin, record)) {
      setLocked(false); setPin(''); setError(false); setFailed(0);
      lastActive.current = Date.now();
    } else {
      const next = failed + 1;
      setFailed(next); setError(true); setPin('');
      setWait(retryDelaySeconds(next));
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={es ? 'Bloqueo de privacidad' : 'Privacy lock'}
      className="fixed inset-0 z-[1000] bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Icon name="lock" size={28} /></div>
        <h2 className="text-foreground text-xl font-bold">{es ? 'Ingresa tu PIN' : 'Enter your PIN'}</h2>
        <input
          type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={8}
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          aria-label="PIN"
          className="w-full text-center tracking-[0.5em] text-2xl bg-secondary border border-border rounded-xl py-3 text-foreground focus:outline-none focus:border-primary"
        />
        {error && wait === 0 && <p className="text-sm text-destructive">{es ? 'PIN incorrecto.' : 'Wrong PIN.'}</p>}
        {wait > 0 && <p className="text-sm text-destructive">{es ? `Espera ${wait} s para intentarlo de nuevo.` : `Wait ${wait} s to try again.`}</p>}
        <button type="submit" disabled={wait > 0 || !PIN_PATTERN.test(pin)}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
          {es ? 'Desbloquear' : 'Unlock'}
        </button>
        <button type="button" onClick={signOutAndClear} className="text-sm font-bold text-primary hover:underline">
          {es ? 'Olvidé mi PIN: cerrar sesión' : 'Forgot my PIN: sign out'}
        </button>
        <p className="text-xs text-muted-foreground">
          {es ? 'Al cerrar sesión se borra el PIN de este dispositivo.' : 'Signing out clears the PIN on this device.'}
        </p>
      </form>
    </div>
  );
}
