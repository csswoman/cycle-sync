'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  times: string[];
  notes: string | null;
  reminders: boolean;
  active: boolean;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  date: string;
  scheduled_time: string;
  taken: boolean;
  taken_at: string | null;
}

export function localDateString(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = localDateString();

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    try {
      const [medsRes, logsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true).order('created_at'),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('date', localDateString()),
      ]);
      if (!medsRes.error) setMedications((medsRes.data as Medication[]) ?? []);
      if (!logsRes.error) setTodayLogs((logsRes.data as MedicationLog[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMedication = async (name: string, dose: string, times: string[], reminders: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    await supabase.from('medications').insert({
      user_id: user.id,
      name,
      dose: dose || null,
      times: [...times].sort(),
      reminders,
    });
    await load();
  };

  const removeMedication = async (id: string) => {
    await supabase.from('medications').update({ active: false }).eq('id', id);
    await load();
  };

  const isTaken = (medicationId: string, time: string) =>
    todayLogs.some((l) => l.medication_id === medicationId && l.scheduled_time === time && l.taken);

  const setTaken = async (medicationId: string, time: string, taken: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    await supabase.from('medication_logs').upsert(
      {
        user_id: user.id,
        medication_id: medicationId,
        date: localDateString(),
        scheduled_time: time,
        taken,
        taken_at: taken ? new Date().toISOString() : null,
      },
      { onConflict: 'medication_id,date,scheduled_time' },
    );
    await load();
  };

  return { medications, todayLogs, loading, today, addMedication, removeMedication, isTaken, setTaken, reload: load };
}
