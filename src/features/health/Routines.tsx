'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchWorkoutVideos, getExercisesByIds, EXERCISE_ATTRIBUTION } from '@/services/exercisesService';
import { Exercise, WorkoutVideo, Routine, VideoCategory, VideoIntensity } from '@/types/exercises';
import phaseData from '@/data/phaseExercises.json';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { localDay, useRoutineStore } from '@/stores/routineStore';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { suggestEffort, summarizeWeek, type Effort, type EffortReason } from '@/lib/exercise/weeklyActivity';
import WorkoutLogSection, { FEELINGS } from './components/WorkoutLogSection';
import WeeklyGoalCard from './components/WeeklyGoalCard';
import PhasePlaylists from './components/PhasePlaylists';
import RoutineBuilder from './components/RoutineBuilder';
import { ProgramsExplorer } from './components/ProgramsExplorer';
import { GardenCorner, SunGlow, TitleSprig } from '@/components/ui/Botanical';
import { ExerciseCard, RoutineSection, SavedRoutineCard, VideoCard, VideoModal } from './components/RoutinesComponents';
import { useGuest } from '@/hooks/useGuest';
import { useLanguage } from '@/i18n/LanguageContext';
import GuestPreviewBanner from '@/components/layout/GuestPreviewBanner';

const VIDEOS_PAGE = 9;

const PHASE_KEY_MAP: Record<string, string> = {
  Menstrual: 'menstrual',
  Follicular: 'follicular',
  Ovulation: 'ovulation',
  Luteal: 'luteal',
};

const PHASE_NAMES_ES: Record<string, string> = {
  menstrual: 'Fase Menstrual',
  follicular: 'Fase Folicular',
  ovulation: 'Fase Ovulatoria',
  luteal: 'Fase Lútea',
};

// The phase is a starting point, not a rule: studies find its effect on performance small and very
// individual, so the copy suggests and never forbids. suggestEffort() adjusts it to today's energy.
const PHASE_GUIDANCE: Record<string, { title: string; desc: string; intensity: string; focus: string; icon: string }> = {
  menstrual: {
    title: 'Muévete según tus síntomas',
    desc: 'Con cólicos o poca energía, caminar, la movilidad y el yoga suave ayudan a aliviar el dolor. Si te sientes bien puedes entrenar con normalidad: la regla no obliga a parar.',
    intensity: 'Suave a moderada',
    focus: 'Alivio y movilidad',
    icon: 'water_drop',
  },
  follicular: {
    title: 'Buen momento para progresar',
    desc: 'Muchas mujeres notan más energía después de la regla. Aprovecha para tus sesiones de fuerza con más carga o para el cardio más exigente de la semana.',
    intensity: 'Moderada a alta',
    focus: 'Fuerza progresiva y cardio',
    icon: 'fitness_center',
  },
  ovulation: {
    title: 'Sesiones exigentes si te sientes fuerte',
    desc: 'Suele ser una ventana de buena energía. Fuerza, intervalos o circuitos encajan bien; calienta con calma y cuida la técnica.',
    intensity: 'Alta',
    focus: 'Fuerza e intervalos',
    icon: 'bolt',
  },
  luteal: {
    title: 'Mantén la constancia',
    desc: 'Al acercarse la regla pueden aparecer cansancio, hinchazón o peor sueño. Mantén la fuerza con cargas que controles y baja la intensidad los días que lo necesites, sin dejar de moverte.',
    intensity: 'Moderada',
    focus: 'Fuerza controlada y bajo impacto',
    icon: 'self_improvement',
  },
};

const EFFORT_COPY: Record<Effort, { label: string; examples: string }> = {
  gentle: { label: 'Hoy: sesión suave', examples: 'Caminata, movilidad, yoga o pilates suave.' },
  moderate: { label: 'Hoy: sesión moderada', examples: 'Fuerza con cargas cómodas, pilates o cardio a ritmo de conversación.' },
  strong: { label: 'Hoy: sesión exigente', examples: 'Fuerza con más carga, intervalos o un circuito.' },
};

