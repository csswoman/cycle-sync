'use client';

import React, { useMemo, useState } from 'react';
import { monthGrid, type DayTotal } from '@/lib/exercise/trainingStats';

export interface PlannedDay { title: string; kind: string; done: boolean }

interface Props {
  totals: Map<string, DayTotal>;
  /** Workouts planned in the weekly planner, by date. */
  planned: Map<string, PlannedDay>;
  today: string;
  selected: string | null;
  onSelect: (date: string | null) => void;
  /** Called with the first day of the month shown, so the parent can load the planner for it. */
  onMonthChange?: (year: number, month: number) => void;
}

const WEEK_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEK_LONG_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// More minutes, stronger fill. Days with activity but no minutes (sets only) use the lightest level.
function level(t: DayTotal | undefined): 0 | 1 | 2 | 3 {
  if (!t) return 0;
  if (t.minutes >= 60) return 3;
  if (t.minutes >= 30) return 2;
  return 1;
}
const LEVEL_CLASS = ['', 'bg-primary/20 text-foreground', 'bg-primary/50 text-foreground', 'bg-primary text-primary-foreground'];

/** Month view of the journal: which days she trained, how much, and what was planned. */
const TrainingCalendar: React.FC<Props> = ({ totals, planned, today, selected, onSelect, onMonthChange }) => {
  const [cursor, setCursor] = useState(() => ({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 }));
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const monthKey = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const isCurrentMonth = monthKey === today.slice(0, 7);

  const summary = useMemo(() => {
    let days = 0, minutes = 0, strength = 0;
    for (const [d, t] of totals) {
      if (!d.startsWith(monthKey)) continue;
      days++; minutes += t.minutes; if (t.strength) strength++;
    }
    return { days, minutes, strength };
  }, [totals, monthKey]);

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    const next = { y: d.getFullYear(), m: d.getMonth() };
    setCursor(next);
    onMonthChange?.(next.y, next.m);
  };
  const goToday = () => {
    const next = { y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 };
    setCursor(next);
    onMonthChange?.(next.y, next.m);
    onSelect(null);
  };

  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });

  return (
    <section aria-labelledby="journal-calendar-title" className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id="journal-calendar-title" className="text-base font-bold text-foreground first-letter:uppercase">{monthName}</h3>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button type="button" onClick={goToday} className="min-h-10 px-3 rounded-xl text-sm font-semibold text-primary hover:bg-secondary cursor-pointer">Hoy</button>
          )}
          <button type="button" onClick={() => move(-1)} aria-label="Mes anterior" className="size-10 rounded-xl border border-border flex items-center justify-center hover:border-primary/50 cursor-pointer">
            <span aria-hidden className="material-symbols-outlined">chevron_left</span>
          </button>
          <button type="button" onClick={() => move(1)} disabled={isCurrentMonth} aria-label="Mes siguiente" className="size-10 rounded-xl border border-border flex items-center justify-center hover:border-primary/50 disabled:opacity-40 cursor-pointer">
            <span aria-hidden className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">
        <span className="font-bold text-foreground">{summary.days}</span> {summary.days === 1 ? 'día entrenado' : 'días entrenados'}
        {' · '}<span className="font-bold text-foreground">{summary.minutes}</span> min
        {' · '}<span className="font-bold text-foreground">{summary.strength}</span> de fuerza
      </p>

      <div role="grid" aria-labelledby="journal-calendar-title" className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEK_ES.map((d, i) => (
            <span key={d} role="columnheader" aria-label={WEEK_LONG_ES[i]} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</span>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-1">
            {week.map((cell) => {
              const t = totals.get(cell.date);
              const plan = planned.get(cell.date);
              const lvl = level(t);
              const future = cell.date > today;
              const isToday = cell.date === today;
              const isSel = cell.date === selected;
              const dayNum = +cell.date.slice(8, 10);
              const parts = [
                new Date(+cell.date.slice(0, 4), +cell.date.slice(5, 7) - 1, dayNum).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
                t ? `${t.minutes ? `${t.minutes} min` : 'entrenado'}${t.strength ? ', fuerza' : ''}` : future ? null : 'sin entrenar',
                plan ? `planificado: ${plan.title}` : null,
              ].filter(Boolean);
              return (
                <div key={cell.date} role="gridcell" aria-selected={isSel}>
                  <button
                    type="button"
                    disabled={!cell.inMonth || future}
                    onClick={() => onSelect(isSel ? null : cell.date)}
                    aria-label={parts.join(', ')}
                    className={`relative w-full aspect-square min-h-10 rounded-xl text-sm font-semibold tabular-nums flex items-center justify-center transition-all cursor-pointer disabled:cursor-default
                      ${!cell.inMonth ? 'opacity-0 pointer-events-none' : ''}
                      ${lvl ? LEVEL_CLASS[lvl] : future ? 'text-muted-foreground/60' : 'text-muted-foreground hover:bg-secondary'}
                      ${plan && !t ? 'border-2 border-dashed border-primary/50' : ''}
                      ${isToday ? 'ring-2 ring-foreground ring-offset-1 ring-offset-card' : ''}
                      ${isSel ? 'outline outline-2 outline-offset-2 outline-primary' : ''}`}
                  >
                    {dayNum}
                    {t?.strength && (
                      <span aria-hidden className={`absolute bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full ${lvl === 3 ? 'bg-primary-foreground' : 'bg-leaf'}`} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Leyenda">
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded bg-primary/20" />Menos de 30 min</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded bg-primary/50" />30–59 min</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded bg-primary" />60 min o más</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-1.5 rounded-full bg-leaf" />Fuerza</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded border-2 border-dashed border-primary/50" />Planificado</li>
      </ul>
    </section>
  );
};

export default TrainingCalendar;
