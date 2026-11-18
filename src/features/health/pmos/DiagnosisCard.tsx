'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import {
  exclusionChecks, logEvidence, phenotype, PHENOTYPE_INFO,
  type DiagnosisCriteria, type EvidenceKey, type ExclusionKey,
} from '@/lib/pmos/diagnosis';
import { FG_THRESHOLD } from '@/lib/pmos/wellbeing';
import { cycleHealthFlags } from '@/lib/cycle/cycleAnalysis';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { parseLocalDate, toLocalISO } from '@/lib/medications/schedule';
type Lang = 'es' | 'en';
type Kind = 'ultrasound' | 'procedure' | 'other';
interface HealthEvent { id: string; date: string; kind: Kind; summary: string }
interface Diagnosis extends DiagnosisCriteria { diagnosed_on: string | null; notes: string | null }
const EMPTY: Diagnosis = { diagnosed_on: null, irregular_cycles: false, clinical_hyperandrogenism: false, biochemical_hyperandrogenism: false, polycystic_ovaries: false, notes: null };
const CRITERIA: { key: keyof DiagnosisCriteria; es: string; en: string }[] = [
  { key: 'irregular_cycles', es: 'Ciclos irregulares o sin ovulación', en: 'Irregular cycles or no ovulation' },
  { key: 'clinical_hyperandrogenism', es: 'Exceso de andrógenos en el cuerpo (vello, acné)', en: 'Androgen excess signs (hair growth, acne)' },
  { key: 'biochemical_hyperandrogenism', es: 'Andrógenos altos en análisis', en: 'High androgens on labs' },
  { key: 'polycystic_ovaries', es: 'Ovarios poliquísticos en la ecografía (o AMH alta, en adultas)', en: 'Polycystic ovaries on ultrasound (or high AMH, in adults)' },
];
const EVIDENCE: Record<EvidenceKey, { es: string; en: string }> = {
  cycle_pattern: { es: 'tus ciclos registrados son largos, cortos o escasos', en: 'your logged cycles are long, short or infrequent' },
  testosterone: { es: 'tu testosterona total más reciente está alta', en: 'your latest total testosterone is high' },
  fai: { es: 'tu índice de andrógenos libres calculado es alto', en: 'your calculated free androgen index is high' },
  ferriman_gallwey: { es: `tu puntaje de Ferriman-Gallwey es ${FG_THRESHOLD} o más`, en: `your Ferriman-Gallwey score is ${FG_THRESHOLD} or more` },
  amh: { es: 'tu AMH más reciente está alta (solo cuenta en adultas, 8 años o más después de tu primera regla)', en: 'your latest AMH is high (only counts in adults, 8 or more years after your first period)' },
};
const EXCLUSION: Record<ExclusionKey, { es: string; en: string }> = {
  tsh: { es: 'TSH (tiroides)', en: 'TSH (thyroid)' },
  prolactin: { es: 'Prolactina', en: 'Prolactin' },
  ohp17: { es: '17-OH progesterona (hiperplasia suprarrenal)', en: '17-OH progesterone (adrenal hyperplasia)' },
};
const KINDS: Record<Kind, { es: string; en: string }> = {
  ultrasound: { es: 'Ecografía', en: 'Ultrasound' }, procedure: { es: 'Procedimiento', en: 'Procedure' }, other: { es: 'Otro', en: 'Other' },
};
const T = {
  es: {
    title: 'Mi diagnóstico', sub: 'Marca lo que te dijo tu médica. La app solo nombra el fenotipo según lo marcado; no diagnostica.',
    diagnosedOn: 'Fecha del diagnóstico', notes: 'Notas', save: 'Guardar', saved: 'Guardado',
    pheno: (p: string) => `Fenotipo ${p}`, noPheno: 'Con al menos dos criterios marcados verás el fenotipo.',
    events: 'Ecografías y eventos', evPh: 'Resumen (por ejemplo, “ovarios con 14 folículos”)', add: 'Agregar', none: 'Aún no hay eventos.',
    error: 'No se pudo guardar.',
    evidence: 'Lo que muestra tu registro', evidenceNote: 'Solo describe tus datos. Si algo no coincide con lo que marcaste, coméntalo con tu médica.',
    exclusions: 'Otras causas que se descartan', exclusionsNote: 'Para el diagnóstico también se revisan otras causas con síntomas parecidos.',
    exMissing: 'Sin registro', exOk: 'En rango', exAbnormal: 'Fuera de rango: coméntalo',
  },
  en: {
    title: 'My diagnosis', sub: 'Tick what your doctor told you. The app only names the phenotype from what is ticked; it does not diagnose.',
    diagnosedOn: 'Diagnosis date', notes: 'Notes', save: 'Save', saved: 'Saved',
    pheno: (p: string) => `Phenotype ${p}`, noPheno: 'With at least two criteria ticked you will see the phenotype.',
    events: 'Ultrasounds and events', evPh: 'Summary (for example, “ovaries with 14 follicles”)', add: 'Add', none: 'No events yet.',
    error: 'Could not save.',
    evidence: 'What your log shows', evidenceNote: 'This only describes your data. If it does not match what you ticked, mention it to your doctor.',
    exclusions: 'Other causes that are ruled out', exclusionsNote: 'Diagnosis also checks other causes with similar symptoms.',
    exMissing: 'Not logged', exOk: 'In range', exAbnormal: 'Out of range: mention it',
  },
};
/** Diagnosis card with ultrasounds and other events. Hidden when the tables do not exist yet. */
export const DiagnosisCard: React.FC<{ lang: Lang; data?: PMOSOverviewData | null }> = ({ lang, data }) => {
  const t = T[lang];
  const evidence = useMemo(() => data ? logEvidence({
    cycleFlags: data.gapsExpected ? [] : cycleHealthFlags(data.periodRuns, parseLocalDate(data.today), data.signs, data.pregnancies),
    labs: data.labs, hirsutism: data.hirsutism,
  }) : {}, [data]);
  const exclusions = useMemo(() => data ? exclusionChecks(data.labs) : [], [data]);
  const [available, setAvailable] = useState(false);
  const [dx, setDx] = useState<Diagnosis>(EMPTY);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [ev, setEv] = useState<{ date: string; kind: Kind; summary: string }>({ date: toLocalISO(new Date()), kind: 'ultrasound', summary: '' });
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const uid = session.user.id;
    const [d, e] = await Promise.all([
      supabase.from('pmos_diagnosis').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('health_events').select('*').eq('user_id', uid).order('date', { ascending: false }),
    ]);
    if (d.error || e.error) return;
    setAvailable(true);
    if (d.data) setDx({ ...EMPTY, ...(d.data as Diagnosis), diagnosed_on: (d.data as Diagnosis).diagnosed_on?.slice(0, 10) ?? null });
    setEvents(((e.data as HealthEvent[]) ?? []).map((x) => ({ ...x, date: x.date.slice(0, 10) })));
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!available) return null;
  const p = phenotype(dx);
  const saveDx = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from('pmos_diagnosis').upsert({
      user_id: session.user.id, diagnosed_on: dx.diagnosed_on || null, irregular_cycles: dx.irregular_cycles,
      clinical_hyperandrogenism: dx.clinical_hyperandrogenism, biochemical_hyperandrogenism: dx.biochemical_hyperandrogenism,
      polycystic_ovaries: dx.polycystic_ovaries, notes: dx.notes?.trim().slice(0, 2000) || null, updated_at: new Date().toISOString(),
    });
    setStatus(error ? 'error' : 'saved');
  };
  const addEvent = async () => {
    const summary = ev.summary.trim();
    if (!summary || !ev.date) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from('health_events').insert({ user_id: session.user.id, date: ev.date, kind: ev.kind, summary: summary.slice(0, 500) });
    if (!error) { setEv({ ...ev, summary: '' }); await load(); } else setStatus('error');
  };
  const removeEvent = async (id: string) => {
    setEvents((prev) => prev.filter((x) => x.id !== id));
    await supabase.from('health_events').delete().eq('id', id);
  };
  const fmt = (iso: string) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Icon name="clinical_notes" size={20} /></div>
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">{t.title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t.sub}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {CRITERIA.map((c) => (
          <label key={c.key} className="flex items-center gap-3 min-h-11 px-3 rounded-xl border border-border text-sm text-foreground cursor-pointer has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
            <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={dx[c.key]} onChange={(e) => { setDx({ ...dx, [c.key]: e.target.checked }); setStatus('idle'); }} /> {c[lang]}
          </label>
        ))}
      </div>
      <p className="text-sm rounded-xl bg-secondary/40 p-3 text-foreground">
        {p ? <><span className="font-semibold">{t.pheno(p)}</span>: {PHENOTYPE_INFO[p][lang]}</> : <span className="text-muted-foreground">{t.noPheno}</span>}
      </p>
      {Object.keys(evidence).length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold text-foreground">{t.evidence}</p>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {CRITERIA.filter((c) => evidence[c.key]?.length).map((c) => (
              <li key={c.key} className="flex items-start gap-2">
                <Icon name={dx[c.key] ? 'check_circle' : 'info'} size={16} className={`mt-0.5 shrink-0 ${dx[c.key] ? 'text-leaf' : 'text-primary'}`} />
                <span><span className="font-semibold">{c[lang]}</span>: {evidence[c.key]!.map((e) => EVIDENCE[e][lang]).join('; ')}.</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t.evidenceNote}</p>
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold text-foreground">{t.exclusions}</p>
          <p className="text-sm text-muted-foreground">{t.exclusionsNote}</p>
          <ul className="flex flex-col divide-y divide-border/60">
            {exclusions.map((x) => (
              <li key={x.key} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="text-foreground">{EXCLUSION[x.key][lang]}</span>
                <span className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${x.status === 'abnormal' ? 'bg-sun/15 text-sun-ink' : x.status === 'ok' ? 'bg-leaf/15 text-leaf' : 'bg-secondary text-muted-foreground'}`}>
                  {x.status === 'abnormal' ? t.exAbnormal : x.status === 'ok' ? t.exOk : t.exMissing}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.diagnosedOn}
          <input type="date" value={dx.diagnosed_on ?? ''} onChange={(e) => { setDx({ ...dx, diagnosed_on: e.target.value || null }); setStatus('idle'); }}
            className="bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground flex-1 min-w-48">{t.notes}
          <input value={dx.notes ?? ''} maxLength={2000} onChange={(e) => { setDx({ ...dx, notes: e.target.value }); setStatus('idle'); }}
            className="bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border" />
        </label>
        <button onClick={saveDx} className="bg-primary text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.save}</button>
      </div>
      {status === 'saved' && <p role="status" className="text-sm text-leaf">{t.saved}</p>}
      {status === 'error' && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-semibold text-muted-foreground">{t.events}</p>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); addEvent(); }}>
          <input type="date" value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} aria-label="date" className="bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border" />
          <select value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value as Kind })} aria-label="type" className="bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border">
            {(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KINDS[k][lang]}</option>)}
          </select>
          <input value={ev.summary} maxLength={500} onChange={(e) => setEv({ ...ev, summary: e.target.value })} placeholder={t.evPh} aria-label={t.evPh}
            className="flex-1 min-w-48 bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border" />
          <button type="submit" className="bg-primary text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.add}</button>
        </form>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">{t.none}</p> : (
          <ul className="flex flex-col gap-1.5">
            {events.map((x) => (
              <li key={x.id} className="text-sm flex items-start justify-between gap-2">
                <span><span className="font-semibold">{fmt(x.date)} · {KINDS[x.kind][lang]}</span>: {x.summary}</span>
                <button onClick={() => removeEvent(x.id)} aria-label="delete" className="size-10 -my-2 -mr-2 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary shrink-0"><Icon name="close" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
export default DiagnosisCard;
