import type { LogSource } from '@/lib/exercise/trainingStats';

export const FEELINGS = [
  { value: 1, icon: 'sentiment_very_dissatisfied', label: 'Muy mal' },
  { value: 2, icon: 'sentiment_dissatisfied', label: 'Mal' },
  { value: 3, icon: 'sentiment_neutral', label: 'Normal' },
  { value: 4, icon: 'sentiment_satisfied', label: 'Bien' },
  { value: 5, icon: 'sentiment_very_satisfied', label: 'Genial' },
];

export const SOURCE_META: Record<LogSource, { icon: string; label: string }> = {
  routine: { icon: 'bookmark', label: 'Mi rutina' },
  program: { icon: 'fitness_center', label: 'Programa' },
  free: { icon: 'edit_note', label: 'Libre' },
  video: { icon: 'play_circle', label: 'Video' },
  quick: { icon: 'bolt', label: 'Registro rápido' },
  session: { icon: 'flag', label: 'Sesión' },
};

export const inputClass =
  'w-full min-h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary';

/** "lun 16 nov", "Hoy" or "Ayer". */
export function dayLabel(iso: string, today: string, yesterday: string, long = false): string {
  if (iso === today) return 'Hoy';
  if (iso === yesterday) return 'Ayer';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', long
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'short' });
}

export const formatSets = (sets: { reps: number | null; weight: number | null }[]) =>
  sets.map((s) => `${s.reps ?? '–'}${s.weight != null ? ` × ${s.weight} kg` : ''}`).join(' · ');
