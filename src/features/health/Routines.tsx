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
import WorkoutLogSection from './components/WorkoutLogSection';
import WeeklyGoalCard from './components/WeeklyGoalCard';
import PhasePlaylists from './components/PhasePlaylists';
import RoutineBuilder from './components/RoutineBuilder';
import { ProgramsExplorer } from './components/ProgramsExplorer';
import { ExerciseCard, RoutineSection, SavedRoutineCard, VideoCard, VideoModal } from './components/RoutinesComponents';

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

const TABS: { id: RoutineTab; label: string; icon: string; description: string }[] = [
  { id: 'programs', label: 'Casa & Gym', icon: 'fitness_center', description: '29 programas completos con demostraciones en video HD integradas' },
  { id: 'phase', label: 'Para tu Fase', icon: 'auto_awesome', description: 'Recomendaciones y playlists adaptadas a tu momento hormonal' },
  { id: 'videos', label: 'Videos Guiados', icon: 'videocam', description: 'Catálogo de sesiones en video con filtros por disciplina' },
  { id: 'builder', label: 'Mis Rutinas', icon: 'calendar_month', description: 'Rutinas guardadas y creador semanal de ejercicios' },
  { id: 'log', label: 'Diario y Registro', icon: 'edit_note', description: 'Anota tus sesiones y analiza cómo responde tu cuerpo' },
];

