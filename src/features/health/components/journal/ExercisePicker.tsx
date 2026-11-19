'use client';

import React, { useId, useMemo, useState } from 'react';
import { searchExercisesByName } from '@/services/exercisesService';
import { TARGET_LABELS_ES } from '../RoutinesComponents';
import { inputClass } from './shared';

const TIMED = /camin|corr|trot|bici|cicl|spinning|cardio|yoga|pilates|nata|nadar|bail|danza|el[ií]ptica|movilidad|estira|remo erg|saltar la cuerda|walk|run|bike|swim|stretch/i;
/** Cardio, classes and mobility are logged in minutes; everything else in sets. */
export const isTimedExercise = (name: string, bodyPart?: string) => bodyPart === 'cardio' || TIMED.test(name);

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Option { name: string; hint: string; timed: boolean }

interface Props {
  /** Exercises she logged before: suggested first. */
  knownNames: string[];
  onPick: (name: string, timed: boolean) => void;
}

/** Type an exercise: matches from her history and the 1.300-exercise catalog, or keep the typed text. */
const ExercisePicker: React.FC<Props> = ({ knownNames, onPick }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();

  const options = useMemo<Option[]>(() => {
    const q = fold(query.trim());
    if (q.length < 2) return [];
    const mine = knownNames.filter((n) => fold(n).includes(q)).slice(0, 4).map((name) => ({ name, hint: 'Ya lo registraste', timed: isTimedExercise(name) }));
    const seen = new Set(mine.map((o) => fold(o.name)));
    const catalog = searchExercisesByName(query, 8)
      .filter((ex) => !seen.has(fold(ex.name)))
      .slice(0, 8 - mine.length)
      .map((ex) => ({ name: ex.name, hint: TARGET_LABELS_ES[ex.target] ?? ex.target, timed: isTimedExercise(ex.name, ex.bodyPart) }));
    return [...mine, ...catalog];
  }, [query, knownNames]);

  const pick = (o: Option) => {
    onPick(o.name.charAt(0).toUpperCase() + o.name.slice(1), o.timed);
    setQuery('');
    setOpen(false);
    setActive(0);
  };
  const pickTyped = () => {
    const name = query.trim();
    if (name.length < 2) return;
    pick({ name, hint: '', timed: isTimedExercise(name) });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && options.length) { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % options.length); }
    else if (e.key === 'ArrowUp' && options.length) { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && options[active]) pick(options[active]); else pickTyped(); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const showList = open && options.length > 0;
  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-sm font-semibold text-foreground">Añadir ejercicio</label>
      <div className="mt-1 flex gap-2">
        <input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          maxLength={80}
          placeholder="Sentadilla, caminata, hip thrust…"
          className={inputClass}
        />
        <button type="button" onClick={pickTyped} disabled={query.trim().length < 2} className="min-h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 disabled:opacity-50 cursor-pointer shrink-0">
          Añadir
        </button>
      </div>
      {showList && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-lg p-1">
          {options.map((o, i) => (
            <li
              key={`${o.name}-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center justify-between gap-3 px-3 min-h-11 rounded-lg cursor-pointer ${i === active ? 'bg-secondary' : ''}`}
            >
              <span className="text-sm text-foreground first-letter:uppercase truncate">{o.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{o.timed ? 'Por tiempo' : o.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExercisePicker;
