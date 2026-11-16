'use client';
import React, { useMemo, useState } from 'react';
import { usePMOSMetrics } from '@/hooks/usePMOSMetrics';
import { LineChart, type LinePoint } from '@/components/ui/LineChart';
import {
  bloodPressureCategory, homaIr, waistHipRatio, WHR_RISK_THRESHOLD, type GlucoseContext, type PMOSMetricEntry,
} from '@/lib/pmos/metrics';
import { INPUT_CLASS, parseNum, todayLocal } from './shared';

type Lang = 'es' | 'en';

const T = {
  es: {
    title: 'Glucosa, presión y medidas', date: 'Fecha', glucose: 'Glucosa (mg/dL)', taken: 'Momento de la glucosa',
    ctx: { fasting: 'En ayunas', post_meal: 'Después de comer', random: 'Otro momento' } as Record<GlucoseContext, string>,
    insulin: 'Insulina en ayunas (µIU/mL)', sys: 'Presión sistólica', dia: 'Presión diastólica', weight: 'Peso (kg)', waist: 'Cintura (cm)', hip: 'Cadera (cm)',
    save: 'Guardar', saving: 'Guardando…', errNone: 'Escribe al menos un valor.', errBp: 'Escribe las dos cifras de la presión (ej.: 118 / 76).',
    loading: 'Cargando…', latest: 'Último', noData: 'Sin datos todavía',
    cFasting: 'Glucosa en ayunas', cInsulin: 'Insulina en ayunas', cHoma: 'HOMA-IR (calculado)', cBp: 'Presión arterial (sistólica)', cWaist: 'Cintura', cWhr: 'Índice cintura-cadera', cWeight: 'Peso',
    homaNote: 'Necesita glucosa e insulina en ayunas del mismo día. Más de 2.5 sugiere resistencia a la insulina.',
    whrNote: (hi: boolean) => hi ? `Por encima de ${WHR_RISK_THRESHOLD}, el umbral de la OMS de mayor riesgo metabólico en mujeres.` : `Umbral de la OMS de mayor riesgo metabólico en mujeres: más de ${WHR_RISK_THRESHOLD}.`,
    bpCat: { normal: 'Normal', elevated: 'Elevada', stage1: 'Alta (etapa 1)', stage2: 'Alta (etapa 2)' },
    bpNote: 'Con PMOS se recomienda medir la presión al menos una vez al año. Si sale alta en varias mediciones, coméntalo con tu médico.',
    weightNote: 'El peso es solo un dato más: tu energía, tu ciclo y tu glucosa dicen mucho más de cómo responde tu cuerpo.',
    entries: 'Registros', del: 'Eliminar',
  },
  en: {
    title: 'Glucose, blood pressure and measurements', date: 'Date', glucose: 'Glucose (mg/dL)', taken: 'Glucose taken',
    ctx: { fasting: 'Fasting', post_meal: 'After a meal', random: 'Random' } as Record<GlucoseContext, string>,
    insulin: 'Fasting insulin (µIU/mL)', sys: 'Systolic BP', dia: 'Diastolic BP', weight: 'Weight (kg)', waist: 'Waist (cm)', hip: 'Hip (cm)',
    save: 'Save', saving: 'Saving…', errNone: 'Enter at least one value.', errBp: 'Enter both blood pressure numbers (e.g. 118 / 76).',
    loading: 'Loading…', latest: 'Latest', noData: 'No data yet',
    cFasting: 'Fasting glucose', cInsulin: 'Fasting insulin', cHoma: 'HOMA-IR (calculated)', cBp: 'Blood pressure (systolic)', cWaist: 'Waist', cWhr: 'Waist-to-hip ratio', cWeight: 'Weight',
    homaNote: 'Needs fasting glucose and insulin logged on the same day. Above about 2.5 suggests insulin resistance.',
    whrNote: (hi: boolean) => hi ? `Above ${WHR_RISK_THRESHOLD}, the WHO threshold for higher metabolic risk in women.` : `WHO threshold for higher metabolic risk in women: above ${WHR_RISK_THRESHOLD}.`,
    bpCat: { normal: 'Normal', elevated: 'Elevated', stage1: 'High (stage 1)', stage2: 'High (stage 2)' },
    bpNote: 'With PMOS, checking blood pressure at least once a year is recommended. If several readings are high, talk to your doctor.',
    weightNote: 'Weight is just one data point: your energy, cycle and glucose say much more about how your body is responding.',
    entries: 'Entries', del: 'Delete',
  },
};

