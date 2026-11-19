'use client';

import React, { useMemo, useState } from 'react';
import type { PMOSMetricEntry } from '@/lib/pmos/metrics';
import type { NewMetricEntry } from '@/hooks/usePMOSMetrics';
import type { BodyProfile } from '@/hooks/useBodyProfile';
import { MEASURES, measureSeries, progressSummary, weightRate, type MeasureKey } from '@/lib/body/progress';
import { LineChart } from '@/components/ui/LineChart';
import { Icon } from '@/components/ui/Icon';
import { parseNum, todayLocal } from '@/features/health/pmos/shared';
import { useLanguage } from '@/i18n/LanguageContext';
import { BodyGoals } from './BodyGoals';

interface BodyProgressProps {
  entries: PMOSMetricEntry[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  add: (entry: NewMetricEntry) => Promise<boolean>;
  remove: (id: string) => Promise<void> | void;
  profile: BodyProfile;
  saveProfile: (patch: Partial<BodyProfile>) => Promise<boolean>;
  profileAvailable: boolean;
}

const BODY_KEYS = MEASURES.map((m) => m.key);

const MEASURES_EN: Record<MeasureKey, { label: string; how: string }> = {
  weight_kg: { label: 'Weight', how: 'In the morning, after using the bathroom and before breakfast, in light clothing.' },
  waist_cm: { label: 'Waist', how: 'At the narrowest point, between the last rib and hip bone, at the end of a normal exhale.' },
  abdomen_cm: { label: 'Abdomen', how: 'At belly button level, standing relaxed without holding your breath.' },
  hip_cm: { label: 'Hips', how: 'At the widest point of the glutes, with feet together.' },
  chest_cm: { label: 'Chest', how: 'At the fullest part of the bust, wearing an unpadded bra.' },
  arm_cm: { label: 'Arm', how: 'Midway between shoulder and elbow, with the arm relaxed.' },
  thigh_cm: { label: 'Thigh', how: 'At the widest part of the thigh, just below the glute.' },
};

const getMeasureLabel = (key: MeasureKey, fallback: string, isEn: boolean) => (isEn ? MEASURES_EN[key]?.label ?? fallback : fallback);
const getMeasureHow = (key: MeasureKey, fallback: string, isEn: boolean) => (isEn ? MEASURES_EN[key]?.how ?? fallback : fallback);

const fmtDate = (iso: string, isEn: boolean) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEn ? 'en-US' : 'es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const fieldClass =
  'w-full min-h-11 bg-background border border-border rounded-xl px-3 text-base text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary';

export const BodyProgress: React.FC<BodyProgressProps> = ({
  entries, loading, saving, error, add, remove, profile, saveProfile, profileAvailable,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [date, setDate] = useState(todayLocal());
  const [values, setValues] = useState<Record<MeasureKey, string>>(
    () => Object.fromEntries(BODY_KEYS.map((k) => [k, ''])) as Record<MeasureKey, string>
  );
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [selected, setSelected] = useState<MeasureKey>('weight_kg');
  const [editStart, setEditStart] = useState(false);
  const [startDraft, setStartDraft] = useState({ kg: '', date: '' });

  const series = useMemo(
    () => Object.fromEntries(BODY_KEYS.map((k) => [k, measureSeries(entries, k)])) as Record<MeasureKey, ReturnType<typeof measureSeries>>,
    [entries]
  );
  const profileStart = profile.startWeightKg && profile.startDate ? { date: profile.startDate, value: profile.startWeightKg } : null;
  const weightSummary = progressSummary(series.weight_kg, profileStart);
  const rate = weightRate(series.weight_kg);
  const measuresWithData = MEASURES.filter((m) => series[m.key].length > 0);
  const selectedInfo = MEASURES.find((m) => m.key === selected)!;
  const selectedLabel = getMeasureLabel(selected, selectedInfo.label, isEn);
  const selectedSummary = progressSummary(series[selected], selected === 'weight_kg' ? profileStart : null);
  const bodyEntries = entries.filter((e) => BODY_KEYS.some((k) => e[k] != null));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const parsed = Object.fromEntries(BODY_KEYS.map((k) => [k, parseNum(values[k])])) as Record<MeasureKey, number | null>;
    if (BODY_KEYS.every((k) => parsed[k] == null)) {
      setFormMsg({ ok: false, text: isEn ? 'Enter at least one measurement.' : 'Escribe al menos una medida.' });
      return;
    }
    setFormMsg(null);
    const ok = await add({ date, ...parsed });
    if (!ok) return;
    // The first weight ever logged becomes the starting point.
    if (parsed.weight_kg != null && !profile.startWeightKg && series.weight_kg.length === 0) {
      await saveProfile({ startWeightKg: parsed.weight_kg, startDate: date });
    }
    setValues(Object.fromEntries(BODY_KEYS.map((k) => [k, ''])) as Record<MeasureKey, string>);
    setFormMsg({ ok: true, text: isEn ? 'Saved. Your progress has been updated.' : 'Guardado. Tu progreso se actualizó.' });
    if (parsed[selected] == null) {
      const firstLogged = BODY_KEYS.find((k) => parsed[k] != null);
      if (firstLogged && series[selected].length === 0) setSelected(firstLogged);
    }
  };

  const handleSaveStart = async () => {
    const kg = parseNum(startDraft.kg);
    if (kg == null || !startDraft.date) return;
    await saveProfile({ startWeightKg: kg, startDate: startDraft.date });
    setEditStart(false);
  };

  const paceText = rate && (isEn ? {
    gain: `Gaining about ${Math.abs(rate.kgPerWeek)} kg per week over the last month.`,
    stable: 'Your weight is stable over the last month. If your measurements are decreasing, you are trading fat for muscle, which is great progress.',
    steady: `Losing about ${Math.abs(rate.kgPerWeek)} kg per week: a steady pace that preserves muscle.`,
    fast: `Losing about ${Math.abs(rate.kgPerWeek)} kg per week, more than 1% of your body weight. At this pace, muscle loss is common: make sure you hit your protein target and don’t under-eat.`,
  }[rate.pace] : {
    gain: `Subiendo unos ${Math.abs(rate.kgPerWeek)} kg por semana en el último mes.`,
    stable: 'Tu peso está estable en el último mes. Si tus medidas bajan, estás cambiando grasa por músculo, y eso también es progreso.',
    steady: `Bajando unos ${Math.abs(rate.kgPerWeek)} kg por semana: un ritmo que cuida tu músculo.`,
    fast: `Bajando unos ${Math.abs(rate.kgPerWeek)} kg por semana, más de 1% de tu peso. A ese ritmo es fácil perder músculo: revisa que llegues a tu proteína y que no comas demasiado poco.`,
  }[rate.pace]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Summary */}
      <section aria-labelledby="progress-title" className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h3 id="progress-title" className="text-foreground text-lg font-semibold text-balance">
            {isEn ? 'My progress' : 'Mi progreso'}
          </h3>
          <p className="text-sm text-muted-foreground text-pretty max-w-prose">
            {isEn
              ? 'Your weight and measurements over time. With PMOS, the waist often tells a clearer story than the scale.'
              : 'Tu peso y tus medidas en el tiempo. Con PMOS, la cintura cuenta mejor la historia que la báscula.'}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">{isEn ? 'Loading…' : 'Cargando…'}</p>
        ) : (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-5 md:gap-y-0 md:divide-x md:divide-border border-t border-border pt-5">
            <div className="flex flex-col gap-0.5 md:px-5 md:first:pl-0 md:last:pr-0">
              <dt className="text-sm text-muted-foreground">{isEn ? 'Starting weight' : 'Peso inicial'}</dt>
              <dd className="text-2xl font-semibold text-foreground tabular-nums">
                {weightSummary ? `${weightSummary.start.value} kg` : profile.startWeightKg ? `${profile.startWeightKg} kg` : '—'}
              </dd>
              <dd className="text-sm text-muted-foreground">
                {weightSummary ? fmtDate(weightSummary.start.date, isEn) : profile.startDate ? fmtDate(profile.startDate, isEn) : (isEn ? 'No records yet' : 'Aún sin registro')}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 md:px-5 md:first:pl-0 md:last:pr-0">
              <dt className="text-sm text-muted-foreground">{isEn ? 'Current weight' : 'Peso actual'}</dt>
              <dd className="text-2xl font-semibold text-foreground tabular-nums">{weightSummary ? `${weightSummary.latest.value} kg` : '—'}</dd>
              <dd className="text-sm text-muted-foreground">{weightSummary ? fmtDate(weightSummary.latest.date, isEn) : (isEn ? 'No records yet' : 'Aún sin registro')}</dd>
            </div>
            <div className="flex flex-col gap-0.5 md:px-5 md:first:pl-0 md:last:pr-0">
              <dt className="text-sm text-muted-foreground">{isEn ? 'Weight change' : 'Cambio de peso'}</dt>
              <dd className={`text-2xl font-semibold tabular-nums ${weightSummary && weightSummary.change < 0 ? 'text-leaf' : 'text-foreground'}`}>
                {weightSummary && weightSummary.days > 0 ? `${signed(weightSummary.change)} kg` : '—'}
              </dd>
              <dd className="text-sm text-muted-foreground">
                {weightSummary && weightSummary.days > 0
                  ? (isEn ? `${signed(weightSummary.changePercent)}% over ${weightSummary.days} days` : `${signed(weightSummary.changePercent)}% en ${weightSummary.days} días`)
                  : (isEn ? 'Requires two entries' : 'Necesitas dos registros')}
              </dd>
            </div>
            {(() => {
              const key: MeasureKey = series.abdomen_cm.length ? 'abdomen_cm' : 'waist_cm';
              const s = progressSummary(series[key]);
              return (
                <div className="flex flex-col gap-0.5 md:px-5 md:first:pl-0 md:last:pr-0">
                  <dt className="text-sm text-muted-foreground">
                    {key === 'abdomen_cm' ? (isEn ? 'Abdomen' : 'Abdomen') : (isEn ? 'Waist' : 'Cintura')}
                  </dt>
                  <dd className={`text-2xl font-semibold tabular-nums ${s && s.change < 0 ? 'text-leaf' : 'text-foreground'}`}>
                    {s && s.days > 0 ? `${signed(s.change)} cm` : s ? `${s.latest.value} cm` : '—'}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    {s && s.days > 0
                      ? (isEn ? `since ${fmtDate(s.start.date, isEn)}` : `desde ${fmtDate(s.start.date, isEn)}`)
                      : s
                        ? (isEn ? 'First entry' : 'Primer registro')
                        : (isEn ? 'No records yet' : 'Aún sin registro')}
                  </dd>
                </div>
              );
            })()}
          </dl>
        )}

        {paceText && (
          <p className={`rounded-2xl px-4 py-3 text-sm text-pretty ${rate?.pace === 'fast' ? 'bg-sun/15 text-foreground' : 'bg-leaf-soft/60 text-foreground'}`}>
            <Icon name={rate?.pace === 'fast' ? 'warning' : 'info'} size={16} weight="bold" className={`inline -mt-0.5 mr-1.5 ${rate?.pace === 'fast' ? 'text-sun' : 'text-leaf'}`} />
            {paceText}
          </p>
        )}

        {profileAvailable && (
          editStart ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                {isEn ? 'Starting weight (kg)' : 'Peso inicial (kg)'}
                <input inputMode="decimal" value={startDraft.kg} onChange={(e) => setStartDraft((d) => ({ ...d, kg: e.target.value }))} className={`${fieldClass} w-32`} />
              </label>
              <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                {isEn ? 'Date' : 'Fecha'}
                <input type="date" max={todayLocal()} value={startDraft.date} onChange={(e) => setStartDraft((d) => ({ ...d, date: e.target.value }))} className={`${fieldClass} w-44`} />
              </label>
              <button type="button" onClick={handleSaveStart} className="min-h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                {isEn ? 'Save start' : 'Guardar inicio'}
              </button>
              <button type="button" onClick={() => setEditStart(false)} className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground">
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStartDraft({ kg: String(profile.startWeightKg ?? weightSummary?.start.value ?? ''), date: profile.startDate ?? weightSummary?.start.date ?? todayLocal() });
                setEditStart(true);
              }}
              className="self-start min-h-10 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              {profile.startWeightKg ? (isEn ? 'Change my starting weight' : 'Cambiar mi peso inicial') : (isEn ? 'Set an earlier starting weight' : 'Indicar un peso inicial anterior')}
            </button>
          )
        )}
      </section>

      {!loading && (
        <BodyGoals
          isEn={isEn}
          profile={profile}
          saveProfile={saveProfile}
          startKg={weightSummary?.start.value ?? profile.startWeightKg}
          currentKg={weightSummary?.latest.value ?? null}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Charts */}
        <section aria-labelledby="progress-chart" className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <h3 id="progress-chart" className="text-foreground text-lg font-semibold">
            {isEn ? 'Evolution' : 'Evolución'}
          </h3>
          {measuresWithData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isEn ? 'When you log your weight or measurements, you will see how they change over time.' : 'Cuando registres tu peso o tus medidas, verás aquí cómo cambian.'}
            </p>
          ) : (
            <>
              <div role="group" aria-label={isEn ? 'Measurement' : 'Medida'} className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {measuresWithData.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={selected === m.key}
                    onClick={() => setSelected(m.key)}
                    className={`shrink-0 min-h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                      selected === m.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {getMeasureLabel(m.key, m.label, isEn)}
                  </button>
                ))}
              </div>
              {series[selected].length > 0 ? (
                <>
                  <LineChart
                    points={series[selected]}
                    unit={selectedInfo.unit}
                    height={180}
                    goal={selected === 'weight_kg' ? profile.goalWeightKg : null}
                    goalLabel={isEn ? 'Goal' : 'Meta'}
                  />
                  {selectedSummary && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {selectedSummary.days > 0
                        ? (isEn
                            ? `${selectedLabel}: from ${selectedSummary.start.value} to ${selectedSummary.latest.value} ${selectedInfo.unit} (${signed(selectedSummary.change)} ${selectedInfo.unit}) over ${selectedSummary.days} days.`
                            : `${selectedInfo.label}: de ${selectedSummary.start.value} a ${selectedSummary.latest.value} ${selectedInfo.unit} (${signed(selectedSummary.change)} ${selectedInfo.unit}) en ${selectedSummary.days} días.`)
                        : (isEn
                            ? `${selectedLabel}: ${selectedSummary.latest.value} ${selectedInfo.unit}. Log a second entry to see changes.`
                            : `${selectedInfo.label}: ${selectedSummary.latest.value} ${selectedInfo.unit}. Con un segundo registro verás el cambio.`)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{isEn ? 'Select a measurement.' : 'Elige una medida.'}</p>
              )}

              {measuresWithData.length > 1 && (
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {isEn ? 'Change in each measurement since the first record' : 'Cambio de cada medida desde el primer registro'}
                  </caption>
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="font-medium py-2">{isEn ? 'Measurement' : 'Medida'}</th>
                      <th className="font-medium py-2 text-right">{isEn ? 'Start' : 'Inicio'}</th>
                      <th className="font-medium py-2 text-right">{isEn ? 'Current' : 'Ahora'}</th>
                      <th className="font-medium py-2 text-right">{isEn ? 'Change' : 'Cambio'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border border-t border-border tabular-nums">
                    {measuresWithData.map((m) => {
                      const s = progressSummary(series[m.key], m.key === 'weight_kg' ? profileStart : null)!;
                      return (
                        <tr key={m.key}>
                          <th scope="row" className="py-2 text-left font-medium text-foreground">{getMeasureLabel(m.key, m.label, isEn)}</th>
                          <td className="py-2 text-right text-muted-foreground">{s.start.value}</td>
                          <td className="py-2 text-right text-foreground">{s.latest.value}</td>
                          <td className={`py-2 text-right font-semibold ${s.change < 0 ? 'text-leaf' : 'text-foreground'}`}>
                            {s.days > 0 ? `${signed(s.change)} ${m.unit}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {bodyEntries.length > 0 && (
            <details className="border-t border-border pt-3">
              <summary className="cursor-pointer min-h-10 flex items-center text-sm font-semibold text-foreground">
                {isEn ? `Entries (${bodyEntries.length})` : `Registros (${bodyEntries.length})`}
              </summary>
              <ul className="mt-2 flex flex-col divide-y divide-border max-h-64 overflow-y-auto">
                {[...bodyEntries].reverse().map((e) => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span className="text-pretty">
                      <strong className="text-foreground">{fmtDate(e.date, isEn)}</strong>
                      {MEASURES.filter((m) => e[m.key] != null).map((m) => ` · ${getMeasureLabel(m.key, m.label, isEn).toLowerCase()} ${e[m.key]} ${m.unit}`).join('')}
                    </span>
                    {e.glucose_mg_dl != null || e.insulin_uiu_ml != null || e.systolic != null ? (
                      // The same row holds glucose or blood pressure: delete it from PMOS care, not here.
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {isEn ? 'Includes glucose or BP' : 'Con glucosa o presión'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        className="shrink-0 min-h-10 px-3 rounded-full text-destructive hover:bg-secondary"
                        aria-label={isEn ? `Delete entry from ${fmtDate(e.date, isEn)}` : `Eliminar registro del ${fmtDate(e.date, isEn)}`}
                      >
                        {isEn ? 'Delete' : 'Eliminar'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="text-sm text-muted-foreground text-pretty">
            {isEn
              ? 'This data is shared with the PMOS Care measurements section. Your energy, cycle, and glucose say as much as the scale.'
              : 'Estos datos se comparten con la sección de medidas de Cuidado PMOS. Tu energía, tu ciclo y tu glucosa dicen tanto como la báscula.'}
          </p>
        </section>
        {/* Log form */}
        <section aria-labelledby="progress-log" className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <h3 id="progress-log" className="text-foreground text-lg font-semibold">
            {isEn ? 'Log measurements' : 'Registrar medidas'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted-foreground">
              {isEn ? 'Date' : 'Fecha'}
              <input type="date" value={date} max={todayLocal()} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MEASURES.map((m) => (
                <label key={m.key} className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {getMeasureLabel(m.key, m.label, isEn)} ({m.unit})
                  <input
                    inputMode="decimal"
                    value={values[m.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                    placeholder={series[m.key].length ? String(series[m.key][series[m.key].length - 1].value) : ''}
                    className={fieldClass}
                  />
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {isEn ? 'Only fill what you measure today; other fields can stay empty.' : 'Solo llena lo que midas hoy; lo demás puede quedar vacío.'}
            </p>
            <button type="submit" disabled={saving} className="min-h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold disabled:opacity-60">
              {saving ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Save' : 'Guardar')}
            </button>
            {(formMsg || error) && (
              <p role="status" className={`text-sm ${formMsg?.ok ? 'text-leaf font-medium' : 'text-destructive'}`}>
                {formMsg?.text ?? error}
              </p>
            )}
          </form>
          <details className="group border-t border-border pt-3">
            <summary className="flex items-center gap-2 min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground">
              <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
              {isEn ? 'How to measure so numbers stay consistent' : 'Cómo medirte para que los números sean comparables'}
            </summary>
            <ul className="flex flex-col gap-2 pt-2 pl-6">
              {MEASURES.map((m) => (
                <li key={m.key} className="text-sm text-muted-foreground text-pretty">
                  <strong className="text-foreground">{getMeasureLabel(m.key, m.label, isEn)}:</strong> {getMeasureHow(m.key, m.how, isEn)}
                </li>
              ))}
              <li className="text-sm text-muted-foreground text-pretty">
                {isEn
                  ? 'Use a flexible tape without pinching the skin. Measure every 2 to 4 weeks, around the same point in your cycle if possible: fluid retention is normal before your period.'
                  : 'Usa una cinta flexible sin apretar la piel. Mídete cada 2 a 4 semanas, el mismo día de tu ciclo si puedes: antes de la regla es normal retener líquido.'}
              </li>
            </ul>
          </details>
        </section>

      </div>
    </div>
  );
};
