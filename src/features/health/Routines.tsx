'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchWorkoutVideos, getExercisesByIds, EXERCISE_ATTRIBUTION } from '@/services/exercisesService';
import { Exercise, WorkoutVideo, Routine, VideoCategory, VideoIntensity } from '@/types/exercises';
import phaseData from '@/data/phaseExercises.json';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { localDay } from '@/stores/routineStore';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { suggestEffort, summarizeWeek, type Effort, type EffortReason } from '@/lib/exercise/weeklyActivity';
import { FEELINGS } from './components/journal/shared';
import WorkoutJournal from './components/journal/WorkoutJournal';
import { computeStreak, dayTotals, lastSetsFor } from '@/lib/exercise/trainingStats';
import WeeklyGoalCard from './components/WeeklyGoalCard';
import PhasePlaylists from './components/PhasePlaylists';
import RoutineBuilder from './components/RoutineBuilder';
import { ProgramsExplorer } from './components/ProgramsExplorer';
import { TitleSprig } from '@/components/ui/Botanical';
import { ExerciseCard, RoutineSection, SavedRoutineCard, VideoCard, VideoModal } from './components/RoutinesComponents';
import { useGuest } from '@/hooks/useGuest';
import { useLanguage } from '@/i18n/LanguageContext';
import GuestPreviewBanner from '@/components/layout/GuestPreviewBanner';
import AddToRoutineDialog, { type AddToRoutineRequest } from './components/AddToRoutineDialog';
import TodayHistory from './components/TodayHistory';
import { usePmosToolsVisible } from '@/hooks/useOnboardingAnswers';
import { OneRepMaxCalculator } from './components/OneRepMaxCalculator';
import { exerciseDisplayName } from '@/data/exerciseNamesEs';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

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

const PHASE_NAMES_EN: Record<string, string> = {
  menstrual: 'Menstrual Phase',
  follicular: 'Follicular Phase',
  ovulation: 'Ovulatory Phase',
  luteal: 'Luteal Phase',
};

// The phase is a starting point, not a rule: studies find its effect on performance small and very
// individual, so the copy suggests and never forbids. suggestEffort() adjusts it to today's energy.
const PHASE_GUIDANCE: Record<string, {
  title: { es: string; en: string };
  desc: { es: string; en: string };
  intensity: { es: string; en: string };
  focus: { es: string; en: string };
  icon: string;
}> = {
  menstrual: {
    title: { es: 'Muévete según tus síntomas', en: 'Move according to your symptoms' },
    desc: {
      es: 'Con cólicos o poca energía, caminar, la movilidad y el yoga suave ayudan a aliviar el dolor. Si te sientes bien puedes entrenar con normalidad: la regla no obliga a parar.',
      en: 'With cramps or low energy, walking, mobility, and gentle yoga help relieve pain. If you feel good you can train normally: your period does not force you to stop.',
    },
    intensity: { es: 'Suave a moderada', en: 'Gentle to moderate' },
    focus: { es: 'Alivio y movilidad', en: 'Relief & mobility' },
    icon: 'water_drop',
  },
  follicular: {
    title: { es: 'Buen momento para progresar', en: 'Great time to make progress' },
    desc: {
      es: 'Muchas mujeres notan más energía después de la regla. Aprovecha para tus sesiones de fuerza con más carga o para el cardio más exigente de la semana.',
      en: 'Many women notice higher energy after their period. Take advantage for heavier strength sessions or your most demanding cardio of the week.',
    },
    intensity: { es: 'Moderada a alta', en: 'Moderate to high' },
    focus: { es: 'Fuerza progresiva y cardio', en: 'Progressive strength & cardio' },
    icon: 'fitness_center',
  },
  ovulation: {
    title: { es: 'Sesiones exigentes si te sientes fuerte', en: 'Challenging sessions if you feel strong' },
    desc: {
      es: 'Suele ser una ventana de buena energía. Fuerza, intervalos o circuitos encajan bien; calienta con calma y cuida la técnica.',
      en: 'Usually a window of peak energy. Strength, intervals, or circuits fit well; warm up carefully and mind your form.',
    },
    intensity: { es: 'Alta', en: 'High' },
    focus: { es: 'Fuerza e intervalos', en: 'Strength & intervals' },
    icon: 'bolt',
  },
  luteal: {
    title: { es: 'Mantén la constancia', en: 'Maintain consistency' },
    desc: {
      es: 'Al acercarse la regla pueden aparecer cansancio, hinchazón o peor sueño. Mantén la fuerza con cargas que controles y baja la intensidad los días que lo necesites, sin dejar de moverte.',
      en: 'As your period nears, fatigue, bloating, or poorer sleep may appear. Maintain strength with controlled loads and lower intensity when needed, without stopping movement.',
    },
    intensity: { es: 'Moderada', en: 'Moderate' },
    focus: { es: 'Fuerza controlada y bajo impacto', en: 'Controlled strength & low impact' },
    icon: 'self_improvement',
  },
};

