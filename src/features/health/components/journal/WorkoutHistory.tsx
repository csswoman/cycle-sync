'use client';

import React, { useMemo, useState } from 'react';
import { groupHistory, personalRecords, setsOf, addDays, type HistoryItem, type JournalLog } from '@/lib/exercise/trainingStats';
import { FEELINGS, SOURCE_META, dayLabel, formatSets } from './shared';

type Filter = 'all' | 'strength' | 'timed' | 'program' | 'routine' | 'video';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'strength', label: 'Fuerza' },
  { id: 'timed', label: 'Cardio y clases' },
  { id: 'routine', label: 'Mis rutinas' },
  { id: 'program', label: 'Programas' },
  { id: 'video', label: 'Videos' },
];

const matches = (it: HistoryItem, f: Filter) => {
  switch (f) {
    case 'strength': return it.strength;
    case 'timed': return !it.strength;
    case 'program': return it.source === 'program';
    case 'routine': return it.source === 'routine';
    case 'video': return it.source === 'video';
    default: return true;
  }
};

const DAYS_PAGE = 7;

interface Props {
  logs: (JournalLog & { pending?: boolean })[];
  loading: boolean;
  today: string;
  /** Show only this day (picked in the calendar). */
  selectedDate: string | null;
  onClearDate: () => void;
  onDelete: (ids: string[]) => Promise<boolean>;
  /** Log something on the selected (past) day. */
  onLogOnDate?: (date: string) => void;
}

const ExerciseLine: React.FC<{ log: JournalLog; record: boolean }> = ({ log, record }) => {
  const sets = setsOf(log);
  const detail = sets ? formatSets(sets) : log.durationMinutes ? `${log.durationMinutes} min` : log.notes?.split(' — ')[0] ?? null;
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block text-sm text-foreground first-letter:uppercase">{log.exercise}</span>
        {detail && <span className="block text-xs text-muted-foreground tabular-nums">{detail}</span>}
      </span>
      {record && (
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-sun/25 text-sun-ink">
          <span aria-hidden className="material-symbols-outlined text-sm">emoji_events</span>Récord
        </span>
      )}
    </li>
  );
};

