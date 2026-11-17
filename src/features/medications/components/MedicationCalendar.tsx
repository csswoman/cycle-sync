'use client';
import React, { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Medication, MedicationLog } from '@/hooks/useMedications';
import {
  adherence, currentStreak, daySummary, dosesOn, findLog, instructionLabel, monthGrid, parseLocalDate, toLocalISO,
  type DayStatus,
} from '@/lib/medications/schedule';

type Lang = 'es' | 'en';

const T = {
  es: {
    title: 'Calendario de tomas', all: 'Todas', month: 'Este mes', streak: 'Racha', days: (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`,
    prev: 'Mes anterior', next: 'Mes siguiente', weekdays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    legend: { full: 'Todas tomadas', partial: 'Incompleto', missed: 'No tomada', future: 'Programada' } as Record<string, string>,
    nothing: 'No había tomas programadas este día.', future: 'Aún no llega este día.', taken: 'Tomada', notTaken: 'No tomada',
    takenAt: (h: string) => `Tomada a las ${h}`, markTaken: 'Marcar tomada', undo: 'Desmarcar',
  },
  en: {
    title: 'Intake calendar', all: 'All', month: 'This month', streak: 'Streak', days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
    prev: 'Previous month', next: 'Next month', weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    legend: { full: 'All taken', partial: 'Incomplete', missed: 'Missed', future: 'Scheduled' } as Record<string, string>,
    nothing: 'No intakes were scheduled this day.', future: 'This day has not arrived yet.', taken: 'Taken', notTaken: 'Not taken',
    takenAt: (h: string) => `Taken at ${h}`, markTaken: 'Mark taken', undo: 'Undo',
  },
};

const CELL: Record<DayStatus, string> = {
  full: 'bg-leaf text-card',
  partial: 'bg-sun/80 text-foreground',
  missed: 'bg-destructive/15 text-destructive',
  pending: 'bg-secondary text-foreground',
  future: 'bg-transparent text-foreground',
  none: 'bg-transparent text-muted-foreground/60',
};

interface Props {
  lang: Lang;
  medications: Medication[];
  logs: MedicationLog[];
  today: string;
  view: { year: number; month: number };
  onMonth: (year: number, month: number) => void;
  onToggle: (medId: string, time: string, taken: boolean, date: string) => void;
}

const fmtTime = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' });

export const MedicationCalendar: React.FC<Props> = ({ lang, medications, logs, today, view, onMonth, onToggle }) => {
  const t = T[lang];
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string>(today);
  const meds = filter === 'all' ? medications : medications.filter((m) => m.id === filter);

  const weeks = useMemo(() => monthGrid(view.year, view.month), [view]);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' });
  const from = toLocalISO(new Date(view.year, view.month, 1));
  const to = toLocalISO(new Date(view.year, view.month + 1, 0));
  const stats = adherence(meds, logs, from, to, today);
  const streak = currentStreak(meds, logs, today);
  const isCurrentMonth = today.startsWith(from.slice(0, 7));

  const selectedDoses = dosesOn(meds, selected);
  const selectedLabel = parseLocalDate(selected).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-5" aria-labelledby="med-cal-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="med-cal-title" className="text-foreground font-bold text-lg flex items-center gap-2">
          <Icon name="calendar_month" size={22} className="text-primary" /> {t.title}
        </h2>
        <div className="flex gap-4 text-sm">
          {stats.pct !== null && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{isCurrentMonth ? t.month : monthLabel}</p>
              <p className="font-bold text-foreground">{stats.pct}% <span className="font-normal text-muted-foreground text-xs">({stats.taken}/{stats.total})</span></p>
            </div>
          )}
          {streak > 0 && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{t.streak}</p>
              <p className="font-bold text-foreground flex items-center gap-1 justify-end">
                <Icon name="local_fire_department" size={16} className="text-coral" /> {t.days(streak)}
              </p>
            </div>
          )}
        </div>
      </div>

      {medications.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[{ id: 'all', name: t.all }, ...medications].map((m) => (
            <button key={m.id} onClick={() => setFilter(m.id)} aria-pressed={filter === m.id}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${filter === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border hover:border-primary/50'}`}>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => onMonth(view.year, view.month - 1)} aria-label={t.prev} className="p-2 rounded-full hover:bg-secondary text-foreground">
          <Icon name="chevron_left" size={20} />
        </button>
        <p className="font-bold text-foreground capitalize">{monthLabel}</p>
        <button onClick={() => onMonth(view.year, view.month + 1)} aria-label={t.next} className="p-2 rounded-full hover:bg-secondary text-foreground">
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div role="grid" className="flex flex-col gap-1.5">
        <div role="row" className="grid grid-cols-7 gap-1.5">
          {t.weekdays.map((d, i) => <span key={i} role="columnheader" className="text-center text-xs font-bold text-muted-foreground">{d}</span>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-1.5">
            {week.map((date, di) => {
              if (!date) return <span key={di} />;
              const s = daySummary(meds, logs, date, today);
              const isToday = date === today;
              const isSel = date === selected;
              return (
                <button key={date} role="gridcell" aria-selected={isSel} onClick={() => setSelected(date)}
                  aria-label={`${date}: ${s.total ? `${s.taken}/${s.total}` : '—'}`}
                  className={`relative aspect-square max-h-12 w-full rounded-xl text-sm font-semibold flex flex-col items-center justify-center transition-all ${CELL[s.status]} ${isSel ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : isToday ? 'ring-2 ring-primary/40' : ''}`}>
                  {Number(date.slice(8))}
                  {(s.status === 'future' || s.status === 'pending') && <span className="absolute bottom-1 size-1 rounded-full bg-primary/60" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(['full', 'partial', 'missed'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5"><span className={`size-3 rounded ${CELL[k].split(' ')[0]}`} />{t.legend[k]}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary/60" />{t.legend.future}</span>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-2">
        <p className="text-sm font-bold text-foreground capitalize">{selectedLabel}</p>
        {selectedDoses.length === 0 && <p className="text-sm text-muted-foreground">{t.nothing}</p>}
        {selected > today && selectedDoses.length > 0 && <p className="text-xs text-muted-foreground">{t.future}</p>}
        {selectedDoses.map(({ med, time }) => {
          const log = findLog(logs, med.id, selected, time);
          const taken = !!log?.taken;
          const instruction = instructionLabel(med.time_instructions?.[time], lang);
          const editable = selected <= today;
          return (
            <div key={`${med.id}-${time}`} className="flex items-center gap-3 py-1">
              <Icon name={taken ? 'check_circle' : 'radio_button_unchecked'} size={20} weight={taken ? 'fill' : 'regular'}
                className={taken ? 'text-leaf' : 'text-muted-foreground'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{time} · {med.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[instruction, taken && log?.taken_at ? t.takenAt(fmtTime(log.taken_at, lang)) : editable ? (taken ? t.taken : t.notTaken) : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              {editable && (
                <button onClick={() => onToggle(med.id, time, !taken, selected)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${taken ? 'border-border text-muted-foreground' : 'border-primary text-primary'}`}>
                  {taken ? t.undo : t.markTaken}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MedicationCalendar;
