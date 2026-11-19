'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { useWorkoutLogs, WorkoutLogInput } from '@/hooks/useWorkoutLogs';
import type { Routine } from '@/types/exercises';
import type { Effort, WeeklyActivity } from '@/lib/exercise/weeklyActivity';
import { addDays, computeStreak, dayTotals, isoDay, lastDoneByRoutine, lastProgramRoutine } from '@/lib/exercise/trainingStats';
import { suggestWorkouts, type Suggestion } from '@/lib/exercise/suggestWorkout';
import { PROGRAMS, findProgramRoutine, programRoutineExercises } from '@/lib/planner/programs';
import { exerciseDisplayName } from '@/data/exerciseNamesEs';
import { useLanguage } from '@/i18n/LanguageContext';
import WeeklyGoalCard from '../WeeklyGoalCard';
import SessionLogger, { type SessionPlan } from './SessionLogger';
import TrainingCalendar, { type PlannedDay } from './TrainingCalendar';
import WorkoutHistory from './WorkoutHistory';
import { isTimedExercise } from './ExercisePicker';

const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  phaseKey: string;
  effort: Effort;
  state: ReturnType<typeof useWorkoutLogs>;
  routines: Routine[];
  week: WeeklyActivity;
  pmos: boolean;
  /** Opens the "Crear rutina" tab. */
  onCreateRoutine: () => void;
}

function routinePlan(r: Routine, lang: 'es' | 'en' = 'es'): SessionPlan {
  return {
    title: r.name,
    source: 'routine',
    refId: r.id,
    refName: r.name,
    minutes: null,
    exercises: r.exercises.map((ex) => {
      const name = exerciseDisplayName(ex, lang);
      return { name, sets: ex.sets ?? 3, reps: ex.reps ?? '10', weight: ex.weight ?? null, timed: isTimedExercise(name, ex.bodyPart) };
    }),
  };
}

function programPlan(routineId: string): SessionPlan | null {
  const found = findProgramRoutine(routineId);
  if (!found) return null;
  const refName = `${found.program.name} · ${found.routine.label}`;
  return {
    title: refName,
    source: 'program',
    refId: routineId,
    refName,
    minutes: found.routine.minutes,
    exercises: programRoutineExercises(routineId).map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      timed: ex.category === 'cardio' && !ex.sets,
    })),
  };
}

const freePlan = (date?: string, exercise?: string, minutes?: number, isEn = false): SessionPlan => ({
  title: exercise ?? (isEn ? 'Free workout' : 'Entrenamiento libre'),
  source: 'free',
  refId: null,
  refName: null,
  minutes: minutes ?? null,
  exercises: exercise ? [{ name: exercise, timed: true, minutes: minutes ?? null }] : [],
  date,
});

const Stat: React.FC<{ label: string; value: number; unit: string; icon: string }> = ({ label, value, unit, icon }) => (
  <div className="bg-card px-3.5 py-3 sm:px-4 flex items-center gap-3 min-w-0">
    <span aria-hidden className="material-symbols-outlined text-2xl text-primary shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums">{value} <span className="text-sm font-medium text-muted-foreground">{unit}</span></p>
    </div>
  </div>
);

