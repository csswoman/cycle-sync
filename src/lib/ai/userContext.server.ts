import type { SupabaseClient } from '@supabase/supabase-js';

// Server-only: reads the signed-in user's own rows (RLS applies) to give the chat assistant context.

export interface UserContextData {
  phase?: string;
  cycleDay?: number;
  dietary: string[];
  logs: { date: string; mood?: string | null; energy?: number | null; sleepHours?: number | null; symptoms: string[] }[];
  pcos: { date: string; symptoms: Record<string, number> } | null;
  medications: { name: string; dose?: string | null; times: string[] }[];
  pantry: string[];
  today?: string;
  plannedMeals: { slot: string; title: string; done: boolean }[];
  plannedWorkout: { title: string; kind: string; done: boolean } | null;
}

const PHASES = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const validPhase = (v: unknown): string | undefined => (PHASES.includes(v as string) ? (v as string) : undefined);
export const validCycleDay = (v: unknown): number | undefined =>
  Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 120 ? (v as number) : undefined;
export const validDate = (v: unknown): string | undefined => (typeof v === 'string' && DATE_RE.test(v) ? v : undefined);

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

/** Turns the loaded data into a compact text block appended to the system instruction. Returns '' when there is nothing to say. */
export function formatUserContext(d: UserContextData, language: 'en' | 'es'): string {
  const es = language === 'es';
  const lines: string[] = [];

  if (d.phase) {
    lines.push(es
      ? `Fase actual del ciclo: ${d.phase}${d.cycleDay ? ` (día ${d.cycleDay})` : ''}.`
      : `Current cycle phase: ${d.phase}${d.cycleDay ? ` (day ${d.cycleDay})` : ''}.`);
  }
  if (d.dietary.length) lines.push((es ? 'Preferencias alimentarias: ' : 'Dietary preferences: ') + d.dietary.join(', ') + '.');

  if (d.logs.length) {
    lines.push(es ? 'Registros de los últimos días:' : 'Recent daily logs:');
    for (const l of d.logs) {
      const bits = [
        l.energy != null ? `${es ? 'energía' : 'energy'} ${l.energy}/10` : '',
        l.sleepHours != null ? `${es ? 'sueño' : 'sleep'} ${l.sleepHours}h` : '',
        l.mood ? `${es ? 'ánimo' : 'mood'} ${clip(l.mood, 30)}` : '',
        l.symptoms.length ? `${es ? 'síntomas' : 'symptoms'}: ${l.symptoms.map((s) => clip(s, 30)).join(', ')}` : '',
      ].filter(Boolean);
      if (bits.length) lines.push(`- ${l.date}: ${bits.join('; ')}`);
    }
  }
  if (d.pcos) {
    const active = Object.entries(d.pcos.symptoms).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}/3`);
    if (active.length) lines.push(`${es ? 'Síntomas SOP' : 'PCOS symptoms'} (${d.pcos.date}): ${active.join(', ')}.`);
  }
  if (d.medications.length) {
    lines.push((es ? 'Medicamentos activos: ' : 'Active medications: ') +
      d.medications.map((m) => `${clip(m.name, 60)}${m.dose ? ` ${clip(m.dose, 30)}` : ''}${m.times.length ? ` (${m.times.join(', ')})` : ''}`).join('; ') + '.');
  }
  if (d.pantry.length) lines.push((es ? 'Despensa: ' : 'Pantry: ') + d.pantry.map((p) => clip(p, 40)).join(', ') + '.');
  if (d.plannedMeals.length) {
    lines.push((es ? 'Comidas planeadas hoy: ' : 'Meals planned today: ') +
      d.plannedMeals.map((m) => `${m.slot} ${clip(m.title, 80)}${m.done ? (es ? ' (hecha)' : ' (done)') : ''}`).join('; ') + '.');
  }
  if (d.plannedWorkout) {
    lines.push(`${es ? 'Entreno planeado hoy' : 'Workout planned today'}: ${clip(d.plannedWorkout.title, 80)}${d.plannedWorkout.done ? (es ? ' (hecho)' : ' (done)') : ''}.`);
  }

  if (lines.length === 0) return '';
  const header = es
    ? 'Contexto privado de la usuaria (úsalo solo cuando ayude a responder; no lo repitas entero ni lo menciones si no viene al caso). No diagnostiques ni cambies dosis de medicamentos; para eso recomienda consultar a su profesional de salud.'
    : "The user's private context (use it only when it helps the answer; do not recite it or mention it when irrelevant). Do not diagnose or change medication doses; refer her to her healthcare professional for that.";
  return `${header}\n${lines.join('\n')}`;
}

/** Loads the data the assistant can use. Each query fails soft: a missing table or error just leaves that part out. */
export async function loadUserContext(
  supabase: SupabaseClient,
  userId: string,
  hints: { phase?: string; cycleDay?: number; today?: string },
): Promise<UserContextData> {
  const soft = async <T>(q: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> => {
    try {
      const { data, error } = await q;
      return error ? null : data;
    } catch {
      return null;
    }
  };

  const today = hints.today;
  const [cfg, logs, pcos, meds, pantry, meals, workout] = await Promise.all([
    soft(supabase.from('cycle_config').select('dietary_prefs').eq('user_id', userId).maybeSingle()),
    soft(supabase.from('daily_logs').select('date, mood, energy_level, sleep_hours, symptoms').eq('user_id', userId).order('date', { ascending: false }).limit(5)),
    soft(supabase.from('pcos_symptoms').select('date, acne, fatigue, hirsutism, hair_loss, mood_swings, bloating').eq('user_id', userId).order('date', { ascending: false }).limit(1)),
    soft(supabase.from('medications').select('name, dose, times').eq('user_id', userId).eq('active', true).limit(20)),
    soft(supabase.from('pantry_items').select('name').eq('user_id', userId).order('name').limit(60)),
    today ? soft(supabase.from('meal_plan_entries').select('slot, title, done').eq('user_id', userId).eq('plan_date', today)) : Promise.resolve(null),
    today ? soft(supabase.from('workout_plan_entries').select('title, kind, done').eq('user_id', userId).eq('plan_date', today).maybeSingle()) : Promise.resolve(null),
  ]);

  const pcosRow: any = (pcos as any[] | null)?.[0];
  return {
    phase: hints.phase,
    cycleDay: hints.cycleDay,
    today,
    dietary: ((cfg as any)?.dietary_prefs ?? []) as string[],
    logs: ((logs as any[] | null) ?? []).map((l) => ({
      date: String(l.date).slice(0, 10),
      mood: l.mood,
      energy: l.energy_level,
      sleepHours: l.sleep_hours != null ? Number(l.sleep_hours) : null,
      symptoms: (l.symptoms ?? []) as string[],
    })),
    pcos: pcosRow
      ? {
          date: String(pcosRow.date).slice(0, 10),
          symptoms: {
            acne: pcosRow.acne, fatigue: pcosRow.fatigue, hirsutism: pcosRow.hirsutism,
            hair_loss: pcosRow.hair_loss, mood_swings: pcosRow.mood_swings, bloating: pcosRow.bloating,
          },
        }
      : null,
    medications: ((meds as any[] | null) ?? []).map((m) => ({ name: m.name, dose: m.dose, times: (m.times ?? []) as string[] })),
    pantry: ((pantry as any[] | null) ?? []).map((p) => p.name as string),
    plannedMeals: ((meals as any[] | null) ?? []).map((m) => ({ slot: m.slot, title: m.title, done: !!m.done })),
    plannedWorkout: workout ? { title: (workout as any).title, kind: (workout as any).kind, done: !!(workout as any).done } : null,
  };
}
