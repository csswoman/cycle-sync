'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { addDays, parseLocalDate, toISODate } from '@/lib/cycle/cycleEngine';
import {
  bbtPattern, detectTemperatureShift, isFertileMucus, MUCUS_ORDER, parseTemperature, readingsInCycle,
  type CervicalMucus, type CycleSign,
} from '@/lib/cycle/fertilitySigns';
import { useCycleSigns } from '@/hooks/useCycleSigns';

type Lang = 'es' | 'en';

const copy = {
  es: {
    date: 'Día', today: 'Hoy',
    spottingTitle: 'Manchado (spotting)',
    spottingHelp: 'Sangrado leve fuera de la regla: unas gotas, rosado o marrón, sin necesitar compresa. No cuenta como regla ni cambia tus predicciones.',
    spottingToggle: 'Tuve manchado este día',
    bbtTitle: 'Temperatura basal',
    bbtHelp: 'Al despertar, antes de levantarte, a la misma hora y tras al menos 3 horas de sueño. Acepta °C o °F.',
    bbtDisturbed: 'Lectura alterada (dormí poco, enfermedad, alcohol, otra hora)',
    bbtInvalid: 'Escribe una temperatura entre 34 y 40 °C.',
    mucusTitle: 'Flujo cervical',
    mucus: { dry: 'Seco', sticky: 'Pegajoso', creamy: 'Cremoso', watery: 'Acuoso', eggwhite: 'Clara de huevo' } as Record<CervicalMucus, string>,
    mucusFertile: 'Flujo de tipo fértil: la ovulación suele estar cerca.',
    lhTitle: 'Prueba de ovulación (LH)',
    lhHelp: 'Si usas tiras de LH, anota el resultado. Con PMOS pueden dar positivos falsos porque la LH suele estar alta; la temperatura confirma si de verdad ovulaste.',
    lh: { negative: 'Negativa', positive: 'Positiva' },
    sexTitle: 'Relaciones sexuales',
    sexCount: 'Veces', protection: 'Protección',
    protected: 'Con protección', unprotected: 'Sin protección',
    sexPrivate: 'Solo tú puedes ver este dato. No se incluye en informes ni en el asistente.',
    notes: 'Nota (opcional)',
    save: 'Guardar día', saving: 'Guardando…', saved: 'Guardado ✓',
    saveError: 'No se pudo guardar. Si es la primera vez, falta aplicar la migración de la base de datos.',
    chartTitle: 'Tu temperatura en este ciclo',
    chartEmpty: 'Registra tu temperatura varios días seguidos para ver la gráfica.',
    pattern: {
      notEnough: 'Hacen falta al menos 9 lecturas válidas para buscar el cambio de temperatura.',
      waiting: 'Todavía no se ve una subida sostenida. Sigue registrando a diario.',
      shift: (d: string) => `Subida sostenida detectada: la ovulación probablemente ocurrió alrededor del ${d}. Esto se confirma después de ovular, no la predice.`,
      monophasic: 'Tu temperatura no ha subido de forma sostenida en este ciclo. Con SOP/PMOS puede pasar en ciclos sin ovulación. Si se repite, coméntalo con tu médica.',
    },
    coverline: 'Línea base',
    hormonal: 'Con anticoncepción hormonal no hay ovulación natural, así que la temperatura basal y el flujo no reflejan tu fertilidad.',
    infoTitle: 'Sobre la temperatura basal y los métodos de fertilidad',
    info: [
      'Tras la ovulación, la progesterona sube tu temperatura en reposo unos 0,2–0,5 °C hasta la siguiente regla. Por eso la temperatura confirma la ovulación después de que ocurre; no sirve para anticiparla.',
      'La regla de "3 sobre 6" que usa la app: tres temperaturas seguidas por encima de las seis anteriores, la tercera al menos 0,2 °C más alta.',
      'Algunas personas usan métodos basados en la conciencia de la fertilidad para evitar embarazos. El método sintotérmico combina temperatura y flujo cervical: con uso perfecto y formación tiene alrededor de 0,4 embarazos por cada 100 mujeres al año, pero con uso típico la tasa sube a entre 2 y 23. La temperatura sola es menos fiable.',
      'Con SOP/PMOS estos métodos son más difíciles: la ovulación puede retrasarse o no ocurrir, el flujo fértil puede aparecer varias veces y las tiras de LH dan falsos positivos.',
      'Esta información es solo de referencia. La app no es un método anticonceptivo. Para usar cualquier método para evitar o buscar un embarazo, hazlo con el acompañamiento de tu médica o de una instructora certificada.',
    ],
  },
  en: {
    date: 'Day', today: 'Today',
    spottingTitle: 'Spotting',
    spottingHelp: 'Light bleeding outside your period: a few drops, pink or brown, no pad needed. It does not count as a period or change your predictions.',
    spottingToggle: 'I had spotting this day',
    bbtTitle: 'Basal body temperature',
    bbtHelp: 'On waking, before getting up, at the same time and after at least 3 hours of sleep. °C or °F.',
    bbtDisturbed: 'Disturbed reading (short sleep, illness, alcohol, different time)',
    bbtInvalid: 'Enter a temperature between 34 and 40 °C.',
    mucusTitle: 'Cervical mucus',
    mucus: { dry: 'Dry', sticky: 'Sticky', creamy: 'Creamy', watery: 'Watery', eggwhite: 'Egg white' } as Record<CervicalMucus, string>,
    mucusFertile: 'Fertile-type mucus: ovulation is usually close.',
    lhTitle: 'Ovulation test (LH)',
    lhHelp: 'If you use LH strips, log the result. With PMOS they can give false positives because LH is often high; temperature confirms whether you really ovulated.',
    lh: { negative: 'Negative', positive: 'Positive' },
    sexTitle: 'Sexual activity',
    sexCount: 'Times', protection: 'Protection',
    protected: 'Protected', unprotected: 'Unprotected',
    sexPrivate: 'Only you can see this. It is not included in reports or the assistant.',
    notes: 'Note (optional)',
    save: 'Save day', saving: 'Saving…', saved: 'Saved ✓',
    saveError: 'Could not save. If this is the first time, the database migration has not been applied yet.',
    chartTitle: 'Your temperature this cycle',
    chartEmpty: 'Log your temperature several days in a row to see the chart.',
    pattern: {
      notEnough: 'At least 9 valid readings are needed to look for the temperature shift.',
      waiting: 'No sustained rise yet. Keep logging every day.',
      shift: (d: string) => `Sustained rise detected: ovulation probably happened around ${d}. This confirms ovulation afterwards, it does not predict it.`,
      monophasic: 'Your temperature has not risen in a sustained way this cycle. With PMOS this can happen in cycles without ovulation. If it keeps happening, mention it to your doctor.',
    },
    coverline: 'Coverline',
    hormonal: 'With hormonal contraception there is no natural ovulation, so basal temperature and mucus do not reflect your fertility.',
    infoTitle: 'About basal temperature and fertility awareness',
    info: [
      'After ovulation, progesterone raises your resting temperature by about 0.2–0.5 °C until the next period. So temperature confirms ovulation after it happens; it cannot predict it.',
      'The "3 over 6" rule used here: three readings in a row above the previous six, the third at least 0.2 °C higher.',
      'Some people use fertility awareness methods to avoid pregnancy. The symptothermal method combines temperature and cervical mucus: with perfect use and training it has about 0.4 pregnancies per 100 women a year, but with typical use the rate is between 2 and 23. Temperature alone is less reliable.',
      'With PMOS these methods are harder: ovulation can be late or absent, fertile mucus can appear several times and LH strips give false positives.',
      'This is reference information only. The app is not a contraceptive method. To use any method to avoid or achieve pregnancy, do it with your doctor or a certified instructor.',
    ],
  },
};

