'use client';

import React, { useId, useMemo, useState } from 'react';
import type { WorkoutLogInput } from '@/hooks/useWorkoutLogs';
import { lastSetsFor, type JournalLog, type SetEntry } from '@/lib/exercise/trainingStats';
import { FEELINGS, SOURCE_META, formatSets, inputClass } from './shared';
import ExercisePicker from './ExercisePicker';
import { useLanguage } from '@/i18n/LanguageContext';

export interface PlanExercise {
  name: string;
  /** Prescribed sets and reps, shown as the target ("3 × 12"). */
  sets?: number | null;
  reps?: string | null;
  weight?: number | null;
  /** Time-based work (cardio, mobility) is logged in minutes instead of sets. */
  timed?: boolean;
  minutes?: number | null;
}

export interface SessionPlan {
  title: string;
  source: 'routine' | 'program' | 'free';
  refId: string | null;
  refName: string | null;
  exercises: PlanExercise[];
  minutes: number | null;
  /** YYYY-MM-DD, today when omitted. */
  date?: string;
}

interface SetRow { reps: string; weight: string }
interface Row {
  key: string;
  name: string;
  target: string | null;
  timed: boolean;
  minutes: string;
  sets: SetRow[];
  done: boolean;
  last: SetEntry[] | null;
}

