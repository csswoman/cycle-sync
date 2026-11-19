'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, Routine } from '@/types/exercises';
import { WEEKDAYS_ES, WEEKDAYS_EN } from './RoutineBuilder';
import { useLanguage } from '@/i18n/LanguageContext';

export interface AddToRoutineRequest {
  /** What is being added, shown in the title ("Sentadilla", "Push - Pecho, Hombros y Tríceps"). */
  label: string;
  exercises: Exercise[];
  /** Name suggested when creating a new routine. */
  suggestedName: string;
}

interface Props {
  request: AddToRoutineRequest | null;
  routines: Routine[];
  phaseKey: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Adds one or several exercises to a saved routine, or creates a new routine with them.
 * Exercises already in the routine are skipped, so adding twice never duplicates.
 */
const AddToRoutineDialog: React.FC<Props> = ({ request, routines, phaseKey, onClose, onSaved }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [mode, setMode] = useState<'pick' | 'new'>('pick');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;
    setMode(routines.length > 0 ? 'pick' : 'new');
    setName(request.suggestedName);
    setError(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, routines.length, onClose]);

  if (!request) return null;
  const count = request.exercises.length;

  const addTo = async (routine: Routine) => {
    setBusy(routine.id);
    setError(null);
    const have = new Set(routine.exercises.map((e) => e.id));
    const fresh = request.exercises.filter((e) => !have.has(e.id));
    if (fresh.length === 0) {
      setBusy(null);
      onSaved(isEn ? `Already in "${routine.name}".` : `Ya estaba en "${routine.name}".`);
      return;
    }
    const { error: err } = await supabase
      .from('routines')
      .update({ exercises: [...routine.exercises, ...fresh] })
      .eq('id', routine.id);
    setBusy(null);
    if (err) return setError(isEn ? 'Could not save. Try again.' : 'No se pudo guardar. Inténtalo de nuevo.');
    onSaved(
      isEn
        ? `${fresh.length === 1 ? 'Exercise added' : `${fresh.length} exercises added`} to "${routine.name}".`
        : `${fresh.length === 1 ? 'Ejercicio agregado' : `${fresh.length} ejercicios agregados`} a "${routine.name}".`,
    );
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError(isEn ? 'Name the routine.' : 'Ponle un nombre a la rutina.');
    setBusy('new');
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(null);
      return setError(isEn ? 'Sign in to save your routine.' : 'Inicia sesión para guardar tu rutina.');
    }
    const { error: err } = await supabase.from('routines').insert([{
      user_id: user.id,
      name: trimmed.slice(0, 80),
      description: `${count} ${count === 1 ? (isEn ? 'exercise' : 'ejercicio') : (isEn ? 'exercises' : 'ejercicios')}.`,
      exercises: request.exercises,
      phase: phaseKey,
      weekday: null,
      muscle_groups: Array.from(new Set(request.exercises.map((x) => x.bodyPart).filter(Boolean))),
    }]);
    setBusy(null);
    if (err) return setError((isEn ? 'Could not create routine: ' : 'No se pudo crear la rutina: ') + err.message);
    onSaved(isEn ? `Routine "${trimmed}" created.` : `Rutina "${trimmed}" creada.`);
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-routine-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
      >
        <header className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 id="add-routine-title" className="text-lg font-bold text-foreground">
              {isEn ? 'Add to my routine' : 'Agregar a mi rutina'}
            </h2>
            <p className="text-sm text-muted-foreground truncate capitalize">
              {request.label}{count > 1 ? ` · ${count} ${isEn ? 'exercises' : 'ejercicios'}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={isEn ? "Close" : "Cerrar"} className="size-10 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 cursor-pointer">
            <span aria-hidden className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        {routines.length > 0 && (
          <div role="tablist" className="flex gap-1 p-1 mx-5 mt-4 rounded-xl bg-secondary/60 border border-border">
            {(['pick', 'new'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 min-h-10 rounded-lg text-sm font-semibold cursor-pointer ${mode === m ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground border border-transparent'}`}
              >
                {m === 'pick' ? (isEn ? 'Existing routine' : 'Rutina existente') : (isEn ? 'New routine' : 'Nueva rutina')}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 flex flex-col gap-3">
          {mode === 'pick' ? (
            <ul className="flex flex-col gap-2">
              {[...routines].sort((a, b) => (a.weekday ?? 7) - (b.weekday ?? 7)).map((r) => {
                const has = request.exercises.every((x) => r.exercises.some((e) => e.id === x.id));
                const weekdays = isEn ? WEEKDAYS_EN : WEEKDAYS_ES;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      disabled={!!busy || has}
                      onClick={() => addTo(r)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/50 text-left disabled:opacity-60 disabled:cursor-default cursor-pointer transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground truncate">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.weekday != null ? `${weekdays[r.weekday]} · ` : ''}{r.exercises.length} {isEn ? 'exercises' : 'ejercicios'}
                        </span>
                      </span>
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold shrink-0 ${has ? 'text-leaf' : 'text-primary'}`}>
                        <span aria-hidden className="material-symbols-outlined text-lg">{has ? 'check' : busy === r.id ? 'sync' : 'add'}</span>
                        {has ? (isEn ? 'Already included' : 'Ya incluido') : (isEn ? 'Add' : 'Agregar')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <form onSubmit={create} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                {isEn ? 'Name' : 'Nombre'}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-primary"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {isEn ? 'You can assign it a day later from “My routines”.' : 'Después podrás asignarle un día desde “Mis rutinas”.'}
              </p>
              <button type="submit" disabled={!!busy} className="min-h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer">
                {busy === 'new' ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Create routine' : 'Crear rutina')}
              </button>
            </form>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AddToRoutineDialog;
