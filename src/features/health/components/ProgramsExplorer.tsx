'use client';

import React, { useState, useMemo } from 'react';
import programsData from '@/data/programsDataset.json';
import { Icon } from '@/components/ui/Icon';

export interface ExerciseItem {
  id: string;
  exerciseDbId: string;
  name: string;
  nameEs: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  formTip?: string;
  category?: string;
  pattern?: string;
  videoUrl?: string | null;
  fallbackVideoUrl?: string | null;
  videoType?: string;
}

export interface RoutineItem {
  id: string;
  name: string;
  description?: string;
  targetMuscles?: string[];
  estimatedMinutes?: number;
  exercises: ExerciseItem[];
}

export interface ProgramItem {
  id: string;
  name: string;
  description: string;
  category: 'home' | 'gym';
  difficulty: string;
  durationWeeks: number;
  icon?: string;
  routines: RoutineItem[];
}

export interface ProgramsExplorerProps {
  onLogWorkout?: (exerciseName: string, sets?: number, reps?: string) => void;
}

interface ExerciseVideoPlayerProps {
  exercise: ExerciseItem;
  onExpand?: () => void;
}

const ExerciseVideoPlayer: React.FC<ExerciseVideoPlayerProps> = ({ exercise, onExpand }) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(exercise.videoUrl || null);
  const [hasError, setHasError] = useState(false);

  // Update when exercise changes
  React.useEffect(() => {
    setVideoSrc(exercise.videoUrl || null);
    setHasError(false);
  }, [exercise.videoUrl]);

  const handleError = () => {
    if (videoSrc === exercise.videoUrl && exercise.fallbackVideoUrl) {
      // Try fallback video (male version or alternative)
      setVideoSrc(exercise.fallbackVideoUrl);
    } else {
      setHasError(true);
    }
  };

  if (!videoSrc || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-muted/80 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Icon name="barbell" size={22} weight="duotone" />
        </div>
        <span className="text-[11px] font-bold text-foreground">
          {exercise.nameEs || exercise.name}
        </span>
        <span className="text-[10px] text-muted-foreground">Demostración técnica</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden group bg-black flex items-center justify-center">
      <video
        key={videoSrc}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        onError={handleError}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        aria-label={exercise.nameEs || exercise.name}
      />
      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center shadow-md cursor-pointer"
          aria-label="Ver video en grande"
        >
          <span className="material-symbols-outlined text-[16px]">fullscreen</span>
        </button>
      )}
    </div>
  );
};