/** The "Diario" tab: start a session from what she already has, log it, and look back at the calendar and history. */
const WorkoutJournal: React.FC<Props> = ({ phaseKey, effort, state, routines, week, pmos, onCreateRoutine }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { logs, loading, saving, addLogs, removeLogs } = state;
  const today = isoDay(new Date());
  const yesterday = addDays(today, -1);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [planKey, setPlanKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const loggerRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => dayTotals(logs), [logs]);
  const streak = useMemo(() => computeStreak(totals.keys(), today), [totals, today]);
  const lastProgram = useMemo(() => lastProgramRoutine(logs), [logs]);
  const lastRoutines = useMemo(() => lastDoneByRoutine(logs), [logs]);
  const monthDays = useMemo(() => Array.from(totals.keys()).filter((d) => d.startsWith(today.slice(0, 7))).length, [totals, today]);
  const weekday = (new Date().getDay() + 6) % 7;

  const suggestions = useMemo(() => suggestWorkouts({
    effort,
    weekday,
    routines: routines.map((r) => ({ id: r.id, name: r.name, weekday: r.weekday ?? null, exerciseCount: r.exercises.length })),
    programs: PROGRAMS,
    lastProgramRoutineId: lastProgram?.refId ?? null,
    lastDoneByRoutine: lastRoutines,
    week,
    strengthYesterday: !!totals.get(yesterday)?.strength,
    trainedToday: totals.has(today),
  }), [effort, weekday, routines, lastProgram, lastRoutines, week, totals, yesterday, today]);

  // Program picker: defaults to the next day of the program she follows.
  const nextProgramDay = useMemo(() => {
    const found = lastProgram ? findProgramRoutine(lastProgram.refId) : null;
    if (!found) return { programId: PROGRAMS[0]?.id ?? '', routineId: PROGRAMS[0]?.routines[0]?.id ?? '' };
    const i = found.program.routines.findIndex((r) => r.id === found.routine.id);
    return { programId: found.program.id, routineId: found.program.routines[(i + 1) % found.program.routines.length].id };
  }, [lastProgram]);
  const [programId, setProgramId] = useState('');
  const [programDayId, setProgramDayId] = useState('');
  const [programTouched, setProgramTouched] = useState(false);
  // Follow the history as it loads, until she picks something herself.
  useEffect(() => {
    if (programTouched) return;
    setProgramId(nextProgramDay.programId);
    setProgramDayId(nextProgramDay.routineId);
  }, [nextProgramDay, programTouched]);
  const program = PROGRAMS.find((p) => p.id === programId);

  // Workouts planned in the weekly planner, for the calendar.
  const [planned, setPlanned] = useState<Map<string, PlannedDay>>(new Map());
  const loadPlanned = useCallback(async (y: number, m: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const from = isoDay(new Date(y, m, 1));
      const to = isoDay(new Date(y, m + 1, 0));
      const { data, error } = await supabase
        .from('workout_plan_entries')
        .select('plan_date, title, kind, done')
        .eq('user_id', session.user.id)
        .gte('plan_date', from)
        .lte('plan_date', to);
      if (error) return;
      setPlanned(new Map((data ?? []).filter((r: any) => r.kind !== 'rest').map((r: any) => [r.plan_date, { title: r.title, kind: r.kind, done: !!r.done }])));
    } catch {
      // Offline: the calendar still shows what was trained.
    }
  }, []);
  useEffect(() => { void loadPlanned(+today.slice(0, 4), +today.slice(5, 7) - 1); }, [loadPlanned, today]);

  const start = (p: SessionPlan | null) => {
    if (!p) return;
    setPlan(p);
    setPlanKey((k) => k + 1);
    requestAnimationFrame(() => loggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const startSuggestion = (s: Suggestion) => {
    if (s.kind === 'routine') { const r = routines.find((x) => x.id === s.routineId); if (r) start(routinePlan(r, language)); }
    else if (s.kind === 'program') start(programPlan(s.routineId));
    else start(freePlan(undefined, s.exercise, s.minutes, isEn));
  };
  const save = async (inputs: WorkoutLogInput[]) => {
    const ids = await addLogs(inputs);
    if (!ids) return false;
    const date = inputs[0]?.date ?? today;
    setPlan(null);
    setFlash(
      date === today
        ? (isEn ? 'Workout saved to your journal.' : 'Entrenamiento guardado en tu diario.')
        : (isEn ? `Workout saved on ${date}.` : `Entrenamiento guardado el ${date.split('-').reverse().join('/')}.`),
    );
    setTimeout(() => setFlash(null), 4000);
    return true;
  };

  const sortedRoutines = [...routines].sort((a, b) => Number(b.weekday === weekday) - Number(a.weekday === weekday) || (a.weekday ?? 7) - (b.weekday ?? 7));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-sm">
        <Stat label={isEn ? "Current streak" : "Racha actual"} value={streak.current} unit={streak.current === 1 ? (isEn ? 'day' : 'día') : (isEn ? 'days' : 'días')} icon="local_fire_department" />
        <Stat label={isEn ? "Best streak" : "Mejor racha"} value={streak.longest} unit={streak.longest === 1 ? (isEn ? 'day' : 'día') : (isEn ? 'days' : 'días')} icon="military_tech" />
        <Stat label={isEn ? "This month" : "Este mes"} value={monthDays} unit={monthDays === 1 ? (isEn ? 'day' : 'día') : (isEn ? 'days' : 'días')} icon="calendar_month" />
        <Stat label={isEn ? "This week" : "Esta semana"} value={week.minutes} unit="min" icon="timer" />
      </div>

      {flash && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-foreground">
          <span aria-hidden className="material-symbols-outlined text-lg text-leaf">check_circle</span>{flash}
        </p>
      )}

      <div ref={loggerRef} className="scroll-mt-24 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm">
        {plan ? (
          <SessionLogger key={planKey} plan={plan} phaseKey={phaseKey} logs={logs} today={today} saving={saving} onSave={save} onCancel={() => setPlan(null)} />
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {totals.has(today) ? (isEn ? 'Anything else today?' : '¿Algo más hoy?') : (isEn ? 'What are you training today?' : '¿Qué entrenas hoy?')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn ? 'Start from your routines or programs, or log what you did on your own.' : 'Empieza desde tus rutinas o programas, o anota lo que hiciste por tu cuenta.'}
              </p>
            </div>

            {suggestions.length > 0 && (
              <section aria-labelledby="journal-suggest-title" className="flex flex-col gap-2">
                <h4 id="journal-suggest-title" className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span aria-hidden className="material-symbols-outlined text-lg text-primary">auto_awesome</span>
                  {isEn ? 'Suggested for today' : 'Sugerido para hoy'}
                </h4>
                <ul className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
                  {suggestions.map((s, i) => (
                    <li key={s.key} className="snap-start shrink-0 basis-[78%] sm:basis-[55%] md:basis-auto">
                      <button
                        type="button"
                        onClick={() => startSuggestion(s)}
                        className={`w-full h-full text-left rounded-xl border p-3.5 flex flex-col gap-1.5 transition-all cursor-pointer hover:border-primary/60 hover:shadow-sm ${i === 0 ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span aria-hidden className="material-symbols-outlined text-xl text-primary">{s.icon}</span>
                          <span className="text-sm font-bold text-foreground text-balance">{s.title}</span>
                        </span>
                        <span className="text-xs text-muted-foreground text-pretty">{s.reason}</span>
                        <span className="mt-auto pt-1 text-sm font-bold text-primary inline-flex items-center gap-1">
                          {isEn ? 'Log' : 'Registrar'}
                          <span aria-hidden className="material-symbols-outlined text-lg">arrow_forward</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
              {/* From a saved routine */}
              <section aria-labelledby="journal-routines-title" className="py-4 lg:py-2 lg:px-5 lg:first:pl-0 lg:last:pr-0 flex flex-col gap-2.5">
                <h4 id="journal-routines-title" className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span aria-hidden className="material-symbols-outlined text-lg text-primary">bookmark</span>
                  {isEn ? 'My routines' : 'Mis rutinas'}
                </h4>
                {routines.length === 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">{isEn ? 'You don’t have saved routines yet.' : 'Aún no tienes rutinas guardadas.'}</p>
                    <button type="button" onClick={onCreateRoutine} className="self-start min-h-10 text-sm font-semibold text-primary hover:underline cursor-pointer">
                      {isEn ? 'Create a routine' : 'Crear una rutina'}
                    </button>
                  </>
                ) : (
                  <ul className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                    {sortedRoutines.map((r) => {
                      const weekdays = isEn ? WEEKDAY_SHORT_EN : WEEKDAY_SHORT;
                      return (
                        <li key={r.id}>
                          <button type="button" onClick={() => start(routinePlan(r, language))} className="w-full min-h-11 px-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left flex items-center justify-between gap-2 cursor-pointer">
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-foreground truncate">{r.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {r.exercises.length} {isEn ? 'exercises' : 'ejercicios'}{lastRoutines[r.id] ? ` · ${isEn ? 'last time' : 'última vez'} ${lastRoutines[r.id].split('-').reverse().slice(0, 2).join('/')}` : ''}
                              </span>
                            </span>
                            {r.weekday != null && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${r.weekday === weekday ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
                                {r.weekday === weekday ? (isEn ? 'Today' : 'Hoy') : weekdays[r.weekday]}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* From a program day */}
              <section aria-labelledby="journal-program-title" className="py-4 lg:py-2 lg:px-5 lg:first:pl-0 lg:last:pr-0 flex flex-col gap-2.5">
                <h4 id="journal-program-title" className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span aria-hidden className="material-symbols-outlined text-lg text-primary">fitness_center</span>
                  {isEn ? 'Program day' : 'Día de un programa'}
                </h4>
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  {isEn ? 'Program' : 'Programa'}
                  <select
                    value={programId}
                    onChange={(e) => { setProgramTouched(true); setProgramId(e.target.value); setProgramDayId(PROGRAMS.find((p) => p.id === e.target.value)?.routines[0]?.id ?? ''); }}
                    className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground cursor-pointer"
                  >
                    <optgroup label={isEn ? 'At home' : 'En casa'}>
                      {PROGRAMS.filter((p) => p.category === 'home').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </optgroup>
                    <optgroup label={isEn ? 'Gym' : 'Gimnasio'}>
                      {PROGRAMS.filter((p) => p.category === 'gym').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </optgroup>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  {isEn ? 'Day' : 'Día'}
                  <select value={programDayId} onChange={(e) => { setProgramTouched(true); setProgramDayId(e.target.value); }} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground cursor-pointer">
                    {program?.routines.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}{r.minutes ? ` · ${r.minutes} min` : ''}{r.id === nextProgramDay.routineId && lastProgram ? (isEn ? ' (scheduled today)' : ' (toca hoy)') : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" disabled={!programDayId} onClick={() => start(programPlan(programDayId))} className="mt-auto min-h-11 px-4 rounded-xl bg-secondary hover:bg-accent text-sm font-bold text-foreground disabled:opacity-50 cursor-pointer">
                  {isEn ? 'Log this day' : 'Registrar este día'}
                </button>
              </section>

              {/* Free */}
              <section aria-labelledby="journal-free-title" className="py-4 lg:py-2 lg:px-5 lg:first:pl-0 lg:last:pr-0 flex flex-col gap-2.5">
                <h4 id="journal-free-title" className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span aria-hidden className="material-symbols-outlined text-lg text-primary">edit_note</span>
                  {isEn ? 'Free workout' : 'Ejercicio libre'}
                </h4>
                <p className="text-sm text-muted-foreground text-pretty">
                  {isEn
                    ? 'A fitness class, a walk, or individual movements. Search 1,300+ exercises or type your own.'
                    : 'Una clase, una caminata o ejercicios sueltos. Busca entre más de 1.300 ejercicios o escribe el tuyo.'}
                </p>
                <button type="button" onClick={() => start(freePlan(undefined, undefined, undefined, isEn))} className="mt-auto min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 cursor-pointer">
                  {isEn ? 'Log workout' : 'Anotar entrenamiento'}
                </button>
              </section>
            </div>
          </div>
        )}
      </div>

      <WeeklyGoalCard pmos={pmos} week={week} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          <TrainingCalendar
            totals={totals}
            planned={planned}
            today={today}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonthChange={(y, m) => void loadPlanned(y, m)}
          />
        </div>
        <div className="lg:col-span-3">
          <WorkoutHistory
            logs={logs}
            loading={loading}
            today={today}
            selectedDate={selectedDate}
            onClearDate={() => setSelectedDate(null)}
            onDelete={removeLogs}
            onLogOnDate={(date) => start(freePlan(date, undefined, undefined, isEn))}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutJournal;
