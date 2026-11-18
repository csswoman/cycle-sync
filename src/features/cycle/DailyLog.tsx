'use client';

import React, { useState, useEffect } from 'react';
import { Mood, type CyclePhase } from '@/types';
import { MoodSelector } from './components/MoodSelector';
import { VitalsInputs, type SleepQuality } from './components/VitalsInputs';
import { SymptomGrid } from './components/SymptomGrid';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { localDateString } from '@/hooks/useMedications';
import { saveDailyLogOffline, getLocalDailyLog } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';
import { useLanguage } from '@/i18n/LanguageContext';
import SymptomCheckin, { type SymptomSummary } from '@/features/health/pmos/SymptomCheckin';
import { useConfiguredSymptoms } from '@/features/health/pmos/useConfiguredSymptoms';
import Medications, { type MedicationSummary } from '@/features/medications/Medications';
import BodySignsPanel from './components/BodySignsPanel';
import { showsPmosTools, usesHormonalContraception } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { addDays, toISODate } from '@/lib/cycle/cycleEngine';
import { Bloom } from '@/components/ui/Bloom';
import { TitleSprig } from '@/components/ui/Botanical';
import { bloomGrowth, bloomTone } from '@/lib/cycle/bloom';

type Tab = 'today' | 'body' | 'symptoms' | 'meds';

type PhaseInsight = { name: string; tip: string; hormone: string };
const phaseInsights: Record<'es' | 'en', Record<string, PhaseInsight>> = {
  en: {
    Menstrual: { name: 'Menstrual', tip: 'Focus on iron-rich foods and gentle movement. Your body is shedding — rest is productive.', hormone: 'Low estrogen & progesterone' },
    Follicular: { name: 'Follicular', tip: 'Energy is rising: a good time for strength training, which also improves insulin sensitivity.', hormone: 'Rising estrogen' },
    Ovulation: { name: 'Ovulation', tip: 'If you ovulate this cycle you may feel more energetic. Pair carbs with protein and fiber to keep blood sugar steady.', hormone: 'Possible fertile window' },
    Luteal: { name: 'Luteal', tip: 'Cravings can rise. Prioritise magnesium-rich foods, protein at every meal and gentle movement after eating.', hormone: 'Higher progesterone' },
  },
  es: {
    Menstrual: { name: 'Menstrual', tip: 'Prioriza alimentos ricos en hierro y movimiento suave. Descansar también es avanzar.', hormone: 'Estrógeno y progesterona bajos' },
    Follicular: { name: 'Folicular', tip: 'Tu energía sube: buen momento para fuerza, que además mejora la sensibilidad a la insulina.', hormone: 'Estrógeno en aumento' },
    Ovulation: { name: 'Ovulación', tip: 'Si ovulas este ciclo, puedes sentir más energía. Acompaña los carbohidratos con proteína y fibra para mantener estable la glucosa.', hormone: 'Posible ventana fértil' },
    Luteal: { name: 'Lútea', tip: 'Los antojos pueden aumentar. Prioriza magnesio, proteína en cada comida y caminar un poco después de comer.', hormone: 'Progesterona más alta' },
  },
};

