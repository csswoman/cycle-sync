'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useCycleSigns } from '@/hooks/useCycleSigns';
import { addDays, parseLocalDate, toISODate } from '@/lib/cycle/cycleEngine';
import { gestationalAge, type Pregnancy } from '@/lib/cycle/pregnancy';
import { inductionCycleRows } from '@/lib/cycle/induction';
import { fertileNow, type FertileNow } from '@/lib/pmos/cycleStatus';
import { gestationalGlucosePlan } from '@/lib/pmos/screening';
import type { CycleOverview } from '@/hooks/useCycleOverview';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
type Lang = 'es' | 'en';
const shell = 'relative overflow-hidden rounded-3xl border border-border/80 garden-wash shadow-sm p-6 sm:p-7 flex flex-col gap-4';
const panel = 'bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4';
const fmt = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(parseLocalDate(iso));

/* ---------------- Medication reminder, fixed during a pregnancy ---------------- */
export const PregnancyMedicationCard: React.FC<{ lang: Lang }> = ({ lang }) => {
  const es = lang === 'es';
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
      <Icon name="medication" size={20} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-foreground">{es ? 'Revisa tu medicación con tu médica' : 'Review your medication with your doctor'}</p>
        <p className="text-sm text-muted-foreground">
          {es
            ? 'Pregunta qué medicación continuar y cuál no. No dejes ni cambies ningún tratamiento por tu cuenta.'
            : 'Ask which medication to continue and which not to. Do not stop or change any treatment on your own.'}
        </p>
      </div>
    </div>
  );
};

/* ---------------- Dashboard: replaces the cycle card while predictions are paused ---------------- */
export const PregnancyHero: React.FC<{ overview: CycleOverview; lang: Lang }> = ({ overview, lang }) => {
  const es = lang === 'es';
  const { pregnancy, endPregnancy } = overview;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const today = toISODate(new Date());
  const age = pregnancy ? gestationalAge(pregnancy, today) : null;
  const leave = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await endPregnancy(today);
    setBusy(false);
    setFailed(!ok);
  };
  if (!pregnancy) {
    return (
      <div className={shell}>
        <h2 className="text-foreground text-xl sm:text-2xl font-semibold">{es ? 'Predicciones en pausa' : 'Predictions paused'}</h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          {es ? 'Volverán cuando registres tu siguiente regla. Hasta entonces no se muestran fechas de regla, ovulación ni alertas de retraso.'
            : 'They return when you log your next period. Until then no period, ovulation or late-period dates are shown.'}
        </p>
        <Link href="/period-history" className="self-start px-5 h-10 inline-flex items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          {es ? 'Registrar mi regla' : 'Log my period'}
        </Link>
      </div>
    );
  }
  return (
    <div className={shell}>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {es ? 'Modo embarazo' : 'Pregnancy mode'}
          {age ? ` · ${es ? `semana ${age.weeks + 1}` : `week ${age.weeks + 1}`}` : ''}
        </p>
        <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight">
          {es ? 'Tus predicciones están en pausa' : 'Your predictions are paused'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {es ? 'No se muestran la próxima regla, la ventana fértil, las alertas de retraso ni las recomendaciones por fase del ciclo.'
            : 'The next period, fertile window, late-period alerts and cycle-phase recommendations are hidden.'}
        </p>
      </div>
      <PregnancyMedicationCard lang={lang} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={leave} disabled={busy}
          className="px-5 h-10 rounded-xl border border-border bg-secondary/50 text-foreground font-bold text-sm hover:bg-secondary disabled:opacity-60">
          {es ? 'Salir del modo embarazo' : 'Leave pregnancy mode'}
        </button>
        <p className="text-xs text-muted-foreground">
          {es ? 'Tus predicciones vuelven con la siguiente regla que registres.' : 'Your predictions return with the next period you log.'}
        </p>
      </div>
      {failed && <p role="alert" className="text-sm text-destructive">{es ? 'No se pudo guardar. Inténtalo de nuevo.' : 'Could not save. Try again.'}</p>}
    </div>
  );
};