const chip = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-foreground border-transparent hover:bg-secondary'
  }`;

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

const Section: React.FC<{ icon: string; title: string; help?: string; children: React.ReactNode }> = ({ icon, title, help, children }) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
    <div>
      <h3 className="text-foreground font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>{title}
      </h3>
      {help && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{help}</p>}
    </div>
    {children}
  </div>
);

/** Line chart of the cycle's temperatures with the coverline once a shift is found. */
const BBTChart: React.FC<{ readings: { date: string; celsius: number; disturbed?: boolean }[]; coverline?: number; ovulationDate?: string; label: string }> = ({ readings, coverline, ovulationDate, label }) => {
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const W = 320, H = 140, P = 24;
  const temps = sorted.map((r) => r.celsius).concat(coverline != null ? [coverline] : []);
  const min = Math.min(...temps) - 0.1, max = Math.max(...temps) + 0.1;
  const first = parseLocalDate(sorted[0].date).getTime();
  const last = parseLocalDate(sorted[sorted.length - 1].date).getTime();
  const x = (iso: string) => P + (last === first ? (W - 2 * P) / 2 : ((parseLocalDate(iso).getTime() - first) / (last - first)) * (W - 2 * P));
  const y = (c: number) => H - P - ((c - min) / (max - min || 1)) * (H - 2 * P);
  const valid = sorted.filter((r) => !r.disturbed);
  const path = valid.map((r, i) => `${i ? 'L' : 'M'}${x(r.date).toFixed(1)},${y(r.celsius).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-primary" role="img" aria-label={label}>
      <text x={4} y={y(max - 0.1) + 4} className="fill-muted-foreground" fontSize="9">{(max - 0.1).toFixed(1)}°</text>
      <text x={4} y={y(min + 0.1) + 4} className="fill-muted-foreground" fontSize="9">{(min + 0.1).toFixed(1)}°</text>
      {coverline != null && (
        <line x1={P} x2={W - P} y1={y(coverline)} y2={y(coverline)} stroke="currentColor" strokeOpacity="0.45" strokeDasharray="4 3" />
      )}
      {ovulationDate && <line x1={x(ovulationDate)} x2={x(ovulationDate)} y1={P / 2} y2={H - P} className="stroke-sky-500" strokeDasharray="2 3" />}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {sorted.map((r) => (
        <circle key={r.date} cx={x(r.date)} cy={y(r.celsius)} r={3} fill={r.disturbed ? 'none' : 'currentColor'} stroke="currentColor" strokeOpacity={r.disturbed ? 0.5 : 1} />
      ))}
    </svg>
  );
};

