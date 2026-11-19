'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/exercises';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  GOAL_PLANS,
  loadUnitNote,
  prescribe,
  type Prescription,
  type TrainingGoal,
} from '@/lib/exercise/prescription';
import {
  BODY_PART_LABELS_ES,
  EQUIPMENT_LABELS_ES,
  listBodyParts,
  listEquipment,
  queryExercises,
} from '@/services/exercisesService';
import { useLanguage } from '@/i18n/LanguageContext';
import { exerciseDisplayName } from '@/data/exerciseNamesEs';

export const WEEKDAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PAGE = 24;
const DRAFT_KEY = 'cyclesync.routineBuilder.draft.v1';

type TestSet = { weight: number; reps: number };

const GOAL_COPY_EN: Record<TrainingGoal, { label: string; short: string; progression: string }> = {
  start: {
    label: 'Start from 0',
    short: 'Learn technique with light weight and build up gradually.',
    progression: 'When you complete all sets with 15 reps with good form, increase weight by one step and drop back to 12 reps.',
  },
  maintain: {
    label: 'Maintain',
    short: 'Preserve strength and muscle tone with moderate effort.',
    progression: 'Keep the weight steady; if 12 reps feel too easy across 2 sessions, bump up by one step.',
  },
  hypertrophy: {
    label: 'Hypertrophy',
    short: 'More sets and moderate weights to build muscle and definition.',
    progression: 'When you hit 12 reps across all sets, increase weight and drop back to 8 reps (double progression).',
  },
};

/** The fields of a prescription that live on the saved exercise. */
const toFields = (p: Prescription): Partial<Exercise> => ({
  sets: p.sets,
  reps: p.reps,
  restSeconds: p.restSeconds,
  weight: p.weight,
});

const formatRest = (s: number, isEn = false) => (s < 60 ? `${s} s` : `${(s / 60).toLocaleString(isEn ? 'en-US' : 'es')} min`);

interface Props {
  phaseKey: string;
  onSaved: () => void;
}

