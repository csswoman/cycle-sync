'use client';

import React, { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  estimate1RM,
  convertLoad,
  loadForReps,
  toGymLoad,
  ESSENTIAL_EXERCISES,
  EssentialExercise,
  LOAD_TYPE_NOTE_ES,
  LoadType,
} from '@/lib/exercise/oneRepMax';

const LOAD_TYPE_NOTE_EN: Record<LoadType, string> = {
  barbell: 'Total weight: bar + plates (Olympic bar 20 kg, lightweight bar 10-15 kg).',
  dumbbell: 'Weight of a single dumbbell.',
  machine: 'Weight marked on the machine or pin stack.',
  assisted: 'Your body weight minus machine assistance.',
};

const PHASE_GUIDANCE_EN: Record<string, string> = {
  follicular: 'Follicular phase: high energy and peak insulin sensitivity. Great time to push weights.',
  luteal: 'Luteal phase: maintain strength and prioritize solid form without grinding to failure.',
  menstrual: 'Menstrual phase: lower intensity, focus on active recovery and comfortable technique.',
};

const GROUPS = [
  ['lower', 'Piernas'],
  ['posterior', 'Cadena posterior y glúteos'],
  ['upper', 'Tren superior'],
] as const;

/** Rep counts shown in the "how much weight for N reps" table. */
const REP_TARGETS = [1, 3, 5, 6, 8, 10, 12, 15] as const;

const DEFAULT_EXERCISE_ID = 'hip-thrust';

const getGoals = (isEn: boolean) => [
  {
    key: 'strength' as const,
    title: isEn ? 'Max Strength' : 'Fuerza máxima',
    icon: 'bolt',
    reps: isEn ? '3 to 6' : '3 a 6',
    hint: isEn
      ? 'Low reps with heavier weight. Helps you get stronger and strengthen bones.'
      : 'Pocas repeticiones con peso alto. Sirve para volverte más fuerte y fortalecer los huesos.',
  },
  {
    key: 'hypertrophy' as const,
    title: isEn ? 'Hypertrophy' : 'Hipertrofia',
    icon: 'fitness_center',
    reps: isEn ? '8 to 12' : '8 a 12',
    hint: isEn
      ? 'Moderate weight and higher reps. The zone to shape and build muscle (e.g. glutes).'
      : 'Peso medio y más repeticiones. Es la zona para dar forma y volumen al músculo (por ejemplo, glúteos).',
  },
  {
    key: 'endurance' as const,
    title: isEn ? 'Endurance & tone' : 'Resistencia y tono',
    icon: 'all_inclusive',
    reps: '12 a 15+',
    hint: isEn
      ? 'Light weight and higher reps. Ideal for learning technique, lower-energy days, or getting started.'
      : 'Peso ligero y muchas repeticiones. Ideal para aprender la técnica, días de poca energía o para empezar.',
  },
];

const startingWeightFor = (exerciseId: string, unit: 'kg' | 'lb') => {
  const ex = ESSENTIAL_EXERCISES.find((e) => e.id === exerciseId);
  return toGymLoad(ex?.startingWeightKg ?? 10, unit);
};

/** Rounds to loadable plates: 2.5 kg or 5 lb steps. */
const plateLoad = (n: number, unit: 'kg' | 'lb') => {
  const step = unit === 'kg' ? 2.5 : 5;
  return Math.round(n / step) * step;
};

const StepBadge: React.FC<{ n: number }> = ({ n }) => (
  <span
    aria-hidden
    className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold tabular-nums shrink-0"
  >
    {n}
  </span>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="mb-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{children}</h4>
);

interface OneRepMaxCalculatorProps {
  currentPhaseKey?: string;
  defaultUnit?: 'kg' | 'lb';
}

