'use client';

import React from 'react';
import { localDateString, type WorkoutLog } from '@/hooks/useWorkoutLogs';
import { setsOf } from '@/lib/exercise/trainingStats';
import { formatSets } from './journal/shared';
import { useLanguage } from '@/i18n/LanguageContext';

type Kind = 'session' | 'video' | 'quick' | 'exercise';

const KIND_ICONS: Record<Kind, string> = {
  session: 'flag',
  video: 'play_circle',
  quick: 'bolt',
  exercise: 'fitness_center',
};

const kindLabel = (kind: Kind, isEn: boolean) => {
  if (kind === 'session') return isEn ? 'Completed routine' : 'Rutina completada';
  if (kind === 'video') return 'Video';
  if (kind === 'quick') return isEn ? 'Quick check-in' : 'Registro rápido';
  return isEn ? 'Exercise' : 'Ejercicio';
};

// The origin is stored with the log (older rows have it recovered from the note).
const kindOf = (log: WorkoutLog): Kind => {
  if (log.source === 'session') return 'session';
  if (log.source === 'video') return 'video';
  if (log.source === 'quick') return 'quick';
  return 'exercise';
};

const detailOf = (log: WorkoutLog, kind: Kind): string | null => {
  if (kind === 'exercise') {
    const sets = setsOf(log);
    return sets ? formatSets(sets) : log.notes?.split(' — ')[0] ?? null;
  }
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
  const { language } = useLanguage();
  const isEn = language === 'en';
  const today = localDateString();
  const items = logs.filter((l) => l.date === today);
  const minutes = items.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
  const shown = compact ? items.slice(0, 3) : items;

  if (loading) return <div className="h-16 rounded-xl bg-secondary/50 animate-pulse" />;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-foreground`}>
          {isEn ? "Today's activity" : "Actividad de hoy"}
        </h3>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {items.length} {isEn ? (items.length === 1 ? 'activity' : 'activities') : (items.length === 1 ? 'actividad' : 'actividades')}{minutes > 0 ? ` · ${minutes} min` : ''}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {compact
            ? (isEn ? 'No activity logged today yet.' : 'Aún no hay actividad hoy.')
            : (isEn ? 'No activity yet. Routines and videos you complete will appear here.' : 'Aún no hay actividad. Lo que completes en una rutina o video aparecerá aquí.')}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {shown.map((log) => {
            const kind = kindOf(log);
            const detail = compact ? null : detailOf(log, kind);
            return (
              <li key={log.id} className="flex items-start gap-2.5 rounded-xl bg-secondary/40 border border-border/50 px-3 py-2">
                <span aria-hidden className={`material-symbols-outlined text-lg mt-0.5 ${kind === 'session' ? 'text-leaf' : 'text-primary'}`}>{KIND_ICONS[kind]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground truncate">{log.exercise}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums truncate">
                    {kindLabel(kind, isEn)}
                    {log.durationMinutes ? ` · ${log.durationMinutes} min` : ''}
                    {detail ? ` · ${detail}` : ''}
                    {log.pending ? (isEn ? ' · unsynced' : ' · sin sincronizar') : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {compact && onSeeAll && items.length > 0 && (
        <button type="button" onClick={onSeeAll} className="self-start min-h-9 text-sm font-semibold text-primary hover:underline cursor-pointer">
          {items.length > shown.length
            ? (isEn ? `View all ${items.length}` : `Ver las ${items.length}`)
            : (isEn ? 'View history' : 'Ver historial')}
        </button>
      )}
    </div>
  );
};

export default TodayHistory;