export const ProgramsExplorer: React.FC<ProgramsExplorerProps> = ({ onLogWorkout }) => {
  const [activeCategory, setActiveCategory] = useState<'home' | 'gym'>('home');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('home-abdomen');
  const [selectedRoutineIndex, setSelectedRoutineIndex] = useState<number>(0);
  const [videoModalExercise, setVideoModalExercise] = useState<ExerciseItem | null>(null);
  const [loggedMsg, setLoggedMsg] = useState<string | null>(null);

  const homePrograms = (programsData.homePrograms || []) as ProgramItem[];
  const gymPrograms = (programsData.gymPrograms || []) as ProgramItem[];

  const currentProgramList = activeCategory === 'home' ? homePrograms : gymPrograms;

  // Filter programs by difficulty & search query
  const filteredPrograms = useMemo(() => {
    return currentProgramList.filter((p) => {
      const matchDiff = selectedDifficulty === 'all' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchDiff && matchSearch;
    });
  }, [currentProgramList, selectedDifficulty, searchQuery]);

  // Selected program object
  const activeProgram = useMemo(() => {
    return (
      currentProgramList.find((p) => p.id === selectedProgramId) ||
      filteredPrograms[0] ||
      currentProgramList[0]
    );
  }, [currentProgramList, selectedProgramId, filteredPrograms]);

  // Active routine
  const activeRoutine = useMemo(() => {
    if (!activeProgram || !activeProgram.routines || activeProgram.routines.length === 0) return null;
    return activeProgram.routines[selectedRoutineIndex] || activeProgram.routines[0];
  }, [activeProgram, selectedRoutineIndex]);

  const handleSelectProgram = (progId: string) => {
    setSelectedProgramId(progId);
    setSelectedRoutineIndex(0);
  };

  const handleQuickLog = (exercise: ExerciseItem) => {
    if (onLogWorkout) {
      onLogWorkout(exercise.nameEs || exercise.name, exercise.sets, exercise.reps);
      setLoggedMsg(`¡"${exercise.nameEs || exercise.name}" agregado a tu Diario!`);
      setTimeout(() => setLoggedMsg(null), 3500);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── TOP HEADER / MODE SWITCHER ── */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Icon name="barbell" size={24} weight="duotone" className="text-primary" />
            Programas y Rutinas Guiadas con Video
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            29 programas (17 En Casa + 12 En Gimnasio) con demostraciones en video HD integradas
          </p>
        </div>

        {/* Home vs Gym Segmented Switch */}
        <div className="flex bg-secondary/80 p-1.5 rounded-xl border border-border gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('home');
              setSelectedProgramId('home-abdomen');
              setSelectedRoutineIndex(0);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeCategory === 'home'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            En Casa (17)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('gym');
              setSelectedProgramId('gym-ppl');
              setSelectedRoutineIndex(0);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeCategory === 'gym'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="barbell" size={18} weight="bold" />
            Gimnasio (12)
          </button>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar programa de ${activeCategory === 'home' ? 'casa' : 'gimnasio'} (ej. glúteos, abdomen, pecho, PPL)...`}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {['all', 'principiante', 'intermedio', 'avanzado'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize ${
                selectedDifficulty === diff
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {diff === 'all' ? 'Todos los niveles' : diff}
            </button>
          ))}
        </div>
      </div>

      {loggedMsg && (
        <div className="p-3 bg-leaf/10 border border-leaf/30 text-leaf text-xs font-bold rounded-xl text-center">
          {loggedMsg}
        </div>
      )}

      {/* ── MAIN 2-COLUMN LAYOUT: PROGRAM SELECTOR (LEFT) + ACTIVE ROUTINE & VIDEOS (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Programs Carousel / List */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 max-h-[750px] overflow-y-auto pr-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            Programas Disponibles ({filteredPrograms.length})
          </span>
          {filteredPrograms.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center text-muted-foreground text-xs border border-border">
              No se encontraron programas con ese criterio.
            </div>
          ) : (
            filteredPrograms.map((program) => {
              const isSelected = activeProgram?.id === program.id;
              const totalExercises = program.routines.reduce(
                (sum, r) => sum + r.exercises.length,
                0
              );

              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => handleSelectProgram(program.id)}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 shadow-xs ${
                    isSelected
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                      : 'bg-card hover:bg-secondary/60 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>{program.icon || '🎯'}</span>
                      {program.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {program.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold pt-1 border-t border-border/40 mt-1">
                    <span>{program.routines.length} rutinas / días</span>
                    <span>·</span>
                    <span>{totalExercises} ejercicios</span>
                    <span>·</span>
                    <span>{program.durationWeeks} sem</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column (8 cols): Selected Program Detail & Video Player */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {activeProgram && (
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">
              {/* Program Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{activeProgram.icon || '🎯'}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {activeCategory === 'home' ? 'Entrenamiento En Casa' : 'Gimnasio'} · {activeProgram.durationWeeks} semanas
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">
                    {activeProgram.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {activeProgram.description}
                  </p>
                </div>
              </div>

              {/* Routine Days / Tabs Selector */}
              {activeProgram.routines.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Días / Rutinas del programa:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeProgram.routines.map((rot, idx) => (
                      <button
                        key={rot.id}
                        type="button"
                        onClick={() => setSelectedRoutineIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedRoutineIndex === idx
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {rot.name} ({rot.exercises.length} exs · {rot.estimatedMinutes || 25}m)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Routine Header */}
              {activeRoutine && (
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-foreground text-base">
                      {activeRoutine.name}
                    </h4>
                    {activeRoutine.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activeRoutine.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                      ~{activeRoutine.estimatedMinutes || 30} min
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                      {activeRoutine.exercises.length} Ejercicios
                    </span>
                  </div>
                </div>
              )}

              {/* Exercise List with Embedded MP4 Loop Video */}
              <div className="flex flex-col gap-4">
                {activeRoutine &&
                  activeRoutine.exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="bg-background rounded-2xl border border-border overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row"
                    >
                      {/* Video Player Box */}
                      <div className="w-full md:w-56 h-48 md:h-auto bg-black relative shrink-0 flex items-center justify-center overflow-hidden">
                        <ExerciseVideoPlayer
                          exercise={ex}
                          onExpand={ex.videoUrl ? () => setVideoModalExercise(ex) : undefined}
                        />
                      </div>

                      {/* Exercise Details */}
                      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                Ejercicio {idx + 1}
                              </span>
                              <h4 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                                {ex.nameEs || ex.name}
                              </h4>
                              {ex.nameEs && ex.name !== ex.nameEs && (
                                <p className="text-xs text-muted-foreground italic">
                                  {ex.name}
                                </p>
                              )}
                            </div>

                            {/* Sets x Reps Pill */}
                            <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-xl text-xs font-black text-center shrink-0">
                              {ex.sets} series × {ex.reps}
                            </div>
                          </div>

                          {/* Notes & Form Tips */}
                          <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
                            {ex.notes && (
                              <p className="text-muted-foreground leading-relaxed">
                                <strong>Ejecución:</strong> {ex.notes}
                              </p>
                            )}
                            {ex.formTip && (
                              <p className="text-leaf leading-relaxed bg-leaf/5 p-2 rounded-lg border border-leaf/15">
                                💡 <strong>Consejo de postura:</strong> {ex.formTip}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom bar with Rest timer & Quick Log */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                          <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-amber-500">
                              hourglass_empty
                            </span>
                            Descanso: {ex.restSeconds}s
                          </span>

                          {onLogWorkout && (
                            <button
                              type="button"
                              onClick={() => handleQuickLog(ex)}
                              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-foreground font-bold flex items-center gap-1.5 transition-colors border border-border"
                            >
                              <span className="material-symbols-outlined text-[14px]">add_task</span>
                              Registrar en Diario
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── VIDEO MODAL ── */}
      {videoModalExercise && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setVideoModalExercise(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-card border border-border rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div>
                <h3 className="font-bold text-foreground text-base">
                  {videoModalExercise.nameEs || videoModalExercise.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {videoModalExercise.sets} series × {videoModalExercise.reps} · {videoModalExercise.restSeconds}s descanso
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalExercise(null)}
                className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {videoModalExercise.videoUrl ? (
                <video
                  src={videoModalExercise.videoUrl}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-muted-foreground text-sm">Video no disponible</p>
              )}
            </div>

            {videoModalExercise.formTip && (
              <div className="p-4 bg-secondary/50 border-t border-border text-xs text-muted-foreground">
                💡 <strong>Consejo biomecánico:</strong> {videoModalExercise.formTip}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
