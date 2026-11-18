'use client';

import React, { useState, useMemo, useRef } from 'react';
import programsData from '@/data/programsDataset.json';
import { Icon } from '@/components/ui/Icon';
import type { Exercise } from '@/types/exercises';
import type { AddToRoutineRequest } from './AddToRoutineDialog';
const SESSION_KEY = 'cyclesync.routines.session.v1';
const PROGRAM_ICONS: Record<string, string> = {
  'home-abdomen': 'local_fire_department',
  'home-gluteos': 'accessibility_new',
  'home-piernas': 'directions_run',
  'home-cardio': 'favorite',
  'home-pecho': 'fitness_center',
  'home-cuerpo-completo': 'bolt',
  'home-femenino': 'spa',
  'home-pilates': 'self_improvement',
  'home-celulitis': 'auto_awesome',
  'home-calentamiento': 'autorenew',
  'home-hiit': 'bolt',
  'home-tonificacion': 'fitness_center',
  'home-calistenia': 'sports_gymnastics',
  'home-adulto-mayor': 'elderly',
  'home-hombros': 'fitness_center',
  'home-espalda-avanzada': 'fitness_center',
  'home-brazos': 'fitness_center',
  'gym-pecho': 'fitness_center',
  'gym-espalda': 'fitness_center',
  'gym-biceps': 'fitness_center',
  'gym-triceps': 'fitness_center',
  'gym-piernas': 'directions_run',
  'gym-gluteos': 'accessibility_new',
  'gym-abdominales': 'local_fire_department',
  'gym-pantorrillas': 'directions_run',
  'gym-ppl': 'autorenew',
  'gym-fullbody': 'fitness_center',
  'gym-upperlower': 'swap_vert',
  'gym-fuerza5x5': 'emoji_events'
};
const DIFFICULTY_STYLE: Record<string, { chip: string; tile: string }> = {
  principiante: { chip: 'bg-leaf-soft text-leaf', tile: 'bg-leaf-soft text-leaf' },
  intermedio: { chip: 'bg-sun/25 text-sun-ink', tile: 'bg-sun/25 text-sun-ink' },
  avanzado: { chip: 'bg-blush text-bud', tile: 'bg-blush text-bud' },
};
const difficultyStyle = (d: string) => DIFFICULTY_STYLE[d?.toLowerCase()] ?? { chip: 'bg-secondary text-muted-foreground', tile: 'bg-secondary text-muted-foreground' };
const programIcon = (id: string) => PROGRAM_ICONS[id] ?? 'fitness_center';
const MUSCLES_ES: Record<string, string> = {
  abs: 'Abdomen', obliques: 'Oblicuos', glutes: 'Glúteos', quads: 'Cuádriceps', hamstrings: 'Isquiotibiales',
  calves: 'Pantorrillas', pectorals: 'Pecho', triceps: 'Tríceps', deltoids: 'Hombros', delts: 'Hombros',
  shoulders: 'Hombros', back: 'Espalda', lats: 'Dorsales', 'upper back': 'Espalda alta', traps: 'Trapecio',
  biceps: 'Bíceps', flexibility: 'Flexibilidad', neck: 'Cuello', 'cardiovascular system': 'Cardio', adductors: 'Aductores',
};
const musclesEs = (list?: string[]) => Array.from(new Set((list ?? []).map((m) => MUSCLES_ES[m] ?? m)));
// Routine names look like "Abdomen - Rutina 1". When every day of a program shares the prefix,
// the prefix tells nothing apart, so the label uses the part after it ("Rutina 1").
// Program exercises have a video and sets × reps instead of the catalog's GIF: they are saved with those fields.
const toSavedExercise = (ex: ExerciseItem): Exercise => ({
  id: `program:${ex.id}`,
  name: ex.nameEs || ex.name,
  bodyPart: ex.category ?? '',
  equipment: '',
  gifUrl: '',
  target: ex.pattern ?? ex.category ?? '',
  instructions: [ex.notes, ex.formTip].filter((t): t is string => !!t),
  videoUrl: ex.videoUrl || ex.fallbackVideoUrl || null,
  sets: ex.sets,
  reps: ex.reps,
  restSeconds: ex.restSeconds,
});
const routineLabel = (routine: RoutineItem, all: RoutineItem[]) => {
  const [head, ...rest] = routine.name.split(' - ');
  const sharedHead = all.length > 1 && all.every((r) => r.name.split(' - ')[0] === head);
  return sharedHead && rest.length ? rest.join(' - ') : head;
};

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
  /** Saves one exercise to the training log. Resolves to the log id, or null when it could not be saved. */
  onLogWorkout?: (entry: ProgramLogEntry) => Promise<string | null>;
  /** Removes a log saved from this screen (used by "Editar"). */
  onUndoLog?: (id: string) => Promise<boolean>;
  /** Called when the user finishes a started routine. */
  onFinishSession?: (summary: ProgramSessionSummary) => void;
  /** Sets from the user's last log of an exercise, used to prefill the form. */
  getLastSets?: (exerciseName: string) => { reps: number | null; weight: number | null }[] | null;
  /** Current cycle phase, used to tint the session UI. */
  phaseKey?: string;
  /** Opens the "add to my routine" picker with a whole routine or one exercise. */
  onAddToRoutine?: (request: AddToRoutineRequest) => void;
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
      <div className="w-full h-full garden-wash wash-leaf pattern-leaves flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Icon name="barbell" size={22} weight="duotone" />
        </div>
        <span className="text-xs font-bold text-foreground">
          {exercise.nameEs || exercise.name}
        </span>
        <span className="text-xs text-muted-foreground">Demostración técnica</span>
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