function effortReason(reason: EffortReason, energy: number | null): string {
  switch (reason) {
    case 'lowEnergy': return `Registraste energía ${energy}/10: prioriza recuperarte, aunque tu fase invite a más.`;
    case 'highEnergy': return `Registraste energía ${energy}/10: buen día para fuerza o intervalos, sea cual sea tu fase.`;
    case 'latePeriod': return 'Tu regla va con retraso, así que la fase es incierta: guíate por tu energía.';
    default: return energy == null
      ? 'Según tu fase. Registra tu energía en el diario de hoy para ajustar la sugerencia.'
      : `Según tu fase y tu energía de hoy (${energy}/10).`;
  }
}

const CATEGORIES: { id: VideoCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: 'grid_view' },
  { id: 'yoga', label: 'Yoga', icon: 'self_improvement' },
  { id: 'pilates', label: 'Pilates', icon: 'accessibility_new' },
  { id: 'gym', label: 'Fuerza', icon: 'fitness_center' },
  { id: 'dance', label: 'Danza', icon: 'music_note' },
];

const INTENSITIES: { id: VideoIntensity | 'all'; label: string }[] = [
  { id: 'all', label: 'Cualquier intensidad' },
  { id: 'low', label: 'Suave' },
  { id: 'medium', label: 'Moderada' },
  { id: 'high', label: 'Intensa' },
];

type RoutineTab = 'programs' | 'phase' | 'videos' | 'builder' | 'log';

// Tabs that hold the user's own data: guests see them locked.
const MEMBER_TABS: RoutineTab[] = ['builder', 'log'];

const PHASE_CHIPS: { key: string; es: string; en: string; icon: string }[] = [
  { key: 'menstrual', es: 'Menstrual', en: 'Menstrual', icon: 'water_drop' },
  { key: 'follicular', es: 'Folicular', en: 'Follicular', icon: 'fitness_center' },
  { key: 'ovulation', es: 'Ovulatoria', en: 'Ovulation', icon: 'bolt' },
  { key: 'luteal', es: 'Lútea', en: 'Luteal', icon: 'self_improvement' },
];

const TABS: { id: RoutineTab; label: string; icon: string; description: string }[] = [
  { id: 'programs', label: 'Casa & Gym', icon: 'fitness_center', description: '29 programas completos con demostraciones en video HD integradas' },
  { id: 'phase', label: 'Para tu Fase', icon: 'auto_awesome', description: 'Recomendaciones y playlists adaptadas a tu momento hormonal' },
  { id: 'videos', label: 'Videos Guiados', icon: 'videocam', description: 'Catálogo de sesiones en video con filtros por disciplina' },
  { id: 'builder', label: 'Mis Rutinas', icon: 'calendar_month', description: 'Rutinas guardadas y creador semanal de ejercicios' },
  { id: 'log', label: 'Diario y Registro', icon: 'edit_note', description: 'Anota tus sesiones y analiza cómo responde tu cuerpo' },
];

