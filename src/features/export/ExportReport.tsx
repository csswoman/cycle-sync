'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DailyLog, PMOSSymptomEntry, Habit, HabitLog } from '@/types';
import { toISODate } from '@/lib/cycle/cycleEngine';
import { usePMOSOverview } from '@/hooks/usePMOSOverview';
import { usePmosToolsVisible } from '@/hooks/useOnboardingAnswers';
import { buildPMOSReport } from './buildPMOSReport';
import { GardenCorner, PetalDrift, TitleSprig } from '@/components/ui/Botanical';

const TEXT = {
  es: {
    title: 'Reporte Médico',
    subtitle: 'Genera un reporte PDF completo para compartir con tu profesional de la salud.',
    cardTitle: 'Reporte de salud CycleSync',
    cardSubtitle: 'Datos integrales de ciclo y bienestar',
    reportContents: 'Contenido del reporte',
    dailyLogs: 'Registros diarios',
    pmosEntries: 'Registros de síntomas hormonales',
    activeHabits: 'Hábitos activos',
    includedSections: 'Secciones incluidas',
    sections: [
      { icon: 'water_drop', label: 'Resumen de fase, día y duración del ciclo', color: 'text-primary' },
      { icon: 'monitoring', label: 'Tendencias de energía, sueño y estado de ánimo (30 días)', color: 'text-moss' },
      { icon: 'medical_services', label: 'Severidad de síntomas hormonales con alertas clínicas', color: 'text-destructive' },
      { icon: 'bar_chart', label: 'Análisis de frecuencia de síntomas principales', color: 'text-sun-ink' },
      { icon: 'check_circle', label: 'Tasas de cumplimiento de hábitos (7 días)', color: 'text-leaf' },
      { icon: 'calendar_month', label: 'Duración de ciclos, días desde el último período y ovulación por ciclo', color: 'text-primary' },
      { icon: 'medication', label: 'Medicamentos, indicaciones médicas y adherencia (30 días)', color: 'text-primary' },
      { icon: 'biotech', label: 'Últimos análisis de laboratorio, HOMA-IR, índice de andrógenos libres y presión arterial', color: 'text-primary' },
      { icon: 'spa', label: 'Tendencia de puntuación de hirsutismo (mFG)', color: 'text-primary' },
      { icon: 'chat', label: 'Tus preguntas pendientes para la consulta médica', color: 'text-primary' },
    ],
    includeWellbeing: 'Incluir mi último chequeo de ánimo, ansiedad y sueño (PHQ-2 / GAD-2)',
    includeWellbeingSubtext: 'Desactivado por defecto por ser sensible. Las fotos de progreso y la actividad sexual nunca se incluyen.',
    generating: 'Generando...',
    downloadPdf: 'Descargar Reporte PDF',
    disclaimer: 'Este reporte se genera a partir de tus datos autorregistrados y tiene como fin orientar a profesionales de la salud durante las consultas. No constituye asesoramiento ni diagnóstico médico. Consulta siempre a un profesional sanitario cualificado para decisiones médicas.',
    locale: 'es-ES',
    defaultPatient: 'Paciente',
  },
  en: {
    title: 'Medical Report',
    subtitle: 'Generate a comprehensive PDF report to share with your healthcare provider.',
    cardTitle: 'CycleSync Health Report',
    cardSubtitle: 'Comprehensive cycle & wellness data',
    reportContents: 'Report Contents',
    dailyLogs: 'Daily Logs',
    pmosEntries: 'Hormonal symptom entries',
    activeHabits: 'Active Habits',
    includedSections: 'Included Sections',
    sections: [
      { icon: 'water_drop', label: 'Cycle phase, day, and length overview', color: 'text-primary' },
      { icon: 'monitoring', label: 'Energy, sleep, and mood trends (30 days)', color: 'text-moss' },
      { icon: 'medical_services', label: 'Hormonal symptom severity with clinical alerts', color: 'text-destructive' },
      { icon: 'bar_chart', label: 'Top symptom frequency analysis', color: 'text-sun-ink' },
      { icon: 'check_circle', label: 'Habit completion rates (7 days)', color: 'text-leaf' },
      { icon: 'calendar_month', label: 'Cycle lengths, days since last period and ovulation per cycle', color: 'text-primary' },
      { icon: 'medication', label: "Medications, doctor's instructions and adherence (30 days)", color: 'text-primary' },
      { icon: 'biotech', label: 'Latest labs, HOMA-IR, free androgen index and blood pressure', color: 'text-primary' },
      { icon: 'spa', label: 'Hirsutism score (mFG) trend', color: 'text-primary' },
      { icon: 'chat', label: 'Your pending questions for the doctor', color: 'text-primary' },
    ],
    includeWellbeing: 'Include my latest mood, anxiety and sleep check-in (PHQ-2 / GAD-2)',
    includeWellbeingSubtext: 'Off by default because it is sensitive. Progress photos and sexual activity are never included.',
    generating: 'Generating...',
    downloadPdf: 'Download PDF Report',
    disclaimer: 'This report is generated from your self-reported data and is intended to assist healthcare providers during consultations. It does not constitute medical advice or diagnosis. Always consult a qualified healthcare professional for medical decisions.',
    locale: 'en-US',
    defaultPatient: 'Patient',
  },
};