/* ---------------- Trying to conceive: fertile window, body signs first ---------------- */
const REASON: Record<FertileNow['reasons'][number], { es: string; en: string }> = {
  eggwhite_mucus: { es: 'flujo de clara de huevo', en: 'egg-white mucus' },
  watery_mucus: { es: 'flujo acuoso', en: 'watery mucus' },
  lh_positive: { es: 'LH positiva', en: 'positive LH' },
  temperature_shift: { es: 'subida de temperatura', en: 'temperature rise' },
};
export const FertilityWindowCard: React.FC<{ overview: CycleOverview; lang: Lang }> = ({ overview, lang }) => {
  const es = lang === 'es';
  const { info, estimate, lastPeriodStart, answers } = overview;
  const today = toISODate(new Date());
  const from = toISODate(addDays(new Date(), -45));
  const { signs } = useCycleSigns(from);
  const state = useMemo(() => fertileNow(signs, lastPeriodStart, today), [signs, lastPeriodStart, today]);
  if (overview.paused || !info || !estimate || answers.goal !== 'fertility') return null;
  const calendar = lastPeriodStart
    ? {
        start: toISODate(addDays(parseLocalDate(lastPeriodStart), estimate.fertileStartDay - 1)),
        end: toISODate(addDays(parseLocalDate(lastPeriodStart), estimate.fertileEndDay - 1)),
      }
    : null;
  const headline = {
    high: es ? 'Tus señales apuntan a un momento fértil' : 'Your signs point to a fertile time',
    possible: es ? 'Podrías estar en tu ventana fértil' : 'You may be in your fertile window',
    passed: es ? 'Tu temperatura indica que la ovulación ya ocurrió en este ciclo' : 'Your temperature shows ovulation already happened this cycle',
    calendar: es ? 'Sin señales recientes' : 'No recent signs',
  }[state.level];
  return (
    <section className={panel}>
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Icon name="child_care" size={20} /></div>
        <div>
          <h3 className="text-foreground text-lg font-bold">{es ? 'Buscando embarazo: tu ventana fértil' : 'Trying to conceive: your fertile window'}</h3>
          <p className="text-sm font-semibold text-foreground">{headline}</p>
        </div>
      </div>
      {state.reasons.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {es ? 'Según: ' : 'Based on: '}{state.reasons.map((r) => REASON[r][lang]).join(', ')}.
          {state.reasons.length === 1 && state.reasons[0] === 'lh_positive' && (es
            ? ' Con PMOS una LH positiva sola puede ser un falso positivo.'
            : ' With PMOS a positive LH alone can be a false positive.')}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {state.level === 'calendar'
          ? (es ? 'Registra temperatura, flujo y tiras de LH en Cuerpo y fertilidad: con ciclos irregulares valen más que el calendario. '
              : 'Log temperature, mucus and LH strips in Body & fertility: with irregular cycles they count for more than the calendar. ')
          : (es ? 'El calendario es solo una referencia: ' : 'The calendar is only a reference: ')}
        {calendar && (es ? `estimación por calendario del ${fmt(calendar.start, lang)} al ${fmt(calendar.end, lang)}, poco fiable si tus ciclos varían.`
          : `calendar estimate ${fmt(calendar.start, lang)} to ${fmt(calendar.end, lang)}, unreliable if your cycles vary.`)}
      </p>
      <Link href="/log?tab=body" className="self-start text-sm font-bold text-primary hover:underline">
        {es ? 'Registrar señales del cuerpo →' : 'Log body signs →'}
      </Link>
    </section>
  );
};

/* ---------------- PMOS summary: preconception list ---------------- */
export const PreconceptionCard: React.FC<{ lang: Lang; data: PMOSOverviewData }> = ({ lang, data }) => {
  const es = lang === 'es';
  const glucose = gestationalGlucosePlan({
    goal: data.goal, gestationalWeeks: null, pregnancyStart: null, today: data.today,
    glucoseDates: [...data.fastingGlucose.map((g) => g.date), ...data.labs.filter((l) => ['hba1c', 'fasting_glucose', 'glucose_2h'].includes(l.marker)).map((l) => l.date)],
  });
  if (data.goal !== 'fertility' || glucose.length === 0) return null;
  const yearAgo = toISODate(addDays(parseLocalDate(data.today), -365));
  const bp = data.bloodPressureDates.some((d) => d >= yearAgo);
  const items: { done: boolean | null; es: string; en: string }[] = [
    { done: null, es: 'Ácido fólico: pregunta a tu médica la dosis antes de empezar.', en: 'Folic acid: ask your doctor about the dose before you start.' },
    { done: null, es: 'Revisión de medicación: algunos medicamentos no se usan al buscar o durante un embarazo.', en: 'Medication review: some medicines are not used when trying to conceive or during pregnancy.' },
    { done: glucose[0].done, es: 'Control de glucosa en el último año.', en: 'Glucose check in the last year.' },
    { done: bp, es: 'Presión arterial en el último año.', en: 'Blood pressure in the last year.' },
  ];
  return (
    <section className={panel}>
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Icon name="checklist" size={20} /></div>
        <div>
          <h3 className="text-foreground text-lg font-bold">{es ? 'Antes de buscar embarazo' : 'Before trying to conceive'}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{es ? 'Para comentar con tu médica. No sustituye su indicación.' : 'To discuss with your doctor. It does not replace their advice.'}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.en} className="flex items-start gap-2.5 rounded-xl border border-border p-3 text-sm text-foreground">
            <Icon name={it.done === null ? 'radio_button_unchecked' : it.done ? 'check_circle' : 'schedule'} size={18}
              className={it.done ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-muted-foreground shrink-0 mt-0.5'} />
            <span>{es ? it.es : it.en}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ---------------- PMOS summary: glucose curve reminders during a pregnancy ---------------- */
export const PregnancyGlucoseCard: React.FC<{ lang: Lang; data: PMOSOverviewData; pregnancy: Pregnancy }> = ({ lang, data, pregnancy }) => {
  const es = lang === 'es';
  const age = gestationalAge(pregnancy, data.today);
  const items = gestationalGlucosePlan({
    goal: data.goal, gestationalWeeks: age?.weeks ?? null, pregnancyStart: pregnancy.start_date, today: data.today,
    glucoseDates: [...data.fastingGlucose.map((g) => g.date), ...data.labs.filter((l) => ['hba1c', 'fasting_glucose', 'glucose_2h'].includes(l.marker)).map((l) => l.date)],
  });
  if (!items.length) return null;
  const label = {
    early_ogtt: { es: 'Curva de glucosa en la primera visita', en: 'Glucose tolerance test at the first visit' },
    ogtt_24_28: { es: 'Curva de glucosa entre las semanas 24 y 28', en: 'Glucose tolerance test between weeks 24 and 28' },
    preconception_glucose: { es: 'Control de glucosa', en: 'Glucose check' },
  } as const;
  return (
    <section className={panel}>
      <h3 className="text-foreground text-lg font-bold">{es ? 'Controles de glucosa en el embarazo' : 'Glucose checks in pregnancy'}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.key} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm text-foreground">
            <span>{label[it.key][lang]}</span>
            <span className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${it.done ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
              {it.done ? (es ? 'Con registro' : 'Logged') : (es ? 'Pendiente de registrar' : 'Not logged')}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{es ? 'Tu médica decide cuándo hacerlas.' : 'Your doctor decides when to do them.'}</p>
    </section>
  );
};

/* ---------------- PMOS summary: induction cycle on one screen ---------------- */
export const InductionCycleCard: React.FC<{ lang: Lang; data: PMOSOverviewData }> = ({ lang, data }) => {
  const es = lang === 'es';
  const med = data.medications.find((m) => m.active && m.is_ovulation_induction && m.induction_cycle_days?.length);
  const cycleStart = data.periodStarts.filter((s) => s <= data.today).at(-1) ?? null;
  const rows = useMemo(() => {
    if (!med || !cycleStart) return [];
    const taken = data.medLogs.filter((l) => l.medication_id === med.id && l.taken).map((l) => String(l.date).slice(0, 10));
    return inductionCycleRows(cycleStart, data.today, med.induction_cycle_days as number[], data.signs, taken);
  }, [med, cycleStart, data]);
  if (!med || !cycleStart) return null;
  const yn = (v: 'negative' | 'positive' | null) => (v ? (v === 'positive' ? (es ? 'Positiva' : 'Positive') : (es ? 'Negativa' : 'Negative')) : '–');
  return (
    <section className={panel}>
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Icon name="timeline" size={20} /></div>
        <div>
          <h3 className="text-foreground text-lg font-bold">{es ? 'Ciclo de inducción' : 'Induction cycle'}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {es ? `${med.name} · ciclo iniciado el ${fmt(cycleStart, lang)}` : `${med.name} · cycle started ${fmt(cycleStart, lang)}`}
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{es ? 'Aún no hay días para mostrar.' : 'No days to show yet.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1.5 pr-3 font-semibold">{es ? 'Día' : 'Day'}</th>
                <th className="py-1.5 pr-3 font-semibold">{es ? 'Medicación' : 'Medication'}</th>
                <th className="py-1.5 pr-3 font-semibold">{es ? 'Temp.' : 'Temp.'}</th>
                <th className="py-1.5 pr-3 font-semibold">LH</th>
                <th className="py-1.5 font-semibold">{es ? 'Embarazo' : 'Pregnancy'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-t border-border text-foreground">
                  <td className="py-1.5 pr-3">{r.cycleDay} <span className="text-xs text-muted-foreground">{fmt(r.date, lang)}</span></td>
                  <td className="py-1.5 pr-3">{r.scheduled ? (r.taken ? (es ? 'Tomada' : 'Taken') : (es ? 'Pautada' : 'Scheduled')) : '–'}</td>
                  <td className="py-1.5 pr-3">{r.bbtCelsius != null ? `${r.bbtCelsius.toFixed(2)} °C` : '–'}</td>
                  <td className="py-1.5 pr-3">{yn(r.lhTest)}</td>
                  <td className="py-1.5">{yn(r.pregnancyTest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
