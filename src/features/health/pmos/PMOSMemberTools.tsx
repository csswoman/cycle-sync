'use client';
import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { usePMOSOverview } from '@/hooks/usePMOSOverview';
import PeriodForecastCard from './PeriodForecastCard';
import BodyMetricsSection from './BodyMetricsSection';
import LabResultsSection from './LabResultsSection';
import { CycleStatusCard, InsightsCard, MealGlucoseCard, ScreeningCard } from './PMOSOverviewCards';
import WellbeingCheck from './WellbeingCheck';
import HirsutismTracker from './HirsutismTracker';
import ProgressPhotos from './ProgressPhotos';
import DoctorQuestions from './DoctorQuestions';
import DiagnosisCard from './DiagnosisCard';
import { InductionCycleCard, PregnancyGlucoseCard, PregnancyMedicationCard, PreconceptionCard } from '@/features/pregnancy/PregnancyCards';
import { activePregnancy, predictionsPaused } from '@/lib/cycle/pregnancy';

type Tab = 'summary' | 'labs' | 'skin' | 'wellbeing' | 'visit';
const TABS: { id: Tab; icon: string; es: string; en: string }[] = [
  { id: 'summary', icon: 'insights', es: 'Resumen', en: 'Summary' },
  { id: 'labs', icon: 'biotech', es: 'Análisis y medidas', en: 'Labs & measurements' },
  { id: 'skin', icon: 'spa', es: 'Piel y vello', en: 'Skin & hair' },
  { id: 'wellbeing', icon: 'favorite', es: 'Bienestar', en: 'Wellbeing' },
  { id: 'visit', icon: 'stethoscope', es: 'Mi cita', en: 'My appointment' },
];

const MemberContent: React.FC<{ lang: 'es' | 'en' }> = ({ lang }) => {
  const [tab, setTab] = useState<Tab>('summary');
  const { data, loading } = usePMOSOverview();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (TABS.some((t) => t.id === requested)) setTab(requested as Tab);
  }, []);

  const go = (next: Tab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url);
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1
      : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    go(TABS[next].id);
    document.getElementById(`pmos-tab-${TABS[next].id}`)?.focus();
  };

  const pregnancy = data ? activePregnancy(data.pregnancies, data.today) : null;
  const paused = data ? predictionsPaused(data.periodStarts.at(-1) ?? null, data.pregnancies, data.today) : false;
  return (
    <div className="flex flex-col gap-6">
      <div className="relative -mx-4 sm:mx-0">
        <div
          role="tablist"
          aria-label={lang === 'es' ? 'Secciones de PMOS' : 'PMOS sections'}
          onKeyDown={onTabKey}
          className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 snap-x scroll-px-4 scrollbar-hide"
        >
          {TABS.map((t) => (
            <button key={t.id} id={`pmos-tab-${t.id}`} role="tab" type="button" aria-selected={tab === t.id}
              aria-controls={`pmos-panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} onClick={() => go(t.id)}
              className={`snap-start shrink-0 flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/50'}`}>
              <Icon name={t.icon} size={18} /> {t[lang]}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`pmos-panel-${tab}`} aria-labelledby={`pmos-tab-${tab}`} className="flex flex-col gap-6">
      {tab === 'summary' && (
        loading || !data ? <p className="text-sm text-muted-foreground">{lang === 'es' ? 'Cargando…' : 'Loading…'}</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
            <div className="flex flex-col gap-6">
              {activePregnancy(data.pregnancies, data.today) && <PregnancyMedicationCard lang={lang} />}
              <DiagnosisCard lang={lang} />
              <InsightsCard lang={lang} data={data} />
              <MealGlucoseCard lang={lang} data={data} />
              <ScreeningCard lang={lang} data={data} onOpenLabs={() => go('labs')} />
            </div>
            <div className="flex flex-col gap-6">
              {pregnancy && <PregnancyGlucoseCard lang={lang} data={data} pregnancy={pregnancy} />}
              {!paused && <PreconceptionCard lang={lang} data={data} />}
              <InductionCycleCard lang={lang} data={data} />
              {!paused && <CycleStatusCard lang={lang} data={data} />}
              {!paused && <PeriodForecastCard lang={lang} />}
            </div>
          </div>
        )
      )}
      {tab === 'labs' && (
        <div className="flex flex-col gap-6">
          <LabResultsSection lang={lang} />
          <BodyMetricsSection lang={lang} />
        </div>
      )}
      {tab === 'skin' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 items-start">
          <HirsutismTracker lang={lang} />
          <ProgressPhotos lang={lang} />
        </div>
      )}
      {tab === 'wellbeing' && <WellbeingCheck lang={lang} />}
      {tab === 'visit' && <DoctorQuestions lang={lang} data={data} onOpenLabs={() => go('labs')} />}
      </div>
    </div>
  );
};

/** Tracking tools that store personal health data, so they only render for signed-in users. */
const PMOSMemberTools: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const authReady = useAppStore((s) => s.authReady);
  const setSignupPromptOpen = useAppStore((s) => s.setSignupPromptOpen);
  const { language } = useLanguage();
  const lang: 'es' | 'en' = language === 'es' ? 'es' : 'en';

  if (!authReady) return null;

  if (!user) {
    return (
      <section className="bg-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-lg font-semibold tracking-tight flex items-center gap-2 text-balance">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">lock</span>
            {lang === 'es' ? 'Sigue tu glucosa, análisis y ciclo' : 'Track glucose, labs and your cycle range'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base text-pretty max-w-[60ch]">
            {lang === 'es'
              ? 'Crea una cuenta gratis para registrar glucosa, insulina, presión, medidas y análisis, ver si tu tratamiento funciona y recibir una predicción basada en tus propios ciclos.'
              : 'Create a free account to log glucose, insulin, blood pressure, measurements and lab results, see whether your treatment is working and get a prediction based on your own cycles.'}
          </p>
        </div>
        <button onClick={() => setSignupPromptOpen(true)}
          className="shrink-0 min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 rounded-full">
          {lang === 'es' ? 'Crear cuenta' : 'Create account'}
        </button>
      </section>
    );
  }

  return <MemberContent lang={lang} />;
};

export default PMOSMemberTools;
