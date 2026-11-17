'use client';
import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/exercises';
import {
  BODY_PART_LABELS_ES,
  EQUIPMENT_LABELS_ES,
  listBodyParts,
  listEquipment,
  queryExercises,
} from '@/services/exercisesService';

export const WEEKDAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const PAGE = 24;

const bodyPartLabel = (bp: string) => BODY_PART_LABELS_ES[bp] ?? bp;
const equipmentLabel = (eq: string) => EQUIPMENT_LABELS_ES[eq] ?? eq;

interface Props {
  phaseKey: string;
  onSaved: () => void;
}

const RoutineBuilder: React.FC<Props> = ({ phaseKey, onSaved }) => {
  const bodyParts = useMemo(() => listBodyParts(), []);
  const equipments = useMemo(() => listEquipment(), []);

  const [bodyPart, setBodyPart] = useState('');
  const [equipment, setEquipment] = useState('body weight');
  const [text, setText] = useState('');
  const [shown, setShown] = useState(PAGE);

  const [weekday, setWeekday] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { items, total } = useMemo(
    () => queryExercises({ bodyPart, equipment, text, limit: shown }),
    [bodyPart, equipment, text, shown],
  );

  const selectedIds = new Set(selected.map((e) => e.id));
  const groups = Array.from(new Set(selected.map((e) => e.bodyPart)));

  const resetPaging = () => setShown(PAGE);
  const toggle = (ex: Exercise) =>
    setSelected((prev) => (prev.some((e) => e.id === ex.id) ? prev.filter((e) => e.id !== ex.id) : [...prev, ex]));

  const canSave = selected.length > 0 && weekday !== null && !saving;

  const save = async () => {
    if (!canSave || weekday === null) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Inicia sesión para guardar tu rutina.');
        return;
      }
      const label = groups.map(bodyPartLabel).join(' + ');
      const { error } = await supabase.from('routines').insert([{
        user_id: user.id,
        name: name.trim() || `${WEEKDAYS_ES[weekday]} · ${label}`,
        description: `${selected.length} ejercicios: ${label}.`,
        exercises: selected,
        phase: phaseKey,
        weekday,
        muscle_groups: groups,
      }]);
      if (error) throw error;
      setSelected([]);
      setName('');
      setWeekday(null);
      setMessage('Rutina guardada.');
      onSaved();
    } catch (err: any) {
      setMessage('No se pudo guardar: ' + (err?.message ?? 'error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-card text-foreground border-border hover:border-primary/50'
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Browser */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button className={chip(bodyPart === '')} onClick={() => { setBodyPart(''); resetPaging(); }}>
            Todos
          </button>
          {bodyParts.map((bp) => (
            <button key={bp} className={chip(bodyPart === bp)} onClick={() => { setBodyPart(bp); resetPaging(); }}>
              {bodyPartLabel(bp)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); resetPaging(); }}
            placeholder="Buscar por nombre o músculo (inglés)"
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground"
          />
          <select
            value={equipment}
            onChange={(e) => { setEquipment(e.target.value); resetPaging(); }}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground"
          >
            <option value="">Cualquier equipo</option>
            {equipments.map((eq) => (
              <option key={eq} value={eq}>{equipmentLabel(eq)}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">{total} ejercicios</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((ex) => {
            const added = selectedIds.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => toggle(ex)}
                className={`text-left rounded-2xl border overflow-hidden bg-card transition-all ${
                  added ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:shadow-md'
                }`}
              >
                <img src={ex.gifUrl} alt={ex.name} loading="lazy" className="w-full aspect-square object-cover bg-muted" />
                <div className="p-3 flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground capitalize leading-tight">{ex.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {bodyPartLabel(ex.bodyPart)} · {equipmentLabel(ex.equipment)}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${added ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span aria-hidden className="material-symbols-outlined text-base">{added ? 'check' : 'add'}</span>
                    {added ? 'Añadido' : 'Añadir'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {items.length < total && (
          <button
            onClick={() => setShown((n) => n + PAGE)}
            className="self-center px-5 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Cargar más
          </button>
        )}
      </div>

      {/* Routine being built */}
      <aside className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 h-fit lg:sticky lg:top-4">
        <h3 className="text-foreground font-bold text-lg">Tu rutina</h3>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-foreground">Día de entrenamiento</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS_ES.map((d, i) => (
              <button key={d} className={chip(weekday === i)} onClick={() => setWeekday(i)}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (opcional)"
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground"
        />

        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">Toca ejercicios para añadirlos. Puedes mezclar grupos musculares.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-primary">{bodyPartLabel(g)}</span>
                {selected.filter((e) => e.bodyPart === g).map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 text-sm text-foreground">
                    <span className="capitalize truncate">{e.name}</span>
                    <button
                      onClick={() => toggle(e)}
                      aria-label={`Quitar ${e.name}`}
                      className="text-muted-foreground hover:text-destructive shrink-0 size-10 -my-2 flex items-center justify-center rounded-lg cursor-pointer"
                    >
                      <span aria-hidden className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-xl bg-primary text-white font-bold py-2.5 disabled:opacity-40"
        >
          {saving ? 'Guardando...' : 'Guardar rutina'}
        </button>
        {weekday === null && selected.length > 0 && (
          <p className="text-xs text-muted-foreground">Elige un día para guardarla.</p>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </aside>
    </div>
  );
};

export default RoutineBuilder;
