'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DailyLog } from '@/types';
import { toISODate } from '@/lib/cycle/cycleEngine';
import { GrowthLine, PetalFall, TitleSprig } from '@/components/ui/Botanical';

interface SymptomCount {
  name: string;
  count: number;
}

const TEXT = {
  es: {
    title: 'Mis Patrones',
    loading: 'Cargando datos...',
    analyzingDays: (n: number) => `Analizando ${n} días registrados`,
    noneLogged: 'Ninguno registrado',
    currentPhase: 'Fase Actual',
    dayOfCycle: (d: number) => `Día ${d}`,
    avgEnergy: 'Energía Promedio (30d)',
    topSymptom: 'Síntoma Principal',
    timesIn30Days: (n: number) => `${n}x en 30 días`,
    cycleVsPerformance: 'Ciclo vs. Rendimiento',
    correlatingEnergy: 'Correlación de niveles de energía con fases hormonales',
    logDailyPrompt: 'Registra tus chequeos diarios para ver tu gráfico de energía',
    noDataYet: 'Sin datos aún',
    insightBadge: 'Perspectiva',
    insightHigh: '¡Fase de Alta Energía!',
    insightSteady: 'Energía Estable',
    insightRecovery: 'Modo Recuperación',
    insightTextHigh: (avg: string) => `Tu energía promedio en los últimos 30 días es ${avg}/10. Excelente momento para avanzar en tus objetivos de entrenamiento.`,
    insightTextLow: (avg: string) => `Tu energía promedio en los últimos 30 días es ${avg}/10. Considera priorizar el descanso y la nutrición antiinflamatoria.`,
    avgSleep: 'Sueño Promedio',
    last30Days: 'Últimos 30 días',
    symptomFrequency: 'Frecuencia de Síntomas',
    noSymptomsYet: 'Aún no hay síntomas registrados. Comienza tus chequeos diarios para ver patrones.',
    didYouKnow: '¿Sabías que...?',
    readinessLabels: {
      high: 'Alta Intensidad',
      moderate: 'Moderada',
      low: 'Baja Intensidad',
    },
    readinessTags: {
      high: 'Listo para Rendir',
      moderate: 'Equilibrado',
      low: 'Enfoque en Recuperación',
    },
    phaseTips: {
      Luteal: 'En la fase Lútea, la temperatura corporal sube y la sensibilidad a la insulina disminuye. Enfócate en cardio continuo y carbohidratos complejos para manejar la hinchazón y los antojos.',
      Menstrual: 'Durante la menstruación, los niveles de hierro descienden. Incluye alimentos ricos en hierro como espinacas, lentejas y carnes magras para mantener tu energía.',
      Ovulation: 'En la ovulación, los estrógenos alcanzan su pico y puedes sentirte con más fuerza. Es el mejor momento para marcas personales y entrenamiento de alta intensidad.',
      Follicular: 'En la fase Folicular, el aumento de estrógenos mejora la recuperación. Excelente momento para aumentar el volumen de entrenamiento y probar nuevos ejercicios.',
    } as Record<string, string>,
    symptomTranslations: {
      'Mild Cramps': 'Cólicos leves',
      'Pelvic Pain': 'Dolor pélvico',
      'Bloating': 'Hinchazón',
      'Sugar Cravings': 'Antojos de azúcar',
      'Energy Crash After Meals': 'Bajón tras comer',
      'Headache': 'Dolor de cabeza',
      'Breast Tenderness': 'Sensibilidad en senos',
      'Spotting': 'Manchado',
      'Nausea / Stomach Upset': 'Náuseas / Malestar',
      'Back Pain': 'Dolor de espalda',
      'Acne Flare': 'Brote de acné',
      'Anxiety': 'Ansiedad',
      'High Libido': 'Libido alta',
      'Binge / Loss of Control': 'Atracón',
      'Emotional Eating': 'Comer emocional',
      'Skipped Meals': 'Comidas saltadas',
    } as Record<string, string>,
    phases: {
      Menstrual: 'Menstrual',
      Follicular: 'Folicular',
      Ovulation: 'Ovulación',
      Luteal: 'Lútea',
    } as Record<string, string>,
  },
  en: {
    title: 'My Patterns',
    loading: 'Loading data...',
    analyzingDays: (n: number) => `Analyzing ${n} logged days`,
    noneLogged: 'None logged',
    currentPhase: 'Current Phase',
    dayOfCycle: (d: number) => `Day ${d}`,
    avgEnergy: 'Avg Energy (30d)',
    topSymptom: 'Top Symptom',
    timesIn30Days: (n: number) => `${n}x in 30 days`,
    cycleVsPerformance: 'Cycle vs. Performance',
    correlatingEnergy: 'Correlating energy levels with hormonal phases',
    logDailyPrompt: 'Log daily check-ins to see your energy chart',
    noDataYet: 'No data yet',
    insightBadge: 'Insight',
    insightHigh: 'High Energy Phase!',
    insightSteady: 'Steady Energy',
    insightRecovery: 'Recovery Mode',
    insightTextHigh: (avg: string) => `Your average energy over the last 30 days is ${avg}/10. Great time to push your training goals.`,
    insightTextLow: (avg: string) => `Your average energy over the last 30 days is ${avg}/10. Consider prioritizing rest and anti-inflammatory nutrition.`,
    avgSleep: 'Avg Sleep',
    last30Days: 'Last 30 days',
    symptomFrequency: 'Symptom Frequency',
    noSymptomsYet: 'No symptoms logged yet. Start daily check-ins to see patterns.',
    didYouKnow: 'Did you know?',
    readinessLabels: {
      high: 'High Intensity',
      moderate: 'Moderate',
      low: 'Low Intensity',
    },
    readinessTags: {
      high: 'Performance Ready',
      moderate: 'Balanced',
      low: 'Recovery Focus',
    },
    phaseTips: {
      Luteal: 'In the Luteal phase, your body temperature rises and insulin sensitivity decreases. Focus on steady-state cardio and complex carbs to manage bloating and cravings.',
      Menstrual: 'During menstruation, iron levels drop. Include iron-rich foods like spinach, lentils, and lean red meat to maintain energy.',
      Ovulation: 'At ovulation, estrogen peaks and you may feel strongest. This is the best time for PRs and high-intensity training.',
      Follicular: 'In the Follicular phase, rising estrogen improves recovery. Great time to increase training volume and try new exercises.',
    } as Record<string, string>,
    symptomTranslations: {} as Record<string, string>,
    phases: {
      Menstrual: 'Menstrual',
      Follicular: 'Follicular',
      Ovulation: 'Ovulation',
      Luteal: 'Luteal',
    } as Record<string, string>,
  },
};

