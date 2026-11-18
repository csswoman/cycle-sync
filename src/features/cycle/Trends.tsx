'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DailyLog } from '@/types';
import { estimateCycle, parseLocalDate, toISODate, addDays } from '@/lib/cycle/cycleEngine';
import { GrowthLine, PetalFall, TitleSprig } from '@/components/ui/Botanical';
import { SYMPTOMS } from '@/features/cycle/components/SymptomGrid';

type Range = 7 | 30 | 90;
type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
const RANGES: Range[] = [7, 30, 90];
const PHASE_KEYS: PhaseKey[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
const MIN_DAYS_FOR_INSIGHT = 7;

const TEXT = {
  es: {
    title: 'Mis patrones',
    loading: 'Cargando datos…',
    analyzing: (n: number, days: number) => `${n} ${n === 1 ? 'día registrado' : 'días registrados'} en los últimos ${days} días`,
    rangeLabel: 'Periodo',
    rangeOption: (d: number) => `${d} días`,
    emptyTitle: 'Aún no hay registros en este periodo',
    emptyBody: 'Cuando registres tu energía, sueño y síntomas, aquí verás cómo cambian a lo largo de tu ciclo.',
    logToday: 'Registrar hoy',
    currentPhase: 'Fase actual',
    dayOfCycle: (d: number) => `Día ${d}`,
    noCycle: 'Sin ciclo registrado',
    phaseNote: 'Estimación según tus periodos registrados',
    setupCycle: 'Registrar mi último periodo',
    avgEnergy: 'Energía promedio',
    avgSleep: 'Sueño promedio',
    outOfTen: 'de 10',
    noValue: 'Sin datos',
    chartTitle: 'Energía según tu ciclo',
    chartSub: 'Cada barra es un día. El color indica la fase del ciclo.',
    noPhase: 'Sin fase calculada',
    energy: 'Energía',
    noEnergyDay: 'sin registro',
    tableDate: 'Fecha',
    tablePhase: 'Fase',
    tableEnergy: 'Energía (0 a 10)',
    pickDay: 'Toca una barra para ver el detalle de ese día.',
    insightTitle: 'Lo que muestran tus registros',
    insightHigh: (avg: string) => `Tu energía promedio es ${avg} de 10. Puede ser un buen momento para avanzar con tu entrenamiento, según cómo te sientas.`,
    insightMid: (avg: string) => `Tu energía promedio es ${avg} de 10, estable. Ajusta el ritmo según cómo te sientas cada día.`,
    insightLow: (avg: string) => `Tu energía promedio es ${avg} de 10. Podrías darle más lugar al descanso y a comidas que te sienten bien. Si te preocupa, coméntalo con tu médica.`,
    insightNeed: (n: number) => `Con ${n} días más de energía registrada podremos mostrarte un resumen.`,
    symptomTitle: 'Síntomas más frecuentes',
    symptomSub: 'Cuántos días registraste cada uno. No indica gravedad.',
    days: (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`,
    noSymptoms: 'No registraste síntomas en este periodo.',
    cyclesTitle: 'Duración de tus ciclos',
    cyclesSub: 'Días entre el inicio de un periodo y el siguiente.',
    cyclesNote: 'Con PMOS es frecuente que los ciclos varíen. Llevar este registro te ayuda a explicárselo a tu médica.',
    cyclesNone: 'Registra al menos dos periodos para ver la duración de tus ciclos.',
    cycleDays: (n: number) => `${n} d`,
    tipTitle: 'Para tener en cuenta en esta fase',
    phaseTips: {
      luteal: 'En la fase lútea suele subir la temperatura corporal y bajar la sensibilidad a la insulina. Cardio continuo y carbohidratos complejos pueden ayudar con la hinchazón y los antojos.',
      menstrual: 'Durante la menstruación bajan los niveles de hierro. Alimentos como espinacas, lentejas o carnes magras pueden ayudarte a mantener la energía.',
      ovulation: 'En la ovulación los estrógenos llegan a su pico y muchas personas se sienten con más fuerza. Puede ser buen momento para entrenar con más intensidad.',
      follicular: 'En la fase folicular, el aumento de estrógenos suele mejorar la recuperación. Puede ser buen momento para subir el volumen de entrenamiento o probar ejercicios nuevos.',
    } as Record<PhaseKey, string>,
    phases: { menstrual: 'Menstrual', follicular: 'Folicular', ovulation: 'Ovulación', luteal: 'Lútea' } as Record<PhaseKey, string>,
  },
  en: {
    title: 'My patterns',
    loading: 'Loading data…',
    analyzing: (n: number, days: number) => `${n} ${n === 1 ? 'day' : 'days'} logged in the last ${days} days`,
    rangeLabel: 'Period',
    rangeOption: (d: number) => `${d} days`,
    emptyTitle: 'No entries in this period yet',
    emptyBody: 'Once you log your energy, sleep and symptoms, you will see how they change across your cycle here.',
    logToday: 'Log today',
    currentPhase: 'Current phase',
    dayOfCycle: (d: number) => `Day ${d}`,
    noCycle: 'No cycle logged',
    phaseNote: 'Estimate based on your logged periods',
    setupCycle: 'Log my last period',
    avgEnergy: 'Average energy',
    avgSleep: 'Average sleep',
    outOfTen: 'out of 10',
    noValue: 'No data',
    chartTitle: 'Energy across your cycle',
    chartSub: 'Each bar is a day. Color shows the cycle phase.',
    noPhase: 'No phase calculated',
    energy: 'Energy',
    noEnergyDay: 'not logged',
    tableDate: 'Date',
    tablePhase: 'Phase',
    tableEnergy: 'Energy (0 to 10)',
    pickDay: 'Tap a bar to see that day.',
    insightTitle: 'What your entries show',
    insightHigh: (avg: string) => `Your average energy is ${avg} out of 10. It may be a good time to push your training, depending on how you feel.`,
    insightMid: (avg: string) => `Your average energy is ${avg} out of 10, fairly steady. Adjust your pace to how you feel each day.`,
    insightLow: (avg: string) => `Your average energy is ${avg} out of 10. You could make more room for rest and meals that feel good. If it worries you, mention it to your doctor.`,
    insightNeed: (n: number) => `Log energy on ${n} more days and we can show you a summary.`,
    symptomTitle: 'Most frequent symptoms',
    symptomSub: 'How many days you logged each one. It does not show severity.',
    days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
    noSymptoms: 'You did not log symptoms in this period.',
    cyclesTitle: 'Your cycle lengths',
    cyclesSub: 'Days between the start of one period and the next.',
    cyclesNote: 'With PMOS it is common for cycles to vary. Keeping this record helps you explain it to your doctor.',
    cyclesNone: 'Log at least two periods to see your cycle lengths.',
    cycleDays: (n: number) => `${n} d`,
    tipTitle: 'Worth keeping in mind in this phase',
    phaseTips: {
      luteal: 'In the luteal phase body temperature often rises and insulin sensitivity drops. Steady cardio and complex carbs can help with bloating and cravings.',
      menstrual: 'During your period iron levels drop. Foods like spinach, lentils or lean meat can help keep your energy up.',
      ovulation: 'At ovulation estrogen peaks and many people feel stronger. It can be a good time for higher-intensity training.',
      follicular: 'In the follicular phase, rising estrogen often improves recovery. It can be a good time to add training volume or try new exercises.',
    } as Record<PhaseKey, string>,
    phases: { menstrual: 'Menstrual', follicular: 'Follicular', ovulation: 'Ovulation', luteal: 'Luteal' } as Record<PhaseKey, string>,
  },
};

const average = (values: (number | null | undefined)[]): number | null => {
  const real = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return real.length ? real.reduce((s, v) => s + v, 0) / real.length : null;
};

interface PeriodRow { start_date: string; end_date: string | null }

const Trends: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const tx = TEXT[isEs ? 'es' : 'en'];
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(isEs ? 'es' : 'en', { day: 'numeric', month: 'short' }), [isEs]);

  const [range, setRange] = useState<Range>(30);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [hasLastPeriod, setHasLastPeriod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }
      const since = addDays(new Date(), -(range - 1));
      const [logsRes, periodsRes, configRes] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', toISODate(since)).order('date', { ascending: true }),
        supabase.from('periods').select('start_date,end_date').eq('user_id', user.id).order('start_date', { ascending: true }),
        supabase.from('cycle_config').select('last_period_start').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setLogs((logsRes.data as DailyLog[]) ?? []);
      setPeriods((periodsRes.data as PeriodRow[]) ?? []);
      setHasLastPeriod(Boolean(configRes.data?.last_period_start));
      setPicked(null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [range]);

  const estimate = useMemo(() => estimateCycle(periods, cycleInfo?.cycleLength), [periods, cycleInfo?.cycleLength]);

  const phaseFor = useMemo(() => {
    const starts = periods.map((p) => p.start_date.slice(0, 10)).sort();
    return (iso: string): PhaseKey | null => {
      let ref: string | null = null;
      for (const s of starts) { if (s <= iso) ref = s; else break; }
      if (!ref) return null;
      const day = Math.round((parseLocalDate(iso).getTime() - parseLocalDate(ref).getTime()) / 86400000) + 1;
      if (day <= estimate.periodLength) return 'menstrual';
      if (day < estimate.ovulationDay) return 'follicular';
      if (day <= estimate.ovulationDay + 1) return 'ovulation';
      return 'luteal';
    };
  }, [periods, estimate]);

  const days = useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.date.slice(0, 10), l]));
    const today = new Date();
    return Array.from({ length: range }, (_, i) => {
      const iso = toISODate(addDays(today, -(range - 1 - i)));
      const log = byDate.get(iso);
      const energy = typeof log?.energy_level === 'number' ? log.energy_level : null;
      return { iso, energy, phase: phaseFor(iso) };
    });
  }, [logs, range, phaseFor]);

  const symptomLabel = (key: string) => (isEs ? SYMPTOMS.find((s) => s.key === key)?.es ?? key : key);
  const symptomCounts = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => (l.symptoms ?? []).forEach((s) => { map[s] = (map[s] || 0) + 1; }));
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [logs]);

  const energyDays = days.filter((d) => d.energy !== null).length;
  const avgEnergyNum = average(logs.map((l) => l.energy_level));
  const avgSleepNum = average(logs.map((l) => l.sleep_hours));
  const avgEnergy = avgEnergyNum !== null ? avgEnergyNum.toFixed(1) : null;
  const avgSleep = avgSleepNum !== null ? `${avgSleepNum.toFixed(1)} h` : null;

  const hasCycle = periods.length > 0 || hasLastPeriod;
  const phaseKey: PhaseKey | null = hasCycle && cycleInfo
    ? (cycleInfo.phase.toLowerCase() as PhaseKey)
    : null;
  const empty = !loading && logs.length === 0;
  const cycleLengths = estimate.lengths.slice(-8);
  const maxLength = Math.max(...cycleLengths, 1);
  const phaseRuns = days.reduce<{ phase: PhaseKey | null; len: number }[]>((runs, d) => {
    const last = runs[runs.length - 1];
    if (last && last.phase === d.phase) last.len += 1; else runs.push({ phase: d.phase, len: 1 });
    return runs;
  }, []);
  const pickedDay = days.find((d) => d.iso === picked) ?? null;
  const barLabel = (d: { iso: string; energy: number | null; phase: PhaseKey | null }) =>
    `${dateFmt.format(parseLocalDate(d.iso))} · ${d.phase ? tx.phases[d.phase] : tx.noPhase} · ${tx.energy} ${d.energy !== null ? `${d.energy}/10` : tx.noEnergyDay}`;

  const card = 'rounded-3xl bg-card border border-border shadow-sm';

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 pb-32">
        <section className="relative overflow-hidden rounded-3xl garden-wash wash-leaf border border-border/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
          <PetalFall colors={['var(--petal)', 'var(--leaf-fresh)']} count={4} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-balance"><TitleSprig />{tx.title}</h1>
            <p className="text-muted-foreground text-base" aria-live="polite">
              {loading || cycleLoading ? tx.loading : tx.analyzing(logs.length, range)}
            </p>
          </div>
          <GrowthLine className="relative hidden sm:block sm:w-48 h-auto shrink-0" />
        </section>

        <div
          role="radiogroup"
          aria-label={tx.rangeLabel}
          className="flex gap-2"
          onKeyDown={(e) => {
            const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            const next = RANGES[(RANGES.indexOf(range) + step + RANGES.length) % RANGES.length];
            setRange(next);
            e.currentTarget.querySelector<HTMLButtonElement>(`[data-range="${next}"]`)?.focus();
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              data-range={r}
              tabIndex={range === r ? 0 : -1}
              aria-checked={range === r}
              onClick={() => setRange(r)}
              className={`h-10 px-4 rounded-full text-sm font-medium border transition-colors ${
                range === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'
              }`}
            >
              {tx.rangeOption(r)}
            </button>
          ))}
        </div>

        {empty ? (
          <section className={`${card} p-6 sm:p-8 flex flex-col items-start gap-4`}>
            <span className="material-symbols-outlined text-primary" aria-hidden="true">edit_calendar</span>
            <div className="flex flex-col gap-1 max-w-prose">
              <h2 className="text-foreground text-xl font-semibold">{tx.emptyTitle}</h2>
              <p className="text-muted-foreground text-base leading-relaxed">{tx.emptyBody}</p>
            </div>
            <Link href="/log" className="px-5 h-10 inline-flex items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {tx.logToday}
            </Link>
          </section>
        ) : (
          <>
            <section className={`${card} grid grid-cols-1 md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-border`}>
              <div className="p-5 sm:p-6 flex flex-col gap-1" data-phase={phaseKey ?? undefined}>
                <p className="text-muted-foreground text-sm">{tx.currentPhase}</p>
                {phaseKey ? (
                  <>
                  <p className="text-foreground text-2xl font-semibold flex items-baseline gap-2">
                    <span className="inline-block size-2.5 rounded-full bg-[var(--phase)]" aria-hidden="true" />
                    {tx.phases[phaseKey]}
                    <span className="text-muted-foreground text-base font-medium">{tx.dayOfCycle(cycleInfo?.cycleDay ?? 1)}</span>
                  </p>
                  <p className="text-muted-foreground text-sm">{tx.phaseNote}</p>
                  </>
                ) : (
                  <>
                    <p className="text-foreground text-2xl font-semibold">{tx.noCycle}</p>
                    <Link href="/cycle-setup" className="text-primary text-sm font-medium underline underline-offset-4 w-fit min-h-10 inline-flex items-center">{tx.setupCycle}</Link>
                  </>
                )}
              </div>
              <div className="p-5 sm:p-6 flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">{tx.avgEnergy}</p>
                <p className="text-foreground text-2xl font-semibold tabular-nums">
                  {avgEnergy ?? tx.noValue}
                  {avgEnergy && <span className="text-muted-foreground text-base font-medium"> {tx.outOfTen}</span>}
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">{tx.avgSleep}</p>
                <p className="text-foreground text-2xl font-semibold tabular-nums">{avgSleep ?? tx.noValue}</p>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className={`${card} lg:col-span-2 p-5 sm:p-6 flex flex-col gap-4`} aria-labelledby="trends-chart-title">
                <div>
                  <h2 id="trends-chart-title" className="text-foreground text-lg font-semibold">{tx.chartTitle}</h2>
                  <p className="text-muted-foreground text-sm">{tx.chartSub}</p>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {PHASE_KEYS.map((k) => (
                    <li key={k} data-phase={k} className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[var(--phase)]" aria-hidden="true" />{tx.phases[k]}
                    </li>
                  ))}
                </ul>
                <div className="relative h-56 sm:h-64 mt-6" aria-hidden="true">
                  <div className="absolute left-8 right-0 -top-6 h-5 flex gap-px">
                    {phaseRuns.map((run, i) => (
                      <div
                        key={i}
                        data-phase={run.phase ?? undefined}
                        style={{ flexGrow: run.len }}
                        className={`min-w-0 rounded-sm text-[11px] leading-5 px-1 truncate ${run.phase ? 'bg-[var(--phase-soft)] text-[var(--phase)] font-medium' : 'bg-secondary'}`}
                      >
                        {run.phase && run.len >= Math.max(3, range / 10) ? tx.phases[run.phase] : ''}
                      </div>
                    ))}
                  </div>
                  <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between text-xs text-muted-foreground tabular-nums">
                    <span>10</span><span>5</span><span>0</span>
                  </div>
                  <div className="absolute left-8 right-0 top-2 bottom-6 border-b border-border">
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" />
                    <div className="absolute inset-0 flex items-end" style={{ gap: range === 90 ? 1 : 2 }}>
                      {days.map((d) => (
                        <div
                          key={d.iso}
                          data-phase={d.phase ?? undefined}
                          onClick={() => setPicked(d.iso)}
                          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setPicked(d.iso); }}
                          className="flex-1 h-full flex items-end"
                        >
                          {d.energy !== null && (
                            <div
                              className={`w-full rounded-t-sm transition-opacity ${d.phase ? 'bg-[var(--phase)]' : 'bg-muted-foreground/50'} ${picked && picked !== d.iso ? 'opacity-50' : 'opacity-90'}`}
                              style={{ height: `${Math.max(d.energy, 0.4) * 10}%` }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-8 right-0 bottom-0 h-5 flex justify-between text-xs text-muted-foreground">
                    <span>{dateFmt.format(parseLocalDate(days[0].iso))}</span>
                    <span>{dateFmt.format(parseLocalDate(days[days.length - 1].iso))}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground min-h-5" aria-hidden="true">
                  {pickedDay ? barLabel(pickedDay) : <span className="text-muted-foreground">{tx.pickDay}</span>}
                </p>
                <table className="sr-only">
                  <caption>{tx.chartTitle}</caption>
                  <thead><tr><th>{tx.tableDate}</th><th>{tx.tablePhase}</th><th>{tx.tableEnergy}</th></tr></thead>
                  <tbody>
                    {days.filter((d) => d.energy !== null).map((d) => (
                      <tr key={d.iso}><td>{dateFmt.format(parseLocalDate(d.iso))}</td><td>{d.phase ? tx.phases[d.phase] : tx.noPhase}</td><td>{d.energy}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <div className="flex flex-col gap-6 lg:self-start">
                <section className="rounded-3xl bg-secondary border border-border/50 p-5 sm:p-6 flex flex-col gap-2">
                  <h2 className="text-foreground text-lg font-semibold">{tx.insightTitle}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {avgEnergy !== null && energyDays >= MIN_DAYS_FOR_INSIGHT
                      ? (avgEnergyNum! >= 7 ? tx.insightHigh(avgEnergy) : avgEnergyNum! >= 4 ? tx.insightMid(avgEnergy) : tx.insightLow(avgEnergy))
                      : tx.insightNeed(MIN_DAYS_FOR_INSIGHT - energyDays)}
                  </p>
                </section>
                {phaseKey && (
                  <section className={`${card} p-5 sm:p-6 flex items-start gap-3`} data-phase={phaseKey}>
                    <span className="material-symbols-outlined text-[var(--phase)] shrink-0" aria-hidden="true">eco</span>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-foreground text-lg font-semibold">{tx.tipTitle}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">{tx.phaseTips[phaseKey]}</p>
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className={`${card} p-5 sm:p-6 flex flex-col gap-4`}>
                <div>
                  <h2 className="text-foreground text-lg font-semibold">{tx.symptomTitle}</h2>
                  <p className="text-muted-foreground text-sm">{tx.symptomSub}</p>
                </div>
                {symptomCounts.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {symptomCounts.map((s) => (
                      <li key={s.name} className="flex flex-col gap-1">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-foreground">{symptomLabel(s.name)}</span>
                          <span className="text-muted-foreground tabular-nums shrink-0">{tx.days(s.count)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary" aria-hidden="true">
                          <div className="h-1.5 rounded-full bg-primary/60" style={{ width: `${(s.count / symptomCounts[0].count) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">{tx.noSymptoms}</p>
                )}
              </section>

              <section className={`${card} p-5 sm:p-6 flex flex-col gap-4`}>
                <div>
                  <h2 className="text-foreground text-lg font-semibold">{tx.cyclesTitle}</h2>
                  <p className="text-muted-foreground text-sm">{tx.cyclesSub}</p>
                </div>
                {cycleLengths.length > 0 ? (
                  <>
                    <ul className="flex flex-col gap-3">
                      {cycleLengths.map((len, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary" aria-hidden="true">
                            <div className="h-1.5 rounded-full bg-leaf-fresh" style={{ width: `${(len / maxLength) * 100}%` }} />
                          </div>
                          <span className="text-foreground tabular-nums w-10 text-right">{tx.cycleDays(len)}</span>
                        </li>
                      ))}
                    </ul>
                    {estimate.irregular && <p className="text-muted-foreground text-sm leading-relaxed">{tx.cyclesNote}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">{tx.cyclesNone}</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trends;
