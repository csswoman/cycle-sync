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
import { usesHormonalContraception } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { addDays, toISODate } from '@/lib/cycle/cycleEngine';

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
  const hormonal = usesHormonalContraception(useOnboardingAnswers());
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
  const tabs: { id: Tab; icon: string; label: string; badge?: string }[] = [
    { id: 'today', icon: 'mood', label: lang === 'es' ? 'Hoy' : 'Today', badge: saved ? '✓' : undefined },
    { id: 'body', icon: 'thermometer', label: lang === 'es' ? 'Cuerpo y fertilidad' : 'Body & fertility' },
    { id: 'symptoms', icon: 'monitor_heart', label: lang === 'es' ? 'Síntomas PMOS' : 'PMOS symptoms', badge: `${symptomSummary.total}/${symptomSummary.max}` },
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
      id: 'symptoms', icon: 'monitor_heart', label: es ? 'Síntomas PMOS' : 'PMOS symptoms',
      detail: es ? 'Acné, vello, caída de cabello, ánimo…' : 'Acne, hair growth, hair loss, mood…', done: false,
    },
    {
      id: 'body', icon: 'thermometer', label: es ? 'Cuerpo y fertilidad' : 'Body & fertility',
      detail: es ? 'Temperatura, moco cervical, pruebas' : 'Temperature, cervical mucus, tests', done: false,
    },
  ];
  // The day count can pass the typical length when the period is late.
  const progressPct = Math.min(100, Math.round((cycleDay / cycleLength) * 100));

  const buttonLabel = saving ? (lang === 'es' ? 'Guardando...' : 'Saving...') : saved ? (lang === 'es' ? 'Actualizado ✓' : 'Updated ✓') : (lang === 'es' ? 'Completar registro' : 'Complete Check-in');

  return (
    <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">{lang === 'es' ? 'Registro diario' : 'Daily Log'}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              <p className="text-sm font-medium">
                {cycleLoading ? (lang === 'es' ? 'Cargando...' : 'Loading...') : lang === 'es' ? `Registra tu día · Día ${cycleDay} del ciclo` : `Log your symptoms and mood for Day ${cycleDay}`}
              </p>
            </div>
          </div>
        </div>

        <div role="tablist" className="flex gap-2 overflow-x-auto -mt-2 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${tab === t.id ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-foreground border-border hover:border-primary/50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
              {t.badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tab === t.id ? 'bg-primary-foreground/20' : 'bg-secondary text-muted-foreground'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
        {tab === 'body' && (
          <BodySignsPanel
            lang={lang}
            hormonal={hormonal}
            initialDate={bodyDate}
            cycleStart={cycleInfo && !cycleLoading ? toISODate(addDays(new Date(), -(cycleInfo.cycleDay - 1))) : null}
          />
        )}
        {tab === 'symptoms' && (
          <SymptomCheckin lang={lang} configured={configuredSymptoms} setConfigured={setConfiguredSymptoms} onSummary={setSymptomSummary} />
        )}
        <div className={tab === 'meds' ? '' : 'hidden'}>
          <Medications embedded onSummary={setMedSummary} />
        </div>
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${tab === 'today' ? '' : 'hidden'}`}>
          <div className="lg:col-span-8 flex flex-col gap-6">
            <MoodSelector lang={lang} selectedMood={selectedMood} onMoodSelect={(m) => { setSelectedMood(m); setSaved(false); }} />

            <VitalsInputs
              energyLevel={energyLevel}
              onEnergyLevelChange={(v) => { setEnergyLevel(v); setSaved(false); }}
              sleepHours={sleepHours}
              onSleepHoursChange={(v) => { setSleepHours(v); setSaved(false); }}
              sleepQuality={sleepQuality}
              onSleepQualityChange={(v) => { setSleepQuality(v); setSaved(false); }}
              lang={lang}
            />

            <SymptomGrid lang={lang} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />

            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-base sm:text-lg font-bold py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-3 transition-all shadow-md shadow-blossom/20 disabled:opacity-60"
            >
              <span className="material-symbols-outlined">{saved ? 'check_circle' : 'save'}</span>
              {buttonLabel}
            </button>
          </div>

          {/* Sidebar Context */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-card via-card to-blossom-soft/40 border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-9xl text-foreground">water_drop</span>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-1 relative z-10">{lang === 'es' ? 'Fase del ciclo' : 'Cycle phase'}</h3>
              <p className="text-primary font-bold text-2xl mb-4 relative z-10">
                {insight.name}
                {irregular && <span className="text-sm font-semibold text-muted-foreground"> · {lang === 'es' ? 'estimada' : 'estimated'}</span>}
              </p>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs text-muted-foreground">{lang === 'es' ? 'Día' : 'Day'} {cycleDay}</span>
                <span className="text-xs text-foreground font-bold">{insight.hormone}</span>
                <span className="text-xs text-muted-foreground">{lang === 'es' ? 'Día' : 'Day'} {cycleLength}</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full bg-gradient-to-r from-blossom to-coral rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed relative z-10">
                {insight.tip}
              </p>
              {irregular && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed relative z-10 border-t border-border pt-3">
                  {lang === 'es'
                    ? 'Con PMOS los ciclos pueden variar y no siempre hay ovulación, así que la fase es una estimación. Registrar temperatura y moco cervical en “Cuerpo y fertilidad” la hace más precisa.'
                    : 'With PMOS cycles can vary and ovulation does not always happen, so the phase is an estimate. Logging temperature and cervical mucus under “Body & fertility” makes it more accurate.'}
                </p>
              )}
            </div>

            <div className="bg-card/70 border border-border rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
              <h4 className="text-foreground font-bold">{lang === 'es' ? 'Tu día de un vistazo' : 'Your day at a glance'}</h4>
              {glanceRows.map((row) => (
                <button key={row.id} onClick={() => { setTab(row.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-3 text-left rounded-xl p-2 -mx-2 hover:bg-secondary transition-colors">
                  <span className={`size-9 shrink-0 rounded-xl flex items-center justify-center ${row.done ? 'bg-emerald-500/15 text-emerald-600' : 'bg-blossom-soft text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{row.done ? 'check_circle' : row.icon}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-foreground">{row.label}</span>
                    <span className="block text-xs text-muted-foreground truncate">{row.detail}</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground">chevron_right</span>
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