interface Props {
  lang: Lang;
  /** First day of the current cycle (YYYY-MM-DD), used to scope the temperature chart. */
  cycleStart: string | null;
  hormonal: boolean;
  initialDate?: string;
}

const BodySignsPanel: React.FC<Props> = ({ lang, cycleStart, hormonal, initialDate }) => {
  const c = copy[lang];
  const todayIso = toISODate(new Date());
  const fromDate = useMemo(() => {
    const ninety = toISODate(addDays(new Date(), -90));
    return cycleStart && cycleStart < ninety ? cycleStart : ninety;
  }, [cycleStart]);
  const { signs, signFor, saveSign, error } = useCycleSigns(fromDate);

  const [date, setDate] = useState(initialDate && initialDate <= todayIso ? initialDate : todayIso);
  const [draft, setDraft] = useState<CycleSign>(() => signFor(date));
  const [tempText, setTempText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showInfo, setShowInfo] = useState(false);

  // Reload the form when the day changes or the saved data arrives.
  useEffect(() => {
    const s = signFor(date);
    setDraft(s);
    setTempText(s.bbtCelsius != null ? String(s.bbtCelsius) : '');
    setStatus('idle');
  }, [date, signFor]);

  const update = (patch: Partial<CycleSign>) => { setDraft((d) => ({ ...d, ...patch })); setStatus('idle'); };
  const tempValue = parseTemperature(tempText);
  const tempInvalid = tempText.trim() !== '' && tempValue == null;

  const onSave = async () => {
    if (tempInvalid) return;
    setStatus('saving');
    const ok = await saveSign({ ...draft, bbtCelsius: tempValue, notes: draft.notes?.trim() || null });
    setStatus(ok ? 'saved' : 'error');
  };

  const readings = cycleStart ? readingsInCycle(signs, cycleStart) : [];
  const shift = detectTemperatureShift(readings);
  const pattern = bbtPattern(readings);
  const fmt = (iso: string) => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(parseLocalDate(iso));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            {c.date}
            <input type="date" className={`${inputClass} w-auto`} value={date} max={todayIso} min={fromDate} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
          {date !== todayIso && (
            <button type="button" onClick={() => setDate(todayIso)} className="text-xs font-bold text-primary hover:underline">{c.today}</button>
          )}
        </div>

        {hormonal && <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl px-4 py-2.5">{c.hormonal}</p>}

        <Section icon="water_drop" title={c.spottingTitle} help={c.spottingHelp}>
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground cursor-pointer">
            <input type="checkbox" className="size-5 accent-[hsl(var(--primary))]" checked={draft.spotting} onChange={(e) => update({ spotting: e.target.checked })} />
            {c.spottingToggle}
          </label>
        </Section>

        <Section icon="thermometer" title={c.bbtTitle} help={c.bbtHelp}>
          <div className="flex items-center gap-2 max-w-[200px]">
            <input className={inputClass} inputMode="decimal" placeholder="36,50" value={tempText} onChange={(e) => { setTempText(e.target.value); setStatus('idle'); }} aria-invalid={tempInvalid} />
            <span className="text-sm text-muted-foreground">°C</span>
          </div>
          {tempInvalid && <p className="text-xs font-semibold text-destructive">{c.bbtInvalid}</p>}
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={draft.bbtDisturbed} onChange={(e) => update({ bbtDisturbed: e.target.checked })} />
            {c.bbtDisturbed}
          </label>
        </Section>

        <Section icon="opacity" title={c.mucusTitle}>
          <div className="flex flex-wrap gap-2">
            {MUCUS_ORDER.map((m) => (
              <button key={m} type="button" aria-pressed={draft.cervicalMucus === m} className={chip(draft.cervicalMucus === m)}
                onClick={() => update({ cervicalMucus: draft.cervicalMucus === m ? null : m })}>
                {c.mucus[m]}
              </button>
            ))}
          </div>
          {isFertileMucus(draft.cervicalMucus) && <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">{c.mucusFertile}</p>}
        </Section>

        {!hormonal && (
          <Section icon="science" title={c.lhTitle} help={c.lhHelp}>
            <div className="flex flex-wrap gap-2">
              {(['negative', 'positive'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={draft.lhTest === v} className={chip(draft.lhTest === v)}
                  onClick={() => update({ lhTest: draft.lhTest === v ? null : v })}>
                  {c.lh[v]}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section icon="favorite" title={c.sexTitle} help={c.sexPrivate}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">{c.sexCount}</span>
              <button type="button" aria-label="-" className="size-9 rounded-xl bg-secondary font-bold" onClick={() => update({ sexCount: Math.max(0, draft.sexCount - 1) })}>−</button>
              <span className="w-6 text-center font-bold text-foreground" aria-live="polite">{draft.sexCount}</span>
              <button type="button" aria-label="+" className="size-9 rounded-xl bg-secondary font-bold" onClick={() => update({ sexCount: Math.min(10, draft.sexCount + 1) })}>+</button>
            </div>
            {draft.sexCount > 0 && (
              <div className="flex gap-2" role="radiogroup" aria-label={c.protection}>
                {(['protected', 'unprotected'] as const).map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={draft.sexProtection === p} className={chip(draft.sexProtection === p)}
                    onClick={() => update({ sexProtection: draft.sexProtection === p ? null : p })}>
                    {c[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          {c.notes}
          <input className={inputClass} maxLength={300} value={draft.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} />
        </label>

        {(status === 'error' || error) && status !== 'saved' && <p className="text-xs font-semibold text-destructive" role="alert">{c.saveError}</p>}
        <button type="button" onClick={onSave} disabled={status === 'saving' || tempInvalid}
          className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3.5 rounded-full flex items-center justify-center gap-2 disabled:opacity-60">
          <span className="material-symbols-outlined">{status === 'saved' ? 'check_circle' : 'save'}</span>
          {status === 'saving' ? c.saving : status === 'saved' ? c.saved : c.save}
        </button>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <h3 className="text-foreground font-bold">{c.chartTitle}</h3>
          {readings.length < 2 ? (
            <p className="text-sm text-muted-foreground">{c.chartEmpty}</p>
          ) : (
            <BBTChart readings={readings} coverline={shift?.coverline} ovulationDate={shift?.ovulationDate} label={c.chartTitle} />
          )}
          {shift && <p className="text-xs text-muted-foreground">--- {c.coverline}: {shift.coverline.toFixed(2)} °C</p>}
          {!hormonal && (
            <p className={`text-sm ${pattern === 'monophasic' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {pattern === 'shift' && shift ? c.pattern.shift(fmt(shift.ovulationDate)) : pattern === 'shift' ? '' : c.pattern[pattern]}
            </p>
          )}
        </div>

        <div className="bg-card/70 border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <button type="button" onClick={() => setShowInfo((v) => !v)} aria-expanded={showInfo}
            className="flex items-center justify-between gap-2 text-left text-foreground font-bold">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[20px]">info</span>{c.infoTitle}</span>
            <span className="material-symbols-outlined">{showInfo ? 'expand_less' : 'expand_more'}</span>
          </button>
          {showInfo && c.info.map((p, i) => (
            <p key={i} className={`text-sm leading-relaxed ${i === c.info.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BodySignsPanel;
