'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LineChart } from '@/components/ui/LineChart';
import { supabase } from '@/lib/supabase';
import { toLocalISO, parseLocalDate } from '@/lib/medications/schedule';
import { FG_AREAS, FG_THRESHOLD, fgTotal, isCheckDue, type FGArea } from '@/lib/pmos/wellbeing';

type Lang = 'es' | 'en';
interface Row { id: string; date: string; scores: Partial<Record<FGArea, number>>; total: number }

const LEVELS = {
  es: ['0 · Nada', '1 · Mínimo', '2 · Leve', '3 · Moderado', '4 · Abundante'],
  en: ['0 · None', '1 · Minimal', '2 · Mild', '3 · Moderate', '4 · Extensive'],
};

const T = {
  es: {
    title: 'Vello corporal (escala Ferriman-Gallwey)', sub: 'Una autoevaluación al mes para ver si el tratamiento está funcionando. Evalúa el vello grueso y oscuro antes de depilarte, o como estaría sin depilar.',
    total: 'Total', save: 'Guardar evaluación', saving: 'Guardando…', last: 'Última evaluación', again: 'Nueva evaluación', cancel: 'Cancelar',
    above: `Un total de ${FG_THRESHOLD} o más suele considerarse hirsutismo (el punto de corte varía según el origen étnico). Los tratamientos tardan unos 6 meses en notarse.`,
    below: 'Lo importante es la tendencia: compara mes a mes.', error: 'No se pudo guardar. Falta aplicar la migración de la base de datos.',
  },
  en: {
    title: 'Body hair (Ferriman-Gallwey scale)', sub: 'A monthly self-assessment to see whether treatment is working. Score coarse dark hair before removal, or as it would be without it.',
    total: 'Total', save: 'Save assessment', saving: 'Saving…', last: 'Last assessment', again: 'New assessment', cancel: 'Cancel',
    above: `A total of ${FG_THRESHOLD} or more is usually considered hirsutism (the cut-off varies by ethnicity). Treatments take about 6 months to show.`,
    below: 'What matters is the trend: compare month to month.', error: 'Could not save. The database migration has not been applied yet.',
  },
};

export const HirsutismTracker: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const today = toLocalISO(new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [scores, setScores] = useState<Partial<Record<FGArea, number>>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error: err } = await supabase.from('hirsutism_scores').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    if (!err) setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const last = rows[rows.length - 1] ?? null;
  const showForm = editing || isCheckDue(last?.date ?? null, today);
  const total = fgTotal(scores);
  const fmt = (iso: string) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const start = () => { setScores(last?.scores ?? {}); setEditing(true); };

  const save = async () => {
    setSaving(true); setError(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const { error: err } = await supabase.from('hirsutism_scores').insert({ user_id: session.user.id, date: today, scores, total });
    setSaving(false);
    if (err) { setError(true); return; }
    setEditing(false);
    await load();
  };

  return (
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon name="spa" size={20} />
        </div>
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">{t.title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t.sub}</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t.last}<br /><span className="text-foreground font-medium">{fmt(last!.date)}</span></p>
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums leading-none">{last!.total}<span className="text-base font-normal text-muted-foreground">/36</span></p>
          </div>
          {rows.length > 1 && <LineChart points={rows.map((r) => ({ date: r.date, value: r.total }))} unit="" refHigh={FG_THRESHOLD} />}
          <p className={`text-sm text-pretty rounded-xl p-3 ${last!.total >= FG_THRESHOLD ? 'bg-sun/10 text-foreground' : 'bg-leaf/10 text-foreground'}`}>{last!.total >= FG_THRESHOLD ? t.above : t.below}</p>
        </div>
      )}

      {showForm ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col divide-y divide-border/60">
          {FG_AREAS.map((a) => (
            <label key={a.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 py-3">
              <span className="text-sm text-foreground">{a[lang]}</span>
              <select value={scores[a.key] ?? 0} onChange={(e) => setScores({ ...scores, [a.key]: Number(e.target.value) })}
                className="bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border w-full sm:w-48">
                {LEVELS[lang].map((l, v) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          ))}
          </div>
          <p className="text-sm font-semibold text-foreground tabular-nums py-3 border-t border-border">{t.total}: {total}/36</p>
          {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
            {last && <button onClick={() => setEditing(false)} className="min-h-11 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground">{t.cancel}</button>}
          </div>
        </div>
      ) : (
        <button onClick={start} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-primary hover:underline">{t.again}</button>
      )}
    </section>
  );
};

export default HirsutismTracker;
