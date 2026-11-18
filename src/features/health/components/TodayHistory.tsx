'use client';

import React from 'react';
import { localDateString, type WorkoutLog } from '@/hooks/useWorkoutLogs';

type Kind = 'session' | 'video' | 'quick' | 'exercise';

const KIND: Record<Kind, { icon: string; label: string }> = {
  session: { icon: 'flag', label: 'Rutina completada' },
  video: { icon: 'play_circle', label: 'Video' },
  quick: { icon: 'bolt', label: 'Registro rápido' },
  exercise: { icon: 'fitness_center', label: 'Ejercicio' },
};

// Logs carry their origin in the note (see Routines.tsx and ProgramsExplorer).
const kindOf = (log: WorkoutLog): Kind => {
  const n = log.notes ?? '';
  if (n.startsWith('Sesión completada')) return 'session';
  if (n === 'Video guiado') return 'video';
  if (n === 'Registro rápido') return 'quick';
  return 'exercise';
};

const detailOf = (log: WorkoutLog, kind: Kind): string | null => {
  if (kind === 'exercise') return log.notes?.split(' — ')[0] ?? null;
  if (kind === 'session') return log.notes?.replace('Sesión completada: ', '') ?? null;
  return null;
};

interface Props {
  logs: WorkoutLog[];
  loading: boolean;
  /** Compact list for the top card: fewer rows and no details. */
  compact?: boolean;
  onSeeAll?: () => void;
}

/** What was done today: completed routines, videos, logged exercises and quick check-ins. */
const TodayHistory: React.FC<Props> = ({ logs, loading, compact, onSeeAll }) => {
  const today = localDateString();
  const items = logs.filter((l) => l.date === today);
  const minutes = items.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
  const shown = compact ? items.slice(0, 3) : items;

  if (loading) return <div className="h-16 rounded-xl bg-secondary/50 animate-pulse" />;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-foreground`}>Actividad de hoy</h3>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {items.length} {items.length === 1 ? 'actividad' : 'actividades'}{minutes > 0 ? ` · ${minutes} min` : ''}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {compact ? 'Aún no hay actividad hoy.' : 'Aún no hay actividad. Lo que completes en una rutina o video aparecerá aquí.'}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {shown.map((log) => {
            const kind = kindOf(log);
            const detail = compact ? null : detailOf(log, kind);
            return (
              <li key={log.id} className="flex items-start gap-2.5 rounded-xl bg-secondary/40 border border-border/50 px-3 py-2">
                <span aria-hidden className={`material-symbols-outlined text-lg mt-0.5 ${kind === 'session' ? 'text-leaf' : 'text-primary'}`}>{KIND[kind].icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground truncate">{log.exercise}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums truncate">
                    {KIND[kind].label}
                    {log.durationMinutes ? ` · ${log.durationMinutes} min` : ''}
                    {detail ? ` · ${detail}` : ''}
                    {log.pending ? ' · sin sincronizar' : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {compact && onSeeAll && items.length > 0 && (
        <button type="button" onClick={onSeeAll} className="self-start min-h-9 text-sm font-semibold text-primary hover:underline cursor-pointer">
          {items.length > shown.length ? `Ver las ${items.length}` : 'Ver historial'}
        </button>
      )}
    </div>
  );
};

export default TodayHistory;