const RoutineBuilder: React.FC<Props> = ({ phaseKey, onSaved }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const bodyPartLabel = (bp: string) => (isEn ? bp : (BODY_PART_LABELS_ES[bp] ?? bp));
  const equipmentLabel = (eq: string) => (isEn ? eq : (EQUIPMENT_LABELS_ES[eq] ?? eq));

  const bodyParts = useMemo(() => listBodyParts(), []);
  const equipments = useMemo(() => listEquipment(), []);

  const [bodyPart, setBodyPart] = useState('');
  const [equipment, setEquipment] = useState('body weight');
  const [text, setText] = useState('');
  const [shown, setShown] = useState(PAGE);

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [goal, setGoal] = useState<TrainingGoal>('start');
  const [testSets, setTestSets] = useState<Record<string, TestSet>>({});

  // Keep the draft across reloads. Restore after mount (SSR-safe) and only then start saving.
  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
      if (d) {
        if (Array.isArray(d.selected)) setSelected(d.selected);
        if (typeof d.name === 'string') setName(d.name);
        if (d.goal in GOAL_PLANS) setGoal(d.goal);
        if (d.testSets && typeof d.testSets === 'object') setTestSets(d.testSets);
      }
    } catch { /* corrupt draft: start empty */ }
    setDraftLoaded(true);
  }, []);
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      if (selected.length === 0 && !name) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ selected, name, goal, testSets }));
    } catch { /* storage full or blocked */ }
  }, [draftLoaded, selected, name, goal, testSets]);
  const { items, total } = useMemo(
    () => queryExercises({ bodyPart, equipment, text, limit: shown, lang: language }),
    [bodyPart, equipment, text, shown, language],
  );

  const selectedIds = new Set(selected.map((e) => e.id));
  const groups = Array.from(new Set(selected.map((e) => e.bodyPart)));

  const resetPaging = () => setShown(PAGE);
  const patch = (id: string, change: Partial<Exercise>) =>
    setSelected((prev) => prev.map((e) => (e.id === id ? { ...e, ...change } : e)));
  const suggest = (ex: Exercise, g: TrainingGoal = goal, testSet: TestSet | null = testSets[ex.id] ?? null) =>
    prescribe({ exercise: ex, goal: g, phaseKey, testSet });
  const toggle = (ex: Exercise) =>
    setSelected((prev) =>
      prev.some((e) => e.id === ex.id)
        ? prev.filter((e) => e.id !== ex.id)
        : [...prev, { ...ex, ...toFields(suggest(ex)) }],
    );
  // Switching goal re-plans every exercise; her logged sets carry over.
  const changeGoal = (g: TrainingGoal) => {
    setGoal(g);
    setSelected((prev) => prev.map((e) => ({ ...e, ...toFields(suggest(e, g)) })));
  };
  const applyTestSet = (ex: Exercise, testSet: TestSet | null) => {
    setTestSets((prev) => {
      const next = { ...prev };
      if (testSet) next[ex.id] = testSet;
      else delete next[ex.id];
      return next;
    });
    patch(ex.id, toFields(suggest(ex, goal, testSet)));
  };

  const canSave = selected.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage(isEn ? 'Sign in to save your routine.' : 'Inicia sesión para guardar tu rutina.');
        return;
      }
      const label = groups.map(bodyPartLabel).join(' + ');
      const { error } = await supabase.from('routines').insert([{
        user_id: user.id,
        name: name.trim() || label,
        description: isEn ? `${selected.length} exercises: ${label}.` : `${selected.length} ejercicios: ${label}.`,
        exercises: selected,
        phase: phaseKey,
        weekday: null,
        muscle_groups: groups,
      }]);
      if (error) throw error;
      setSelected([]);
      setName('');
      setTestSets({});
      setMessage(isEn ? 'Routine saved. You can assign it a day of the week in "My routines".' : 'Rutina guardada. En "Mis rutinas" puedes asignarle un día de la semana.');
      onSaved();
    } catch (err: any) {
      setMessage((isEn ? 'Could not save: ' : 'No se pudo guardar: ') + (err?.message ?? (isEn ? 'unknown error' : 'error desconocido')));
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-card text-foreground border-border hover:border-primary/50'
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Browser */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button className={chip(bodyPart === '')} onClick={() => { setBodyPart(''); resetPaging(); }}>
            {isEn ? 'All' : 'Todos'}
          </button>
          {bodyParts.map((bp) => (
            <button key={bp} className={chip(bodyPart === bp)} onClick={() => { setBodyPart(bp); resetPaging(); }}>
              {bodyPartLabel(bp)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); resetPaging(); }}
            placeholder={isEn ? "Search by name or muscle" : "Buscar por nombre o músculo"}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground"
          />
          <select
            value={equipment}
            onChange={(e) => { setEquipment(e.target.value); resetPaging(); }}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground"
          >
            <option value="">{isEn ? 'Any equipment' : 'Cualquier equipo'}</option>
            {equipments.map((eq) => (
              <option key={eq} value={eq}>{equipmentLabel(eq)}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">{total} {isEn ? 'exercises' : 'ejercicios'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((ex) => {
            const added = selectedIds.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => toggle(ex)}
                className={`text-left rounded-2xl border overflow-hidden bg-card transition-all ${
                  added ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:shadow-md'
                }`}
              >
                <img src={ex.gifUrl} alt={exerciseDisplayName(ex, language)} loading="lazy" className="w-full aspect-square object-cover bg-muted" />
                <div className="p-3 flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground capitalize leading-tight">{exerciseDisplayName(ex, language)}</span>
                  <span className="text-xs text-muted-foreground">
                    {bodyPartLabel(ex.bodyPart)} · {equipmentLabel(ex.equipment)}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${added ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span aria-hidden className="material-symbols-outlined text-base">{added ? 'check' : 'add'}</span>
                    {added ? (isEn ? 'Added' : 'Añadido') : (isEn ? 'Add' : 'Añadir')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {items.length < total && (
          <button
            onClick={() => setShown((n) => n + PAGE)}
            className="self-center px-5 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary"
          >
            {isEn ? 'Load more' : 'Cargar más'}
          </button>
        )}
      </div>

      {/* Routine being built */}
      <aside className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5 self-start lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-foreground font-bold text-xl text-balance">
            <span aria-hidden className="material-symbols-outlined text-primary">fitness_center</span>
            {isEn ? 'Your routine' : 'Tu rutina'}
          </h3>
          {selected.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 tabular-nums">
              {selected.length} {selected.length === 1 ? (isEn ? 'exercise' : 'ejercicio') : (isEn ? 'exercises' : 'ejercicios')}
            </span>
          )}
        </div>
        {/* Only the body scrolls: header and save button stay in view */}
        <div className="flex flex-col gap-5 max-h-[50dvh] lg:max-h-[calc(100dvh-16rem)] overflow-y-auto overscroll-contain -mx-5 px-5">
        <label className="relative block">
          <span className="sr-only">{isEn ? 'Routine name' : 'Nombre de la rutina'}</span>
          <span aria-hidden className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground pointer-events-none">edit</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isEn ? "Name (optional)" : "Nombre (opcional)"}
            className="w-full min-h-11 rounded-xl border border-border bg-background pl-11 pr-4 py-2 text-sm text-foreground"
          />
        </label>

        {/* Goal: drives the suggested sets, reps, rest and weight for every exercise */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1">
            <span id="rb-goal-label" className="text-sm font-semibold text-foreground">{isEn ? 'Goal' : 'Objetivo'}</span>
            <InfoTooltip label={isEn ? 'How suggestions are calculated' : 'Cómo se calculan las sugerencias'}>
              {isEn ? (
                <>
                  <p>
                    Based on your goal, we suggest sets, reps, rest, and weight for each exercise using the same formula
                    as the 1RM calculator.
                  </p>
                  <p>
                    Starting weight is a conservative estimate. To make it exact, tap <strong>&ldquo;Calibrate with my
                    set&rdquo;</strong> and enter a weight you’ve lifted and how many reps you completed.
                  </p>
                  <p className="text-muted-foreground">
                    We always leave 2–3 reps in reserve: each set should feel challenging while maintaining solid form.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Según tu objetivo te sugerimos series, repeticiones, descanso y peso para cada ejercicio, con la misma
                    fórmula que la calculadora de 1RM.
                  </p>
                  <p>
                    El peso inicial es una estimación prudente. Para que sea exacto, toca <strong>&ldquo;Ajustar con mi
                    serie&rdquo;</strong> e indica un peso que ya hayas levantado y cuántas repeticiones hiciste.
                  </p>
                  <p className="text-muted-foreground">
                    Siempre dejamos 2 o 3 repeticiones en reserva: deberías terminar cada serie cansada, pero con buena técnica.
                  </p>
                </>
              )}
            </InfoTooltip>
          </div>
          <div role="radiogroup" aria-labelledby="rb-goal-label" className="grid grid-cols-3 gap-2">
            {Object.values(GOAL_PLANS).map((plan) => {
              const active = goal === plan.id;
              const label = isEn ? GOAL_COPY_EN[plan.id].label : plan.labelEs;
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => changeGoal(plan.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-3 min-h-11 text-center transition-colors cursor-pointer ${
                    active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <span aria-hidden className="material-symbols-outlined text-xl">{plan.icon}</span>
                  <span className="text-xs font-bold leading-tight">{label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{plan.sets} × {plan.reps}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground leading-snug text-pretty">
            {isEn ? GOAL_COPY_EN[goal].short : GOAL_PLANS[goal].shortEs}{' '}
            <span className="text-foreground/80">{isEn ? GOAL_COPY_EN[goal].progression : GOAL_PLANS[goal].progressionEs}</span>
          </p>
        </div>

        {selected.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <span aria-hidden className="material-symbols-outlined text-3xl text-muted-foreground">touch_app</span>
            <p className="text-sm text-muted-foreground text-pretty">{isEn ? 'Tap exercises to add them. You can mix muscle groups.' : 'Toca ejercicios para añadirlos. Puedes mezclar grupos musculares.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <span aria-hidden className="material-symbols-outlined text-lg">accessibility_new</span>
                  {bodyPartLabel(g)}
                </span>
                {selected.filter((e) => e.bodyPart === g).map((e) => (
                  <SelectedExercise
                    key={e.id}
                    exercise={e}
                    suggestion={suggest(e)}
                    testSet={testSets[e.id] ?? null}
                    onPatch={(change) => patch(e.id, change)}
                    onRemove={() => toggle(e)}
                    onTestSet={(t) => applyTestSet(e, t)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        </div>
        <div className="shrink-0 flex flex-col gap-3 border-t border-border pt-4">
        <button
          onClick={save}
          disabled={!canSave}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold min-h-11 py-2.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <span aria-hidden className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'bookmark_add'}</span>
          {saving ? (isEn ? 'Saving…' : 'Guardando...') : (isEn ? 'Save routine' : 'Guardar rutina')}
        </button>
        {message && (
          <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground text-pretty">
            <span aria-hidden className="material-symbols-outlined text-lg shrink-0">info</span>
            {message}
          </p>
        )}
        </div>
      </aside>
    </div>
  );
};

interface SelectedExerciseProps {
  exercise: Exercise;
  suggestion: Prescription;
  testSet: TestSet | null;
  onPatch: (change: Partial<Exercise>) => void;
  onRemove: () => void;
  onTestSet: (testSet: TestSet | null) => void;
}

/** One exercise in the routine: editable sets/reps/weight plus the goal-based suggestion. */
const SelectedExercise: React.FC<SelectedExerciseProps> = ({
  exercise: e,
  suggestion,
  testSet,
  onPatch,
  onRemove,
  onTestSet,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const displayName = exerciseDisplayName(e, language);
  const [calibrating, setCalibrating] = useState(false);
  const [draftWeight, setDraftWeight] = useState(testSet ? String(testSet.weight) : '');
  const [draftReps, setDraftReps] = useState(testSet ? String(testSet.reps) : '');
  const unitNote = loadUnitNote(e);
  const loadable = suggestion.source !== 'none';
  const matchesSuggestion =
    e.sets === suggestion.sets && e.reps === suggestion.reps && e.weight === suggestion.weight;
  const draftValid = Number(draftWeight) > 0 && Number(draftReps) > 0;

  const submitTestSet = () => {
    if (!draftValid) return;
    onTestSet({ weight: Number(draftWeight), reps: Math.min(30, Math.round(Number(draftReps))) });
    setCalibrating(false);
  };

  return (
    <div className="flex flex-col gap-3 text-sm text-foreground rounded-xl border border-border/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="capitalize truncate font-semibold leading-tight" title={displayName}>{displayName}</span>
        <button
          onClick={onRemove}
          aria-label={`${isEn ? 'Remove' : 'Quitar'} ${displayName}`}
          className="text-muted-foreground hover:text-destructive shrink-0 size-10 -my-2 -mr-1.5 flex items-center justify-center rounded-lg cursor-pointer"
        >
          <span aria-hidden className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([
          [isEn ? 'Sets' : 'Series', 'sets', e.sets ?? '', (v: string) => ({ sets: v === '' ? undefined : Math.max(1, Number(v)) })],
          ['Reps', 'reps', e.reps ?? '', (v: string) => ({ reps: v })],
          [isEn ? 'Weight (kg)' : 'Peso (kg)', 'weight', e.weight ?? '', (v: string) => ({ weight: v === '' ? undefined : Math.max(0, Number(v)) })],
        ] as const).map(([label, key, value, toPatch]) => (
          <label key={key} className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {label}
            <input
              value={value}
              onChange={(ev) => onPatch(toPatch(ev.target.value))}
              inputMode={key === 'reps' ? 'text' : 'decimal'}
              type={key === 'reps' ? 'text' : 'number'}
              min={0}
              step={key === 'weight' ? 0.5 : 1}
              placeholder={key === 'reps' ? (isEn ? '10 or 8-12' : '10 o 8-12') : key === 'weight' && !loadable ? (isEn ? 'No weight' : 'Sin peso') : '–'}
              className="rounded-lg border border-border bg-background px-2 min-h-10 text-sm text-foreground tabular-nums w-full"
            />
          </label>
        ))}
      </div>

      {/* Goal-based suggestion */}
      <div className="flex flex-col gap-1 rounded-lg bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground leading-snug">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-start gap-1">
            <span aria-hidden className="material-symbols-outlined text-base text-primary">lightbulb</span>
            <span>
              {isEn ? 'Suggested:' : 'Sugerido:'} <strong className="text-foreground tabular-nums">{suggestion.sets} × {suggestion.reps}</strong>
              {suggestion.weight != null && (
                <>
                  {isEn ? ' with ' : ' con '}
                  <strong className="text-foreground tabular-nums">{suggestion.weight.toLocaleString(isEn ? 'en-US' : 'es')} kg</strong>
                  {unitNote && ` ${unitNote}`}
                </>
              )}
              {` · ${isEn ? 'rest' : 'descanso'} ${formatRest(suggestion.restSeconds, isEn)}`}
            </span>
          </span>
          {!matchesSuggestion && (
            <button
              type="button"
              onClick={() => onPatch(toFields(suggestion))}
              className="shrink-0 font-bold text-primary hover:underline cursor-pointer min-h-8 px-1"
            >
              {isEn ? 'Apply' : 'Usar'}
            </button>
          )}
        </div>
        {suggestion.notes.map((n) => {
          const noteText = isEn
            ? n.includes('Fase menstrual')
              ? 'Menstrual phase: −10% load and 1 less set.'
              : n.includes('Fase lútea')
                ? 'Luteal phase: −5% load, prioritize form.'
                : n
            : n;
          return <span key={n}>{noteText}</span>;
        })}

        {/* Personalise the load from a real set, through the 1RM model */}
        {loadable && !calibrating && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
            {suggestion.source === 'set' && testSet ? (
              <>
                <span>
                  {isEn
                    ? `Calculated from your set of ${testSet.weight} kg × ${testSet.reps} (1RM ≈ ${suggestion.oneRepMax} kg).`
                    : `Calculado con tu serie de ${testSet.weight} kg × ${testSet.reps} (1RM ≈ ${suggestion.oneRepMax} kg).`}
                </span>
                <button type="button" onClick={() => setCalibrating(true)} className="font-bold text-primary hover:underline cursor-pointer">
                  {isEn ? 'Change' : 'Cambiar'}
                </button>
                <button type="button" onClick={() => onTestSet(null)} className="hover:text-foreground underline cursor-pointer">
                  {isEn ? 'Remove' : 'Quitar'}
                </button>
              </>
            ) : (
              <>
                <span>{isEn ? 'Estimated beginner weight.' : 'Peso estimado para principiante.'}</span>
                <button
                  type="button"
                  onClick={() => setCalibrating(true)}
                  className="inline-flex items-center gap-0.5 font-bold text-primary hover:underline cursor-pointer"
                >
                  <span aria-hidden className="material-symbols-outlined text-base">calculate</span>
                  {isEn ? 'Calibrate with my set' : 'Ajustar con mi serie'}
                </button>
              </>
            )}
          </div>
        )}

        {loadable && calibrating && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-border/70 mt-0.5">
            <span>{isEn ? 'What weight did you lift for this exercise and how many reps with solid form?' : '¿Qué peso ya levantaste en este ejercicio y cuántas reps lograste con buena técnica?'}</span>
            <div className="flex items-center gap-1.5">
              <input
                aria-label={isEn ? "Weight lifted in kg" : "Peso levantado en kg"}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={draftWeight}
                onChange={(ev) => setDraftWeight(ev.target.value)}
                placeholder="kg"
                autoFocus
                className="w-16 rounded-lg border border-border bg-background px-2 min-h-10 text-sm text-foreground tabular-nums"
              />
              <span>kg ×</span>
              <input
                aria-label={isEn ? "Reps completed" : "Repeticiones logradas"}
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={draftReps}
                onChange={(ev) => setDraftReps(ev.target.value)}
                onKeyDown={(ev) => ev.key === 'Enter' && submitTestSet()}
                placeholder="reps"
                className="w-16 rounded-lg border border-border bg-background px-2 min-h-10 text-sm text-foreground tabular-nums"
              />
              <button
                type="button"
                onClick={submitTestSet}
                disabled={!draftValid}
                className="ml-auto rounded-lg bg-primary text-primary-foreground px-3 min-h-10 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                {isEn ? 'Calculate' : 'Calcular'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCalibrating(false)}
              className="self-start hover:text-foreground underline cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineBuilder;