export interface ProgramLogEntry {
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  notes: string | null;
}
export interface ProgramSessionSummary {
  label: string;
  durationMinutes: number;
  exercisesLogged: number;
}
const ExercisePreviewCard: React.FC<{ exercise: ExerciseItem; index: number; onOpen: () => void }> = ({ exercise, index, onOpen }) => {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [src, setSrc] = useState<string | null>(exercise.videoUrl || exercise.fallbackVideoUrl || null);
  const play = () => { void videoRef.current?.play().catch(() => undefined); };
  const stop = () => {
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0.1; }
  };
  const onError = () => {
    if (src === exercise.videoUrl && exercise.fallbackVideoUrl) setSrc(exercise.fallbackVideoUrl);
    else setSrc(null);
  };
  // Request the video only once the card is near the viewport, not for every card in the strip.
  React.useEffect(() => {
    const el = btnRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Touch screens have no hover: play the card that is mostly on screen, unless the user prefers less motion.
  React.useEffect(() => {
    const el = btnRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (!window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio >= 0.75) play(); else stop(); }, { threshold: [0, 0.75, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onOpen}
      onPointerEnter={play}
      onPointerLeave={stop}
      onFocus={play}
      onBlur={stop}
      className="w-full h-full text-left rounded-xl border border-border bg-background overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
    >
      <span className="relative block aspect-video bg-black">
        {src && near ? (
          <video
            ref={videoRef}
            src={`${src}#t=0.1`}
            muted
            loop
            playsInline
            preload="metadata"
            onError={onError}
            aria-hidden
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 garden-wash wash-leaf flex items-center justify-center text-primary">
            <Icon name="barbell" size={28} weight="duotone" />
          </span>
        )}
        <span className="absolute top-2 left-2 size-7 rounded-full bg-background/90 text-foreground text-xs font-bold flex items-center justify-center tabular-nums shadow-sm">{index + 1}</span>
        <span aria-hidden className="absolute bottom-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">open_in_full</span>
        </span>
      </span>
      <span className="p-3 flex flex-col gap-1.5">
        <span className="text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">{exercise.nameEs || exercise.name}</span>
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 tabular-nums">
          <span className="text-sm font-bold text-primary">{exercise.sets} × {exercise.reps}</span>
          <span className="inline-flex items-center gap-1 text-xs text-foreground/70">
            <span aria-hidden className="material-symbols-outlined text-sm">hourglass_empty</span>
            Descanso {exercise.restSeconds}s
          </span>
        </span>
      </span>
    </button>
  );
};

interface SetRow { reps: string; weight: string }
interface ParsedSet { reps: number | null; weight: number | null }
const toNum = (v: string): number | null => {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const fmtClock = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const logInputClass = 'w-full min-h-11 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary';
interface ExerciseLogPanelProps {
  exercise: ExerciseItem;
  sessionActive: boolean;
  saved: boolean;
  canLog: boolean;
  lastSets: { reps: number | null; weight: number | null }[] | null;
  onSave: (rows: ParsedSet[]) => Promise<boolean>;
  onUndo: () => Promise<boolean>;
}
const ExerciseLogPanel: React.FC<ExerciseLogPanelProps> = ({ exercise, sessionActive, saved, canLog, lastSets, onSave, onUndo }) => {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<SetRow[]>(() =>
    Array.from({ length: Math.min(Math.max(exercise.sets || 3, 1), 10) }, () => ({ reps: '', weight: '' })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = canLog && (expanded || (sessionActive && !saved));
  // Typing in the first set carries over to the empty (or still copied) sets below it.
  const update = (i: number, key: keyof SetRow, value: string) =>
    setRows((r) => {
      const prevFirst = r[0]?.[key] ?? '';
      return r.map((row, idx) => {
        if (idx === i) return { ...row, [key]: value };
        if (i === 0 && idx > 0 && (row[key] === '' || row[key] === prevFirst)) return { ...row, [key]: value };
        return row;
      });
    });
  // "Editar" removes the saved log and reopens the same numbers, so editing never leaves a duplicate.
  const edit = async () => {
    setError(null);
    const ok = await onUndo();
    if (ok) setExpanded(true);
    else setError('No se pudo deshacer el registro. Inténtalo de nuevo.');
  };
  const useLast = () => {
    if (!lastSets) return;
    setRows(lastSets.slice(0, 10).map((l) => ({ reps: l.reps != null ? String(l.reps) : '', weight: l.weight != null ? String(l.weight) : '' })));
  };
  const lastLabel = lastSets
    ? lastSets.map((l) => `${l.reps ?? '–'}${l.weight != null ? ` × ${l.weight} kg` : ''}`).join(' · ')
    : null;
  const submit = async () => {
    const parsed = rows
      .map((r) => ({ reps: toNum(r.reps), weight: toNum(r.weight) }))
      .filter((r) => r.reps != null || r.weight != null);
    if (parsed.length === 0) return setError('Anota las repeticiones o el peso de al menos una serie.');
    setError(null);
    setSaving(true);
    const ok = await onSave(parsed);
    setSaving(false);
    if (ok) {
      setExpanded(false);
    } else {
      setError('No se pudo guardar. Inicia sesión e inténtalo de nuevo.');
    }
  };
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border/50 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-semibold">
          <span aria-hidden className="material-symbols-outlined text-base text-sun">hourglass_empty</span>
          Descanso {exercise.restSeconds}s
        </span>
        {canLog && (
          <div className="flex items-center gap-2">
            {saved ? (
              <>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-leaf">
                  <span aria-hidden className="material-symbols-outlined text-lg">check_circle</span>
                  Guardado
                </span>
                <button
                  type="button"
                  onClick={edit}
                  className="min-h-11 px-3.5 rounded-xl bg-secondary hover:bg-accent text-foreground text-sm font-semibold flex items-center gap-1.5 transition-colors border border-border cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">edit</span>
                  Editar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={open}
                className="min-h-11 px-3.5 rounded-xl bg-secondary hover:bg-accent text-foreground text-sm font-semibold flex items-center gap-1.5 transition-colors border border-border cursor-pointer"
              >
                <span aria-hidden className="material-symbols-outlined text-lg">{open ? 'expand_less' : 'edit_note'}</span>
                {open ? 'Cerrar' : 'Registrar series'}
              </button>
            )}
          </div>
        )}
      </div>
      {!open && error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      {open && (
        <div className="flex flex-col gap-2.5 rounded-xl bg-secondary/40 border border-border/60 p-3">
          {lastLabel && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="text-muted-foreground tabular-nums">Última vez: <span className="font-semibold text-foreground">{lastLabel}</span></p>
              <button type="button" onClick={useLast} className="min-h-9 px-2.5 font-semibold text-primary hover:underline cursor-pointer">Usar estos valores</button>
            </div>
          )}
          <div className="grid grid-cols-[3.5rem_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground px-0.5">
            <span>Serie</span>
            <span>Repeticiones</span>
            <span>Peso (kg)</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[3.5rem_1fr_1fr] gap-2 items-center">
              <span className="text-sm font-bold text-foreground tabular-nums px-0.5">{i + 1}</span>
              <input
                className={logInputClass}
                inputMode="numeric"
                aria-label={`Repeticiones de la serie ${i + 1}`}
                placeholder={exercise.reps}
                value={row.reps}
                onChange={(e) => update(i, 'reps', e.target.value)}
              />
              <input
                className={logInputClass}
                inputMode="decimal"
                aria-label={`Peso de la serie ${i + 1} en kilos`}
                placeholder="0"
                value={row.weight}
                onChange={(e) => update(i, 'weight', e.target.value)}
              />
            </div>
          ))}
          {error && <p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRows((r) => (r.length < 10 ? [...r, { reps: '', weight: '' }] : r))}
              disabled={rows.length >= 10}
              className="min-h-11 px-3 rounded-lg text-sm font-semibold text-primary hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <span aria-hidden className="material-symbols-outlined text-lg">add</span>
              Añadir serie
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="min-h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving ? 'Guardando…' : 'Guardar ejercicio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProgramsExplorer: React.FC<ProgramsExplorerProps> = ({ onLogWorkout, onUndoLog, onFinishSession, getLastSets, phaseKey, onAddToRoutine }) => {
  const [activeCategory, setActiveCategory] = useState<'home' | 'gym'>('home');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const stripRef = useRef<HTMLOListElement>(null);
  const scrollStrip = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 440, behavior: 'smooth' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('home-abdomen');
  const [selectedRoutineIndex, setSelectedRoutineIndex] = useState<number>(0);
  const [videoModalExercise, setVideoModalExercise] = useState<ExerciseItem | null>(null);
  const [loggedMsg, setLoggedMsg] = useState<string | null>(null);
  const [session, setSession] = useState<{ label: string; startedAt: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(() => new Set());
  const [confirmFinish, setConfirmFinish] = useState<null | 'empty' | 'partial' | 'ready'>(null);
  const [finishMinutes, setFinishMinutes] = useState('');
  const [finishNote, setFinishNote] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  // Restore a session that was running when the page was reloaded.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d.startedAt === 'number' && typeof d.programId === 'string') {
          setActiveCategory(d.category === 'gym' ? 'gym' : 'home');
          setSelectedProgramId(d.programId);
          setSelectedRoutineIndex(Number(d.routineIndex) || 0);
          setSavedKeys(new Set(Array.isArray(d.savedKeys) ? d.savedKeys : []));
          setSavedIds(d.savedIds && typeof d.savedIds === 'object' ? d.savedIds : {});
          setCurrentIdx(Number(d.currentIdx) || 0);
          setSession({ label: String(d.label ?? ''), startedAt: d.startedAt });
          setElapsed(Math.floor((Date.now() - d.startedAt) / 1000));
          setPlayerOpen(true);
        }
      }
    } catch {
      /* storage unavailable or corrupt: start clean */
    }
    setHydrated(true);
  }, []);
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      if (!session) { sessionStorage.removeItem(SESSION_KEY); return; }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        category: activeCategory,
        programId: selectedProgramId,
        routineIndex: selectedRoutineIndex,
        currentIdx,
        savedKeys: Array.from(savedKeys),
        savedIds,
      }));
    } catch {
      /* ignore */
    }
  }, [hydrated, session, activeCategory, selectedProgramId, selectedRoutineIndex, currentIdx, savedKeys, savedIds]);
  React.useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [session]);

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
    setCurrentIdx(0);
  };

  const flash = (msg: string) => {
    setLoggedMsg(msg);
    setTimeout(() => setLoggedMsg(null), 3500);
  };
  const exerciseKey = (ex: ExerciseItem, idx: number) => `${activeProgram?.id}:${activeRoutine?.id}:${ex.id || idx}`;
  const handleSaveExercise = async (ex: ExerciseItem, idx: number, rows: ParsedSet[]): Promise<boolean> => {
    if (!onLogWorkout || !activeProgram || !activeRoutine) return false;
    const name = ex.nameEs || ex.name;
    const weights = rows.map((r) => r.weight).filter((w): w is number => w != null);
    const detail = rows
      .map((r) => `${r.reps ?? '–'}${r.weight != null ? ` × ${r.weight} kg` : ''}`)
      .join(' · ');
    const id = await onLogWorkout({
      exercise: name.slice(0, 80),
      sets: rows.length,
      weightKg: weights.length ? Math.max(...weights) : null,
      durationMinutes: null,
      notes: `${detail} — ${activeProgram.name}, ${routineLabel(activeRoutine, activeProgram.routines)}`.slice(0, 300),
    });
    if (!id) return false;
    const key = exerciseKey(ex, idx);
    setSavedKeys((prev) => new Set(prev).add(key));
    setSavedIds((prev) => ({ ...prev, [key]: id }));
    setCurrentIdx((cur) => (cur === idx ? Math.min(idx + 1, activeRoutine.exercises.length - 1) : cur));
    flash(`"${name}" guardado en tu diario.`);
    return true;
  };
  const handleUndoExercise = async (ex: ExerciseItem, idx: number): Promise<boolean> => {
    const key = exerciseKey(ex, idx);
    const id = savedIds[key];
    if (!id || !onUndoLog) return false;
    const ok = await onUndoLog(id);
    if (!ok) return false;
    setSavedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
    setSavedIds((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setCurrentIdx(idx);
    flash('Registro eliminado. Corrige los números y guarda de nuevo.');
    return true;
  };
  const startSession = () => {
    if (!activeProgram || !activeRoutine) return;
    setSavedKeys(new Set());
    setElapsed(0);
    setCurrentIdx(0);
    setSession({ label: `${activeProgram.name}: ${routineLabel(activeRoutine, activeProgram.routines)}`, startedAt: Date.now() });
    setPlayerOpen(true);
  };
  const savedInRoutine = activeRoutine ? activeRoutine.exercises.filter((ex, i) => savedKeys.has(exerciseKey(ex, i))).length : 0;
  const endSession = () => {
    setSession(null);
    setPlayerOpen(false);
    setSavedKeys(new Set());
    setSavedIds({});
    setConfirmFinish(null);
    setFinishNote(null);
    setCurrentIdx(0);
  };
  const commitFinish = () => {
    if (!session) return;
    const typed = Math.round(Number(finishMinutes.replace(',', '.')));
    const minutes = Number.isFinite(typed) && typed >= 1 ? Math.min(typed, 300) : 1;
    onFinishSession?.({ label: session.label, durationMinutes: minutes, exercisesLogged: savedKeys.size });
    flash(`Sesión guardada: ${minutes} min.`);
    endSession();
  };
  const exitWithoutCredit = () => {
    if (onLogWorkout) flash('Sesión cerrada sin registrar: no suma a tu racha ni a tus minutos.');
    endSession();
  };
  // A session only counts when something was logged, and its length is confirmed (and capped) before saving.
  const requestFinish = () => {
    if (!session || !activeRoutine) return;
    if (!onLogWorkout) return endSession();
    const raw = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
    const cap = Math.ceil((activeRoutine.estimatedMinutes || 30) * 1.5);
    setFinishMinutes(String(Math.min(raw, cap)));
    setFinishNote(raw > cap ? `El cronómetro marcó ${raw} min. Lo ajustamos a ${cap}: corrígelo si hace falta.` : null);
    if (savedInRoutine === 0) return setConfirmFinish('empty');
    setConfirmFinish(savedInRoutine * 2 < activeRoutine.exercises.length ? 'partial' : 'ready');
  };
  const renderExerciseDetail = (ex: ExerciseItem, idx: number) => (
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
                            <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-base font-bold text-center shrink-0 tabular-nums">
                              {ex.sets} series × {ex.reps}
                            </div>
                          </div>

                          {/* Notes & Form Tips */}
                          <div className="mt-2.5 flex flex-col gap-1.5 text-sm">
                            {ex.notes && (
                              <p className="text-muted-foreground leading-relaxed">
                                <strong>Ejecución:</strong> {ex.notes}
                              </p>
                            )}
                            {ex.formTip && (
                              <p className="text-leaf leading-relaxed bg-leaf/5 p-2 rounded-lg border border-leaf/15">
                                <span aria-hidden className="material-symbols-outlined text-base align-text-bottom mr-1">lightbulb</span><strong>Consejo de postura:</strong> {ex.formTip}
                              </p>
                            )}
                          </div>
                        </div>

                        <ExerciseLogPanel
                          key={exerciseKey(ex, idx)}
                          exercise={ex}
                          sessionActive={!!session}
                          saved={savedKeys.has(exerciseKey(ex, idx))}
                          canLog={!!onLogWorkout}
                          lastSets={getLastSets ? getLastSets((ex.nameEs || ex.name).slice(0, 80)) : null}
                          onSave={(rows) => handleSaveExercise(ex, idx, rows)}
                          onUndo={() => handleUndoExercise(ex, idx)}
                        />
                      </div>
                    </div>
  );
  return (
    <div data-phase={phaseKey} className="w-full flex flex-col gap-6">
      {/* ── TOOLBAR: mode, search, level ── */}
      <div className="flex flex-col xl:flex-row gap-2.5 xl:items-center">
        <div className="flex flex-wrap gap-2.5 xl:contents">
        {/* Home vs Gym: neutral segments, so pink stays reserved for the main action */}
        <div role="group" aria-label="Lugar de entrenamiento" className="flex bg-secondary/60 p-1 rounded-xl border border-border gap-1 shrink-0">
          {([
            { id: 'home', label: 'En casa', first: 'home-abdomen' },
            { id: 'gym', label: 'Gimnasio', first: 'gym-ppl' },
          ] as const).map((opt) => {
            const active = activeCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                disabled={!!session}
                onClick={() => {
                  setActiveCategory(opt.id);
                  setSelectedProgramId(opt.first);
                  setSelectedRoutineIndex(0);
                  setCurrentIdx(0);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 min-h-10 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  active ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {opt.id === 'home'
                  ? <span aria-hidden className="material-symbols-outlined text-[18px] max-sm:hidden">home</span>
                  : <span className="inline-flex max-sm:hidden"><Icon name="barbell" size={18} weight="bold" /></span>}
                {opt.label}
              </button>
            );
          })}
        </div>
        <select
          aria-label="Nivel"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="xl:hidden flex-1 min-w-[9.5rem] min-h-11 px-3 bg-card border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {['all', 'principiante', 'intermedio', 'avanzado'].map((d) => (
            <option key={d} value={d}>{'Nivel: '}{d === 'all' ? 'Todos' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        </div>
        <div className="relative flex-1 min-w-0">
          <span aria-hidden className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[18px]">
            search
          </span>
          <input
            type="search"
            aria-label="Buscar programas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar: glúteos, abdomen, pecho…"
            className="w-full pl-10 pr-4 min-h-11 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div role="group" aria-label="Nivel" className="hidden xl:flex bg-secondary/60 p-1 rounded-xl border border-border gap-1 overflow-x-auto scrollbar-hide shrink-0">
          {['all', 'principiante', 'intermedio', 'avanzado'].map((diff) => {
            const active = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 px-3 min-h-10 rounded-lg text-sm font-semibold transition-all whitespace-nowrap capitalize cursor-pointer ${
                  active ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {diff === 'all' ? 'Todos' : diff}
              </button>
            );
          })}
        </div>
      </div>
      {loggedMsg && (
        <div className="p-3 bg-leaf/10 border border-leaf/30 text-leaf text-xs font-bold rounded-xl text-center">
          {loggedMsg}
        </div>
      )}

      {/* ── PROGRAM STRIP + FULL-WIDTH DETAIL ── */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 px-0.5">
            <h2 className="text-sm font-bold text-foreground">Programas</h2>
            <span className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
              {filteredPrograms.length} disponibles<span className="md:hidden"> · desliza para ver más</span>
              <span className="hidden md:flex gap-2">
                {([['Programas anteriores', 'chevron_left', -1], ['Programas siguientes', 'chevron_right', 1]] as const).map(([label, icon, dir]) => (
                  <button key={icon} type="button" aria-label={label} onClick={() => scrollStrip(dir)} className="size-10 -my-2 rounded-full border border-border bg-card text-foreground flex items-center justify-center hover:border-primary/50 cursor-pointer">
                    <span aria-hidden className="material-symbols-outlined text-xl">{icon}</span>
                  </button>
                ))}
              </span>
            </span>
          </div>
          {filteredPrograms.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center text-muted-foreground text-sm border border-border">
              No se encontraron programas con ese criterio.
            </div>
          ) : (
            <ol ref={stripRef} className="flex gap-3 overflow-x-auto snap-x scroll-px-3 py-3 -my-1.5 px-3 scrollbar-hide">
              {filteredPrograms.map((program) => {
                const isSelected = activeProgram?.id === program.id;
                const totalExercises = program.routines.reduce((sum, r) => sum + r.exercises.length, 0);
                const diff = difficultyStyle(program.difficulty);
                return (
                  <li key={program.id} className="snap-start shrink-0 w-56 lg:w-60 first:ml-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectProgram(program.id)}
                      aria-pressed={isSelected}
                      className={`w-full h-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-card border-primary ring-1 ring-primary shadow-md'
                          : 'bg-card hover:bg-secondary/60 border-border'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${diff.tile}`}>
                          <span className="material-symbols-outlined text-xl">{programIcon(program.id)}</span>
                        </span>
                        <span className="font-bold text-sm text-foreground leading-snug line-clamp-2 text-balance">{program.name}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                        <span className="whitespace-nowrap" title={`${totalExercises} ejercicios · ${program.durationWeeks} semanas`}>{totalExercises} ej. · {program.durationWeeks} sem</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full capitalize ${diff.chip}`}>{program.difficulty}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        {/* Selected program */}
        <section aria-label="Programa seleccionado" className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          {activeProgram && (
            <div className="flex flex-col">
              {/* Program Overview */}
              <header className="flex items-start gap-4 p-5 sm:p-6 garden-wash wash-leaf border-b border-border">
                <span aria-hidden className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center shrink-0 ${difficultyStyle(activeProgram.difficulty).tile}`}>
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">{programIcon(activeProgram.id)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground text-balance leading-tight">{activeProgram.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-sm text-muted-foreground tabular-nums">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${difficultyStyle(activeProgram.difficulty).chip}`}>{activeProgram.difficulty}</span>
                    <span>{activeCategory === 'home' ? 'En casa' : 'Gimnasio'} · {activeProgram.durationWeeks} semanas · {activeProgram.routines.length} {activeProgram.routines.length === 1 ? 'rutina' : 'rutinas'}</span>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mt-3 text-pretty max-w-prose leading-relaxed">{activeProgram.description}</p>
                </div>
              </header>

              <div className="flex flex-col gap-5 p-4 sm:p-6">
              {/* Routine days: a real tab list with distinguishable names */}
              {activeProgram.routines.length > 1 && (
                <div role="tablist" aria-label="Rutinas del programa" className="grid grid-flow-col auto-cols-fr gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 -mb-2">
                  {activeProgram.routines.map((rot, idx) => {
                    const active = selectedRoutineIndex === idx;
                    return (
                      <button
                        key={rot.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        disabled={!!session && !active}
                        title={rot.name}
                        onClick={() => { setSelectedRoutineIndex(idx); setCurrentIdx(0); }}
                        className={`min-w-28 flex flex-col items-start px-4 py-2 min-h-12 rounded-xl text-left border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? 'bg-primary/10 border-primary/50 text-foreground'
                            : 'bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <span className={`text-xs font-bold tabular-nums ${active ? 'text-primary' : ''}`}>Día {idx + 1}</span>
                        <span className="text-sm font-semibold whitespace-nowrap">{routineLabel(rot, activeProgram.routines)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Routine summary, start button and session bar */}
              {activeRoutine && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl bg-secondary/40 border border-border/60 p-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-lg leading-snug text-balance">{activeRoutine.name}</h4>
                      {activeRoutine.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 text-pretty">{activeRoutine.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm font-semibold tabular-nums">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <span aria-hidden className="material-symbols-outlined text-base text-primary">timer</span>
                          ~{activeRoutine.estimatedMinutes || 30} min
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground mr-1">
                          <span aria-hidden className="material-symbols-outlined text-base text-primary">format_list_numbered</span>
                          {activeRoutine.exercises.length} ejercicios
                        </span>
                        {musclesEs(activeRoutine.targetMuscles).map((m) => (
                          <span key={m} className="px-2.5 py-1 rounded-full bg-leaf-soft text-leaf text-xs">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-2 xl:shrink-0 max-md:sticky max-md:bottom-20 max-md:z-10 max-md:-mx-1 max-md:p-1 max-md:rounded-2xl max-md:bg-background/90 max-md:backdrop-blur-md">
                      {onAddToRoutine && (
                        <button
                          type="button"
                          onClick={() => onAddToRoutine({
                            label: activeRoutine.name,
                            suggestedName: `${activeProgram.name}: ${routineLabel(activeRoutine, activeProgram.routines)}`,
                            exercises: activeRoutine.exercises.map(toSavedExercise),
                          })}
                          aria-label="Guardar en mis rutinas"
                          className="min-h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <span aria-hidden className="material-symbols-outlined text-xl">playlist_add</span>
                          <span className="max-md:hidden whitespace-nowrap">Guardar en mis rutinas</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={session ? () => setPlayerOpen(true) : startSession}
                        className="max-md:flex-1 min-h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span aria-hidden className="material-symbols-outlined text-xl">{session ? 'resume' : 'play_arrow'}</span>
                        <span className="whitespace-nowrap">{session ? 'Volver a la sesión' : onLogWorkout ? 'Comenzar rutina' : 'Ver guía paso a paso'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Preview of the routine. Training itself happens in the full-screen player below. */}
              {activeRoutine && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h4 className="text-base font-bold text-foreground">Ejercicios de la rutina</h4>
                    <p className="text-xs text-foreground/70">Toca un ejercicio para ver la demostración.</p>
                  </div>
                  <ol className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {activeRoutine.exercises.map((ex, idx) => (
                      <li key={ex.id || idx}>
                        <ExercisePreviewCard exercise={ex} index={idx} onOpen={() => setVideoModalExercise(ex)} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── WORKOUT PLAYER: training happens on its own screen, away from the catalog ── */}
      {session && playerOpen && activeProgram && activeRoutine && (
        <div role="dialog" aria-modal="true" aria-label={`Sesión: ${session.label}`} className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlayerOpen(false)}
                aria-label="Volver al catálogo (la sesión sigue en curso)"
                className="size-11 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 cursor-pointer"
              >
                <span aria-hidden className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground truncate">{activeProgram.name}</p>
                <h2 className="text-base font-bold text-foreground truncate">{routineLabel(activeRoutine, activeProgram.routines)}</h2>
              </div>
              <span aria-hidden className="text-xl font-bold text-phase tabular-nums">{fmtClock(elapsed)}</span>
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-5 pb-16">
                  {(
                    <div className="rounded-xl border border-phase/30 bg-phase-soft p-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          {/* The clock is decorative: a live region ticking every second would flood screen readers. */}
                          <span aria-hidden className="text-2xl font-bold text-phase tabular-nums">{fmtClock(elapsed)}</span>
                          <div className="text-sm">
                            <p className="font-semibold text-foreground">Ejercicio {currentIdx + 1} de {activeRoutine.exercises.length}</p>
                            <p role="status" className="text-xs text-muted-foreground tabular-nums">
                              {onLogWorkout
                                ? `${savedInRoutine} de ${activeRoutine.exercises.length} ejercicios guardados`
                                : 'Crea una cuenta para registrar tus series.'}
                            </p>
                          </div>
                        </div>
                        {!confirmFinish && (
                          <button
                            type="button"
                            onClick={requestFinish}
                            className="min-h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            <span aria-hidden className="material-symbols-outlined text-lg">flag</span>
                            {onLogWorkout ? 'Finalizar sesión' : 'Salir de la guía'}
                          </button>
                        )}
                      </div>
                      {confirmFinish && (
                        <div role="alert" className="flex flex-col gap-3 border-t border-phase/20 pt-3">
                          <p className="text-sm text-foreground text-pretty">
                            {confirmFinish === 'empty'
                              ? 'No has guardado ningún ejercicio. Si sales ahora, la sesión no suma a tu racha ni a tus minutos.'
                              : confirmFinish === 'partial'
                                ? `Guardaste ${savedInRoutine} de ${activeRoutine.exercises.length} ejercicios. Se registrará la sesión con los que guardaste.`
                                : 'Confirma cuánto duró la sesión antes de guardarla.'}
                          </p>
                          {confirmFinish !== 'empty' && (
                            <div className="flex flex-col gap-1.5">
                              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                                Minutos
                                <input
                                  inputMode="numeric"
                                  value={finishMinutes}
                                  onChange={(e) => setFinishMinutes(e.target.value)}
                                  className="w-24 min-h-11 rounded-xl border border-border bg-card px-3 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-primary"
                                />
                              </label>
                              {finishNote && <p className="text-xs text-muted-foreground">{finishNote}</p>}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmFinish(null)}
                              className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 cursor-pointer"
                            >
                              Seguir entrenando
                            </button>
                            <button
                              type="button"
                              onClick={confirmFinish === 'empty' ? exitWithoutCredit : commitFinish}
                              className="min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 cursor-pointer"
                            >
                              {confirmFinish === 'empty' ? 'Salir sin registrar' : 'Guardar sesión'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              {activeRoutine.exercises[currentIdx] && (
                <div className="flex flex-col gap-4">
                  <ol className="flex gap-2 overflow-x-auto pb-1" aria-label="Progreso de la rutina">
                    {activeRoutine.exercises.map((ex, idx) => {
                      const done = savedKeys.has(exerciseKey(ex, idx));
                      const current = idx === currentIdx;
                      return (
                        <li key={ex.id || idx} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setCurrentIdx(idx)}
                            aria-current={current ? 'step' : undefined}
                            aria-label={`Ejercicio ${idx + 1}: ${ex.nameEs || ex.name}${done ? ', guardado' : ''}`}
                            className={`size-11 rounded-full text-sm font-bold flex items-center justify-center border transition-all cursor-pointer tabular-nums ${
                              current
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : done
                                  ? 'bg-leaf-soft text-leaf border-leaf/30'
                                  : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                            }`}
                          >
                            {done && !current ? <span aria-hidden className="material-symbols-outlined text-lg">check</span> : idx + 1}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  {renderExerciseDetail(activeRoutine.exercises[currentIdx], currentIdx)}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      disabled={currentIdx === 0}
                      className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <span aria-hidden className="material-symbols-outlined text-lg">arrow_back</span>
                      Anterior
                    </button>
                    {currentIdx < activeRoutine.exercises.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((i) => Math.min(activeRoutine.exercises.length - 1, i + 1))}
                        className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold flex items-center gap-1.5 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        Siguiente
                        <span aria-hidden className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Último ejercicio: finaliza la sesión.</span>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

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
                <span aria-hidden className="material-symbols-outlined text-base align-text-bottom mr-1">lightbulb</span><strong>Consejo biomecánico:</strong> {videoModalExercise.formTip}
              </div>
            )}
            {onAddToRoutine && (
              <div className="p-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const ex = videoModalExercise;
                    setVideoModalExercise(null);
                    onAddToRoutine({ label: ex.nameEs || ex.name, suggestedName: 'Mi rutina', exercises: [toSavedExercise(ex)] });
                  }}
                  className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold flex items-center gap-2 hover:border-primary/50 cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-lg">playlist_add</span>
                  Agregar a mi rutina
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
