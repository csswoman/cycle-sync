'use client';

import React, { useState, useEffect } from 'react';
import { Mood, type CyclePhase } from '@/types';
import { MoodSelector } from './components/MoodSelector';
import { VitalsInputs } from './components/VitalsInputs';
import { SymptomGrid } from './components/SymptomGrid';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { saveDailyLogOffline, getLocalDailyLog } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';
import { useLanguage } from '@/i18n/LanguageContext';
import SymptomCheckin, { type SymptomSummary } from '@/features/health/pmos/SymptomCheckin';
import { useConfiguredSymptoms } from '@/features/health/pmos/useConfiguredSymptoms';
import Medications, { type MedicationSummary } from '@/features/medications/Medications';

type Tab = 'today' | 'symptoms' | 'meds';

const phaseInsights: Record<string, { tip: string; hormone: string }> = {
  Menstrual: { tip: 'Focus on iron-rich foods and gentle movement. Your body is shedding — rest is productive.', hormone: 'Low Estrogen & Progesterone' },
  Follicular: { tip: 'Energy is rising! Great time for strength training and trying new recipes with leafy greens.', hormone: 'Rising Estrogen' },
  Ovulation: { tip: 'Estrogen peaks — you may feel more energetic and social. Great time for HIIT and cruciferous veggies.', hormone: 'Peak Fertility' },
  Luteal: { tip: 'Progesterone rises. Focus on magnesium-rich foods, gentle yoga, and stabilizing blood sugar.', hormone: 'High Progesterone' },
};

const DailyLog: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.OKAY);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { language } = useLanguage();
  const lang: 'es' | 'en' = language === 'es' ? 'es' : 'en';
  const [tab, setTab] = useState<Tab>('today');
  const [configuredSymptoms, setConfiguredSymptoms] = useConfiguredSymptoms();
  const [symptomSummary, setSymptomSummary] = useState<SymptomSummary>({ total: 0, max: 18 });
  const [medSummary, setMedSummary] = useState<MedicationSummary>({ taken: 0, total: 0 });
  const tabs: { id: Tab; icon: string; label: string; badge?: string }[] = [
    { id: 'today', icon: 'mood', label: lang === 'es' ? 'Hoy' : 'Today', badge: saved ? '✓' : undefined },
    { id: 'symptoms', icon: 'monitor_heart', label: lang === 'es' ? 'Síntomas PMOS' : 'PMOS symptoms', badge: `${symptomSummary.total}/${symptomSummary.max}` },
    { id: 'meds', icon: 'medication', label: lang === 'es' ? 'Medicación' : 'Medication', badge: medSummary.total ? `${medSummary.taken}/${medSummary.total}` : undefined },
  ];

  useEffect(() => {
    async function loadTodayLog() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const local = await getLocalDailyLog(user.id, today);
      if (local && !local.synced) {
        // Pending local edits win over the remote copy.
        setSelectedMood((local.mood as Mood) || Mood.OKAY);
        setEnergyLevel(local.energyLevel ?? 5);
        setSleepHours(local.sleepHours ?? 7);
        setActiveSymptoms(local.symptoms ?? []);
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
      const today = new Date().toISOString().split('T')[0];
      await saveDailyLogOffline({
        userId: user.id,
        date: today,
        mood: selectedMood,
        energyLevel,
        sleepHours,
        sleepQuality: null,
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
  const insight = phaseInsights[phase] ?? phaseInsights.Follicular;
  const progressPct = Math.round((cycleDay / cycleLength) * 100);

  const buttonLabel = saving ? (lang === 'es' ? 'Guardando...' : 'Saving...') : saved ? (lang === 'es' ? 'Actualizado ✓' : 'Updated ✓') : (lang === 'es' ? 'Completar registro' : 'Complete Check-in');
  const buttonMobileLabel = saving ? 'Saving...' : saved ? 'Updated ✓' : 'Log Today';

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
        {tab === 'symptoms' && (
          <SymptomCheckin lang={lang} configured={configuredSymptoms} setConfigured={setConfiguredSymptoms} onSummary={setSymptomSummary} />
        )}
        <div className={tab === 'meds' ? '' : 'hidden'}>
          <Medications embedded onSummary={setMedSummary} />
        </div>
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${tab === 'today' ? '' : 'hidden'}`}>
          <div className="lg:col-span-8 flex flex-col gap-6">
            <MoodSelector selectedMood={selectedMood} onMoodSelect={(m) => { setSelectedMood(m); setSaved(false); }} />

            <VitalsInputs
              energyLevel={energyLevel}
              onEnergyLevelChange={(v) => { setEnergyLevel(v); setSaved(false); }}
              sleepHours={sleepHours}
              onSleepHoursChange={(v) => { setSleepHours(v); setSaved(false); }}
            />

            <SymptomGrid activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />

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
              <h3 className="text-foreground font-bold text-lg mb-1 relative z-10">Cycle Phase</h3>
              <p className="text-primary font-bold text-2xl mb-4 relative z-10">{phase}</p>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs text-muted-foreground">Day {cycleDay}</span>
                <span className="text-xs text-foreground font-bold">{insight.hormone}</span>
                <span className="text-xs text-muted-foreground">Day {cycleLength}</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full bg-gradient-to-r from-blossom to-coral rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed relative z-10">
                {insight.tip}
              </p>
            </div>

            <div className="bg-card/70 border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blossom-soft p-2 rounded-xl text-blossom">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h4 className="text-foreground font-bold">Daily Insight</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PMOS Tip: During the {phase.toLowerCase()} phase, {insight.tip.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLog;
