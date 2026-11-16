'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import type { Medication } from '@/hooks/useMedications';
import { effectLabel, effectOptions, SEVERITY_LABELS } from '@/lib/pmos/sideEffects';
import { parseLocalDate, toLocalISO } from '@/lib/medications/schedule';
type Lang = 'es' | 'en';
interface DoseChange { id: string; medication_id: string; date: string; dose: string; weeks: number }
interface Row { id: string; medication_id: string; date: string; effect: string; severity: number }
const T = {
  es: { title: 'Efectos secundarios', log: 'Registrar molestia', save: 'Guardar', cancel: 'Cancelar', severity: 'Intensidad', history: 'Últimos registros', del: 'Eliminar',
    note: 'Es para llevar a tu consulta. No cambies la dosis por tu cuenta.', error: 'No se pudo guardar.',
    change: 'Registrar cambio de dosis', newDose: 'Nueva dosis', since: 'Desde', watch: 'Semanas a observar', changes: 'Cambios de dosis', changeNote: 'Anota la dosis que te indicó tu médico y cuántas semanas quieres vigilar los efectos.' },
  en: { title: 'Side effects', log: 'Log a side effect', save: 'Save', cancel: 'Cancel', severity: 'Severity', history: 'Recent entries', del: 'Delete',
    note: 'This is to bring to your appointment. Do not change the dose on your own.', error: 'Could not save.',
    change: 'Log a dose change', newDose: 'New dose', since: 'From', watch: 'Weeks to watch', changes: 'Dose changes', changeNote: 'Enter the dose your doctor prescribed and for how many weeks you want to watch for side effects.' },
};
/** Side-effect log per active medication. Hidden when the table does not exist yet. */
export const SideEffectsLog: React.FC<{ lang: Lang; medications: Medication[] }> = ({ lang, medications }) => {
  const t = T[lang];
  const [rows, setRows] = useState<Row[]>([]);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [effect, setEffect] = useState('');
  const [severity, setSeverity] = useState(1);
  const [error, setError] = useState(false);
  const [changes, setChanges] = useState<DoseChange[]>([]);
  const [changeFor, setChangeFor] = useState<string | null>(null);
  const [cf, setCf] = useState({ dose: '', date: toLocalISO(new Date()), weeks: '8' });
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error: err } = await supabase.from('medication_side_effects').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(100);
    setAvailable(!err);
    if (!err) setRows(((data as Row[]) ?? []).map((r) => ({ ...r, date: r.date.slice(0, 10) })));
    const ch = await supabase.from('medication_dose_changes').select('*').eq('user_id', session.user.id).order('date', { ascending: false });
    if (!ch.error) setChanges(((ch.data as DoseChange[]) ?? []).map((c) => ({ ...c, date: c.date.slice(0, 10) })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const active = medications.filter((m) => m.active !== false);
  if (!available || active.length === 0) return null;
  const save = async (med: Medication) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !effect) return;
    const { error: err } = await supabase.from('medication_side_effects').insert({
      user_id: session.user.id, medication_id: med.id, date: toLocalISO(new Date()), effect, severity,
    });
    setError(!!err);
    if (!err) { setOpen(null); setEffect(''); setSeverity(1); await load(); }
  };
  const saveChange = async (med: Medication) => {
    const { data: { session } } = await supabase.auth.getSession();
    const weeks = Math.round(Number(cf.weeks));
    if (!session?.user || !cf.dose.trim() || !cf.date || !(weeks >= 1 && weeks <= 26)) { setError(true); return; }
    const { error: err } = await supabase.from('medication_dose_changes').insert({
      user_id: session.user.id, medication_id: med.id, date: cf.date, dose: cf.dose.trim().slice(0, 100), weeks,
    });
    setError(!!err);
    if (!err) { setChangeFor(null); setCf({ dose: '', date: toLocalISO(new Date()), weeks: '8' }); await load(); }
  };
  const removeChange = async (id: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('medication_dose_changes').delete().eq('id', id);
  };
  const remove = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from('medication_side_effects').delete().eq('id', id);
  };
  return (
    <section className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3">
      <h3 className="text-foreground font-bold flex items-center gap-2"><Icon name="healing" size={18} className="text-primary" /> {t.title}</h3>
      <p className="text-xs text-muted-foreground">{t.note}</p>
      {active.map((med) => {
        const own = rows.filter((r) => r.medication_id === med.id).slice(0, 5);
        return (
          <div key={med.id} className="rounded-xl border border-border p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground text-sm">{med.name}</p>
              {open !== med.id && changeFor !== med.id && (
                <div className="flex gap-3">
                  <button onClick={() => { setOpen(med.id); setChangeFor(null); setEffect(''); setError(false); }} className="text-xs font-bold text-primary">{t.log}</button>
                  <button onClick={() => { setChangeFor(med.id); setOpen(null); setError(false); }} className="text-xs font-bold text-primary">{t.change}</button>
                </div>
              )}
            </div>
            {changeFor === med.id && (
              <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); saveChange(med); }}>
                <p className="text-xs text-muted-foreground">{t.changeNote}</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground col-span-3 sm:col-span-1">{t.newDose}
                    <input required maxLength={100} value={cf.dose} onChange={(e) => setCf({ ...cf, dose: e.target.value })} className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border min-w-0" /></label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">{t.since}
                    <input required type="date" value={cf.date} onChange={(e) => setCf({ ...cf, date: e.target.value })} className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border min-w-0" /></label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">{t.watch}
                    <input required type="number" min={1} max={26} value={cf.weeks} onChange={(e) => setCf({ ...cf, weeks: e.target.value })} className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border min-w-0" /></label>
                </div>
                {error && <p role="alert" className="text-xs text-destructive">{t.error}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-bold text-xs">{t.save}</button>
                  <button type="button" onClick={() => setChangeFor(null)} className="px-4 py-1.5 rounded-full font-bold text-xs border border-border text-foreground">{t.cancel}</button>
                </div>
              </form>
            )}
            {changes.some((c) => c.medication_id === med.id) && (
              <ul className="flex flex-col gap-1">
                <li className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.changes}</li>
                {changes.filter((c) => c.medication_id === med.id).slice(0, 4).map((c) => (
                  <li key={c.id} className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                    <span>{parseLocalDate(c.date).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · {c.dose} · {c.weeks} {lang === 'es' ? 'sem.' : 'wk'}</span>
                    <button onClick={() => removeChange(c.id)} aria-label={t.del} className="p-0.5 hover:text-destructive"><Icon name="close" size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
            {open === med.id && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {effectOptions(med.name).map((k) => (
                    <button key={k} onClick={() => setEffect(k)} aria-pressed={effect === k}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${effect === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}>
                      {effectLabel(k, lang)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-muted-foreground">{t.severity}</span>
                  {([1, 2, 3] as const).map((s) => (
                    <button key={s} onClick={() => setSeverity(s)} aria-pressed={severity === s}
                      className={`px-3 py-1 rounded-full font-semibold border ${severity === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground'}`}>{SEVERITY_LABELS[s][lang]}</button>
                  ))}
                </div>
                {error && <p role="alert" className="text-xs text-destructive">{t.error}</p>}
                <div className="flex gap-2">
                  <button disabled={!effect} onClick={() => save(med)} className="bg-primary disabled:opacity-50 text-primary-foreground px-4 py-1.5 rounded-full font-bold text-xs">{t.save}</button>
                  <button onClick={() => setOpen(null)} className="px-4 py-1.5 rounded-full font-bold text-xs border border-border text-foreground">{t.cancel}</button>
                </div>
              </div>
            )}
            {own.length > 0 && (
              <ul className="flex flex-col gap-1">
                {own.map((r) => (
                  <li key={r.id} className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                    <span>{parseLocalDate(r.date).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short' })} · {effectLabel(r.effect, lang)} · {SEVERITY_LABELS[r.severity as 1 | 2 | 3]?.[lang]}</span>
                    <button onClick={() => remove(r.id)} aria-label={t.del} className="p-0.5 hover:text-destructive"><Icon name="close" size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
};
export default SideEffectsLog;
