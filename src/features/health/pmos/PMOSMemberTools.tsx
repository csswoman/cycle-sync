'use client';
import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { usePMOSOverview } from '@/hooks/usePMOSOverview';
import PeriodForecastCard from './PeriodForecastCard';
import BodyMetricsSection from './BodyMetricsSection';
import LabResultsSection from './LabResultsSection';
import { CycleStatusCard, InsightsCard, ScreeningCard } from './PMOSOverviewCards';
import WellbeingCheck from './WellbeingCheck';
import HirsutismTracker from './HirsutismTracker';
import ProgressPhotos from './ProgressPhotos';
import DoctorQuestions from './DoctorQuestions';

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

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => go(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${tab === t.id ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-foreground border-border hover:border-primary/50'}`}>
            <Icon name={t.icon} size={16} /> {t[lang]}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        loading || !data ? <p className="text-sm text-muted-foreground">{lang === 'es' ? 'Cargando…' : 'Loading…'}</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-6">
              <InsightsCard lang={lang} data={data} />
              <ScreeningCard lang={lang} data={data} onOpenLabs={() => go('labs')} />
            </div>
            <div className="flex flex-col gap-6">
              <CycleStatusCard lang={lang} data={data} />
              <PeriodForecastCard lang={lang} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <HirsutismTracker lang={lang} />
          <ProgressPhotos lang={lang} />
        </div>
      )}
      {tab === 'wellbeing' && <WellbeingCheck lang={lang} />}
      {tab === 'visit' && <DoctorQuestions lang={lang} />}
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
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            {lang === 'es' ? 'Sigue tu glucosa, análisis y ciclo' : 'Track glucose, labs and your cycle range'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {lang === 'es'
              ? 'Crea una cuenta gratis para registrar glucosa, insulina, presión, medidas y análisis, ver si tu tratamiento funciona y recibir una predicción basada en tus propios ciclos.'
              : 'Create a free account to log glucose, insulin, blood pressure, measurements and lab results, see whether your treatment is working and get a prediction based on your own cycles.'}
          </p>
        </div>
        <button onClick={() => setSignupPromptOpen(true)}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl">
          {lang === 'es' ? 'Crear cuenta' : 'Create account'}
        </button>
      </section>
    );
  }

  return <MemberContent lang={lang} />;
};

export default PMOSMemberTools;
