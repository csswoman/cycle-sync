'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { localDateString, type Medication, type MedicationLog } from '@/hooks/useMedications';

const CHECK_MS = 30_000;
const GRACE_MIN = 60; // still remind up to 1h after the scheduled time

export async function requestMedicationNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

async function show(title: string, body: string, tag: string) {
  const options: NotificationOptions = { body, tag, icon: '/icons/icon-192x192.png', data: { url: '/medications' } };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, options);
  else new Notification(title, options);
}

/**
 * Shows a PWA notification when a medication is due and not yet marked as taken.
 * Runs while the app is open or in the background; it does not wake a closed app
 * (that would need a server-side Web Push sender).
 */
export function useMedicationReminders() {
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) return;
      const date = localDateString();
      const [medsRes, logsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true).eq('reminders', true),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('date', date),
      ]);
      if (medsRes.error || logsRes.error) return;
      const logs = (logsRes.data as MedicationLog[]) ?? [];
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      for (const med of (medsRes.data as Medication[]) ?? []) {
        for (const time of med.times) {
          const [h, m] = time.split(':').map(Number);
          const diff = nowMin - (h * 60 + m);
          if (diff < 0 || diff > GRACE_MIN) continue;
          if (logs.some((l) => l.medication_id === med.id && l.scheduled_time === time && l.taken)) continue;
          const key = `med-notified:${med.id}:${date}:${time}`;
          if (localStorage.getItem(key)) continue;
          localStorage.setItem(key, '1');
          await show(`💊 ${med.name}`, `${med.dose ? med.dose + ' · ' : ''}${time}`, key);
        }
      }
    };

    check();
    const id = setInterval(check, CHECK_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
