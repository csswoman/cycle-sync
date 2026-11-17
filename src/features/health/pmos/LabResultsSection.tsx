'use client';
import React, { useMemo, useState } from 'react';
import { useLabResults } from '@/hooks/useLabResults';
import { LineChart } from '@/components/ui/LineChart';
import {
  derivedSeries, FAI_HIGH, freeAndrogenIndex, homaIr, LAB_MARKERS, markerInfo, markerLabel, markerStatus,
  type LabGroup, type LabMarker,
} from '@/lib/pmos/metrics';
import { convertToCanonical, unitOptions } from '@/lib/pmos/units';
import LabScanDialog from './LabScanDialog';
import { INPUT_CLASS, parseNum, todayLocal } from './shared';

type Lang = 'es' | 'en';

const STATUS_STYLE = {
  ok: 'bg-leaf/15 text-leaf',
  low: 'bg-sage/15 text-moss',
  high: 'bg-destructive/15 text-destructive',
} as const;

const T = {
  es: {
    title: 'Análisis de laboratorio', test: 'Análisis', value: 'Valor', date: 'Fecha del análisis', add: 'Agregar resultado', saving: 'Guardando…',
    errValue: 'Escribe un valor mayor que 0.', loading: 'Cargando…', none: 'Sin resultados', results: 'Resultados', del: 'Eliminar',
    status: { ok: 'En rango', low: 'Bajo', high: 'Alto', none: 'Sin rango' },
    unit: 'Unidad', noRange: 'Sin rango de referencia en la app',
    groups: { hormones: 'Hormonas', metabolic: 'Glucosa e insulina', lipids: 'Lípidos', other: 'Vitaminas' } as Record<LabGroup, string>,
    derived: 'Calculado', fai: 'Índice de andrógenos libres (FAI)',
    faiNote: `Se calcula con testosterona total y SHBG del mismo día. Alrededor de ${FAI_HIGH} o más suele leerse como elevado.`,
    homaNote: 'Se calcula con glucosa e insulina en ayunas del mismo día. Más de 2.5 sugiere resistencia a la insulina.',
    footer: 'La franja sombreada es un rango de referencia típico en mujeres adultas. El rango de tu laboratorio tiene prioridad, y LH/FSH cambian según la fase del ciclo. Comenta tus resultados con tu médico.',
  },
  en: {
    title: 'Lab results', test: 'Test', value: 'Value', date: 'Lab date', add: 'Add result', saving: 'Saving…',
    errValue: 'Enter a value greater than 0.', loading: 'Loading…', none: 'No results yet', results: 'Results', del: 'Delete',
    status: { ok: 'In range', low: 'Below range', high: 'Above range', none: 'No range' },
    unit: 'Unit', noRange: 'No reference range in the app',
    groups: { hormones: 'Hormones', metabolic: 'Glucose & insulin', lipids: 'Lipids', other: 'Vitamins' } as Record<LabGroup, string>,
    derived: 'Calculated', fai: 'Free androgen index (FAI)',
    faiNote: `Calculated from same-day total testosterone and SHBG. Around ${FAI_HIGH} or more is commonly read as elevated.`,
    homaNote: 'Calculated from same-day fasting glucose and insulin. Above 2.5 suggests insulin resistance.',
    footer: "The shaded band is a typical adult-female reference range. Your lab's own range takes priority, and LH/FSH vary with cycle phase. Review your results with your doctor.",
  },
};

const GROUPS: LabGroup[] = ['hormones', 'metabolic', 'lipids', 'other'];

