'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/lib/pmos/appointments';
export type AppointmentInput = Partial<Omit<Appointment, 'id'>> & { date: string };
const clean = (v: string | null | undefined, max: number) => (v?.trim() ? v.trim().slice(0, max) : null);
/**
 * Appointments of the signed-in user. If the migration is not applied the query fails,
 * `available` stays false and the callers hide their cards.
 */
export function useAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error } = await supabase.from('appointments').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    setAvailable(!error);
    if (!error) setItems(((data as Appointment[]) ?? []).map((a) => ({ ...a, date: a.date.slice(0, 10), time: a.time ? a.time.slice(0, 5) : null })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = useCallback(async (input: AppointmentInput, id?: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const row = {
      date: input.date,
      time: input.time || null,
      specialty: clean(input.specialty, 100),
      doctor: clean(input.doctor, 150),
      place: clean(input.place, 200),
      notes: clean(input.notes, 2000),
      summary: clean(input.summary, 2000),
    };
    const { error } = id
      ? await supabase.from('appointments').update(row).eq('id', id)
      : await supabase.from('appointments').insert({ ...row, user_id: session.user.id });
    if (!error) await load();
    return !error;
  }, [load]);
  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('appointments').delete().eq('id', id);
  }, []);
  return { items, available, loading, save, remove, reload: load };
}
