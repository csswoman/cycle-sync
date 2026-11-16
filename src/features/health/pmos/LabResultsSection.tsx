'use client';
import React, { useState } from 'react';
import { useLabResults } from '@/hooks/useLabResults';
import { LineChart } from '@/components/ui/LineChart';
import { LAB_MARKERS, markerInfo, markerStatus, type LabMarker } from '@/lib/pmos/metrics';
import { INPUT_CLASS, parseNum, todayLocal } from './shared';

const STATUS_STYLE = {
  ok: 'bg-green-500/15 text-green-600',
  low: 'bg-blue-500/15 text-blue-500',
  high: 'bg-red-500/15 text-red-500',
} as const;
const STATUS_TEXT = { ok: 'In range', low: 'Below range', high: 'Above range' } as const;

const LabResultsSection: React.FC = () => {
  const { results, loading, saving, error, add, remove } = useLabResults();
  const [marker, setMarker] = useState<LabMarker>('testosterone');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseNum(value);
    if (v == null) { setFormError('Enter a value greater than 0.'); return; }
    setFormError(null);
    if (await add(marker, v, date)) setValue('');
  };

  const selected = markerInfo(marker);

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border bg-secondary/20">
        <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">biotech</span>
          Lab results
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Test
          <select value={marker} onChange={(ev) => setMarker(ev.target.value as LabMarker)} className={INPUT_CLASS}>
            {LAB_MARKERS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Value{selected.unit && ` (${selected.unit})`}
          <input inputMode="decimal" value={value} onChange={(ev) => setValue(ev.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Lab date
          <input type="date" value={date} max={todayLocal()} onChange={(ev) => setDate(ev.target.value)} className={INPUT_CLASS} required />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add result'}
          </button>
        </div>
        {(formError || error) && <p className="col-span-full text-sm text-destructive">{formError ?? error}</p>}
      </form>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (
          LAB_MARKERS.map((info) => {
            const points = results.filter((r) => r.marker === info.key).map((r) => ({ date: r.date, value: r.value }));
            const latest = points[points.length - 1];
            const status = latest ? markerStatus(info, latest.value) : null;
            return (
              <div key={info.key} className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{info.label}</h4>
                  {latest && status && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                      {latest.value} {info.unit} · {STATUS_TEXT[status]}
                    </span>
                  )}
                </div>
                {points.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No results yet</p>
                ) : (
                  <LineChart points={points} unit={info.unit} refLow={info.low} refHigh={info.high} />
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="px-6 pb-4 text-xs text-muted-foreground">
        The shaded band is a typical adult reference range. Your lab&apos;s own range takes priority, and LH/FSH vary with cycle phase.
      </p>

      {results.length > 0 && (
        <details className="border-t border-border px-6 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Results ({results.length})</summary>
          <ul className="mt-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
            {[...results].reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{r.date}</strong> · {markerInfo(r.marker).label}: {r.value} {markerInfo(r.marker).unit}
                </span>
                <button onClick={() => remove(r.id)} className="text-destructive hover:underline shrink-0" aria-label={`Delete ${markerInfo(r.marker).label} result from ${r.date}`}>
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

export default LabResultsSection;
