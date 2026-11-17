'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { dosesOn, findLog, toLocalISO } from '@/lib/medications/schedule';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  times: string[];
  /** Free-text indication from the doctor. */
  notes: string | null;
  reminders: boolean;
  active: boolean;
  /** 0 = Sunday … 6 = Saturday; null = every day. */
  days_of_week?: number[] | null;
  /** Intake time ('HH:MM') → instruction key (see INSTRUCTIONS). */
  time_instructions?: Record<string, string> | null;
  start_date?: string | null;
  created_at?: string | null;
  pack_active_days?: number | null;
  pack_break_days?: number | null;
  pack_start_date?: string | null;
  /** Units (pills, capsules…) left; null = not tracked. */
  stock?: number | null;
  units_per_dose?: number | null;
  refill_alert_days?: number | null;
  /** Ovulation induction (e.g. letrozole): taken on `induction_cycle_days` of each cycle. */
  is_ovulation_induction?: boolean | null;
  induction_cycle_days?: number[] | null;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  date: string;
  scheduled_time: string;
  taken: boolean;
  taken_at: string | null;
}

export interface MedicationInput {
  name: string;
  dose: string;
  times: string[];
  reminders: boolean;
  notes: string;
  days_of_week: number[] | null;
  time_instructions: Record<string, string>;
  start_date: string | null;
  pack: { active: number; break: number; start: string } | null;
  stock: number | null;
  units_per_dose: number;
  refill_alert_days: number;
  /** Cycle days (first..last) on which an ovulation-induction drug is taken; null when it is not one. */
  induction?: { from: number; to: number } | null;
}

export function localDateString(d = new Date()): string {
  return toLocalISO(d);
}

function monthBounds(year: number, month: number) {
  return { from: toLocalISO(new Date(year, month, 1)), to: toLocalISO(new Date(year, month + 1, 0)) };
}

/** Rows for the columns added in 20261116000000; dropped if that migration is not applied yet. */
function toRow(input: MedicationInput) {
  const times = [...new Set(input.times)].sort();
  const instructions = Object.fromEntries(
    Object.entries(input.time_instructions).filter(([t, v]) => times.includes(t) && v),
  );
  const days = input.days_of_week && input.days_of_week.length > 0 && input.days_of_week.length < 7
    ? [...input.days_of_week].sort()
    : null;
  return {
    base: { name: input.name, dose: input.dose || null, times, reminders: input.reminders, notes: input.notes || null },
    extra: { days_of_week: input.pack ? null : days, time_instructions: instructions, start_date: input.start_date || null },
    // Columns from 20261116010000_pmos_care_expansion.
    extra2: {
      pack_active_days: input.pack?.active ?? null,
      pack_break_days: input.pack ? input.pack.break : null,
      pack_start_date: input.pack?.start ?? null,
      stock: input.stock,
      units_per_dose: input.units_per_dose,
      refill_alert_days: input.refill_alert_days,
    },
    // Columns from the pregnancy migration.
    extra3: {
      is_ovulation_induction: !!input.induction,
      induction_cycle_days: input.induction
        ? Array.from({ length: input.induction.to - input.induction.from + 1 }, (_, i) => input.induction!.from + i)
        : null,
    },
  };
}

const isMissingColumn = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST204' || e.code === '42703' || /column/i.test(e.message ?? ''));

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = localDateString();
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const viewRef = useRef(view);
  viewRef.current = view;

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    const { year, month } = viewRef.current;
    const { from, to } = monthBounds(year, month);
    const t = localDateString();
    // Always include the last 62 days so today's status and the streak are available.
    const back = new Date(); back.setDate(back.getDate() - 62);
    const rangeFrom = [from, localDateString(back)].sort()[0];
    const rangeTo = [to, t].sort()[1];
    try {
      const [medsRes, logsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true).order('created_at'),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).gte('date', rangeFrom).lte('date', rangeTo),
      ]);
      if (!medsRes.error) setMedications((medsRes.data as Medication[]) ?? []);
      if (!logsRes.error) setLogs((logsRes.data as MedicationLog[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, view]);

  const showMonth = useCallback((year: number, month: number) => {
    const d = new Date(year, month, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }, []);

  const saveMedication = async (input: MedicationInput, id?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const { base, extra, extra2, extra3 } = toRow(input);
    const write = (row: object) => id
      ? supabase.from('medications').update(row).eq('id', id)
      : supabase.from('medications').insert({ user_id: user.id, ...row });
    // Fall back step by step when the newer migrations have not been applied yet.
    let { error } = await write({ ...base, ...extra, ...extra2, ...extra3 });
    if (isMissingColumn(error)) ({ error } = await write({ ...base, ...extra, ...extra2 }));
    if (isMissingColumn(error)) ({ error } = await write({ ...base, ...extra }));
    if (isMissingColumn(error)) {
      console.warn('medications: schedule columns missing, saving basic fields only. Apply the latest migrations.');
      await write(base);
    }
    await load();
  };

  /** Adds units after a refill. */
  const refill = async (id: string, units: number) => {
    const med = medications.find((m) => m.id === id);
    if (!med || units <= 0) return;
    await supabase.from('medications').update({ stock: Number(med.stock ?? 0) + units }).eq('id', id);
    await load();
  };

  const addMedication = (name: string, dose: string, times: string[], reminders: boolean) =>
    saveMedication({
      name, dose, times, reminders, notes: '', days_of_week: null, time_instructions: {}, start_date: null,
      pack: null, stock: null, units_per_dose: 1, refill_alert_days: 7,
    });

  const removeMedication = async (id: string) => {
    await supabase.from('medications').update({ active: false }).eq('id', id);
    await load();
  };

  const isTaken = useCallback(
    (medicationId: string, time: string, date: string = today) => !!findLog(logs, medicationId, date, time)?.taken,
    [logs, today],
  );

  const takenAt = (medicationId: string, time: string, date: string = today) =>
    findLog(logs, medicationId, date, time)?.taken_at ?? null;

  const setTaken = async (medicationId: string, time: string, taken: boolean, date: string = today) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    // Optimistic update so the button responds instantly.
    const takenAtValue = taken ? new Date().toISOString() : null;
    setLogs((prev) => {
      const rest = prev.filter((l) => !(l.medication_id === medicationId && l.date === date && l.scheduled_time === time));
      return [...rest, { id: 'local', medication_id: medicationId, date, scheduled_time: time, taken, taken_at: takenAtValue }];
    });
    const previouslyTaken = !!findLog(logs, medicationId, date, time)?.taken;
    const med = medications.find((m) => m.id === medicationId);
    // Keep the pill count in step with what is marked as taken.
    if (med && med.stock != null && previouslyTaken !== taken) {
      const delta = (med.units_per_dose ?? 1) * (taken ? -1 : 1);
      const stock = Math.max(0, Number(med.stock) + delta);
      setMedications((prev) => prev.map((m) => (m.id === medicationId ? { ...m, stock } : m)));
      await supabase.from('medications').update({ stock }).eq('id', medicationId);
    }
    await supabase.from('medication_logs').upsert(
      { user_id: user.id, medication_id: medicationId, date, scheduled_time: time, taken, taken_at: takenAtValue },
      { onConflict: 'medication_id,date,scheduled_time' },
    );
    await load();
  };

  const todayDoses = dosesOn(medications, today);
  const todayLogs = logs.filter((l) => l.date === today);

  return {
    medications, logs, todayLogs, todayDoses, loading, today, view, showMonth,
    addMedication, saveMedication, removeMedication, refill, isTaken, takenAt, setTaken, reload: load,
  };
}
