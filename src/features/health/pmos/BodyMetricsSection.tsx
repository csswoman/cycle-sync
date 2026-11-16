'use client';
import React, { useMemo, useState } from 'react';
import { usePMOSMetrics } from '@/hooks/usePMOSMetrics';
import { LineChart, type LinePoint } from '@/components/ui/LineChart';
import { homaIr, waistHipRatio, WHR_RISK_THRESHOLD, type GlucoseContext, type PMOSMetricEntry } from '@/lib/pmos/metrics';
import { INPUT_CLASS, parseNum, todayLocal } from './shared';

const CONTEXT_LABELS: Record<GlucoseContext, string> = { fasting: 'Fasting', post_meal: 'After a meal', random: 'Random' };

function series(entries: PMOSMetricEntry[], pick: (e: PMOSMetricEntry) => number | null): LinePoint[] {
  return entries.flatMap((e) => {
    const value = pick(e);
    return value == null ? [] : [{ date: e.date, value: Number(value) }];
  });
}

const ChartCard: React.FC<{ title: string; unit: string; points: LinePoint[]; note?: string }> = ({ title, unit, points, note }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-baseline">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {points.length > 0 && (
        <span className="text-xs text-muted-foreground">
          Latest: {Number(points[points.length - 1].value.toFixed(2))} {unit}
        </span>
      )}
    </div>
    {points.length === 0 ? (
      <p className="text-xs text-muted-foreground py-4">No data yet</p>
    ) : (
      <LineChart points={points} unit={unit} />
    )}
    {note && <p className="text-xs text-muted-foreground">{note}</p>}
  </div>
);

const BodyMetricsSection: React.FC = () => {
  const { entries, loading, saving, error, add, remove } = usePMOSMetrics();
  const [date, setDate] = useState(todayLocal());
  const [glucose, setGlucose] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [insulin, setInsulin] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const glucoseSeries = useMemo(
    () => series(entries.filter((e) => e.glucose_context === 'fasting'), (e) => e.glucose_mg_dl),
    [entries],
  );
  const insulinSeries = useMemo(() => series(entries, (e) => e.insulin_uiu_ml), [entries]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseNum(glucose);
    const i = parseNum(insulin);
    const w = parseNum(weight);
    const wa = parseNum(waist);
    const h = parseNum(hip);
    if (g == null && i == null && w == null && wa == null && h == null) {
      setFormError('Enter at least one value.');
      return;
    }
    setFormError(null);
    const ok = await add({
      date,
      glucose_mg_dl: g,
      glucose_context: g != null ? context : null,
      insulin_uiu_ml: i,
      weight_kg: w,
      waist_cm: wa,
      hip_cm: h,
    });
    if (ok) { setGlucose(''); setInsulin(''); setWeight(''); setWaist(''); setHip(''); }
  };

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border bg-secondary/20">
        <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">glucose</span>
          Glucose, insulin and body measurements
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Date
          <input type="date" value={date} max={todayLocal()} onChange={(ev) => setDate(ev.target.value)} className={INPUT_CLASS} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Glucose (mg/dL)
          <input inputMode="decimal" value={glucose} onChange={(ev) => setGlucose(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Glucose taken
          <select value={context} onChange={(ev) => setContext(ev.target.value as GlucoseContext)} className={INPUT_CLASS}>
            {(Object.keys(CONTEXT_LABELS) as GlucoseContext[]).map((k) => (
              <option key={k} value={k}>{CONTEXT_LABELS[k]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fasting insulin (µIU/mL)
          <input inputMode="decimal" value={insulin} onChange={(ev) => setInsulin(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Weight (kg)
          <input inputMode="decimal" value={weight} onChange={(ev) => setWeight(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Waist (cm)
          <input inputMode="decimal" value={waist} onChange={(ev) => setWaist(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hip (cm)
          <input inputMode="decimal" value={hip} onChange={(ev) => setHip(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {(formError || error) && <p className="col-span-full text-sm text-destructive">{formError ?? error}</p>}
      </form>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (
          <>
            <ChartCard title="Fasting glucose" unit="mg/dL" points={glucoseSeries} />
            <ChartCard title="Fasting insulin" unit="µIU/mL" points={insulinSeries} />
            <ChartCard
              title="HOMA-IR (calculated)"
              unit=""
              points={homaSeries}
              note="Needs fasting glucose and insulin logged on the same day. Above about 2.5 suggests insulin resistance."
            />
            <ChartCard title="Weight" unit="kg" points={weightSeries} />
            <ChartCard title="Waist" unit="cm" points={waistSeries} />
            <ChartCard
              title="Waist-to-hip ratio"
              unit=""
              points={whrSeries}
              note={
                latestWhr != null && latestWhr > WHR_RISK_THRESHOLD
                  ? `Above ${WHR_RISK_THRESHOLD}, the WHO threshold for higher metabolic risk in women.`
                  : `WHO threshold for higher metabolic risk in women: above ${WHR_RISK_THRESHOLD}.`
              }
            />
          </>
        )}
      </div>

      {entries.length > 0 && (
        <details className="border-t border-border px-6 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Entries ({entries.length})</summary>
          <ul className="mt-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{e.date}</strong>
                  {e.glucose_mg_dl != null && ` · glucose ${e.glucose_mg_dl} (${CONTEXT_LABELS[e.glucose_context!]})`}
                  {e.insulin_uiu_ml != null && ` · insulin ${e.insulin_uiu_ml}`}
                  {e.weight_kg != null && ` · ${e.weight_kg} kg`}
                  {e.waist_cm != null && ` · waist ${e.waist_cm}`}
                  {e.hip_cm != null && ` · hip ${e.hip_cm}`}
                </span>
                <button onClick={() => remove(e.id)} className="text-destructive hover:underline shrink-0" aria-label={`Delete entry from ${e.date}`}>
                  Delete
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
