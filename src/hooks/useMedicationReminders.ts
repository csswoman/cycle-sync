'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { localDateString, type Medication, type MedicationLog } from '@/hooks/useMedications';
import { isScheduledOn, instructionLabel } from '@/lib/medications/schedule';

const GRACE_MIN = 60; // still remind up to 1h after the scheduled time

export async function requestMedicationNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

async function show(title: string, body: string, tag: string) {
  const options: NotificationOptions = { body, tag, icon: '/icons/icon-192x192.png', data: { url: '/log?tab=meds' } };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, options);
  else new Notification(title, options);
}

// Keys are med-notified:<id>:<YYYY-MM-DD>:<time>; drop those from before today.
function purgeOldKeys(today: string) {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('med-notified:') && (k.split(':')[2] ?? '') < today) localStorage.removeItem(k);
  }
}
/**
 * Shows a PWA notification when a medication is due and not yet marked as taken.
 * Runs while the app is open or in the background; it does not wake a closed app
 * (that would need a server-side Web Push sender).
 */
export function useMedicationReminders() {
  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };

    const notify = async (med: Medication, date: string, time: string, taken: boolean) => {
      if (taken) return;
      const key = `med-notified:${med.id}:${date}:${time}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      const es = (document.documentElement.lang || navigator.language).startsWith('es');
      const instruction = instructionLabel(med.time_instructions?.[time], es ? 'es' : 'en');
      const body = [med.dose, time, instruction, med.notes].filter(Boolean).join(' · ');
      await show(`💊 ${med.name}`, body, key);
    };

    // One fetch per load; doses later today get an exact-time timeout instead of polling.
    const load = async () => {
      clear();
      purgeOldKeys(localDateString());
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) return;
      const date = localDateString();
      const [medsRes, logsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true).eq('reminders', true),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('date', date),
      ]);
      if (medsRes.error || logsRes.error || cancelled) return;
      const logs = (logsRes.data as MedicationLog[]) ?? [];
      const isTaken = (l: MedicationLog[], med: Medication, time: string) =>
        l.some((x) => x.medication_id === med.id && x.scheduled_time === time && x.taken);
      const now = new Date();
      for (const med of (medsRes.data as Medication[]) ?? []) {
        if (!isScheduledOn(med, date)) continue;
        for (const time of med.times) {
          const [h, m] = time.split(':').map(Number);
          const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
          const diffMin = (now.getTime() - due) / 60_000;
          if (diffMin > GRACE_MIN) continue;
          if (diffMin >= 0) {
            await notify(med, date, time, isTaken(logs, med, time));
            continue;
          }
          timers.push(setTimeout(async () => {
            // Re-check the log: the user may have marked it taken since load.
            const { data, error } = await supabase.from('medication_logs').select('*')
              .eq('user_id', user.id).eq('date', date).eq('medication_id', med.id).eq('scheduled_time', time);
            if (cancelled || error) return;
            await notify(med, date, time, isTaken((data as MedicationLog[]) ?? [], med, time));
          }, due - now.getTime()));
        }
      }
      // Reload at midnight to pick up the next day's schedule.
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
      timers.push(setTimeout(load, midnight - now.getTime() + 1000));
    };

    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clear();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