const DailyLog: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.OKAY);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { language } = useLanguage();
  const lang: 'es' | 'en' = language === 'es' ? 'es' : 'en';
  const [tab, setTab] = useState<Tab>('today');
  const [bodyDate, setBodyDate] = useState<string | undefined>(undefined);
  const onboarding = useOnboardingAnswers();
  const hormonal = usesHormonalContraception(onboarding);
  const showPmos = showsPmosTools(onboarding);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab');
    if (requested === 'symptoms' || requested === 'meds' || requested === 'today' || requested === 'body') setTab(requested);
    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setBodyDate(date);
  }, []);
  const [configuredSymptoms, setConfiguredSymptoms] = useConfiguredSymptoms();
  const [symptomSummary, setSymptomSummary] = useState<SymptomSummary>({ total: 0, max: 18 });
  const [medSummary, setMedSummary] = useState<MedicationSummary>({ taken: 0, total: 0 });
  const focusTab = (id: Tab) => {
    setTab(id);
    document.getElementById(`log-tab-${id}`)?.focus({ preventScroll: true });
  };
  const tabs: { id: Tab; icon: string; label: string; badge?: string; badgeIcon?: string }[] = [
    { id: 'today', icon: 'mood', label: lang === 'es' ? 'Hoy' : 'Today', badgeIcon: saved ? 'check' : undefined },
    { id: 'body', icon: 'thermometer', label: lang === 'es' ? 'Cuerpo y fertilidad' : 'Body & fertility' },
    { id: 'symptoms', icon: 'monitor_heart', label: lang === 'es' ? 'Síntomas hormonales' : 'Hormonal symptoms', badge: `${symptomSummary.total}/${symptomSummary.max}` },
    { id: 'meds', icon: 'medication', label: lang === 'es' ? 'Medicación' : 'Medication', badge: medSummary.total ? `${medSummary.taken}/${medSummary.total}` : undefined },
  ];

  useEffect(() => {
    async function loadTodayLog() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const today = localDateString();
      const local = await getLocalDailyLog(user.id, today);
      if (local && !local.synced) {
        // Pending local edits win over the remote copy.
        setSelectedMood((local.mood as Mood) || Mood.OKAY);
        setEnergyLevel(local.energyLevel ?? 5);
        setSleepHours(local.sleepHours ?? 7);
        setActiveSymptoms(local.symptoms ?? []);
        setSleepQuality((local.sleepQuality as SleepQuality | null) ?? null);
        setSaved(true);
        return;
      }
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data) {
        setSelectedMood((data.mood as Mood) || Mood.OKAY);
        setEnergyLevel(data.energy_level ?? 5);
        setSleepHours(data.sleep_hours ?? 7);
        setActiveSymptoms(data.symptoms ?? []);
        setSleepQuality((data.sleep_quality as SleepQuality | null) ?? null);
        setSaved(true);
      }
    }
    loadTodayLog();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const today = localDateString();
      await saveDailyLogOffline({
        userId: user.id,
        date: today,
        mood: selectedMood,
        energyLevel,
        sleepHours,
        sleepQuality,
        symptoms: activeSymptoms,
        notes: null,
      });
      if (navigator.onLine) await syncAll();
      setSaved(true);
    } catch (err) {
      console.error('Error saving daily log:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSaved(false);
    setActiveSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const phase = cycleInfo?.phase ?? 'Follicular';
  const cycleDay = cycleInfo?.cycleDay ?? 1;
  const cycleLength = cycleInfo?.cycleLength ?? 28;
  const insight = phaseInsights[lang][phase] ?? phaseInsights[lang].Follicular;
  const irregular = !!cycleInfo?.irregular;
  const es = lang === 'es';
  const glanceRows: { id: Tab; icon: string; label: string; detail: string; done: boolean }[] = [
    {
      id: 'meds', icon: 'medication', label: es ? 'Medicación' : 'Medication',
      detail: medSummary.total
        ? (es ? `${medSummary.taken} de ${medSummary.total} tomas hoy` : `${medSummary.taken} of ${medSummary.total} doses today`)
        : (es ? 'Sin tomas programadas hoy' : 'No doses scheduled today'),
      done: medSummary.total > 0 && medSummary.taken === medSummary.total,
    },
    {
      id: 'symptoms', icon: 'monitor_heart', label: es ? 'Síntomas hormonales' : 'Hormonal symptoms',
      detail: es ? 'Acné, vello, caída de cabello, ánimo…' : 'Acne, hair growth, hair loss, mood…', done: false,
    },
    {
      id: 'body', icon: 'thermometer', label: es ? 'Cuerpo y fertilidad' : 'Body & fertility',
      detail: es ? 'Temperatura, moco cervical, pruebas' : 'Temperature, cervical mucus, tests', done: false,
    },
  ];
  // The day count can pass the typical length when the period is late.
  const progressPct = Math.min(100, Math.round((cycleDay / cycleLength) * 100));

  const buttonLabel = saving ? (lang === 'es' ? 'Guardando…' : 'Saving…') : saved ? (lang === 'es' ? 'Registro guardado' : 'Check-in saved') : (lang === 'es' ? 'Completar registro' : 'Complete Check-in');

  return (
    <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight text-balance"><TitleSprig bud={null} />{lang === 'es' ? 'Registro diario' : 'Daily Log'}</h1>
          <p className="flex items-center gap-2 text-muted-foreground text-base">
            <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">calendar_today</span>
            {cycleLoading ? (lang === 'es' ? 'Cargando…' : 'Loading…') : lang === 'es' ? `Registra tu día · Día ${cycleDay} del ciclo` : `Log your symptoms and mood for Day ${cycleDay}`}
          </p>
        </header>

        <div
          role="tablist"
          aria-label={lang === 'es' ? 'Secciones del registro' : 'Log sections'}
          className="-mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-1"
          onKeyDown={(e) => {
            const i = tabs.findIndex((t) => t.id === tab);
            if (e.key === 'ArrowRight') { e.preventDefault(); focusTab(tabs[(i + 1) % tabs.length].id); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); focusTab(tabs[(i - 1 + tabs.length) % tabs.length].id); }
            else if (e.key === 'Home') { e.preventDefault(); focusTab(tabs[0].id); }
            else if (e.key === 'End') { e.preventDefault(); focusTab(tabs[tabs.length - 1].id); }
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`log-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`log-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`snap-start shrink-0 flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground border-primary shadow-[var(--shadow-low)]' : 'bg-card text-foreground border-border hover:border-primary/50'}`}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{t.icon}</span>
              {t.label}
              {(t.badge || t.badgeIcon) && (
                <span className={`inline-flex items-center justify-center min-w-6 h-6 text-xs font-semibold px-2 rounded-full tabular-nums ${tab === t.id ? 'bg-primary-foreground/20' : 'bg-secondary text-muted-foreground'}`}>
                  {t.badgeIcon ? <span className="material-symbols-outlined text-[14px]" aria-label={lang === 'es' ? 'Guardado' : 'Saved'}>{t.badgeIcon}</span> : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'body' && (
          <div role="tabpanel" id="log-panel-body" aria-labelledby="log-tab-body">
            <BodySignsPanel
              lang={lang}
              hormonal={hormonal}
              initialDate={bodyDate}
              cycleStart={cycleInfo && !cycleLoading ? toISODate(addDays(new Date(), -(cycleInfo.cycleDay - 1))) : null}
            />
          </div>
        )}
        {tab === 'symptoms' && (
          <div role="tabpanel" id="log-panel-symptoms" aria-labelledby="log-tab-symptoms">
            <SymptomCheckin lang={lang} configured={configuredSymptoms} setConfigured={setConfiguredSymptoms} onSummary={setSymptomSummary} />
          </div>
        )}
        <div role="tabpanel" id="log-panel-meds" aria-labelledby="log-tab-meds" className={tab === 'meds' ? '' : 'hidden'}>
          <Medications embedded onSummary={setMedSummary} />
        </div>
        <div role="tabpanel" id="log-panel-today" aria-labelledby="log-tab-today" className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${tab === 'today' ? '' : 'hidden'}`}>
          <div className="lg:col-span-8 bg-card border border-border rounded-3xl shadow-[var(--shadow-low)] divide-y divide-border">
            <div className="p-5 sm:p-6">
              <MoodSelector lang={lang} selectedMood={selectedMood} onMoodSelect={(m) => { setSelectedMood(m); setSaved(false); }} />
            </div>
            <div className="p-5 sm:p-6">
              <VitalsInputs
                energyLevel={energyLevel}
                onEnergyLevelChange={(v) => { setEnergyLevel(v); setSaved(false); }}
                sleepHours={sleepHours}
                onSleepHoursChange={(v) => { setSleepHours(v); setSaved(false); }}
                sleepQuality={sleepQuality}
                onSleepQualityChange={(v) => { setSleepQuality(v); setSaved(false); }}
                lang={lang}
              />
            </div>
            <div className="p-5 sm:p-6">
              <SymptomGrid lang={lang} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
            </div>
            <div className="p-5 sm:p-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || saved}
                className="w-full min-h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-[var(--shadow-low)] disabled:opacity-60"
              >
                <span className="material-symbols-outlined" aria-hidden="true">{saved ? 'check_circle' : 'save'}</span>
                {buttonLabel}
              </button>
            </div>
          </div>

          {/* Sidebar Context */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-4">
            <div data-phase={bloomTone(phase)} className="phase-wash border border-border rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-[var(--shadow-low)]">
              <Bloom
                growth={bloomGrowth(cycleDay, cycleInfo?.ovulationDay ?? Math.max(1, cycleLength - 14))}
                tone={bloomTone(phase)}
                className="absolute -top-1 right-1 h-28 w-auto opacity-90"
              />
              <h2 className="text-muted-foreground font-medium text-sm mb-1 relative z-10">{lang === 'es' ? 'Fase del ciclo' : 'Cycle phase'}</h2>
              <p className="text-phase font-semibold text-3xl mb-4 relative z-10 pr-16 text-balance">
                {insight.name}
                {irregular && <span className="text-sm font-semibold text-muted-foreground"> · {lang === 'es' ? 'estimada' : 'estimated'}</span>}
              </p>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-muted-foreground tabular-nums">{lang === 'es' ? 'Día' : 'Day'} {cycleDay}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{lang === 'es' ? 'Día' : 'Day'} {cycleLength}</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden relative z-10" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={lang === 'es' ? 'Avance del ciclo' : 'Cycle progress'}>
                <div
                  className="h-full bg-phase rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-foreground mt-4 relative z-10">{insight.hormone}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed relative z-10">
                {insight.tip}
              </p>
              {irregular && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed relative z-10 border-t border-border pt-3">
                  {lang === 'es'
                    ? `${showPmos ? 'Con PMOS los ciclos pueden variar' : 'Tus ciclos recientes han variado'} y no siempre hay ovulación, así que la fase es una estimación. Registrar temperatura y moco cervical en “Cuerpo y fertilidad” la hace más precisa.`
                    : `${showPmos ? 'With PMOS cycles can vary' : 'Your recent cycles have varied'} and ovulation does not always happen, so the phase is an estimate. Logging temperature and cervical mucus under “Body & fertility” makes it more accurate.`}
                </p>
              )}
            </div>

            <div className="bg-card/70 border border-border rounded-3xl p-5 sm:p-6 flex flex-col gap-2">
              <h2 className="text-foreground font-semibold text-base">{lang === 'es' ? 'Tu día de un vistazo' : 'Your day at a glance'}</h2>
              {glanceRows.map((row) => (
                <button key={row.id} type="button" onClick={() => { setTab(row.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-3 text-left rounded-2xl p-2 -mx-2 min-h-14 hover:bg-secondary transition-colors">
                  <span className={`size-9 shrink-0 rounded-xl flex items-center justify-center ${row.done ? 'bg-leaf/15 text-leaf' : 'bg-blossom-soft text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{row.done ? 'check_circle' : row.icon}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{row.label}</span>
                    <span className="block text-sm text-muted-foreground truncate">{row.detail}</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground" aria-hidden="true">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLog;