const toNum = (v: string): number | null => {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

let keySeq = 0;
function buildRow(ex: PlanExercise, logs: JournalLog[], done: boolean): Row {
  const last = lastSetsFor(logs, ex.name);
  const count = Math.max(1, Math.min(10, ex.sets ?? last?.length ?? 3));
  const repsNum = ex.reps && /^\d+$/.test(ex.reps.trim()) ? ex.reps.trim() : '';
  // Prefill with what she lifted last time; otherwise with the routine's prescription.
  const sets: SetRow[] = Array.from({ length: count }, (_, i) => {
    const prev = last?.[i] ?? last?.[last.length - 1];
    return {
      reps: prev?.reps != null ? String(prev.reps) : repsNum,
      weight: prev?.weight != null ? String(prev.weight) : ex.weight != null ? String(ex.weight) : '',
    };
  });
  return {
    key: `row-${++keySeq}`,
    name: ex.name,
    target: ex.sets && ex.reps ? `${ex.sets} × ${ex.reps}` : null,
    timed: !!ex.timed,
    minutes: ex.minutes ? String(ex.minutes) : '',
    sets,
    done,
    last,
  };
}

interface Props {
  plan: SessionPlan;
  phaseKey: string;
  logs: JournalLog[];
  today: string;
  saving: boolean;
  onSave: (inputs: WorkoutLogInput[]) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * Logs one training session: a saved routine, a program day or free exercises. Every finished
 * exercise is saved with its sets, plus a summary row with the minutes and how it felt, all
 * under one session id so the history shows them together.
 */
const SessionLogger: React.FC<Props> = ({ plan, phaseKey, logs, today, saving, onSave, onCancel }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const isFree = plan.source === 'free';
  // Exercises of a routine or program start unticked: she marks what she actually did.
  const [rows, setRows] = useState<Row[]>(() => plan.exercises.map((ex) => buildRow(ex, logs, isFree)));
  const [minutes, setMinutes] = useState(plan.minutes ? String(plan.minutes) : '');
  const [feeling, setFeeling] = useState(0);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(plan.date ?? today);
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  const knownNames = useMemo(() => Array.from(new Set(logs.filter((l) => l.source !== 'session').map((l) => l.exercise))).slice(0, 200), [logs]);
  const doneCount = rows.filter((r) => r.done).length;
  const timedMinutes = rows.filter((r) => r.done && r.timed).reduce((s, r) => s + (toNum(r.minutes) ?? 0), 0);

  const update = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const updateSet = (key: string, i: number, patch: Partial<SetRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, sets: r.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : r)));
  const addExercise = (name: string, timed: boolean) => {
    setRows((prev) => [...prev, buildRow({ name, timed, sets: timed ? null : undefined }, logs, true)]);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const done = rows.filter((r) => r.done);
    if (done.length === 0) return setError(isFree ? (isEn ? 'Add at least one exercise.' : 'Añade al menos un ejercicio.') : (isEn ? 'Check the exercises you completed.' : 'Marca los ejercicios que hiciste.'));
    const total = Math.round(toNum(minutes) ?? timedMinutes);
    if (!Number.isFinite(total) || total < 1 || total > 300) return setError(isEn ? 'Indicate how many total minutes you trained (1 to 300).' : 'Indica cuántos minutos entrenaste en total (1 a 300).');
    if (feeling === 0) return setError(isEn ? 'Select how you felt.' : 'Elige cómo te sentiste.');
    if (date > today) return setError(isEn ? 'You cannot log a day in the future.' : 'No puedes registrar un día que aún no ha llegado.');
    setError(null);

    const ref = plan.refName ?? plan.title;
    const sessionId = crypto.randomUUID();
    const base = { feeling, phase: phaseKey, date, source: plan.source, refId: plan.refId, refName: plan.refName } as const;
    const exerciseInput = (r: Row): WorkoutLogInput => {
      if (r.timed) {
        const m = Math.round(toNum(r.minutes) ?? 0);
        return { ...base, exercise: r.name.slice(0, 80), sets: null, weightKg: null, durationMinutes: null, notes: m > 0 ? `${m} min — ${ref}`.slice(0, 300) : null, setDetails: null };
      }
      const sets = r.sets
        .map((s) => ({ reps: toNum(s.reps), weight: toNum(s.weight) }))
        .filter((s) => s.reps != null || s.weight != null);
      const weights = sets.map((s) => s.weight).filter((w): w is number => w != null && w > 0);
      return {
        ...base,
        exercise: r.name.slice(0, 80),
        sets: sets.length || null,
        weightKg: weights.length ? Math.max(...weights) : null,
        durationMinutes: null,
        // Same note format as the program guide, read back by older versions of the history.
        notes: sets.length ? `${formatSets(sets)} — ${ref}`.slice(0, 300) : null,
        setDetails: sets.length ? sets : null,
      };
    };

    let inputs: WorkoutLogInput[];
    if (done.length === 1) {
      // One exercise is one row: no summary row needed.
      const only = exerciseInput(done[0]);
      inputs = [{ ...only, durationMinutes: total, notes: [only.notes, note.trim()].filter(Boolean).join(' · ').slice(0, 300) || null }];
    } else {
      inputs = [
        {
          ...base,
          source: 'session',
          sessionId,
          exercise: plan.title.slice(0, 80),
          sets: null,
          weightKg: null,
          durationMinutes: total,
          notes: `${isEn ? 'Completed session:' : 'Sesión completada:'} ${done.length} ${isEn ? (done.length === 1 ? 'exercise saved' : 'exercises saved') : (done.length === 1 ? 'ejercicio guardado' : 'ejercicios guardados')}${note.trim() ? ` · ${note.trim()}` : ''}`.slice(0, 300),
        },
        ...done.map((r) => ({ ...exerciseInput(r), sessionId })),
      ];
    }
    const ok = await onSave(inputs);
    if (!ok) setError(isEn ? 'Could not save. Sign in and try again.' : 'No se pudo guardar. Inicia sesión e inténtalo de nuevo.');
  };

  const sourceLabel = isEn
    ? (plan.source === 'routine' ? 'My routine' : plan.source === 'program' ? 'Program' : 'Free')
    : SOURCE_META[plan.source].label;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-labelledby={`${ids}-title`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 text-xs font-bold text-primary">
            <span aria-hidden className="material-symbols-outlined text-sm">{SOURCE_META[plan.source].icon}</span>
            {sourceLabel}
          </p>
          <h3 id={`${ids}-title`} className="text-lg font-bold text-foreground text-balance">{plan.title}</h3>
          {!isFree && (
            <p className="text-sm text-muted-foreground">
              {isEn ? 'Mark what you completed and adjust reps and weight. Pre-filled with your last session.' : 'Marca lo que hiciste y ajusta repeticiones y peso. Se rellena con tu última vez.'}
            </p>
          )}
        </div>
        <button type="button" onClick={onCancel} aria-label={isEn ? "Close logger" : "Cerrar registro"} className="size-11 shrink-0 rounded-xl border border-border bg-card flex items-center justify-center hover:border-primary/50 cursor-pointer">
          <span aria-hidden className="material-symbols-outlined">close</span>
        </button>
      </div>

      <ol className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.key} className={`rounded-xl border p-3 transition-colors ${r.done ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer min-h-11">
                <input type="checkbox" checked={r.done} onChange={(e) => update(r.key, { done: e.target.checked })} className="size-5 accent-primary shrink-0 cursor-pointer" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground first-letter:uppercase">{r.name}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums truncate">
                    {[r.target ? (isEn ? `Target ${r.target}` : `Objetivo ${r.target}`) : null, r.last ? (isEn ? `Last time: ${formatSets(r.last)}` : `Última vez: ${formatSets(r.last)}`) : null].filter(Boolean).join(' · ') || (r.timed ? (isEn ? 'Timed' : 'Por tiempo') : (isEn ? 'Sets & reps' : 'Series y repeticiones'))}
                  </span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => update(r.key, { timed: !r.timed })}
                className="min-h-9 px-2.5 rounded-lg text-xs font-semibold bg-secondary/70 hover:bg-secondary text-foreground cursor-pointer shrink-0"
                aria-label={`${r.name}: ${isEn ? 'log by' : 'registrar por'} ${r.timed ? (isEn ? 'sets' : 'series') : (isEn ? 'time' : 'tiempo')}`}
              >
                {r.timed ? (isEn ? 'Timed' : 'Por tiempo') : (isEn ? 'Sets' : 'Series')}
              </button>
              {(isFree || !plan.exercises.some((p) => p.name === r.name)) && (
                <button type="button" onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))} aria-label={`${isEn ? 'Remove' : 'Quitar'} ${r.name}`} className="size-9 shrink-0 rounded-lg text-muted-foreground hover:text-destructive flex items-center justify-center cursor-pointer">
                  <span aria-hidden className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </div>

            {r.done && (r.timed ? (
              <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground max-w-48">
                {isEn ? 'Minutes' : 'Minutos'}
                <input inputMode="numeric" value={r.minutes} onChange={(e) => update(r.key, { minutes: e.target.value })} placeholder="20" className={inputClass} />
              </label>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="grid grid-cols-[2rem_1fr_1fr_2.25rem] gap-2 text-xs font-semibold text-muted-foreground px-0.5">
                  <span>{isEn ? 'Set' : 'Serie'}</span><span>{isEn ? 'Reps' : 'Reps'}</span><span>{isEn ? 'Kg' : 'Kg'}</span><span className="sr-only">{isEn ? 'Remove' : 'Quitar'}</span>
                </div>
                {r.sets.map((s, i) => (
                  <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.25rem] gap-2 items-center">
                    <span className="text-sm font-bold text-muted-foreground tabular-nums text-center">{i + 1}</span>
                    <input aria-label={`${r.name}, ${isEn ? 'set' : 'serie'} ${i + 1}: ${isEn ? 'reps' : 'repeticiones'}`} inputMode="numeric" value={s.reps} onChange={(e) => updateSet(r.key, i, { reps: e.target.value })} placeholder="10" className={inputClass} />
                    <input aria-label={`${r.name}, ${isEn ? 'set' : 'serie'} ${i + 1}: ${isEn ? 'weight (kg)' : 'kilos'}`} inputMode="decimal" value={s.weight} onChange={(e) => updateSet(r.key, i, { weight: e.target.value })} placeholder="—" className={inputClass} />
                    <button
                      type="button"
                      disabled={r.sets.length === 1}
                      onClick={() => update(r.key, { sets: r.sets.filter((_, j) => j !== i) })}
                      aria-label={`${isEn ? 'Remove set' : 'Quitar serie'} ${i + 1} ${isEn ? 'of' : 'de'} ${r.name}`}
                      className="size-9 rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <span aria-hidden className="material-symbols-outlined text-lg">remove</span>
                    </button>
                  </div>
                ))}
                {r.sets.length < 10 && (
                  <button type="button" onClick={() => update(r.key, { sets: [...r.sets, { ...r.sets[r.sets.length - 1] }] })} className="self-start min-h-9 px-1 text-sm font-semibold text-primary hover:underline cursor-pointer">
                    {isEn ? '+ Add set' : '+ Añadir serie'}
                  </button>
                )}
              </div>
            ))}
          </li>
        ))}
      </ol>

      <ExercisePicker knownNames={knownNames} onPick={addExercise} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          {isEn ? 'Total minutes' : 'Minutos en total'}
          <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder={timedMinutes ? String(timedMinutes) : '45'} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          {isEn ? 'Date' : 'Día'}
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={`${ids}-feel`} className="text-sm font-semibold text-foreground">
          {isEn ? 'How did you feel?' : '¿Cómo te sentiste?'}
        </span>
        <div role="radiogroup" aria-labelledby={`${ids}-feel`} className="flex gap-1.5">
          {FEELINGS.map((f) => {
            const label = isEn
              ? (f.value === 1 ? 'Very bad' : f.value === 2 ? 'Bad' : f.value === 3 ? 'Neutral' : f.value === 4 ? 'Good' : 'Great')
              : f.label;
            return (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={feeling === f.value}
                aria-label={label}
                title={label}
                onClick={() => setFeeling(f.value)}
                className={`flex-1 min-h-11 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  feeling === f.value ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span aria-hidden className="material-symbols-outlined text-2xl">{f.icon}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
        {isEn ? 'Note (optional)' : 'Nota (opcional)'}
        <textarea
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isEn ? 'Discomfort, feelings, what to increase next time…' : 'Molestias, sensaciones, qué subir la próxima vez…'}
          className={`${inputClass} py-2`}
        />
      </label>

      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button type="button" onClick={onCancel} className="min-h-12 px-5 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 cursor-pointer">
          {isEn ? 'Cancel' : 'Cancelar'}
        </button>
        <button type="submit" disabled={saving} className="flex-1 min-h-12 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-60 cursor-pointer">
          {saving
            ? (isEn ? 'Saving…' : 'Guardando…')
            : doneCount > 0
              ? (isEn ? `Save workout · ${doneCount} ${doneCount === 1 ? 'exercise' : 'exercises'}` : `Guardar entrenamiento · ${doneCount} ${doneCount === 1 ? 'ejercicio' : 'ejercicios'}`)
              : (isEn ? 'Save workout' : 'Guardar entrenamiento')}
        </button>
      </div>
    </form>
  );
};

export default SessionLogger;