const HistoryRow: React.FC<{ item: HistoryItem; records: Set<string>; pending: boolean; onDelete: (ids: string[]) => Promise<boolean> }> = ({ item, records, pending, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const meta = SOURCE_META[item.session && item.exercises.length === 0 ? 'session' : item.source];
  const feeling = FEELINGS.find((f) => f.value === item.feeling);
  const hasRecord = item.exercises.some((e) => records.has(e.id));
  const single = !item.session && item.exercises.length === 1 ? item.exercises[0] : null;
  const singleSets = single ? setsOf(single) : null;
  const expandable = item.exercises.length > 1 || (item.session && item.exercises.length > 0);
  const subtitle = [
    meta.label,
    item.minutes ? `${item.minutes} min` : null,
    item.exercises.length > 1 ? `${item.exercises.length} ejercicios` : null,
    singleSets ? formatSets(singleSets) : null,
    pending ? 'sin sincronizar' : null,
  ].filter(Boolean).join(' · ');

  const remove = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await onDelete(item.ids);
    setBusy(false);
    if (!ok) { setFailed(true); setConfirm(false); }
  };

  return (
    <li className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 p-3">
        <span aria-hidden className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.strength ? 'bg-primary/10 text-primary' : 'bg-leaf/10 text-leaf'}`}>
          <span className="material-symbols-outlined text-xl">{meta.icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground line-clamp-2 sm:truncate first-letter:uppercase">
            {item.title}
            {hasRecord && <span aria-label="Incluye un récord personal" className="material-symbols-outlined text-base text-sun-ink align-middle ml-1">emoji_events</span>}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums line-clamp-2 sm:truncate">{subtitle}</p>
        </div>
        {feeling && <span title={feeling.label} aria-label={`Te sentiste: ${feeling.label}`} className="material-symbols-outlined text-xl text-muted-foreground shrink-0">{feeling.icon}</span>}
        {expandable && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Ocultar ejercicios' : 'Ver ejercicios'} className="size-10 rounded-lg hover:bg-secondary flex items-center justify-center shrink-0 cursor-pointer">
            <span aria-hidden className="material-symbols-outlined">{open ? 'expand_less' : 'expand_more'}</span>
          </button>
        )}
        {!confirm && (
          <button type="button" onClick={() => setConfirm(true)} aria-label={`Borrar ${item.title}`} className="size-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary flex items-center justify-center shrink-0 cursor-pointer">
            <span aria-hidden className="material-symbols-outlined text-lg">delete</span>
          </button>
        )}
      </div>
      {confirm && (
        <div role="alertdialog" aria-label="Confirmar borrado" className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 text-sm">
          <span className="text-foreground">¿Borrar {item.ids.length > 1 ? `la sesión y sus ${item.exercises.length} ejercicios` : 'este registro'}?</span>
          <span className="flex gap-2">
            <button type="button" onClick={() => setConfirm(false)} className="min-h-10 px-3 rounded-lg border border-border font-semibold cursor-pointer">No</button>
            <button type="button" onClick={remove} disabled={busy} className="min-h-10 px-3 rounded-lg bg-destructive text-white font-semibold disabled:opacity-60 cursor-pointer">{busy ? 'Borrando…' : 'Sí, borrar'}</button>
          </span>
        </div>
      )}
      {failed && <p role="alert" className="px-3 pb-3 text-xs font-semibold text-destructive">No se pudo borrar. Revisa tu conexión.</p>}
      {open && expandable && (
        <ul className="border-t border-border mx-3 py-1.5 divide-y divide-border/60">
          {item.exercises.map((e) => <ExerciseLine key={e.id} log={e} record={records.has(e.id)} />)}
        </ul>
      )}
    </li>
  );
};

/** Training history grouped by day and session, with filters and personal records. */
const WorkoutHistory: React.FC<Props> = ({ logs, loading, today, selectedDate, onClearDate, onDelete, onLogOnDate }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(DAYS_PAGE);
  const yesterday = addDays(today, -1);
  const records = useMemo(() => personalRecords(logs), [logs]);
  const pendingIds = useMemo(() => new Set(logs.filter((l) => l.pending).map((l) => l.id)), [logs]);

  const days = useMemo(() => {
    const all = groupHistory(selectedDate ? logs.filter((l) => l.date === selectedDate) : logs);
    return all
      .map((d) => ({ ...d, items: d.items.filter((it) => matches(it, filter)) }))
      .filter((d) => d.items.length > 0);
  }, [logs, selectedDate, filter]);

  return (
    <section aria-labelledby="journal-history-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="journal-history-title" className="text-base font-bold text-foreground">
          {selectedDate ? `Historial: ${dayLabel(selectedDate, today, yesterday, true)}` : 'Historial'}
        </h3>
        {selectedDate && (
          <button type="button" onClick={onClearDate} className="min-h-10 px-3 rounded-xl text-sm font-semibold text-primary hover:bg-secondary cursor-pointer">Ver todos los días</button>
        )}
      </div>
      <div role="group" aria-label="Filtrar historial" className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => { setFilter(f.id); setShown(DAYS_PAGE); }}
            className={`shrink-0 min-h-10 px-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 hover:bg-secondary text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card animate-pulse border border-border" />)
      ) : days.length === 0 ? (
        <div className="py-10 px-4 text-center bg-card/40 rounded-2xl border border-dashed border-border flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {selectedDate ? 'No registraste nada este día.' : filter === 'all' ? 'Aún no has registrado entrenamientos. Empieza con una sugerencia o una de tus rutinas.' : 'No hay registros con este filtro.'}
          </p>
          {selectedDate && onLogOnDate && filter === 'all' && (
            <button type="button" onClick={() => onLogOnDate(selectedDate)} className="min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer">
              Registrar entrenamiento este día
            </button>
          )}
        </div>
      ) : (
        <>
          <ol className="flex flex-col gap-4">
            {days.slice(0, shown).map((d) => (
              <li key={d.date} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2 px-0.5">
                  <h4 className="text-sm font-bold text-foreground first-letter:uppercase">{dayLabel(d.date, today, yesterday)}</h4>
                  <span className="text-xs text-muted-foreground tabular-nums">{d.minutes ? `${d.minutes} min` : ''}</span>
                </div>
                <ul className="flex flex-col gap-2">
                  {d.items.map((it) => <HistoryRow key={it.id} item={it} records={records} pending={it.ids.some((id) => pendingIds.has(id))} onDelete={onDelete} />)}
                </ul>
              </li>
            ))}
          </ol>
          {days.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + DAYS_PAGE)} className="self-center min-h-11 px-5 rounded-xl border border-border bg-card text-sm font-bold hover:border-primary/50 cursor-pointer">
              Ver más días ({days.length - shown})
            </button>
          )}
          {selectedDate && onLogOnDate && selectedDate !== today && (
            <button type="button" onClick={() => onLogOnDate(selectedDate)} className="self-start min-h-10 text-sm font-semibold text-primary hover:underline cursor-pointer">
              <span aria-hidden className="material-symbols-outlined text-lg align-middle mr-1">add</span>Añadir otro entrenamiento este día
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default WorkoutHistory;