const LabResultsSection: React.FC<{ lang?: Lang }> = ({ lang = 'es' }) => {
  const t = T[lang];
  const { results, loading, saving, error, add, addMany, remove } = useLabResults();
  const [marker, setMarker] = useState<LabMarker>('testosterone');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [formError, setFormError] = useState<string | null>(null);
  const [group, setGroup] = useState<LabGroup>('hormones');

  // HOMA-IR typed in by hand and HOMA-IR derived from same-day labs are shown together.
  const homaDerived = useMemo(() => derivedSeries(results, 'fasting_glucose', 'fasting_insulin', homaIr), [results]);
  const fai = useMemo(() => derivedSeries(results, 'testosterone', 'shbg', freeAndrogenIndex), [results]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseNum(value);
    if (v == null) { setFormError(t.errValue); return; }
    const converted = convertToCanonical(marker, v, unit || markerInfo(marker).unit);
    if (converted == null) { setFormError(t.errValue); return; }
    setFormError(null);
    if (await add(marker, converted, date)) { setValue(''); setGroup(markerInfo(marker).group); }
  };

  const selected = markerInfo(marker);
  const units = unitOptions(marker);
  const label = (k: LabMarker) => markerLabel(markerInfo(k), lang);

  return (
    <section className="bg-card rounded-3xl border border-border overflow-hidden">
      <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance flex items-center gap-3">
          <span className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">biotech</span>
          </span>
          {t.title}
        </h2>
        <LabScanDialog lang={lang} saving={saving} onSave={addMany} />
      </div>

      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 items-end bg-secondary/30 border-y border-border">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
          {t.test}
          <select value={marker} onChange={(ev) => { setMarker(ev.target.value as LabMarker); setUnit(''); }} className={INPUT_CLASS}>
            {GROUPS.map((g) => (
              <optgroup key={g} label={t.groups[g]}>
                {LAB_MARKERS.filter((m) => m.group === g).map((m) => <option key={m.key} value={m.key}>{markerLabel(m, lang)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {t.value}
          <div className="flex gap-2">
            <input inputMode="decimal" value={value} onChange={(ev) => setValue(ev.target.value)} className={INPUT_CLASS} />
            {units.length > 1 ? (
              <select value={unit || units[0].label} onChange={(ev) => setUnit(ev.target.value)} className={`${INPUT_CLASS} w-28 shrink-0`} aria-label={t.unit}>
                {units.map((u) => <option key={u.label} value={u.label}>{u.label}</option>)}
              </select>
            ) : (
              selected.unit && <span className="self-center text-sm whitespace-nowrap">{selected.unit}</span>
            )}
          </div>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {t.date}
          <input type="date" value={date} max={todayLocal()} onChange={(ev) => setDate(ev.target.value)} className={INPUT_CLASS} required />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-11 rounded-full disabled:opacity-60">
            {saving ? t.saving : t.add}
          </button>
        </div>
        {(lang === 'es' ? selected.noteEs : selected.noteEn) && (
          <p className="col-span-full text-sm text-muted-foreground">{lang === 'es' ? selected.noteEs : selected.noteEn}</p>
        )}
        {(formError || error) && <p className="col-span-full text-sm text-destructive">{formError ?? error}</p>}
      </form>

      <div className="px-5 sm:px-6 pt-5 flex gap-2 overflow-x-auto scrollbar-hide" role="tablist">
        {GROUPS.map((g) => (
          <button key={g} role="tab" aria-selected={group === g} onClick={() => setGroup(g)}
            className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap border ${group === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}>
            {t.groups[g]}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t.loading}</p>
        ) : (
          <>
            {LAB_MARKERS.filter((m) => m.group === group).map((info) => {
              let points = results.filter((r) => r.marker === info.key).map((r) => ({ date: r.date, value: r.value }));
              if (info.key === 'homa_ir') {
                const typed = new Set(points.map((p) => p.date));
                points = [...points, ...homaDerived.filter((p) => !typed.has(p.date))].sort((a, b) => a.date.localeCompare(b.date));
              }
              const latest = points[points.length - 1];
              const status = latest ? markerStatus(info, latest.value) : null;
              return (
                <div key={info.key} className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{markerLabel(info, lang)}</h3>
                    {latest && status && status !== 'none' && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                        {latest.value} {info.unit} · {t.status[status]}
                      </span>
                    )}
                  </div>
                  {latest && status === 'none' && (
                    <p className="text-sm text-muted-foreground">{latest.value} {info.unit} · {t.noRange}</p>
                  )}
                  {points.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.none}</p>
                  ) : (
                    <LineChart points={points} unit={info.unit} refLow={info.low} refHigh={info.high} />
                  )}
                  {info.key === 'homa_ir' && <p className="text-sm text-muted-foreground">{t.homaNote}</p>}
                </div>
              );
            })}
            {group === 'hormones' && (
              <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                <div className="flex justify-between items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{t.fai} <span className="text-xs font-normal text-muted-foreground">· {t.derived}</span></h3>
                  {fai.length > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fai[fai.length - 1].value >= FAI_HIGH ? STATUS_STYLE.high : STATUS_STYLE.ok}`}>
                      {fai[fai.length - 1].value} · {fai[fai.length - 1].value >= FAI_HIGH ? t.status.high : t.status.ok}
                    </span>
                  )}
                </div>
                {fai.length === 0 ? <p className="text-sm text-muted-foreground">{t.none}</p> : <LineChart points={fai} unit="" refLow={null} refHigh={FAI_HIGH} />}
                <p className="text-sm text-muted-foreground">{t.faiNote}</p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="px-5 sm:px-6 pb-5 text-sm text-muted-foreground text-pretty max-w-[70ch]">{t.footer}</p>

      {results.length > 0 && (
        <details className="border-t border-border px-5 sm:px-6 py-3">
          <summary className="cursor-pointer min-h-10 flex items-center text-sm font-semibold text-foreground">{t.results} ({results.length})</summary>
          <ul className="mt-1 flex flex-col divide-y divide-border/60 max-h-64 overflow-y-auto">
            {[...results].reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{r.date}</strong> · {label(r.marker)}: {r.value} {markerInfo(r.marker).unit}
                </span>
                <button onClick={() => remove(r.id)} className="inline-flex items-center min-h-10 px-2 text-sm font-semibold text-destructive hover:underline shrink-0" aria-label={`${t.del} ${label(r.marker)} ${r.date}`}>
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

export default LabResultsSection;
