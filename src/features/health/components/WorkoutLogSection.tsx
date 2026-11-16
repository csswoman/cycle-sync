'use client';

import React, { useState } from 'react';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';

const FEELINGS = [
  { value: 1, emoji: '😣', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '🤩', label: 'Genial' },
];

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Folicular',
  ovulation: 'Ovulación',
  luteal: 'Lútea',
};

const toNumberOrNull = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

interface Props {
  phaseKey: string;
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

const WorkoutLogSection: React.FC<Props> = ({ phaseKey }) => {
  const { logs, loading, saving, addLog } = useWorkoutLogs();
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [feeling, setFeeling] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const setsN = toNumberOrNull(sets);
    const weightN = toNumberOrNull(weight);
    const durationN = toNumberOrNull(duration);

    if (!exercise.trim()) return setError('Escribe el nombre del ejercicio.');
    if (weightN == null && durationN == null) return setError('Indica el peso o la duración.');
    if (setsN != null && (!Number.isInteger(setsN) || setsN < 1)) return setError('Las series deben ser un número entero mayor que 0.');
    if (durationN != null && (!Number.isInteger(durationN) || durationN < 1)) return setError('La duración debe ser un número entero de minutos.');
    if (feeling === 0) return setError('Elige cómo te sentiste.');

    setError(null);
    const ok = await addLog({
      exercise: exercise.trim(),
      sets: setsN,
      weightKg: weightN,
      durationMinutes: durationN,
      feeling,
      notes: notes.trim() || null,
      phase: phaseKey,
    });
    if (ok) {
      setExercise(''); setSets(''); setWeight(''); setDuration(''); setFeeling(0); setNotes('');
    } else {
      setError('Inicia sesión para guardar tus entrenamientos.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <form onSubmit={onSubmit} className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 flex flex-col gap-3.5 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          Ejercicio
          <input className={inputClass} value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Sentadillas, yoga, caminata…" maxLength={80} />
        </label>

        <div className="grid grid-cols-3 gap-2.5">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Series
            <input className={inputClass} inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="3" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Peso (kg)
            <input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="20" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            Minutos
            <input className={inputClass} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1.5">Completa el peso o la duración (o ambos).</p>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">¿Cómo te sentiste?</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Cómo te sentiste">
            {FEELINGS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={feeling === f.value}
                aria-label={f.label}
                title={f.label}
                onClick={() => setFeeling(f.value)}
                className={`flex-1 py-2 rounded-xl text-xl transition-all cursor-pointer border ${
                  feeling === f.value ? 'bg-primary/15 border-primary/40 scale-105' : 'bg-secondary/50 border-transparent hover:bg-secondary'
                }`}
              >
                {f.emoji}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          Nota (opcional)
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
        </label>

        {error && <p className="text-xs font-semibold text-destructive" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Guardando…' : 'Guardar entrenamiento'}
        </button>
      </form>

      <div className="lg:col-span-3 flex flex-col gap-2.5">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card animate-pulse border border-border" />)
        ) : logs.length === 0 ? (
          <div className="py-10 text-center bg-card/40 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Aún no has registrado entrenamientos.
          </div>
        ) : (
          logs.map((log) => {
            const f = FEELINGS.find((x) => x.value === log.feeling);
            const details = [
              log.sets != null ? `${log.sets} series` : null,
              log.weightKg != null ? `${log.weightKg} kg` : null,
              log.durationMinutes != null ? `${log.durationMinutes} min` : null,
            ].filter(Boolean).join(' · ');
            return (
              <div key={log.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3.5">
                <span className="text-2xl shrink-0" title={f?.label}>{f?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">{log.exercise}</p>
                  <p className="text-xs text-muted-foreground">{details}</p>
                  {log.notes && <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{log.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">{formatDate(log.date)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {log.phase ? PHASE_LABELS[log.phase] ?? log.phase : ''}{log.pending ? ' · sin sincronizar' : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkoutLogSection;