const EFFORT_COPY: Record<Effort, { label: { es: string; en: string }; examples: { es: string; en: string } }> = {
  gentle: {
    label: { es: 'Hoy: sesión suave', en: 'Today: gentle session' },
    examples: { es: 'Caminata, movilidad, yoga o pilates suave.', en: 'Walking, mobility, gentle yoga or pilates.' },
  },
  moderate: {
    label: { es: 'Hoy: sesión moderada', en: 'Today: moderate session' },
    examples: { es: 'Fuerza con cargas cómodas, pilates o cardio a ritmo de conversación.', en: 'Strength with comfortable weights, pilates, or conversational cardio.' },
  },
  strong: {
    label: { es: 'Hoy: sesión exigente', en: 'Today: demanding session' },
    examples: { es: 'Fuerza con más carga, intervalos o un circuito.', en: 'Heavier strength, intervals, or a circuit.' },
  },
};

function effortReason(reason: EffortReason, energy: number | null, isEs: boolean): string {
  if (isEs) {
    switch (reason) {
      case 'lowEnergy': return `Registraste energía ${energy}/10: prioriza recuperarte, aunque tu fase invite a más.`;
      case 'highEnergy': return `Registraste energía ${energy}/10: buen día para fuerza o intervalos, sea cual sea tu fase.`;
      case 'latePeriod': return 'Tu regla va con retraso, así que la fase es incierta: guíate por tu energía.';
      default: return energy == null
        ? 'Según tu fase. Registra tu energía en el diario de hoy para ajustar la sugerencia.'
        : `Según tu fase y tu energía de hoy (${energy}/10).`;
    }
  } else {
    switch (reason) {
      case 'lowEnergy': return `You logged ${energy}/10 energy: prioritize recovery, even if your phase suggests more.`;
      case 'highEnergy': return `You logged ${energy}/10 energy: great day for strength or intervals, whatever your phase.`;
      case 'latePeriod': return 'Your period is late, so the phase is uncertain: guide yourself by your energy.';
      default: return energy == null
        ? 'Based on your phase. Log your energy in today’s journal to personalize the suggestion.'
        : `Based on your phase and today's energy (${energy}/10).`;
    }
  }
}

const getCategories = (isEs: boolean): { id: VideoCategory | 'all'; label: string; icon: string }[] => [
  { id: 'all', label: isEs ? 'Todos' : 'All', icon: 'grid_view' },
  { id: 'yoga', label: 'Yoga', icon: 'self_improvement' },
  { id: 'pilates', label: 'Pilates', icon: 'accessibility_new' },
  { id: 'gym', label: isEs ? 'Fuerza' : 'Strength', icon: 'fitness_center' },
  { id: 'dance', label: isEs ? 'Danza' : 'Dance', icon: 'music_note' },
];

const getIntensities = (isEs: boolean): { id: VideoIntensity | 'all'; label: string }[] => [
  { id: 'all', label: isEs ? 'Todas' : 'Any' },
  { id: 'low', label: isEs ? 'Suave' : 'Gentle' },
  { id: 'medium', label: isEs ? 'Moderada' : 'Moderate' },
  { id: 'high', label: isEs ? 'Intensa' : 'Intense' },
];

type RoutineTab = 'programs' | 'phase' | 'videos' | 'builder' | 'create' | 'log';

// Tabs that hold the user's own data: guests see them locked.
const MEMBER_TABS: RoutineTab[] = ['builder', 'create', 'log'];

const getTabs = (isEs: boolean): { id: RoutineTab; label: string; shortLabel?: string; icon: string }[] => [
  { id: 'programs', label: isEs ? 'Programas' : 'Programs', icon: 'fitness_center' },
  { id: 'phase', label: isEs ? 'Para tu fase' : 'For your phase', shortLabel: isEs ? 'Tu fase' : 'Your phase', icon: 'auto_awesome' },
  { id: 'videos', label: isEs ? 'Videos' : 'Videos', icon: 'videocam' },
  { id: 'builder', label: isEs ? 'Mis rutinas' : 'My routines', shortLabel: isEs ? 'Rutinas' : 'Routines', icon: 'calendar_month' },
  { id: 'create', label: isEs ? 'Crear rutina' : 'Create routine', shortLabel: isEs ? 'Crear' : 'Create', icon: 'edit_calendar' },
  { id: 'log', label: isEs ? 'Diario' : 'Journal', icon: 'edit_note' },
];