const Trends: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const tx = TEXT[isEs ? 'es' : 'en'];
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', toISODate(thirtyDaysAgo))
        .order('date', { ascending: true });

      setLogs((data as DailyLog[]) ?? []);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const symptomCounts: SymptomCount[] = (() => {
    const map: Record<string, number> = {};
    logs.forEach((log) => {
      (log.symptoms ?? []).forEach((s) => {
        map[s] = (map[s] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const rawTopSymptom = symptomCounts[0]?.name;
  const topSymptom = rawTopSymptom
    ? (tx.symptomTranslations[rawTopSymptom] ?? rawTopSymptom)
    : tx.noneLogged;
  const avgEnergy = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.energy_level ?? 0), 0) / logs.length).toFixed(1)
    : '--';

  const rawPhase = cycleInfo?.phase ?? 'Follicular';
  const displayPhase = tx.phases[rawPhase] ?? rawPhase;
  const cycleDay = cycleInfo?.cycleDay ?? 0;
  const cycleLength = cycleInfo?.cycleLength ?? 28;
  const progressPct = cycleLength > 0 ? Math.min(100, Math.round((cycleDay / cycleLength) * 100)) : 0;

  const readinessLabel = Number(avgEnergy) >= 7 ? tx.readinessLabels.high : Number(avgEnergy) >= 4 ? tx.readinessLabels.moderate : tx.readinessLabels.low;
  const readinessTag = Number(avgEnergy) >= 7 ? tx.readinessTags.high : Number(avgEnergy) >= 4 ? tx.readinessTags.moderate : tx.readinessTags.low;

  const symptomStyle = (idx: number) => {
    if (idx === 0) return 'px-4 py-2 rounded-lg bg-red-500/20 text-red-500 font-bold text-lg border border-red-500/20';
    if (idx === 1) return 'px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-base border border-orange-500/20';
    if (idx === 2) return 'px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-base border border-primary/20';
    return 'px-2 py-1 rounded-lg bg-secondary text-muted-foreground text-sm';
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">

        <section className="relative overflow-hidden rounded-3xl garden-wash wash-leaf border border-border/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <PetalFall colors={['var(--petal)', 'var(--leaf-fresh)']} count={4} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight"><TitleSprig />{tx.title}</h1>
            <p className="text-muted-foreground text-base font-normal">
              {loading ? tx.loading : tx.analyzingDays(logs.length)}
            </p>
          </div>
          <GrowthLine className="relative w-full max-w-[16rem] sm:w-64 h-auto shrink-0 self-end sm:self-auto" />
        </section>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">water_drop</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{tx.currentPhase}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-foreground text-2xl font-bold">{displayPhase}</p>
                <span className="text-primary font-semibold text-lg">{tx.dayOfCycle(cycleDay)}</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">battery_charging_full</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{tx.avgEnergy}</p>
              <p className="text-foreground text-2xl font-bold">{avgEnergy}/10 — {readinessLabel}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">{readinessTag}</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">medical_services</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{tx.topSymptom}</p>
              <p className="text-foreground text-2xl font-bold">{topSymptom}</p>
            </div>
            <div className="mt-4 flex gap-2">
              {symptomCounts.length > 0 && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {tx.timesIn30Days(symptomCounts[0].count)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart + Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-foreground text-lg font-bold">{tx.cycleVsPerformance}</h3>
                <p className="text-muted-foreground text-sm">{tx.correlatingEnergy}</p>
              </div>
            </div>
            {/* Energy bars from real data */}
            <div className="flex-1 w-full relative">
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground text-right pr-2">
                <span>10</span><span>5</span><span>0</span>
              </div>
              <div className="absolute left-10 right-0 top-2 bottom-8 flex items-end gap-[2px]">
                {logs.length > 0 ? logs.map((log) => {
                  const h = ((log.energy_level ?? 5) / 10) * 100;
                  return (
                    <div
                      key={log.id}
                      className="flex-1 bg-primary/40 hover:bg-primary/70 rounded-t transition-all"
                      style={{ height: `${h}%` }}
                      title={`${log.date}: ${log.energy_level ?? 5}/10`}
                    />
                  );
                }) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    {tx.logDailyPrompt}
                  </div>
                )}
              </div>
              <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                {logs.length > 0 ? (
                  <>
                    <span>{logs[0]?.date?.slice(5)}</span>
                    <span>{logs[logs.length - 1]?.date?.slice(5)}</span>
                  </>
                ) : (
                  <span>{tx.noDataYet}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl p-6 bg-primary text-primary-foreground shadow-lg flex flex-col justify-between min-h-[180px] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-primary-foreground/10">
                <span className="material-symbols-outlined text-[120px]">lightbulb</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="text-sm font-bold uppercase tracking-wide opacity-90 text-primary-foreground">{tx.insightBadge}</span>
                </div>
                <h4 className="text-xl font-bold leading-snug mb-2">
                  {Number(avgEnergy) >= 7 ? tx.insightHigh : Number(avgEnergy) >= 4 ? tx.insightSteady : tx.insightRecovery}
                </h4>
                <p className="opacity-90 text-sm leading-relaxed text-primary-foreground">
                  {Number(avgEnergy) >= 5 ? tx.insightTextHigh(avgEnergy) : tx.insightTextLow(avgEnergy)}
                </p>
              </div>
            </div>

            <div className="flex-1 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col">
              <h3 className="text-foreground text-lg font-bold mb-4">{tx.avgSleep}</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <span className="material-symbols-outlined">bedtime</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tx.last30Days}</p>
                  <p className="text-lg font-bold text-foreground">
                    {logs.length > 0
                      ? `${(logs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / logs.length).toFixed(1)}h`
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Symptom Cloud */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-foreground text-lg font-bold">{tx.symptomFrequency}</h3>
              <span className="text-xs text-muted-foreground">{tx.last30Days}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {symptomCounts.length > 0 ? symptomCounts.map((s, i) => {
                const label = tx.symptomTranslations[s.name] ?? s.name;
                return (
                  <div key={s.name} className={symptomStyle(i)}>
                    {label} ({s.count})
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-sm">{tx.noSymptomsYet}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl p-6 bg-secondary border border-border/50 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full shrink-0">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground text-lg font-bold">{tx.didYouKnow}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {tx.phaseTips[rawPhase] ?? tx.phaseTips.Follicular}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;