const Routines: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { isGuest, promptSignup } = useGuest();
  const { t, language } = useLanguage();
  // Guests have no cycle, so they pick a phase to browse its exercises and playlists.
  const [guestPhase, setGuestPhase] = useState('follicular');
  const { streak, completeWorkout } = useRoutineStore();
  const workoutLogs = useWorkoutLogs();
  const [energyToday, setEnergyToday] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<RoutineTab>('programs');
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [workoutVideos, setWorkoutVideos] = useState<WorkoutVideo[]>([]);
  const [videoCategory, setVideoCategory] = useState<VideoCategory | 'all'>('all');
  const [videoIntensity, setVideoIntensity] = useState<VideoIntensity | 'all'>('all');
  const [onlyPhaseVideos, setOnlyPhaseVideos] = useState(false);
  const [videosShown, setVideosShown] = useState(VIDEOS_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<WorkoutVideo | null>(null);

  const phaseKey = isGuest
    ? guestPhase
    : cycleInfo ? PHASE_KEY_MAP[cycleInfo.phase] || 'follicular' : 'follicular';
  const phaseNameEs = PHASE_NAMES_ES[phaseKey] || 'Fase Folicular';
  const guidance = PHASE_GUIDANCE[phaseKey] || PHASE_GUIDANCE.follicular;

  const today = localDay();
  const isCompletedToday = streak.lastCompletedDate === today;
  const paused = !!cycleInfo?.paused;
  const periodLate = (cycleInfo?.daysLate ?? 0) > 0;
  const week = useMemo(() => summarizeWeek(workoutLogs.logs), [workoutLogs.logs]);
  const suggestion = suggestEffort(phaseKey, energyToday, periodLate);
  const effort = EFFORT_COPY[suggestion.effort];
  // Saved routines carry a weekday (0 = Monday): the one for today is the real answer to "what do I do today".
  const todayWeekday = (new Date().getDay() + 6) % 7;
  const todayRoutine = userRoutines.find((r) => r.weekday === todayWeekday) ?? null;
  const mainCtaTab: RoutineTab = todayRoutine ? 'builder' : 'phase';
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickMinutes, setQuickMinutes] = useState('');
  const [quickFeeling, setQuickFeeling] = useState(0);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Today's energy from the daily log, used to adjust the phase suggestion.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from('daily_logs')
        .select('energy_level')
        .eq('user_id', session.user.id)
        .eq('date', localDay())
        .maybeSingle();
      setEnergyToday(data?.energy_level ?? null);
    })();
  }, []);

  const visibleVideos = workoutVideos
    .filter((v) => videoCategory === 'all' || v.category === videoCategory)
    .filter((v) => videoIntensity === 'all' || v.intensity === videoIntensity)
    .filter((v) => !onlyPhaseVideos || v.phases.includes(phaseKey as any))
    .sort((a, b) => Number(b.phases.includes(phaseKey as any)) - Number(a.phases.includes(phaseKey as any)));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentPhaseData = (phaseData as any)[phaseKey];
        if (currentPhaseData) {
          setRecommendedExercises(getExercisesByIds(currentPhaseData.exerciseIds));
        }

        const videos = await fetchWorkoutVideos();
        setWorkoutVideos(videos);
        setError(null);
      } catch (err) {
        console.error('Error loading routines data:', err);
        setError('No se pudieron cargar las rutinas. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (!cycleLoading) loadData();
    fetchUserRoutines();
  }, [cycleLoading, phaseKey, reloadKey]);

  const fetchUserRoutines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserRoutines(data || []);
    } catch (err) {
      console.error('Error fetching user routines:', err);
    }
  };

  const onSaveExercise = async (ex: Exercise) => {
    try {
      setSaving(true);
      setSaveError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('routines').insert([{
        user_id: user.id,
        name: `Rutina de ${ex.name}`,
        description: `Enfocada en ${ex.target} para ${phaseNameEs}.`,
        exercises: [ex],
        phase: phaseKey,
      }]);

      if (error) throw error;
      fetchUserRoutines();
    } catch (err: any) {
      setSaveError('No se pudo guardar la rutina: ' + (err?.message ?? 'inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  // Reads the sets of the last log of an exercise back from its note ("10 × 20 kg · 8 × 22.5 kg — Programa, Día").
  const lastSetsFor = (exerciseName: string) => {
    const log = workoutLogs.logs.find((l) => l.exercise === exerciseName && l.notes && l.notes.includes(' — '));
    if (!log?.notes) return null;
    const sets = log.notes.split(' — ')[0].split(' · ').map((part) => {
      const m = part.trim().match(/^(\d+|–)(?: × ([\d.,]+) kg)?$/);
      if (!m) return null;
      return { reps: m[1] === '–' ? null : Number(m[1]), weight: m[2] ? Number(m[2].replace(',', '.')) : null };
    });
    return sets.length > 0 && sets.every(Boolean) ? (sets as { reps: number | null; weight: number | null }[]) : null;
  };
  // Free-form check-in: it only counts for the streak once minutes and how it felt are recorded.
  const submitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = Math.round(Number(quickMinutes.replace(',', '.')));
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 300) return setQuickError('Indica cuántos minutos entrenaste (1 a 300).');
    if (quickFeeling === 0) return setQuickError('Elige cómo te sentiste.');
    setQuickError(null);
    const ok = await workoutLogs.addLog({
      exercise: 'Entrenamiento libre',
      sets: null,
      weightKg: null,
      durationMinutes: minutes,
      feeling: quickFeeling,
      notes: 'Registro rápido',
      phase: phaseKey,
    });
    if (!ok) return setQuickError('No se pudo guardar. Inicia sesión e inténtalo de nuevo.');
    completeWorkout();
    setQuickOpen(false);
    setQuickMinutes('');
    setQuickFeeling(0);
  };
  const handleCompleteWorkout = () => {
    completeWorkout();
    // A finished video also goes to the workout log so its minutes count toward the weekly goal.
    if (activeVideo) {
      void workoutLogs.addLog({
        exercise: `${activeVideo.category === 'gym' ? 'Fuerza: ' : ''}${activeVideo.title}`.slice(0, 80),
        sets: null,
        weightKg: null,
        durationMinutes: activeVideo.durationMinutes > 0 ? Math.round(activeVideo.durationMinutes) : null,
        feeling: 3,
        notes: 'Video guiado',
        phase: phaseKey,
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">

        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl garden-wash wash-sun border border-border/80 shadow-sm px-5 py-4 sm:px-8 sm:py-5">
            <SunGlow className="absolute -top-6 right-[18%] size-16 sm:size-24 opacity-90" />
            <GardenCorner variant="sun" className="size-24 sm:size-36 opacity-80" />
            <div className="relative flex flex-col gap-1.5 max-w-2xl pr-16 sm:pr-40">
              <h1 className="text-foreground text-2xl md:text-3xl font-bold tracking-tight text-balance">
                <TitleSprig />Rutinas y Entrenamiento
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-pretty">
                Tu fase es el punto de partida y tu energía de hoy decide. Con PMOS lo que más cuenta es el total de la semana: 150 minutos de actividad y 2 días de fuerza.
              </p>
            </div>
          </div>

          {isGuest ? (
            <>
              {/* Guest phase explorer: the same guidance, picked by hand */}
              <div data-phase={phaseKey} className="bg-card rounded-2xl border border-border px-4 py-3.5 sm:px-5 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-phase-soft flex items-center justify-center text-phase shrink-0">
                      <span className="material-symbols-outlined text-2xl">{guidance.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground text-balance">{phaseNameEs}</h2>
                      <p className="text-sm text-muted-foreground">{t.guestExplorePhase}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border">
                    {PHASE_CHIPS.map((chip) => {
                      const active = guestPhase === chip.key;
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setGuestPhase(chip.key)}
                          aria-pressed={active}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            active ? 'bg-phase-soft text-phase shadow-sm border border-phase/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">{chip.icon}</span>
                          {language === 'es' ? chip.es : chip.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {activeTab === 'phase' && (
                  <>
                    <p className="text-muted-foreground text-sm leading-relaxed">{guidance.desc}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-phase-soft text-phase">Intensidad: {guidance.intensity}</span>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-foreground">{guidance.focus}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
          <>
          {/* Status & Daily Activity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phase Status Card */}
            <div data-phase={phaseKey} className="md:col-span-2 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-phase-soft flex items-center justify-center text-phase shrink-0">
                    <span className="material-symbols-outlined text-2xl">{guidance.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground text-balance">
                      {cycleLoading ? 'Cargando...' : paused ? 'Modo embarazo' : periodLate ? `Día ${cycleInfo?.cycleDay ?? '?'} • Regla con retraso` : `${phaseNameEs} • Día ${cycleInfo?.cycleDay ?? '?'}`}
                    </h2>
                  </div>
                </div>
                {!paused && <span className="text-xs font-bold px-3 py-1 rounded-full bg-phase-soft text-phase shrink-0">
                  {effort.label}
                </span>}
              </div>

              <div className={paused ? 'hidden' : 'text-sm'}>
                <p className="font-semibold text-foreground">{effort.examples}</p>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{effortReason(suggestion.reason, energyToday)}</p>
              </div>

              {(activeTab === 'phase' || paused) && (
                <div className="bg-secondary/40 rounded-xl p-3.5 border border-border/50 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    {paused && <p className="font-semibold text-foreground">Ejercicio y embarazo</p>}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{paused ? 'Consulta con tu médica qué tipo de ejercicio te conviene. Las recomendaciones por fase del ciclo están en pausa.' : guidance.desc}</p>
                </div>
              )}
              {!paused && activeTab !== mainCtaTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab(mainCtaTab)}
                  className="w-full sm:w-auto sm:self-start min-h-12 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">{todayRoutine ? 'event_available' : 'play_arrow'}</span>
                  <span className="truncate">{todayRoutine ? `Tu rutina de hoy: ${todayRoutine.name}` : 'Ver ejercicios de tu fase'}</span>
                </button>
              )}
            </div>

            {/* Daily Movement Check-in (secondary) */}
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Registro de hoy</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-foreground tabular-nums">{streak.currentStreak}</span>
                  <span className="text-xs text-muted-foreground font-medium">días activos seguidos</span>
                </div>
              </div>
              <WeeklyGoalCard compact week={week} loading={workoutLogs.loading} />
              {isCompletedToday ? (
                <div className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <span aria-hidden className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Entrenamiento de hoy listo</span>
                </div>
              ) : quickOpen ? (
                <form onSubmit={submitQuick} className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                    Minutos entrenados
                    <input
                      inputMode="numeric"
                      value={quickMinutes}
                      onChange={(e) => setQuickMinutes(e.target.value)}
                      placeholder="30"
                      className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal tabular-nums placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </label>
                  <div role="radiogroup" aria-label="Cómo te sentiste" className="flex gap-1.5">
                    {FEELINGS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        role="radio"
                        aria-checked={quickFeeling === f.value}
                        aria-label={f.label}
                        title={f.label}
                        onClick={() => setQuickFeeling(f.value)}
                        className={`flex-1 min-h-11 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                          quickFeeling === f.value ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        <span aria-hidden className="material-symbols-outlined text-2xl">{f.icon}</span>
                      </button>
                    ))}
                  </div>
                  {quickError && <p role="alert" className="text-xs font-semibold text-destructive">{quickError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setQuickOpen(false); setQuickError(null); }} className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={workoutLogs.saving} className="flex-1 min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer">
                      {workoutLogs.saving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickOpen(true)}
                  className="w-full min-h-11 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-card text-foreground border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">task_alt</span>
                  <span>Registrar entrenamiento</span>
                </button>
              )}
            </div>
          </div>
          </>
          )}
        </section>

        {error && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-destructive/10 text-foreground rounded-xl border border-destructive/20 text-sm">
            <p className="flex items-start gap-2">
              <span aria-hidden className="material-symbols-outlined text-lg text-destructive shrink-0">error</span>
              <span>{error}</span>
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 min-h-10 rounded-xl text-sm font-semibold border border-border bg-card hover:border-primary/50 cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        {saveError && (
          <div role="alert" className="flex items-start justify-between gap-3 p-4 bg-destructive/10 text-foreground rounded-xl border border-destructive/20 text-sm">
            <p className="flex items-start gap-2">
              <span aria-hidden className="material-symbols-outlined text-lg text-destructive shrink-0">error</span>
              <span>{saveError}</span>
            </p>
            <button type="button" onClick={() => setSaveError(null)} className="min-h-10 px-3 rounded-xl text-sm font-semibold border border-border bg-card hover:border-primary/50 cursor-pointer shrink-0">Cerrar</button>
          </div>
        )}
        {/* Sticky Tab Navigation */}
        <div data-phase={phaseKey} className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-background/85 backdrop-blur-md border-y border-border/50">
          <div
            role="tablist"
            aria-label="Secciones de rutinas"
            className="flex lg:grid lg:grid-cols-5 overflow-x-auto scrollbar-hide p-1.5 rounded-2xl bg-secondary/50 border border-border gap-1.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const locked = isGuest && MEMBER_TABS.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`routines-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`routines-panel-${tab.id}`}
                  onClick={() => (locked ? promptSignup() : setActiveTab(tab.id))}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-11 shrink-0 lg:shrink rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-card text-foreground shadow-sm border border-border/80 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent'
                  }`}
                >
                  <span aria-hidden className={`material-symbols-outlined text-xl shrink-0 ${isActive ? 'text-phase' : 'text-muted-foreground'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {locked && (
                    <>
                      <span aria-hidden className="material-symbols-outlined text-sm text-muted-foreground shrink-0">lock</span>
                      <span className="sr-only">(requiere cuenta)</span>
                    </>
                  )}
                  {tab.id === 'builder' && userRoutines.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {userRoutines.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Tab 0: Programas Casa & Gym */}
        <div role="tabpanel" id="routines-panel-programs" aria-labelledby="routines-tab-programs" className={activeTab === 'programs' ? 'flex flex-col gap-6' : 'hidden'}>
          <ProgramsExplorer
            phaseKey={phaseKey}
            getLastSets={isGuest ? undefined : lastSetsFor}
            onLogWorkout={isGuest ? undefined : (entry) => workoutLogs.addLogWithId({ ...entry, feeling: 3, phase: phaseKey })}
            onUndoLog={isGuest ? undefined : workoutLogs.removeLog}
            onFinishSession={isGuest ? undefined : ({ label, durationMinutes, exercisesLogged }) => {
              completeWorkout();
              void workoutLogs.addLog({
                exercise: label.slice(0, 80),
                sets: null,
                weightKg: null,
                durationMinutes,
                feeling: 3,
                notes: `Sesión completada: ${exercisesLogged} ejercicios guardados`,
                phase: phaseKey,
              });
            }}
          />
        </div>

        {/* Tab 1: Para tu Fase */}
        <div role="tabpanel" id="routines-panel-phase" aria-labelledby="routines-tab-phase" className={activeTab === 'phase' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Recommended Movements for Current Phase */}
          <RoutineSection
            title={`Ejercicios Recomendados para ${phaseNameEs}`}
            description={guidance.focus}
            icon="fitness_center"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-2xl bg-card animate-pulse border border-border" />
                ))
              ) : recommendedExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-full">No hay ejercicios específicos cargados para esta fase.</p>
              ) : (
                recommendedExercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    variant="horizontal"
                    onSave={isGuest ? undefined : () => onSaveExercise(ex)}
                    saving={saving}
                  />
                ))
              )}
            </div>
          </RoutineSection>

          {/* Automatic phase playlists */}
          <RoutineSection
            title="Playlists por Fase"
            description="Sesiones de video curadas y organizadas según el momento de tu ciclo hormonal."
            icon="queue_music"
          >
            <PhasePlaylists videos={workoutVideos} currentPhaseKey={phaseKey} onPlay={(v) => setActiveVideo(v)} />
          </RoutineSection>
        </div>

        {/* Tab 2: Videos Guiados */}
        <div role="tabpanel" id="routines-panel-videos" aria-labelledby="routines-tab-videos" className={activeTab === 'videos' ? 'flex flex-col gap-10' : 'hidden'}>
          <RoutineSection
            title="Catálogo de Videos de Entrenamiento"
            description="Sesiones completas en video adaptadas para realizar en casa o en el gimnasio."
            icon="videocam"
            rightElement={
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
                {visibleVideos.length} {visibleVideos.length === 1 ? 'video disponible' : 'videos disponibles'}
              </span>
            }
          >
            {/* Controls & Filter Bar */}
            <div className="flex flex-col gap-3 bg-card/60 p-4 rounded-2xl border border-border">
              <div role="group" aria-label="Disciplina" className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={videoCategory === cat.id}
                    onClick={() => { setVideoCategory(cat.id); setVideosShown(VIDEOS_PAGE); }}
                    className={`inline-flex items-center gap-1.5 px-3.5 min-h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      videoCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary/70 hover:bg-secondary text-foreground'
                    }`}
                  >
                    <span aria-hidden className="material-symbols-outlined text-base">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border/60">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>Intensidad</span>
                  <select
                    value={videoIntensity}
                    onChange={(e) => { setVideoIntensity(e.target.value as VideoIntensity | 'all'); setVideosShown(VIDEOS_PAGE); }}
                    className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {INTENSITIES.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer sm:ml-auto min-h-10">
                  <input
                    type="checkbox"
                    checked={onlyPhaseVideos}
                    onChange={(e) => { setOnlyPhaseVideos(e.target.checked); setVideosShown(VIDEOS_PAGE); }}
                    className="size-4 accent-primary cursor-pointer"
                  />
                  <span>Solo ideales para mi fase</span>
                </label>
              </div>
            </div>
            {/* Videos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-card animate-pulse border border-border" />
                ))
              ) : visibleVideos.length === 0 ? (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-3 bg-card/40 rounded-2xl border border-dashed border-border p-6">
                  <span className="material-symbols-outlined text-muted-foreground text-4xl">search_off</span>
                  <p className="text-foreground font-semibold text-base">No hay videos con los filtros seleccionados</p>
                  <p className="text-muted-foreground text-xs max-w-sm">
                    Prueba a quitar el filtro de fase o cambiar la categoría seleccionada.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoCategory('all');
                      setVideoIntensity('all');
                      setOnlyPhaseVideos(false);
                    }}
                    className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                visibleVideos.slice(0, videosShown).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isPhaseRecommended={video.phases.includes(phaseKey as any)}
                    onPlay={(v) => setActiveVideo(v)}
                  />
                ))
              )}
            </div>

            {/* Load More Button */}
            {!loading && visibleVideos.length > videosShown && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setVideosShown((n) => n + VIDEOS_PAGE)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer shadow-sm"
                >
                  Cargar más videos ({visibleVideos.length - videosShown} restantes)
                </button>
              </div>
            )}
          </RoutineSection>
        </div>

        {/* Tab 3: Mis Rutinas (members only) */}
        {!isGuest && <div role="tabpanel" id="routines-panel-builder" aria-labelledby="routines-tab-builder" className={activeTab === 'builder' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Saved Routines (if any exist) */}
          {userRoutines.length > 0 && (
            <RoutineSection
              title="Mis Rutinas Guardadas"
              description="Ejercicios y entrenamientos que has guardado para consultar rápidamente."
              icon="bookmark"
              rightElement={
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
                  {userRoutines.length} {userRoutines.length === 1 ? 'rutina' : 'rutinas'}
                </span>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...userRoutines]
                  .sort((a, b) => (a.weekday ?? 7) - (b.weekday ?? 7))
                  .map((routine) => (
                  <SavedRoutineCard key={routine.id} routine={routine} />
                ))}
              </div>
            </RoutineSection>
          )}

          {/* Custom routine builder */}
          <RoutineSection
            title="Crea tu Rutina Semanal"
            description="Explora más de 1.300 ejercicios por grupo muscular y equipamiento, y arma tu rutina para cada día de la semana."
            icon="edit_calendar"
          >
            <RoutineBuilder phaseKey={phaseKey} onSaved={fetchUserRoutines} />
          </RoutineSection>
        </div>}

        {/* Tab 4: Diario y Registro (members only) */}
        {!isGuest && <div role="tabpanel" id="routines-panel-log" aria-labelledby="routines-tab-log" className={activeTab === 'log' ? 'flex flex-col gap-10' : 'hidden'}>
          <RoutineSection
            title="Registro de Entrenamientos"
            description="Anota actividad fuera de un programa y revisa tu semana. Los ejercicios de un programa se guardan solos desde su guía."
            icon="edit_note"
          >
            <div className="flex flex-col gap-5">
              <WeeklyGoalCard week={week} loading={workoutLogs.loading} />
              <WorkoutLogSection phaseKey={phaseKey} state={workoutLogs} />
            </div>
          </RoutineSection>
        </div>}

        {isGuest && <GuestPreviewBanner message={t.guestRoutinesPreview} />}
        {/* Video Player Modal */}
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onCompleteWorkout={isGuest ? undefined : handleCompleteWorkout}
          isCompletedToday={isCompletedToday}
        />

      </div>
    </div>
  );
};

export default Routines;