export default function ExportReport() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const tx = TEXT[isEs ? 'es' : 'en'];
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { data: overview, loading: overviewLoading } = usePMOSOverview();
  const showPmos = usePmosToolsVisible();
  const [includeWellbeing, setIncludeWellbeing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    dailyLogCount: 0,
    pmosEntryCount: 0,
    habitCount: 0,
  });

  const [reportData, setReportData] = useState<{
    userName: string;
    cycleLength: number;
    lastPeriodStart: string | null;
    dailyLogs: DailyLog[];
    pmosEntries: PMOSSymptomEntry[];
    habits: Habit[];
    habitLogs: HabitLog[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = toISODate(thirtyDaysAgo);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekStr = toISODate(sevenDaysAgo);

      const [configRes, logsRes, pmosRes, habitsRes, habitLogsRes] = await Promise.all([
        supabase.from('cycle_config').select('*').eq('user_id', user.id).single(),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', dateStr).order('date'),
        supabase.from('pcos_symptoms').select('*').eq('user_id', user.id).gte('date', dateStr).order('date'),
        supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', weekStr),
      ]);

      const dailyLogs = (logsRes.data as DailyLog[]) ?? [];
      const pmosEntries = (pmosRes.data as PMOSSymptomEntry[]) ?? [];
      const habits = (habitsRes.data as Habit[]) ?? [];
      const habitLogs = (habitLogsRes.data as HabitLog[]) ?? [];

      setStats({
        dailyLogCount: dailyLogs.length,
        pmosEntryCount: pmosEntries.length,
        habitCount: habits.length,
      });

      setReportData({
        userName: user.user_metadata?.full_name || user.email || tx.defaultPatient,
        cycleLength: configRes.data?.cycle_length ?? 28,
        lastPeriodStart: configRes.data?.last_period_start ?? null,
        dailyLogs,
        pmosEntries,
        habits,
        habitLogs,
      });

      setLoading(false);
    }
    loadData();
  }, [tx.defaultPatient]);

  const handleGenerate = async () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      const [{ generateMedicalReport }, { default: jsPDF }] = await Promise.all([
        import('@/services/medicalReportService'),
        import('jspdf'),
      ]);
      const pmos = overview ? await buildPMOSReport(overview, includeWellbeing, isEs ? 'es' : 'en') : undefined;
      generateMedicalReport(
        {
          ...reportData,
          lang: isEs ? 'es' : 'en',
          pmos,
          cycleInfo: cycleInfo ?? null,
          generatedAt: new Date().toLocaleDateString(tx.locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        jsPDF,
      );
    } finally {
      setGenerating(false);
    }
  };

  const isLoading = loading || cycleLoading || overviewLoading;

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 flex flex-col gap-10 pb-32">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl garden-wash border border-border/80 shadow-sm p-6 sm:p-8">
          <GardenCorner variant="blossom" className="size-32 sm:size-44 opacity-80" />
          <PetalDrift className="absolute top-4 right-[38%] w-24 opacity-60 hidden sm:block" />
          <div className="relative flex flex-col gap-2 pr-24 sm:pr-44">
            <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              <TitleSprig />{tx.title}
            </h1>
            <p className="text-muted-foreground text-base">
              {tx.subtitle}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contents */}
          <div className="lg:col-span-8 bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            <section className="p-6 sm:p-8 flex flex-col gap-5">
              <h2 className="text-foreground font-semibold text-base">{tx.reportContents}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
                {[
                  { icon: 'calendar_today', color: 'text-moss', value: stats.dailyLogCount, label: tx.dailyLogs },
                  { icon: 'medical_services', color: 'text-blossom', value: stats.pmosEntryCount, label: tx.pmosEntries },
                  { icon: 'check_circle', color: 'text-leaf', value: stats.habitCount, label: tx.activeHabits },
                ].map((s) => (
                  <div key={s.label} className="flex items-start gap-3 min-w-0">
                    <span className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center" aria-hidden>
                      <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
                    </span>
                    <div className="flex flex-col min-w-0">
                      <dd className="text-foreground font-semibold text-2xl tabular-nums leading-tight order-first">{isLoading ? '...' : s.value}</dd>
                      <dt className="text-muted-foreground text-sm leading-snug">{s.label}</dt>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section className="p-6 sm:p-8 flex flex-col gap-5">
              <h2 className="text-foreground font-semibold text-base">{tx.includedSections}</h2>
              <ul className="flex flex-col gap-4">
                {tx.sections.filter((item) => showPmos || item.icon !== 'spa').map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-[20px] shrink-0 ${item.color}`} aria-hidden>{item.icon}</span>
                    <span className="text-foreground text-sm leading-snug">{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Action panel */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            <div className="p-6 sm:p-8 flex flex-col gap-5">
              <div>
                <h2 className="text-foreground font-semibold text-base">{tx.cardTitle}</h2>
                <p className="text-muted-foreground text-sm">{tx.cardSubtitle}</p>
              </div>
              <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer min-h-10">
                <input type="checkbox" className="size-5 mt-0.5 shrink-0 accent-primary" checked={includeWellbeing} onChange={(e) => setIncludeWellbeing(e.target.checked)} />
                <span>
                  {tx.includeWellbeing}
                  <span className="block text-sm text-muted-foreground mt-1">{tx.includeWellbeingSubtext}</span>
                </span>
              </label>
              <button
                onClick={handleGenerate}
                disabled={isLoading || generating || !reportData}
                className="w-full min-h-12 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 font-semibold text-base hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" aria-hidden>progress_activity</span>
                    {tx.generating}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" aria-hidden>download</span>
                    {tx.downloadPdf}
                  </>
                )}
              </button>
            </div>
            <p className="p-6 sm:p-8 text-muted-foreground text-sm leading-relaxed flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden>info</span>
              <span>{tx.disclaimer}</span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