const Routines: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
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
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeVideo, setActiveVideo] = useState<WorkoutVideo | null>(null);

  const phaseKey = cycleInfo ? PHASE_KEY_MAP[cycleInfo.phase] || 'follicular' : 'follicular';
  const phaseNameEs = PHASE_NAMES_ES[phaseKey] || 'Fase Folicular';
  const guidance = PHASE_GUIDANCE[phaseKey] || PHASE_GUIDANCE.follicular;

  const today = localDay();
  const isCompletedToday = streak.lastCompletedDate === today;
  const periodLate = (cycleInfo?.daysLate ?? 0) > 0;
  const week = useMemo(() => summarizeWeek(workoutLogs.logs), [workoutLogs.logs]);
  const suggestion = suggestEffort(phaseKey, energyToday, periodLate);
  const effort = EFFORT_COPY[suggestion.effort];

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
  }, [cycleLoading, phaseKey]);

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
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-10 pb-32">

        {/* Hero Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-foreground text-3xl md:text-4xl font-bold tracking-tight">
              Rutinas y Entrenamiento
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Tu fase es el punto de partida y tu energía de hoy decide. Con PMOS lo que más cuenta es el total de la semana: 150 minutos de actividad y 2 días de fuerza.
            </p>
          </div>

          {/* Status & Daily Activity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phase Status Card */}
            <div className="md:col-span-2 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-2xl">{guidance.icon}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu Fase Actual</span>
                    <h2 className="text-xl font-bold text-foreground">
                      {cycleLoading ? 'Cargando...' : periodLate ? `Día ${cycleInfo?.cycleDay ?? '?'} • Regla con retraso` : `${phaseNameEs} • Día ${cycleInfo?.cycleDay ?? '?'}`}
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                  {effort.label}
                </span>
              </div>

              <div className="text-sm">
                <p className="font-semibold text-foreground">{effort.examples}</p>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{effortReason(suggestion.reason, energyToday)}</p>
              </div>

              <div className="bg-secondary/40 rounded-xl p-3.5 border border-border/50 text-sm">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-foreground">{guidance.title}</p>
                  {activeTab !== 'phase' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('phase')}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                    >
                      <span>Ver ejercicios</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{guidance.desc}</p>
              </div>
            </div>

            {/* Daily Movement Check-in */}
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registro de Hoy</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-foreground">{streak.currentStreak}</span>
                  <span className="text-xs text-muted-foreground font-medium">días activos seguidos</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {streak.totalCompleted} {streak.totalCompleted === 1 ? 'entrenamiento registrado' : 'entrenamientos registrados'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCompleteWorkout}
                  disabled={isCompletedToday}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isCompletedToday
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isCompletedToday ? 'check_circle' : 'task_alt'}
                  </span>
                  <span>{isCompletedToday ? 'Entrenamiento de hoy listo' : 'Registrar sesión de hoy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('log')}
                  className="text-xs text-muted-foreground hover:text-foreground text-center font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 py-1"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span>Abrir diario de entrenamiento</span>
                </button>
              </div>
            </div>
          </div>

          <WeeklyGoalCard week={week} loading={workoutLogs.loading} onLog={() => setActiveTab('log')} />
        </section>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center font-bold text-sm">
            {error}
          </div>
        )}

        {/* Sticky Tab Navigation */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-background/85 backdrop-blur-md border-y border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 p-1.5 rounded-2xl bg-secondary/50 border border-border gap-1.5 shadow-xs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-card text-foreground shadow-sm border border-border/80 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg sm:text-xl shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                  {tab.id === 'programs' && (
                    <span className={`hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0 ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      29
                    </span>
                  )}
                  {tab.id === 'phase' && (
                    <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0 ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {phaseNameEs.replace('Fase ', '')}
                    </span>
                  )}
                  {tab.id === 'videos' && (
                    <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0 ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {visibleVideos.length}
                    </span>
                  )}
                  {tab.id === 'builder' && userRoutines.length > 0 && (
                    <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0 ${
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
        <div className={activeTab === 'programs' ? 'flex flex-col gap-6' : 'hidden'}>
          <ProgramsExplorer
            onLogWorkout={(exerciseName, sets, reps) => {
              void workoutLogs.addLog({
                exercise: `${exerciseName} (${sets ?? 3}x${reps ?? '12'})`.slice(0, 80),
                sets: sets ?? 3,
                weightKg: null,
                durationMinutes: 30,
                feeling: 4,
                notes: 'Programa guiado con video',
                phase: phaseKey,
              });
            }}
          />
        </div>

        {/* Tab 1: Para tu Fase */}
        <div className={activeTab === 'phase' ? 'flex flex-col gap-10' : 'hidden'}>
          {/* Recommended Movements for Current Phase */}
          <RoutineSection
            title={`Ejercicios Recomendados para ${phaseNameEs}`}
            description={guidance.focus}
            icon="fitness_center"
            rightElement={
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
                Intensidad: {guidance.intensity}
              </span>
            }
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
                    onSave={() => onSaveExercise(ex)}
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
        <div className={activeTab === 'videos' ? 'flex flex-col gap-10' : 'hidden'}>
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
            <div className="flex flex-col gap-3.5 bg-card/60 p-4 rounded-2xl border border-border">
              {/* Categories */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setVideoCategory(cat.id); setVideosShown(VIDEOS_PAGE); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        videoCategory === cat.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary/70 hover:bg-secondary text-foreground border border-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Phase alignment quick toggle */}
                <button
                  type="button"
                  onClick={() => { setOnlyPhaseVideos(!onlyPhaseVideos); setVideosShown(VIDEOS_PAGE); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    onlyPhaseVideos
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-secondary/70 hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {onlyPhaseVideos ? 'auto_awesome' : 'filter_list'}
                  </span>
                  <span>Solo ideales para mi fase</span>
                </button>
              </div>

              {/* Intensities */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                  Intensidad:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INTENSITIES.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => { setVideoIntensity(lvl.id); setVideosShown(VIDEOS_PAGE); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        videoIntensity === lvl.id
                          ? 'bg-foreground text-background font-bold shadow-xs'
                          : 'bg-secondary/50 hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
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

        {/* Tab 3: Mis Rutinas */}
        <div className={activeTab === 'builder' ? 'flex flex-col gap-10' : 'hidden'}>
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
        </div>

        {/* Tab 4: Diario y Registro */}
        <div className={activeTab === 'log' ? 'flex flex-col gap-10' : 'hidden'}>
          <RoutineSection
            title="Registro de Entrenamientos"
            description="Anota qué hiciste y cómo te sentiste para ver cómo responde tu cuerpo en cada fase."
            icon="edit_note"
          >
            <WorkoutLogSection phaseKey={phaseKey} state={workoutLogs} />
          </RoutineSection>
        </div>

        {/* Video Player Modal */}
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onCompleteWorkout={handleCompleteWorkout}
          isCompletedToday={isCompletedToday}
        />

      </div>
    </div>
  );
};

export default Routines;
