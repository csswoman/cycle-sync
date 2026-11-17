'use client';

import React from 'react';
import { STRENGTH_DAYS_GOAL, WEEKLY_MINUTES_GOAL, type WeeklyActivity } from '@/lib/exercise/weeklyActivity';

interface Props {
  week: WeeklyActivity;
  loading: boolean;
  onLog?: () => void;
  /** Two thin bars with no card chrome, for tight spaces. */
  compact?: boolean;
}

const Bar: React.FC<{ label: string; value: string; pct: number; done: boolean }> = ({ label, value, pct, done }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${done ? 'text-emerald-600' : 'text-foreground'}`}>{value}</span>
    </div>
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

function tip(week: WeeklyActivity): string {
  if (week.strengthDaysConsecutive) return 'Deja al menos un día de descanso entre tus sesiones de fuerza para recuperar bien.';
  if (!week.strengthGoalMet) {
    const left = STRENGTH_DAYS_GOAL - week.strengthDays;
    return `Te ${left === 1 ? 'falta 1 día' : `faltan ${left} días`} de fuerza esta semana. Vale con peso corporal, bandas o pesas.`;
  }
  if (!week.minutesGoalMet) return `Te faltan ${WEEKLY_MINUTES_GOAL - week.minutes} min. Una caminata rápida de 30 minutos cuenta.`;
  return 'Meta de la semana cumplida. Si buscas más beneficio metabólico, el siguiente escalón son 250 min.';
}

/** Progress toward the weekly activity target recommended for PMOS, built from the workout log. */
const WeeklyGoalCard: React.FC<Props> = ({ week, loading, onLog, compact }) => compact ? (
  loading ? (
    <div className="h-14 rounded-xl bg-secondary/50 animate-pulse" />
  ) : (
    <div className="flex flex-col gap-2.5">
      <Bar
        label="Minutos esta semana"
        value={`${week.minutes} / ${WEEKLY_MINUTES_GOAL}`}
        pct={Math.min(100, (week.minutes / WEEKLY_MINUTES_GOAL) * 100)}
        done={week.minutesGoalMet}
      />
      <Bar
        label="Días de fuerza"
        value={`${week.strengthDays} / ${STRENGTH_DAYS_GOAL}`}
        pct={Math.min(100, (week.strengthDays / STRENGTH_DAYS_GOAL) * 100)}
        done={week.strengthGoalMet}
      />
    </div>
  )
) : (
  <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-foreground">Meta semanal para PMOS</h2>
      </div>
      {onLog && (
        <button type="button" onClick={onLog} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Registrar</span>
        </button>
      )}
    </div>

    {loading ? (
      <div className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Bar
            label="Minutos activos"
            value={`${week.minutes} / ${WEEKLY_MINUTES_GOAL} min`}
            pct={Math.min(100, (week.minutes / WEEKLY_MINUTES_GOAL) * 100)}
            done={week.minutesGoalMet}
          />
          <Bar
            label="Días de fuerza"
            value={`${week.strengthDays} / ${STRENGTH_DAYS_GOAL}`}
            pct={Math.min(100, (week.strengthDays / STRENGTH_DAYS_GOAL) * 100)}
            done={week.strengthGoalMet}
          />
        </div>
        <p className="text-sm text-foreground">{tip(week)}</p>
      </>
    )}

    <p className="text-xs text-muted-foreground leading-relaxed">
      Meta de la guía internacional de SOP/PMOS (2023): 150 min a la semana de actividad moderada, o 75 min intensos, más fuerza 2 días no
      consecutivos. Ningún tipo de ejercicio es claramente mejor que otro: el que mantienes es el que funciona. Se calcula con tu diario de
      entrenamiento, de lunes a domingo.
    </p>
  </div>
);

export default WeeklyGoalCard;