export const OneRepMaxCalculator: React.FC<OneRepMaxCalculatorProps> = ({
  currentPhaseKey = 'follicular',
  defaultUnit = 'kg',
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(DEFAULT_EXERCISE_ID);
  const [weight, setWeight] = useState<number>(() => startingWeightFor(DEFAULT_EXERCISE_ID, defaultUnit));
  const [reps, setReps] = useState<number>(5);
  const [unit, setUnit] = useState<'kg' | 'lb'>(defaultUnit);
  const [showScienceInfo, setShowScienceInfo] = useState<boolean>(false);

  const selectedExercise: EssentialExercise | undefined = useMemo(() => {
    return ESSENTIAL_EXERCISES.find((ex) => ex.id === selectedExerciseId);
  }, [selectedExerciseId]);

  const suggestedWeights = useMemo(() => {
    if (!selectedExercise) return [];
    return [...new Set(selectedExercise.suggestedWeightsKg.map((kg) => toGymLoad(kg, unit)))];
  }, [selectedExercise, unit]);

  // A new exercise has a very different typical load (a curl vs. a hip thrust),
  // so reset to that exercise's beginner-friendly starting weight.
  const handleExerciseChange = (id: string) => {
    setSelectedExerciseId(id);
    setWeight(startingWeightFor(id, unit));
  };

  const handleUnitChange = (next: 'kg' | 'lb') => {
    if (next === unit) return;
    setWeight((w) => convertLoad(w, unit, next));
    setUnit(next);
  };

  const calculation = useMemo(() => estimate1RM(weight, reps, unit), [weight, reps, unit]);
  const hasWeight = weight > 0;

  const repTable = useMemo(
    () => REP_TARGETS.map((r) => ({ reps: r, ...loadForReps(calculation.oneRepMax, r) })),
    [calculation.oneRepMax],
  );

  const phaseKeyNormalized =
    currentPhaseKey === 'menstrual' ? 'menstrual' : currentPhaseKey === 'luteal' ? 'luteal' : 'follicular';

  const phaseRec = calculation.phaseRecommendations[phaseKeyNormalized];

  const phaseLabel =
    phaseKeyNormalized === 'menstrual'
      ? (isEn ? 'Menstrual Phase' : 'Fase Menstrual')
      : phaseKeyNormalized === 'luteal'
      ? (isEn ? 'Luteal Phase' : 'Fase Lútea')
      : (isEn ? 'Follicular Phase' : 'Fase Folicular');

  const fmt = (n: number) => (hasWeight ? n.toLocaleString(isEn ? 'en-US' : 'es') : '—');
  const fmtLoad = (n: number) => fmt(plateLoad(n, unit));
  const goals = useMemo(() => getGoals(isEn), [isEn]);

  return (
    <section
      id="calculadora-1rm"
      aria-labelledby="rm-calc-heading"
      className="w-full scroll-mt-4 bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-secondary flex items-center justify-center text-primary shrink-0">
            <span aria-hidden className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>
          <div>
            <h3 id="rm-calc-heading" className="text-foreground text-lg font-bold tracking-tight text-balance">
              {isEn ? '1RM & Strength Load Calculator' : 'Calculadora de 1RM y Cargas de Fuerza'}
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm text-pretty">
              {isEn
                ? 'Tell us how much weight you lifted and how many times: we calculate your load for every set without testing your true max.'
                : 'Dinos qué peso levantaste y cuántas veces: calculamos cuánto cargar en cada serie, sin tener que probar tu máximo.'}
            </p>
          </div>
        </div>

        {/* Unit toggle */}
        <div
          role="group"
          aria-label={isEn ? "Weight unit" : "Unidad de peso"}
          className="inline-flex items-center p-1 bg-secondary rounded-full border border-border self-start sm:self-auto"
        >
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              aria-pressed={unit === u}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                unit === u ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inputs: tu serie ── */}
      <div className="rounded-2xl bg-secondary/40 border border-border p-4 sm:p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exercise selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rm-exercise-select" className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <StepBadge n={1} />
              {isEn ? 'Exercise' : 'Ejercicio'}
              {selectedExercise && (
                <InfoTooltip label={isEn ? "About this exercise" : "Sobre este ejercicio"}>
                  <p>
                    <strong>{selectedExercise.musclesEs}.</strong> {selectedExercise.tipEs}
                  </p>
                </InfoTooltip>
              )}
            </label>
            <select
              id="rm-exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleExerciseChange(e.target.value)}
              className="w-full min-h-12 rounded-2xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            >
              {GROUPS.map(([cat, label]) => (
                <optgroup key={cat} label={isEn ? (cat === 'lower' ? 'Lower Body' : cat === 'posterior' ? 'Posterior Chain' : 'Upper Body') : label}>
                  {ESSENTIAL_EXERCISES.filter((ex) => ex.category === cat).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {isEn ? ex.nameEn : ex.nameEs}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Weight lifted */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <label htmlFor="rm-weight-input" className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <StepBadge n={2} />
                {isEn ? 'Weight you lifted' : 'Peso que levantaste'}
              </label>
              <InfoTooltip label={isEn ? "What weight to enter" : "Qué peso poner"}>
                {isEn ? (
                  <>
                    <p>
                      Use a weight with which you completed a set <strong>with solid form</strong>, finishing fatigued without losing technique.
                    </p>
                    <p className="text-muted-foreground">
                      Not sure how much? Pick one of the common weights below and start with the lightest.
                    </p>
                    {selectedExercise && <p className="text-muted-foreground">{LOAD_TYPE_NOTE_EN[selectedExercise.loadType]}</p>}
                  </>
                ) : (
                  <>
                    <p>
                      Usa un peso con el que hayas hecho una serie <strong>con buena técnica</strong>, terminando cansada pero sin
                      perder la forma.
                    </p>
                    <p className="text-muted-foreground">
                      ¿No sabes cuánto? Elige uno de los pesos comunes de abajo y empieza por el más ligero.
                    </p>
                    {selectedExercise && <p className="text-muted-foreground">{LOAD_TYPE_NOTE_ES[selectedExercise.loadType]}</p>}
                  </>
                )}
              </InfoTooltip>
            </div>
            <div className="relative flex items-center">
              <input
                id="rm-weight-input"
                type="number"
                min="0"
                max="500"
                step="0.5"
                inputMode="decimal"
                value={weight || ''}
                placeholder="0"
                onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full min-h-12 rounded-2xl border border-border bg-card px-3.5 pr-10 text-base font-bold text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-primary"
              />
              <span className="absolute right-3.5 text-xs font-bold text-muted-foreground pointer-events-none">{unit}</span>
            </div>
          </div>

          {/* Reps */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <label htmlFor="rm-reps-input" className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <StepBadge n={3} />
                {isEn ? 'Reps you completed' : 'Repeticiones que hiciste'}
              </label>
              <InfoTooltip label={isEn ? "Why between 3 and 7 reps" : "Por qué entre 3 y 7 repeticiones"}>
                {isEn ? (
                  <>
                    <p>
                      Count how many full reps you completed with that weight, stopping when you had 1–2 reps in reserve.
                    </p>
                    <p className="text-muted-foreground">
                      Between 3 and 7 the formula is most accurate. Higher reps introduce fatigue, making the estimate less exact.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Cuenta cuántas repeticiones completas lograste con ese peso, hasta que te quedaran 1 o 2 en reserva.
                    </p>
                    <p className="text-muted-foreground">
                      Entre 3 y 7 el cálculo es más preciso. Con más repeticiones influye el cansancio y el resultado se vuelve
                      menos exacto.
                    </p>
                  </>
                )}
              </InfoTooltip>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReps((r) => Math.max(1, r - 1))}
                aria-label={isEn ? "Decrease reps" : "Disminuir repeticiones"}
                className="size-12 rounded-2xl bg-card border border-border text-foreground flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer shrink-0"
              >
                <span aria-hidden className="material-symbols-outlined text-xl">remove</span>
              </button>
              <input
                id="rm-reps-input"
                type="number"
                min="1"
                max="30"
                step="1"
                inputMode="numeric"
                value={reps || ''}
                onChange={(e) => setReps(Math.min(30, parseInt(e.target.value, 10) || 1))}
                className="w-full min-h-12 rounded-2xl border border-border bg-card text-center text-base font-bold text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-primary"
              />
              <button
                type="button"
                onClick={() => setReps((r) => Math.min(30, r + 1))}
                aria-label={isEn ? "Increase reps" : "Aumentar repeticiones"}
                className="size-12 rounded-2xl bg-card border border-border text-foreground flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer shrink-0"
              >
                <span aria-hidden className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
            <span
              className={`text-xs leading-snug flex items-center gap-1 ${
                calculation.isHighRepWarning ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-muted-foreground'
              }`}
            >
              {calculation.isHighRepWarning && (
                <span aria-hidden className="material-symbols-outlined text-sm">warning</span>
              )}
              {calculation.isHighRepWarning
                ? (isEn ? 'Over 7 reps: estimate is less accurate.' : 'Más de 7 reps: el resultado es menos preciso.')
                : (isEn ? 'Ideal: between 3 and 7 reps.' : 'Lo ideal: entre 3 y 7 repeticiones.')}
            </span>
          </div>
        </div>

        {/* Suggested loads for the selected exercise */}
        {suggestedWeights.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border/70 pt-3.5">
            <span id="rm-suggested-label" className="text-xs font-semibold text-muted-foreground text-pretty">
              {isEn ? 'Common weights · if it’s your first time, start with the lightest' : 'Pesos comunes · si es tu primera vez, empieza por los más ligeros'}
            </span>
            <div role="group" aria-labelledby="rm-suggested-label" className="flex flex-wrap gap-2">
              {suggestedWeights.map((w) => {
                const active = w === weight;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeight(w)}
                    aria-pressed={active}
                    className={`min-h-9 px-3.5 rounded-full border text-sm font-bold tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {w} {unit}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Primary results ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Carga según tu fase actual: the main answer, so it's widest and first on mobile */}
        <div className="md:col-span-3 md:order-1 bg-phase-soft rounded-2xl border-2 border-phase/40 p-4 sm:p-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-phase flex items-center gap-1.5">
              <span aria-hidden className="material-symbols-outlined text-base">auto_awesome</span>
              {isEn ? 'Your load for today' : 'Tu carga para hoy'} · {phaseLabel}
            </span>
            <InfoTooltip label={isEn ? "Why this load in your phase" : "Por qué esta carga en tu fase"}>
              {isEn ? (
                <>
                  <p>
                    We adjust your 1RM percentage according to your cycle: during the <strong>follicular phase</strong> you usually have more energy and tolerate heavier loads (~85%); during the <strong>luteal</strong> maintain steady effort (~75%); and during <strong>menstruation</strong> ease into comfortable weight (~70%).
                  </p>
                  <p className="text-muted-foreground">This is a guide: if you feel different today, listen to your body.</p>
                </>
              ) : (
                <>
                  <p>
                    Ajustamos el porcentaje de tu 1RM según tu ciclo: en la <strong>fase folicular</strong> sueles tener más
                    energía y tolerar más peso (~85%); en la <strong>lútea</strong> conviene mantener (~75%); y en la{' '}
                    <strong>menstrual</strong> bajar a algo cómodo (~70%).
                  </p>
                  <p className="text-muted-foreground">Es una guía: si hoy te sientes distinta, escucha a tu cuerpo.</p>
                </>
              )}
            </InfoTooltip>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-phase tabular-nums leading-none">{fmtLoad(phaseRec.load)}</span>
              <span className="text-base font-bold text-phase/80">{unit}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-0.5">
              <span className="text-xs font-semibold text-phase bg-card/70 px-2.5 py-1 rounded-lg">{phaseRec.reps}</span>
              <span className="text-xs font-semibold text-phase bg-card/70 px-2.5 py-1 rounded-lg tabular-nums">
                {phaseRec.percentage}% {isEn ? 'of your 1RM' : 'de tu 1RM'}
              </span>
            </div>
          </div>

          <p className="text-xs text-foreground/80 leading-relaxed text-pretty">
            {isEn ? (PHASE_GUIDANCE_EN[phaseKeyNormalized] || phaseRec.guidance) : phaseRec.guidance} {isEn ? 'Rounded to gym plates.' : 'Redondeado a discos reales.'}
          </p>
        </div>

        {/* 1RM Estimado */}
        <div className="md:col-span-2 md:order-2 bg-secondary/60 rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isEn ? 'Your estimated 1RM' : 'Tu 1RM estimado'}</span>
            <InfoTooltip label={isEn ? "What is 1RM" : "Qué es el 1RM"}>
              {isEn ? (
                <>
                  <p>
                    <strong>1RM</strong> (one repetition maximum) is the heaviest weight you could lift <em>a single time</em> with solid technique.
                  </p>
                  <p className="text-muted-foreground">
                    You never need to test it: we calculate it from your working set and use it as reference to decide your loads.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    El <strong>1RM</strong> (una repetición máxima) es el peso más alto que podrías levantar <em>una sola vez</em>{' '}
                    con buena técnica.
                  </p>
                  <p className="text-muted-foreground">
                    No necesitas levantarlo nunca: lo calculamos a partir de tu serie y lo usamos como referencia para decidir
                    cuánto cargar.
                  </p>
                </>
              )}
            </InfoTooltip>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-foreground tabular-nums leading-none">
              {hasWeight ? `≈ ${fmt(calculation.oneRepMax)}` : '—'}
            </span>
            <span className="text-base font-bold text-muted-foreground">{unit}</span>
          </div>
          <span className="text-xs text-muted-foreground leading-snug text-pretty">
            {calculation.isHighRepWarning
              ? (isEn ? 'Less accurate estimate with more than 7 reps. Use as reference.' : 'Estimación menos precisa con más de 7 reps. Úsala como referencia.')
              : (isEn ? 'Theoretical 1-rep maximum. No need to test it.' : 'Máximo teórico a 1 repetición. No hace falta probarlo.')}
          </span>
        </div>
      </div>

      {/* ── Target loads by goal ── */}
      <div>
        <SectionTitle>
          {isEn ? 'Loads based on your goal' : 'Cargas según tu objetivo'}
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals.map((goal) => {
            const target = calculation.targetLoads[goal.key];
            return (
              <div
                key={goal.key}
                className={`rounded-2xl border p-4 flex flex-col gap-2 transition-colors ${
                  target.percentage === phaseRec.percentage
                    ? 'bg-phase-soft border-phase/50'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <span aria-hidden className="material-symbols-outlined text-lg text-primary">{goal.icon}</span>
                    {goal.title}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full tabular-nums">
                    {target.percentage}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-foreground tabular-nums">{fmtLoad(target.load)}</span>
                  <span className="text-sm font-bold text-muted-foreground">{unit}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug text-pretty">{goal.hint}</p>
                <div className="mt-auto pt-2 border-t border-border/70 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1 text-foreground">
                    <span aria-hidden className="material-symbols-outlined text-sm text-muted-foreground">repeat</span>
                    <strong>{goal.reps}</strong> reps
                  </span>
                  <span className="flex items-center gap-1 text-foreground">
                    <span aria-hidden className="material-symbols-outlined text-sm text-muted-foreground">timer</span>
                    {isEn ? 'Rest' : 'Descanso'} <strong>{target.restMinutes}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Load per rep count (secondary, collapsed) ── */}
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground">
          {isEn ? 'How much weight for each rep count?' : '¿Cuánto peso para cada número de repeticiones?'}
          <span aria-hidden className="material-symbols-outlined text-lg transition-transform group-open:rotate-180">expand_more</span>
        </summary>
        <p className="mt-2 mb-2.5 text-xs text-muted-foreground text-pretty">
          {isEn
            ? 'Find the reps you want to complete and load that weight: you will reach near-limit. The percentage is of your 1RM.'
            : 'Busca las repeticiones que quieres hacer y usa ese peso: llegarás casi al límite. El porcentaje es la parte de tu 1RM.'}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {repTable.map((row) => {
            const isCurrent = row.reps === reps;
            return (
              <div
                key={row.reps}
                className={`rounded-xl border px-2 py-2.5 text-center flex flex-col gap-0.5 ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                  {row.reps} {row.reps === 1 ? 'rep' : 'reps'}
                </span>
                <span className="text-base font-extrabold text-foreground tabular-nums leading-tight">
                  {fmtLoad(row.load)}
                  <span className="text-[11px] font-bold text-muted-foreground ml-0.5">{unit}</span>
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {isCurrent ? (isEn ? 'your set' : 'tu serie') : `${row.percentage}%`}
                </span>
              </div>
            );
          })}
        </div>
      </details>
      {/* Science Info Accordion */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowScienceInfo(!showScienceInfo)}
          aria-expanded={showScienceInfo}
          aria-controls="rm-science-panel"
          className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground py-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="material-symbols-outlined text-base text-primary">school</span>
            {isEn ? 'Why rest 2 to 3 minutes and calculate indirectly?' : '¿Por qué descansar 2 a 3 minutos y calcular de forma indirecta?'}
          </span>
          <span
            aria-hidden
            className={`material-symbols-outlined text-lg transition-transform ${showScienceInfo ? 'rotate-180' : ''}`}
          >
            expand_more
          </span>
        </button>

        {showScienceInfo && (
          <div
            id="rm-science-panel"
            className="mt-3 p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground leading-relaxed flex flex-col gap-2.5"
          >
            {isEn ? (
              <>
                <p>
                  <strong className="text-foreground">Rest Physiology (ATP-PC):</strong> Research by Eric Helms and Alan Aragon demonstrates that phosphagen and glycolytic pathways take 2 to 3 minutes to fully recover. Resting under 60 seconds drastically cuts mechanical tension on subsequent sets.
                </p>
                <p>
                  <strong className="text-foreground">Female Recovery:</strong> Women have higher capillary density and lactate clearance in muscular efforts. This allows tolerating slightly higher volume and recovering quickly between working sets.
                </p>
                <p>
                  <strong className="text-foreground">Natural Ceiling:</strong> The female skeleton naturally supports about 5 kg of muscle per kilo of bone. Heavy resistance training stimulates bone and metabolic density without risk of bulky hypertrophy.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong className="text-foreground">Fisiología del descanso (ATP-PC):</strong> Investigaciones de
                  Eric Helms y Alan Aragon demuestran que las vías fosfagénicas y glucolíticas tardan entre 2 y 3 minutos en
                  recuperarse por completo. Descansar menos de 60 segundos disminuye drásticamente la tensión mecánica de las series
                  posteriores.
                </p>
                <p>
                  <strong className="text-foreground">Recuperación femenina:</strong> Las mujeres cuentan con mayor densidad
                  capilar y tolerancia al ácido láctico en esfuerzos musculares. Esto les permite tolerar un volumen de trabajo
                  ligeramente mayor y recuperarse con rapidez entre series efectivas.
                </p>
                <p>
                  <strong className="text-foreground">Límite natural:</strong> El esqueleto femenino soporta naturalmente hasta unos
                  5 kg de músculo por cada kilo de hueso. Entrenar la fuerza con cargas altas estimula la masa ósea y metabólica sin
                  peligro de hipertrofia desmedida.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
