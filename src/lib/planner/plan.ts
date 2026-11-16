import { MEAL_SLOTS, type MealSlot } from './week';

export interface PlannedMeal {
  day: number; // 0 = Monday … 6 = Sunday
  slot: MealSlot;
  title: string;
  ingredients: string[];
}

export interface PlannedWorkout {
  day: number;
  kind: 'video' | 'gym' | 'rest';
  videoId: string | null; // workout_videos.id
  title: string;
  durationMinutes: number | null;
}

export interface GeneratedPlan {
  meals: PlannedMeal[];
  workouts: PlannedWorkout[];
}

export interface CandidateVideo {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  intensity: string;
}

export interface PlanRequest {
  language: 'es' | 'en';
  phase: string;
  pantry: string[];
  dietary: string[];
  includeMeals: boolean;
  includeWorkouts: boolean;
  videos: CandidateVideo[];
}

export function buildPlanPrompt(req: PlanRequest): string {
  const lang = req.language === 'es' ? 'Spanish' : 'English';
  const parts: string[] = [
    `You plan one week (Monday to Sunday, day 0 to 6) for a woman who tracks her menstrual cycle. Current cycle phase: ${req.phase}.`,
    `Write all text in ${lang}.`,
  ];
  if (req.includeMeals) {
    parts.push(
      `Meals: for every day 0-6 give breakfast, lunch, snack and dinner. Favor foods that suit the ${req.phase} phase. Reuse ingredients across the week to keep shopping simple.`,
      req.pantry.length ? `Prefer using these ingredients she already has: ${req.pantry.join(', ')}.` : '',
      req.dietary.length ? `Dietary preferences/restrictions: ${req.dietary.join(', ')}.` : '',
      'Each meal needs a short title and 2 to 8 ingredients as plain names without quantities.',
    );
  }
  if (req.includeWorkouts) {
    parts.push(
      `Workouts: one entry per day 0-6. Match intensity to the ${req.phase} phase, include 1 or 2 rest days, and vary categories.`,
      'Use kind "video" with the exact id of one video from the list below, kind "gym" for a strength session without video (give a descriptive title and durationMinutes), or kind "rest".',
      req.videos.length
        ? `Videos (id | title | category | minutes | intensity):\n${req.videos
            .map((v) => `${v.id} | ${v.title} | ${v.category} | ${v.durationMinutes} | ${v.intensity}`)
            .join('\n')}`
        : 'There are no videos available, so use only "gym" and "rest".',
    );
  }
  parts.push(
    'Return only JSON with this shape: {"meals":[{"day":0,"slot":"breakfast|lunch|snack|dinner","title":"","ingredients":[""]}],"workouts":[{"day":0,"kind":"video|gym|rest","videoId":null,"title":"","durationMinutes":30}]}.',
    `Use an empty array for the section you were not asked for (${req.includeMeals ? 'workouts' : 'meals'} when applicable).`,
  );
  return parts.filter(Boolean).join('\n');
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDay = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6;

/** Validates the model output: drops malformed rows, unknown slots and video ids that are not in the candidate list. */
export function parsePlanJson(text: string, validVideoIds: Set<string>): GeneratedPlan {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    return { meals: [], workouts: [] };
  }

  const meals: PlannedMeal[] = [];
  const seenMeals = new Set<string>();
  for (const m of Array.isArray(raw?.meals) ? raw.meals : []) {
    const title = str(m?.title, 120);
    if (!isDay(m?.day) || !MEAL_SLOTS.includes(m?.slot) || !title) continue;
    const key = `${m.day}-${m.slot}`;
    if (seenMeals.has(key)) continue;
    seenMeals.add(key);
    const ingredients = (Array.isArray(m.ingredients) ? m.ingredients : [])
      .map((i: unknown) => str(i, 60))
      .filter(Boolean)
      .slice(0, 12);
    meals.push({ day: m.day, slot: m.slot, title, ingredients });
  }

  const workouts: PlannedWorkout[] = [];
  const seenDays = new Set<number>();
  for (const w of Array.isArray(raw?.workouts) ? raw.workouts : []) {
    if (!isDay(w?.day) || seenDays.has(w.day)) continue;
    const title = str(w?.title, 120);
    if (!title) continue;
    const duration = Number.isInteger(w?.durationMinutes) && w.durationMinutes > 0 && w.durationMinutes <= 300 ? w.durationMinutes : null;
    if (w.kind === 'video') {
      if (typeof w.videoId !== 'string' || !validVideoIds.has(w.videoId)) continue;
      workouts.push({ day: w.day, kind: 'video', videoId: w.videoId, title, durationMinutes: duration });
    } else if (w.kind === 'gym' || w.kind === 'rest') {
      workouts.push({ day: w.day, kind: w.kind, videoId: null, title, durationMinutes: w.kind === 'rest' ? null : duration });
    } else continue;
    seenDays.add(w.day);
  }

  return { meals, workouts };
}