const Routines: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { isGuest, promptSignup } = useGuest();
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const TABS = useMemo(() => getTabs(isEs), [isEs]);
  const CATEGORIES = useMemo(() => getCategories(isEs), [isEs]);
  const INTENSITIES = useMemo(() => getIntensities(isEs), [isEs]);
  const showPmos = usePmosToolsVisible();
  const workoutLogs = useWorkoutLogs();
  const [energyToday, setEnergyToday] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<RoutineTab>('programs');
  // Deep link such as /routines?tab=phase (used by the home page phase card).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab') as RoutineTab | null;
    if (requested && TABS.some((tab) => tab.id === requested)) setActiveTab(requested);
  }, [TABS]);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [workoutVideos, setWorkoutVideos] = useState<WorkoutVideo[]>([]);
  const [videoCategory, setVideoCategory] = useState<VideoCategory | 'all'>('all');
  const [videoIntensity, setVideoIntensity] = useState<VideoIntensity | 'all'>('all');
  const [onlyPhaseVideos, setOnlyPhaseVideos] = useState(false);
  const [videosShown, setVideosShown] = useState(VIDEOS_PAGE);
  const [showAllPhaseEx, setShowAllPhaseEx] = useState(false);
  const [todayLogOpen, setTodayLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [addRequest, setAddRequest] = useState<AddToRoutineRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<WorkoutVideo | null>(null);

  // The phase comes from the cycle and is never picked by hand. Guests have no cycle, so they see
  // the follicular phase as an example.
  const phaseKey = !isGuest && cycleInfo ? PHASE_KEY_MAP[cycleInfo.phase] || 'follicular' : 'follicular';
  const phaseName = isEs ? (PHASE_NAMES_ES[phaseKey] || 'Fase Folicular') : (PHASE_NAMES_EN[phaseKey] || 'Follicular Phase');
  const g = PHASE_GUIDANCE[phaseKey] || PHASE_GUIDANCE.follicular;
  const guidance = {
    title: isEs ? g.title.es : g.title.en,
    desc: isEs ? g.desc.es : g.desc.en,
    intensity: isEs ? g.intensity.es : g.intensity.en,
    focus: isEs ? g.focus.es : g.focus.en,
    icon: g.icon,
  };

  const today = localDay();
  // Streak and today's status come from the workout log in the database, the same on every device.
  const trainingDays = useMemo(() => dayTotals(workoutLogs.logs), [workoutLogs.logs]);
  const streak = useMemo(() => computeStreak(trainingDays.keys(), today), [trainingDays, today]);
  const isCompletedToday = trainingDays.has(today);
  const paused = !!cycleInfo?.paused;
  const periodLate = (cycleInfo?.daysLate ?? 0) > 0;
  const week = useMemo(() => summarizeWeek(workoutLogs.logs), [workoutLogs.logs]);
  const suggestion = suggestEffort(phaseKey, energyToday, periodLate);
  const eff = EFFORT_COPY[suggestion.effort];
  const effort = {
    label: isEs ? eff.label.es : eff.label.en,
    examples: isEs ? eff.examples.es : eff.examples.en,
  };
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

  const filteredVideos = workoutVideos
    .filter((v) => videoCategory === 'all' || v.category === videoCategory)
    .filter((v) => videoIntensity === 'all' || v.intensity === videoIntensity)
    .filter((v) => !onlyPhaseVideos || v.phases.includes(phaseKey as any))
    .sort((a, b) => Number(b.phases.includes(phaseKey as any)) - Number(a.phases.includes(phaseKey as any)));
  // Without a category filter, alternate categories so the first page is not one channel's strength series.
  const visibleVideos = videoCategory === 'all'
    ? (() => {
        const groups = new Map<string, WorkoutVideo[]>();
        filteredVideos.forEach((v) => groups.set(v.category, [...(groups.get(v.category) ?? []), v]));
        const lists = [...groups.values()];
        const mixed: WorkoutVideo[] = [];
        for (let i = 0; mixed.length < filteredVideos.length; i++) lists.forEach((l) => { if (l[i]) mixed.push(l[i]); });
        return mixed;
      })()
    : filteredVideos;

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

  // The training day is set from "Mis rutinas", not while building the routine.
  const updateRoutineWeekday = async (routine: Routine, weekday: number | null) => {
    const { error } = await supabase.from('routines').update({ weekday }).eq('id', routine.id);
    if (error) throw error;
    setUserRoutines((prev) => prev.map((r) => (r.id === routine.id ? { ...r, weekday } : r)));
  };

  // Guests get the sign-up prompt: routines are saved to the account.
  const openAddToRoutine = (request: AddToRoutineRequest) => (isGuest ? promptSignup() : setAddRequest(request));
  const closeAddToRoutine = React.useCallback(() => setAddRequest(null), []);
  const onRoutineSaved = (message: string) => {
    setAddRequest(null);
    setToast(message);
    setTimeout(() => setToast(null), 4000);
    void fetchUserRoutines();
  };
  // A video counts once per day: the button turns into "saved" when it is already in today's history.
  const videoLogName = (v: WorkoutVideo) => `${v.category === 'gym' ? 'Fuerza: ' : ''}${v.title}`.slice(0, 80);
  const activeVideoLogged = !!activeVideo && workoutLogs.logs.some(
    (l) => l.date === today && l.notes === 'Video guiado' && l.exercise === videoLogName(activeVideo),
  );

  // Sets of the last log of an exercise, to prefill the program guide.
  const getLastSets = (exerciseName: string) => lastSetsFor(workoutLogs.logs, exerciseName);
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
      source: 'quick',
    });
    if (!ok) return setQuickError('No se pudo guardar. Inicia sesión e inténtalo de nuevo.');
    setQuickOpen(false);
    setQuickMinutes('');
    setQuickFeeling(0);
  };
  const handleCompleteWorkout = () => {
    // A finished video goes to the workout log so it counts for the streak and the weekly goal.
    if (activeVideo) {
      void workoutLogs.addLog({
        exercise: videoLogName(activeVideo),
        sets: null,
        weightKg: null,
        durationMinutes: activeVideo.durationMinutes > 0 ? Math.round(activeVideo.durationMinutes) : null,
        feeling: 3,
        notes: 'Video guiado',
        phase: phaseKey,
        source: 'video',
        refId: activeVideo.id,
        refName: activeVideo.title.slice(0, 120),
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="w-full max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col gap-5 sm:gap-8 pb-40">

        {/* Hero Section */}
        <section className="flex flex-col gap-3 sm:gap-4">
          {/* Compact header: the routines are the content, the header only orients */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-balance">
                <TitleSprig />{isEs ? 'Rutinas y Entrenamiento' : 'Workouts & Training'}
              </h1>
              <p className={`text-muted-foreground text-sm leading-relaxed text-pretty max-w-2xl ${isGuest ? '' : 'max-sm:hidden'}`}>
                {isGuest
                  ? (isEs ? 'Programas por lugar y nivel. Con una cuenta, tu fase y tu energía ajustan la sugerencia.' : 'Programs by location and level. With an account, your phase and energy adjust suggestions.')
                  : (isEs ? 'Tu fase orienta y tu energía de hoy decide.' : 'Your phase guides and today’s energy decides.')}
              </p>
            </div>
            {!isGuest && !cycleLoading && !paused && (
              <span data-phase={phaseKey} className="self-start sm:mt-1 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-phase-soft text-phase shrink-0">
                {periodLate ? (isEs ? 'Regla con retraso' : 'Late period') : phaseName}{cycleInfo?.cycleDay ? ` · ${isEs ? 'Día' : 'Day'} ${cycleInfo.cycleDay}` : ''}
              </span>
            )}
          </header>

          {!isGuest && (
          <>
          {/* Status & Daily Activity Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 max-sm:gap-0">
            {/* Phase Status Card */}
            <div data-phase={phaseKey} className="xl:col-span-2 bg-card rounded-2xl max-sm:rounded-b-none border border-border max-sm:border-b-0 p-3 sm:p-5 shadow-sm flex flex-col gap-2.5 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="size-9 sm:size-12 rounded-xl sm:rounded-2xl bg-phase-soft flex items-center justify-center text-phase shrink-0">
                  <span aria-hidden className="material-symbols-outlined text-2xl">{paused ? 'pregnant_woman' : guidance.icon}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold leading-tight text-foreground text-balance">
                    {cycleLoading ? (isEs ? 'Cargando…' : 'Loading…') : paused ? (isEs ? 'Modo embarazo' : 'Pregnancy mode') : effort.label}
                    {!paused && !cycleLoading && (
                      <InfoTooltip label={`${isEs ? 'Sobre tu fase' : 'About your phase'}: ${guidance.title}`} className="ml-1.5 -translate-y-0.5">
                        <p className="font-bold">{guidance.title}</p>
                        <p className="text-muted-foreground">{guidance.desc}</p>
                        <p className="flex flex-wrap gap-2 pt-1">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-phase-soft text-phase">{isEs ? 'Intensidad' : 'Intensity'}: {guidance.intensity}</span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-foreground">{guidance.focus}</span>
                        </p>
                      </InfoTooltip>
                    )}
                  </h2>
                  {paused ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-prose">
                      {isEs ? 'Consulta con tu médica qué tipo de ejercicio te conviene. Las recomendaciones por fase del ciclo están en pausa.' : 'Consult your doctor on what exercise is right for you. Phase recommendations are paused.'}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm sm:text-base font-medium text-foreground mt-0.5 sm:mt-1">{effort.examples}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-prose text-pretty max-sm:hidden">
                        {periodLate ? `${isEs ? 'Día' : 'Day'} ${cycleInfo?.cycleDay ?? '?'}. ` : ''}{effortReason(suggestion.reason, energyToday, isEs)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {!paused && activeTab !== mainCtaTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab(mainCtaTab)}
                  className="w-full sm:w-auto sm:self-start max-w-full min-h-11 sm:min-h-12 px-4 sm:px-5 rounded-xl font-semibold sm:font-bold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground sm:shadow-md hover:bg-primary/90 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">{todayRoutine ? 'event_available' : 'play_arrow'}</span>
                  <span className="truncate">{todayRoutine ? `${isEs ? 'Tu rutina de hoy' : "Today's routine"}: ${todayRoutine.name}` : (isEs ? 'Ver ejercicios de tu fase' : 'See phase exercises')}</span>
                </button>
              )}
            </div>

            {/* Daily Movement Check-in (secondary) */}
            <div className="xl:col-span-3 bg-card rounded-2xl max-sm:rounded-t-none border border-border max-sm:border-t-border/50 p-4 sm:p-5 max-sm:py-1 shadow-sm grid lg:grid-cols-2 gap-x-6 gap-y-4 max-sm:gap-y-0">
              {/* On phones the log folds into one summary row, so the phase content stays within reach */}
              <button
                type="button"
                aria-expanded={todayLogOpen}
                aria-controls="routines-today-log"
                onClick={() => setTodayLogOpen((v) => !v)}
                className="sm:hidden flex items-center justify-between gap-3 w-full min-h-11 text-left cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{isEs ? 'Registro de hoy' : "Today's log"}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {week.minutes} / 150 min · {streak.current} {isEs ? (streak.current === 1 ? 'día seguido' : 'días seguidos') : (streak.current === 1 ? 'day streak' : 'days streak')}
                  </span>
                </span>
                <span aria-hidden className="material-symbols-outlined text-2xl text-muted-foreground shrink-0">{todayLogOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              <div id="routines-today-log" className={`${todayLogOpen ? 'grid gap-4 pt-3 mt-3 border-t border-border' : 'hidden'} sm:contents`}>
              <div className="flex flex-col gap-3 min-w-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">{isEs ? 'Registro de hoy' : "Today's log"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{isEs ? 'Meta semanal' : 'Weekly goal'}{showPmos ? ' PMOS' : ''}: {isEs ? '150 min y 2 días de fuerza' : '150 min & 2 strength days'}</p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-2xl font-bold text-foreground tabular-nums">{streak.current}</span>
                    <span className="text-sm text-muted-foreground font-medium">{isEs ? 'días activos seguidos' : 'active days streak'}</span>
                  </div>
                </div>
                <WeeklyGoalCard compact pmos={showPmos} week={week} loading={workoutLogs.loading} />
              </div>
              <div className="flex flex-col justify-between gap-3 min-w-0 lg:border-l lg:border-border lg:pl-6">
                <TodayHistory compact logs={workoutLogs.logs} loading={workoutLogs.loading} onSeeAll={() => setActiveTab('log')} />
              {isCompletedToday ? (
                <div className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-leaf/10 text-leaf border border-leaf/20">
                  <span aria-hidden className="material-symbols-outlined text-lg">check_circle</span>
                  <span>{isEs ? 'Entrenamiento de hoy listo' : "Today's workout completed"}</span>
                </div>
              ) : quickOpen ? (
                <form onSubmit={submitQuick} className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                    {isEs ? 'Minutos entrenados' : 'Minutes trained'}
                    <input
                      inputMode="numeric"
                      value={quickMinutes}
                      onChange={(e) => setQuickMinutes(e.target.value)}
                      placeholder="30"
                      className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-normal tabular-nums placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </label>
                  <div role="radiogroup" aria-label={isEs ? 'Cómo te sentiste' : 'How you felt'} className="flex gap-1.5">
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
                    <button type="button" onClick={() => { setQuickOpen(false); setQuickError(null); }} className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 cursor-pointer">{isEs ? 'Cancelar' : 'Cancel'}</button>
                    <button type="submit" disabled={workoutLogs.saving} className="flex-1 min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer">
                      {workoutLogs.saving ? (isEs ? 'Guardando…' : 'Saving…') : (isEs ? 'Guardar' : 'Save')}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickOpen(true)}
                  className="w-full min-h-11 px-3 whitespace-nowrap rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-card text-foreground border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">task_alt</span>
                  <span>{isEs ? 'Registrar entrenamiento' : 'Log workout'}</span>
                </button>
              )}
              </div>
              </div>
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
              {isEs ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        )}

        {toast && (
          <div role="status" className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[56] max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl bg-foreground text-background text-sm font-semibold shadow-lg flex items-center gap-2">
            <span aria-hidden className="material-symbols-outlined text-lg text-leaf">check_circle</span>
            {toast}
          </div>
        )}
        {/* Sticky Tab Navigation */}
        {/* Opaque strip behind the card so scrolled content never shows around it */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 max-sm:bg-transparent bg-background">
        <div data-phase={phaseKey} className="px-1.5 sm:px-4 rounded-2xl bg-card border border-border shadow-sm">
          <div
            role="tablist"
            aria-label="Secciones de rutinas"
            className="flex overflow-x-auto scrollbar-hide gap-0.5 sm:gap-1 -mb-px max-[380px]:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] xl:[mask-image:none]"
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
                  className={`relative flex items-center justify-center gap-1.5 px-1.5 sm:px-3 lg:px-4 min-h-12 shrink-0 max-sm:flex-1 max-sm:px-1 max-sm:text-[13px] text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <span aria-hidden className={`material-symbols-outlined text-lg shrink-0 max-lg:!hidden ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {tab.icon}
                  </span>
                  <span className="lg:hidden">{tab.shortLabel ?? tab.label}</span>
                  <span className="max-lg:hidden">{tab.label}</span>
                  {locked && (
                    <>
                      <span aria-hidden className="material-symbols-outlined text-sm text-muted-foreground shrink-0 max-lg:!absolute max-lg:top-1 max-lg:right-0 max-lg:!text-[11px]">lock</span>
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
        </div>
        {/* Tab 0: Programas Casa & Gym */}
        <div role="tabpanel" id="routines-panel-programs" aria-labelledby="routines-tab-programs" className={activeTab === 'programs' ? 'flex flex-col gap-6' : 'hidden'}>
          <ProgramsExplorer
            onAddToRoutine={openAddToRoutine}
            phaseKey={phaseKey}
            getLastSets={isGuest ? undefined : getLastSets}
            onLogWorkout={isGuest ? undefined : (entry) => workoutLogs.addLogWithId({ ...entry, feeling: 3, phase: phaseKey })}
            onUndoLog={isGuest ? undefined : workoutLogs.removeLog}
            onFinishSession={isGuest ? undefined : ({ sessionId, refId, label, durationMinutes, exercisesLogged }) => {
              void workoutLogs.addLog({
                exercise: label.slice(0, 80),
                sets: null,
                weightKg: null,
                durationMinutes,
                feeling: 3,
                notes: `Sesión completada: ${exercisesLogged} ejercicios guardados`,
                phase: phaseKey,
                source: 'session',
                sessionId,
                refId: refId || null,
                refName: label.slice(0, 120),
              });
            }}
          />
        </div>

        {/* Tab 1: Para tu Fase */}
        <div role="tabpanel" id="routines-panel-phase" aria-labelledby="routines-tab-phase" className={activeTab === 'phase' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Phase guidance (read-only: the phase comes from the cycle) */}
          {/* Members see this guidance inside the "Hoy" card at the top */}
          {!paused && isGuest && (
            <div data-phase={phaseKey} className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm flex items-start gap-3">
              <div className="size-11 rounded-xl bg-phase-soft flex items-center justify-center text-phase shrink-0">
                <span aria-hidden className="material-symbols-outlined text-2xl">{guidance.icon}</span>
              </div>
              <div className="min-w-0 flex flex-col gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground text-balance">{guidance.title}</h2>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {isGuest ? (isEs ? `Ejemplo: ${phaseName}. Con una cuenta se adapta a tu ciclo.` : `Example: ${phaseName}. With an account it adapts to your cycle.`) : phaseName}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{guidance.desc}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-phase-soft text-phase">{isEs ? `Intensidad: ${guidance.intensity}` : `Intensity: ${guidance.intensity}`}</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-foreground">{guidance.focus}</span>
                </div>
              </div>
            </div>
          )}
          {/* Recommended Movements for Current Phase */}
          <RoutineSection
            title={isEs ? `Ejercicios recomendados para ${phaseName.toLowerCase()}` : `Recommended exercises for ${phaseName.toLowerCase()}`}
            description={guidance.focus}
            icon="fitness_center"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 rounded-2xl bg-card animate-pulse border border-border" />
                ))
              ) : recommendedExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-full">
                  {isEs ? 'No hay ejercicios específicos cargados para esta fase.' : 'No specific exercises loaded for this phase.'}
                </p>
              ) : (
                recommendedExercises.map((ex, i) => (
                  <div key={ex.id} className={i >= 3 && !showAllPhaseEx ? 'max-sm:hidden' : ''}>
                    <ExerciseCard
                      exercise={ex}
                      variant="horizontal"
                      onSave={() => openAddToRoutine({
                        label: exerciseDisplayName(ex, language),
                        suggestedName: language === 'en' ? `Routine ${phaseKey}` : `Rutina ${phaseName}`,
                        exercises: [{ ...ex, name: exerciseDisplayName(ex, language) }],
                      })}
                    />
                  </div>
                ))
              )}
            </div>
            {!loading && recommendedExercises.length > 3 && (
              <button
                type="button"
                aria-expanded={showAllPhaseEx}
                onClick={() => setShowAllPhaseEx((v) => !v)}
                className="sm:hidden self-center min-h-11 px-5 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer"
              >
                {showAllPhaseEx ? (isEs ? 'Ver menos' : 'Show less') : (isEs ? `Ver los ${recommendedExercises.length} ejercicios` : `Show all ${recommendedExercises.length} exercises`)}
              </button>
            )}
          </RoutineSection>

          {/* Automatic phase playlists */}
          <RoutineSection
            title={isEs ? 'Playlists por fase' : 'Playlists by phase'}
            description={isEs ? 'Sesiones de video curadas y organizadas según el momento de tu ciclo hormonal.' : 'Curated video sessions organized by the phase of your cycle.'}
            icon="queue_music"
          >
            <PhasePlaylists videos={workoutVideos} currentPhaseKey={phaseKey} onPlay={(v) => setActiveVideo(v)} />
          </RoutineSection>

        </div>

        {/* Tab 2: Videos Guiados */}
        <div role="tabpanel" id="routines-panel-videos" aria-labelledby="routines-tab-videos" className={activeTab === 'videos' ? 'flex flex-col gap-10' : 'hidden'}>
          <RoutineSection
            compactOnMobile
            title={isEs ? 'Catálogo de videos de entrenamiento' : 'Workout video catalog'}
            description={isEs ? 'Sesiones completas en video adaptadas para realizar en casa o en el gimnasio.' : 'Full video workouts suited for home or gym.'}
            icon="videocam"
            rightElement={
              <span className="self-start md:self-auto text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
                {visibleVideos.length} {visibleVideos.length === 1 ? (isEs ? 'video disponible' : 'video available') : (isEs ? 'videos disponibles' : 'videos available')}
              </span>
            }
          >
            {/* Controls & Filter Bar */}
            <div className="flex flex-col gap-3 bg-card/60 p-3 sm:p-4 rounded-2xl border border-border max-sm:bg-card max-sm:rounded-t-none max-sm:-mt-4">
              <div role="group" aria-label={isEs ? 'Disciplina' : 'Discipline'} className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:none] sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={videoCategory === cat.id}
                    onClick={() => { setVideoCategory(cat.id); setVideosShown(VIDEOS_PAGE); }}
                    className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 min-h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-3 pt-3 border-t border-border/60">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{isEs ? 'Intensidad' : 'Intensity'}</span>
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
                {!isGuest && <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer sm:ml-auto min-h-10">
                  <input
                    type="checkbox"
                    checked={onlyPhaseVideos}
                    onChange={(e) => { setOnlyPhaseVideos(e.target.checked); setVideosShown(VIDEOS_PAGE); }}
                    className="size-4 accent-primary cursor-pointer"
                  />
                  <span><span className="sm:hidden">{isEs ? 'Solo mi fase' : 'My phase only'}</span><span className="max-sm:hidden">{isEs ? 'Solo ideales para mi fase' : 'Ideal for my phase only'}</span></span>
                </label>}
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
                  <p className="text-foreground font-semibold text-base">{isEs ? 'No hay videos con los filtros seleccionados' : 'No videos found with selected filters'}</p>
                  <p className="text-muted-foreground text-xs max-w-sm">
                    {isEs ? 'Prueba a quitar el filtro de fase o cambiar la categoría seleccionada.' : 'Try removing the phase filter or changing the category.'}
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
                    {isEs ? 'Restablecer filtros' : 'Reset filters'}
                  </button>
                </div>
              ) : (
                visibleVideos.slice(0, videosShown).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isPhaseRecommended={!isGuest && video.phases.includes(phaseKey as any)}
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
                  className="px-6 min-h-10 rounded-xl text-sm font-bold border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer shadow-sm"
                >
                  {isEs ? `Cargar más videos (${visibleVideos.length - videosShown} restantes)` : `Load more videos (${visibleVideos.length - videosShown} remaining)`}
                </button>
              </div>
            )}
          </RoutineSection>
        </div>

        {/* Tab 3: Mis Rutinas (members only) */}
        {!isGuest && <div role="tabpanel" id="routines-panel-builder" aria-labelledby="routines-tab-builder" className={activeTab === 'builder' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Saved Routines (if any exist) */}
          <RoutineSection
              title={isEs ? 'Mis Rutinas Guardadas' : 'My Saved Routines'}
              description={isEs ? 'Aquí aparecen las rutinas que creas, con series, repeticiones y peso.' : 'Here you will find the routines you create, with sets, reps, and weights.'}
              icon="bookmark"
              rightElement={
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
                  {userRoutines.length} {userRoutines.length === 1 ? (isEs ? 'rutina' : 'routine') : (isEs ? 'rutinas' : 'routines')}
                </span>
              }
            >
              {userRoutines.length === 0 ? (
                <p className="text-sm text-muted-foreground max-sm:bg-card max-sm:border max-sm:border-border max-sm:rounded-2xl max-sm:p-3">{isEs ? 'Aún no tienes rutinas guardadas. Crea una en la pestaña "Crear rutina".' : 'No saved routines yet. Create one in the "Create routine" tab.'}</p>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...userRoutines]
                  .sort((a, b) => (a.weekday ?? 7) - (b.weekday ?? 7))
                  .map((routine) => (
                  <SavedRoutineCard key={routine.id} routine={routine} onWeekdayChange={updateRoutineWeekday} />
                ))}
              </div>
              )}
            </RoutineSection>

        </div>}

        {/* Tab: Crear rutina (members only) */}
        {!isGuest && <div role="tabpanel" id="routines-panel-create" aria-labelledby="routines-tab-create" className={activeTab === 'create' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Custom routine builder */}
          <RoutineSection
            title={isEs ? 'Crea tu Rutina Semanal' : 'Create your Weekly Routine'}
            description={isEs ? 'Explora más de 1.300 ejercicios por grupo muscular y equipamiento, y arma tu rutina para cada día de la semana.' : 'Browse over 1,300 exercises by muscle group and equipment, and build your routine for each day of the week.'}
            icon="edit_calendar"
            rightElement={
              <button
                type="button"
                onClick={() => document.getElementById('calculadora-1rm')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50 cursor-pointer"
              >
                <span aria-hidden className="material-symbols-outlined text-lg text-primary">calculate</span>
                {isEs ? 'Calculadora de 1RM: saber qué peso usar' : '1RM Calculator: find your working weight'}
                <span aria-hidden className="material-symbols-outlined text-lg">arrow_downward</span>
              </button>
            }
          >
            <RoutineBuilder phaseKey={phaseKey} onSaved={() => { void fetchUserRoutines(); setActiveTab('builder'); }} />
          </RoutineSection>
          <OneRepMaxCalculator currentPhaseKey={phaseKey} />
        </div>}
        {/* Tab 4: Diario y Registro (members only) */}
        {!isGuest && <div role="tabpanel" id="routines-panel-log" aria-labelledby="routines-tab-log" className={activeTab === 'log' ? 'flex flex-col gap-10' : 'hidden'}>
          <RoutineSection
            title={isEs ? 'Diario de entrenamiento' : 'Workout journal'}
            description={isEs ? 'Registra tus rutinas, días de programa o ejercicio libre, y revisa en el calendario qué días entrenaste. Todo se guarda en tu cuenta.' : 'Log your routines, program days, or free workouts, and review on the calendar which days you trained. Everything is saved to your account.'}
            icon="edit_note"
          >
            <WorkoutJournal
              phaseKey={phaseKey}
              effort={suggestion.effort}
              state={workoutLogs}
              routines={userRoutines}
              week={week}
              pmos={showPmos}
              onCreateRoutine={() => setActiveTab('create')}
            />
          </RoutineSection>
        </div>}

        {isGuest && <GuestPreviewBanner message={t.guestRoutinesPreview} />}
        {/* Video Player Modal */}
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onCompleteWorkout={isGuest ? undefined : handleCompleteWorkout}
          isLogged={activeVideoLogged}
        />
        <AddToRoutineDialog
          request={addRequest}
          routines={userRoutines}
          phaseKey={phaseKey}
          onClose={closeAddToRoutine}
          onSaved={onRoutineSaved}
        />

      </div>
    </div>
  );
};

export default Routines;
