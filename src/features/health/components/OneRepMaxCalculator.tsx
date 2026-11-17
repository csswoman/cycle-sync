'use client';

import React, { useState, useMemo } from 'react';
import {
  estimate1RM,
  ESSENTIAL_EXERCISES,
  EssentialExercise,
} from '@/lib/exercise/oneRepMax';

interface OneRepMaxCalculatorProps {
  currentPhaseKey?: string;
  defaultUnit?: 'kg' | 'lb';
}

export const OneRepMaxCalculator: React.FC<OneRepMaxCalculatorProps> = ({
  currentPhaseKey = 'follicular',
  defaultUnit = 'kg',
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('hip-thrust');
  const [weight, setWeight] = useState<number>(40);
  const [reps, setReps] = useState<number>(5);
  const [unit, setUnit] = useState<'kg' | 'lb'>(defaultUnit);
  const [showScienceInfo, setShowScienceInfo] = useState<boolean>(false);

  const selectedExercise: EssentialExercise | undefined = useMemo(() => {
    return ESSENTIAL_EXERCISES.find((ex) => ex.id === selectedExerciseId);
  }, [selectedExerciseId]);

  const calculation = useMemo(() => {
    return estimate1RM(weight, reps, unit);
  }, [weight, reps, unit]);

  const phaseKeyNormalized =
    currentPhaseKey === 'menstrual'
      ? 'menstrual'
      : currentPhaseKey === 'luteal'
      ? 'luteal'
      : 'follicular';

  const phaseRec = calculation.phaseRecommendations[phaseKeyNormalized];

  const phaseLabel =
    phaseKeyNormalized === 'menstrual'
      ? 'Fase Menstrual'
      : phaseKeyNormalized === 'luteal'
      ? 'Fase Lútea'
      : 'Fase Folicular';

  return (
    <section
      aria-labelledby="rm-calc-heading"
      className="w-full bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-secondary flex items-center justify-center text-primary shrink-0">
            <span aria-hidden className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>
          <div>
            <h3 id="rm-calc-heading" className="text-foreground text-lg font-bold tracking-tight text-balance">
              Calculadora de 1RM y Cargas de Fuerza
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm text-pretty">
              Estima tu fuerza máxima de forma indirecta y segura (sin test lesivo de 1 repetición).
            </p>
          </div>
        </div>

        {/* Unit toggle */}
        <div className="inline-flex items-center p-1 bg-secondary rounded-full border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setUnit('kg')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              unit === 'kg' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => setUnit('lb')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              unit === 'lb' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            lb
          </button>
        </div>
      </div>

      {/* Form Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Exercise selector */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <label htmlFor="rm-exercise-select" className="text-xs font-semibold text-muted-foreground">
            Ejercicio esencial
          </label>
          <select
            id="rm-exercise-select"
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full min-h-12 rounded-2xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
          >
            {ESSENTIAL_EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.nameEs}
              </option>
            ))}
          </select>
          {selectedExercise && (
            <span className="text-[11px] text-muted-foreground leading-tight">
              Enfoque: {selectedExercise.musclesEs}
            </span>
          )}
        </div>

        {/* Weight lifted */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rm-weight-input" className="text-xs font-semibold text-muted-foreground">
            Peso levantado ({unit})
          </label>
          <div className="relative flex items-center">
            <input
              id="rm-weight-input"
              type="number"
              min="1"
              max="500"
              step="0.5"
              inputMode="decimal"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full min-h-12 rounded-2xl border border-border bg-card px-3.5 pr-10 text-base font-bold text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-primary"
            />
            <span className="absolute right-3.5 text-xs font-bold text-muted-foreground pointer-events-none">
              {unit}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Carga manejada con buena técnica</span>
        </div>

        {/* Reps */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rm-reps-input" className="text-xs font-semibold text-muted-foreground">
            Repeticiones logradas
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReps((r) => Math.max(1, r - 1))}
              aria-label="Disminuir repeticiones"
              className="size-12 rounded-2xl bg-secondary border border-border/80 text-foreground flex items-center justify-center font-bold text-lg hover:bg-secondary/80 transition-colors cursor-pointer shrink-0"
            >
              -
            </button>
            <input
              id="rm-reps-input"
              type="number"
              min="1"
              max="30"
              step="1"
              inputMode="numeric"
              value={reps || ''}
              onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
              className="w-full min-h-12 rounded-2xl border border-border bg-card text-center text-base font-bold text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-primary"
            />
            <button
              type="button"
              onClick={() => setReps((r) => Math.min(30, r + 1))}
              aria-label="Aumentar repeticiones"
              className="size-12 rounded-2xl bg-secondary border border-border/80 text-foreground flex items-center justify-center font-bold text-lg hover:bg-secondary/80 transition-colors cursor-pointer shrink-0"
            >
              +
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {calculation.isHighRepWarning
              ? 'Aviso: más de 7 reps aumenta el margen de error.'
              : 'Ideal: entre 3 y 7 repeticiones.'}
          </span>
        </div>
      </div>

      {/* Primary Result Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1RM Estimado */}
        <div className="bg-secondary/60 rounded-2xl border border-border p-4 flex flex-col justify-between gap-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            1RM Estimado
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-foreground tabular-nums">
              {calculation.oneRepMax}
            </span>
            <span className="text-sm font-bold text-muted-foreground">{unit}</span>
          </div>
          <span className="text-[11px] text-muted-foreground leading-tight">
            Carga máxima teórica a 1 sola repetición sin desvirtuar la técnica.
          </span>
        </div>

        {/* Carga según tu fase actual */}
        <div className="md:col-span-2 bg-phase-soft rounded-2xl border border-phase/20 p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-phase flex items-center gap-1.5">
              <span aria-hidden className="material-symbols-outlined text-base">auto_awesome</span>
              Recomendación para tu {phaseLabel}
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-card text-phase tabular-nums border border-phase/30">
              {phaseRec.percentage}% del 1RM
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-phase tabular-nums">
                {phaseRec.load}
              </span>
              <span className="text-sm font-bold text-phase/80">{unit}</span>
            </div>
            <span className="text-xs font-semibold text-phase bg-card/60 px-2.5 py-1 rounded-lg">
              {phaseRec.reps}
            </span>
          </div>

          <p className="text-xs text-foreground/80 leading-relaxed text-pretty">
            {phaseRec.guidance}
          </p>
        </div>
      </div>

      {/* Target loads by goal */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          Cargas de trabajo según objetivo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Strength */}
          <div className="bg-card rounded-2xl border border-border p-3.5 flex flex-col gap-1.5 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Fuerza Máxima</span>
              <span className="text-muted-foreground font-semibold">85% 1RM</span>
            </div>
            <div className="text-xl font-extrabold text-foreground tabular-nums">
              {calculation.targetLoads.strength.load} {unit}
            </div>
            <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
              <span>Reps: <strong>3 a 6</strong></span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <span aria-hidden className="material-symbols-outlined text-xs">timer</span>
                Descanso: 2 a 3 min
              </span>
            </div>
          </div>

          {/* Hypertrophy */}
          <div className="bg-card rounded-2xl border border-border p-3.5 flex flex-col gap-1.5 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Hipertrofia / Volumen</span>
              <span className="text-muted-foreground font-semibold">75% 1RM</span>
            </div>
            <div className="text-xl font-extrabold text-foreground tabular-nums">
              {calculation.targetLoads.hypertrophy.load} {unit}
            </div>
            <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
              <span>Reps: <strong>8 a 12</strong></span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <span aria-hidden className="material-symbols-outlined text-xs">timer</span>
                Descanso: 2 min
              </span>
            </div>
          </div>

          {/* Endurance */}
          <div className="bg-card rounded-2xl border border-border p-3.5 flex flex-col gap-1.5 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Resistencia / Tono</span>
              <span className="text-muted-foreground font-semibold">65% 1RM</span>
            </div>
            <div className="text-xl font-extrabold text-foreground tabular-nums">
              {calculation.targetLoads.endurance.load} {unit}
            </div>
            <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
              <span>Reps: <strong>12 a 15+</strong></span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <span aria-hidden className="material-symbols-outlined text-xs">timer</span>
                Descanso: 1.5 min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Science Info Accordion */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowScienceInfo(!showScienceInfo)}
          className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground py-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="material-symbols-outlined text-base text-primary">school</span>
            ¿Por qué descansar 2 a 3 minutos y calcular de forma indirecta?
          </span>
          <span
            aria-hidden
            className={`material-symbols-outlined text-lg transition-transform ${
              showScienceInfo ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {showScienceInfo && (
          <div className="mt-3 p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground leading-relaxed flex flex-col gap-2.5">
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
          </div>
        )}
      </div>
    </section>
  );
};