function series(entries: PMOSMetricEntry[], pick: (e: PMOSMetricEntry) => number | null | undefined): LinePoint[] {
  return entries.flatMap((e) => {
    const value = pick(e);
    return value == null ? [] : [{ date: e.date, value: Number(value) }];
  });
}

const ChartCard: React.FC<{ title: string; unit: string; points: LinePoint[]; note?: string; latestLabel: string; empty: string; badge?: string; refHigh?: number }> = ({ title, unit, points, note, latestLabel, empty, badge, refHigh }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-baseline gap-2">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {points.length > 0 && (
        <span className="text-xs text-muted-foreground text-right">
          {badge ?? `${latestLabel}: ${Number(points[points.length - 1].value.toFixed(2))} ${unit}`}
        </span>
      )}
    </div>
    {points.length === 0 ? (
      <p className="text-xs text-muted-foreground py-4">{empty}</p>
    ) : (
      <LineChart points={points} unit={unit} refHigh={refHigh} />
    )}
    {note && <p className="text-xs text-muted-foreground">{note}</p>}
  </div>
);

const BodyMetricsSection: React.FC<{ lang?: Lang }> = ({ lang = 'en' }) => {
  const t = T[lang];
  const { entries, loading, saving, error, add, remove } = usePMOSMetrics();
  const [date, setDate] = useState(todayLocal());
  const [glucose, setGlucose] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [insulin, setInsulin] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const glucoseSeries = useMemo(() => series(entries.filter((e) => e.glucose_context === 'fasting'), (e) => e.glucose_mg_dl), [entries]);
  const insulinSeries = useMemo(() => series(entries, (e) => e.insulin_uiu_ml), [entries]);
  const bpEntries = useMemo(() => entries.filter((e) => e.systolic != null && e.diastolic != null), [entries]);
  const bpSeries = useMemo(() => series(bpEntries, (e) => e.systolic), [bpEntries]);
  const weightSeries = useMemo(() => series(entries, (e) => e.weight_kg), [entries]);
  const waistSeries = useMemo(() => series(entries, (e) => e.waist_cm), [entries]);
  const whrSeries = useMemo(() => series(entries, (e) => waistHipRatio(e.waist_cm, e.hip_cm)), [entries]);

  // HOMA-IR is only meaningful when fasting glucose and insulin come from the same day.
  const homaSeries = useMemo(() => {
    const byDate = new Map<string, { g?: number; i?: number }>();
    for (const e of entries) {
      const cur = byDate.get(e.date) ?? {};
      if (e.glucose_context === 'fasting' && e.glucose_mg_dl != null) cur.g = Number(e.glucose_mg_dl);
      if (e.insulin_uiu_ml != null) cur.i = Number(e.insulin_uiu_ml);
      byDate.set(e.date, cur);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([d, v]) => {
        const h = homaIr(v.g, v.i);
        return h == null ? [] : [{ date: d, value: h }];
      });
  }, [entries]);

  const latestWhr = whrSeries.length ? whrSeries[whrSeries.length - 1].value : null;
  const latestBp = bpEntries.length ? bpEntries[bpEntries.length - 1] : null;
  const bpBadge = latestBp
    ? `${latestBp.systolic}/${latestBp.diastolic} · ${t.bpCat[bloodPressureCategory(Number(latestBp.systolic), Number(latestBp.diastolic))]}`
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseNum(glucose);
    const i = parseNum(insulin);
    const s = parseNum(sys);
    const d = parseNum(dia);
    const w = parseNum(weight);
    const wa = parseNum(waist);
    const h = parseNum(hip);
    if ((s == null) !== (d == null)) { setFormError(t.errBp); return; }
    if (g == null && i == null && s == null && w == null && wa == null && h == null) { setFormError(t.errNone); return; }
    setFormError(null);
    const ok = await add({
      date,
      glucose_mg_dl: g,
      glucose_context: g != null ? context : null,
      insulin_uiu_ml: i,
      weight_kg: w,
      waist_cm: wa,
      hip_cm: h,
      ...(s != null && d != null ? { systolic: Math.round(s), diastolic: Math.round(d) } : {}),
    });
    if (ok) { setGlucose(''); setInsulin(''); setSys(''); setDia(''); setWeight(''); setWaist(''); setHip(''); }
  };

  const field = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input inputMode="decimal" value={value} onChange={(ev) => set(ev.target.value)} className={INPUT_CLASS} />
    </label>
  );

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border bg-secondary/20">
        <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">glucose</span>
          {t.title}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t.date}
          <input type="date" value={date} max={todayLocal()} onChange={(ev) => setDate(ev.target.value)} className={INPUT_CLASS} required />
        </label>
        {field(t.glucose, glucose, setGlucose)}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t.taken}
          <select value={context} onChange={(ev) => setContext(ev.target.value as GlucoseContext)} className={INPUT_CLASS}>
            {(Object.keys(t.ctx) as GlucoseContext[]).map((k) => <option key={k} value={k}>{t.ctx[k]}</option>)}
          </select>
        </label>
        {field(t.insulin, insulin, setInsulin)}
        {field(t.sys, sys, setSys)}
        {field(t.dia, dia, setDia)}
        {field(t.waist, waist, setWaist)}
        {field(t.hip, hip, setHip)}
        {field(t.weight, weight, setWeight)}
        <div className="flex items-end col-span-1 md:col-start-4">
          <button type="submit" disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg disabled:opacity-60">
            {saving ? t.saving : t.save}
          </button>
        </div>
        {(formError || error) && <p className="col-span-full text-sm text-destructive">{formError ?? error}</p>}
      </form>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t.loading}</p>
        ) : (
          <>
            <ChartCard title={t.cFasting} unit="mg/dL" points={glucoseSeries} latestLabel={t.latest} empty={t.noData} refHigh={99} />
            <ChartCard title={t.cInsulin} unit="µIU/mL" points={insulinSeries} latestLabel={t.latest} empty={t.noData} />
            <ChartCard title={t.cHoma} unit="" points={homaSeries} note={t.homaNote} latestLabel={t.latest} empty={t.noData} refHigh={2.5} />
            <ChartCard title={t.cBp} unit="mmHg" points={bpSeries} note={t.bpNote} latestLabel={t.latest} empty={t.noData} badge={bpBadge} refHigh={130} />
            <ChartCard title={t.cWaist} unit="cm" points={waistSeries} latestLabel={t.latest} empty={t.noData} />
            <ChartCard title={t.cWhr} unit="" points={whrSeries} note={t.whrNote(latestWhr != null && latestWhr > WHR_RISK_THRESHOLD)} latestLabel={t.latest} empty={t.noData} />
            <ChartCard title={t.cWeight} unit="kg" points={weightSeries} note={t.weightNote} latestLabel={t.latest} empty={t.noData} />
          </>
        )}
      </div>

      {entries.length > 0 && (
        <details className="border-t border-border px-6 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">{t.entries} ({entries.length})</summary>
          <ul className="mt-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{e.date}</strong>
                  {e.glucose_mg_dl != null && ` · ${lang === 'es' ? 'glucosa' : 'glucose'} ${e.glucose_mg_dl} (${t.ctx[e.glucose_context!]})`}
                  {e.insulin_uiu_ml != null && ` · ${lang === 'es' ? 'insulina' : 'insulin'} ${e.insulin_uiu_ml}`}
                  {e.systolic != null && ` · ${e.systolic}/${e.diastolic} mmHg`}
                  {e.waist_cm != null && ` · ${lang === 'es' ? 'cintura' : 'waist'} ${e.waist_cm}`}
                  {e.hip_cm != null && ` · ${lang === 'es' ? 'cadera' : 'hip'} ${e.hip_cm}`}
                  {e.weight_kg != null && ` · ${e.weight_kg} kg`}
                </span>
                <button onClick={() => remove(e.id)} className="text-destructive hover:underline shrink-0" aria-label={`${t.del} ${e.date}`}>
                  {t.del}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

export default BodyMetricsSection;
