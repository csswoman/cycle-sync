import { NextResponse } from 'next/server';
import { requireAiUser, missingKey } from '@/lib/api/requireUser';
import { createClient } from '@/lib/supabase/server';
import { generateJson } from '@/lib/ai/gemini.server';
import { buildPlanPrompt, parsePlanJson, type CandidateVideo } from '@/lib/planner/plan';
import { MEAL_SLOTS, type MealSlot } from '@/lib/planner/week';
import { createAdminClient } from '@/lib/supabase/admin';
import { saveCatalogRecipes } from '@/lib/recipes/catalog.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PHASES = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal'];
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const cleanList = (v: unknown, max: number, limit: number) =>
  (Array.isArray(v) ? v : []).map((i) => clean(i, max)).filter(Boolean).slice(0, limit);

/**
 * Returns a suggested week (meals and/or workouts). The plan itself is saved by the client under the user's session.
 * The full recipes the AI writes for the meals are added to the shared catalog (deduplicated) so they can be reused without the AI.
 */
export async function POST(request: Request) {
  const auth = await requireAiUser();
  if (auth.response) return auth.response;
  if (!process.env.GEMINI_API_KEY) return missingKey('GEMINI_API_KEY');

  const body = await request.json().catch(() => null);
  const language = body?.language === 'en' ? 'en' : 'es';
  const phase = PHASES.includes(body?.phase) ? body.phase : 'Follicular';
  const includeMeals = body?.includeMeals !== false;
  const includeWorkouts = body?.includeWorkouts !== false;
  if (!includeMeals && !includeWorkouts) {
    return NextResponse.json({ error: 'Nothing to generate' }, { status: 400 });
  }

  const onlySlots = (Array.isArray(body?.onlySlots) ? body.onlySlots : [])
    .filter((o: any) => Number.isInteger(o?.day) && o.day >= 0 && o.day <= 6 && MEAL_SLOTS.includes(o?.slot))
    .slice(0, 28) as { day: number; slot: MealSlot }[];
  try {
    let videos: CandidateVideo[] = [];
    if (includeWorkouts) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('workout_videos')
        .select('id, title, category, duration_minutes, intensity, phases')
        .or(`phases.cs.{${phase.toLowerCase()}},phases.cs.{any}`)
        .limit(80);
      if (error) throw error;
      videos = (data ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        category: v.category,
        durationMinutes: v.duration_minutes,
        intensity: v.intensity,
      }));
    }

    const text = await generateJson(
      buildPlanPrompt({
        language,
        phase,
        pantry: cleanList(body?.pantry, 50, 60),
        dietary: cleanList(body?.dietary, 40, 10),
        includeMeals,
        includeWorkouts,
        videos,
        avoid: cleanList(body?.avoid, 40, 40),
        onlySlots: onlySlots.length ? onlySlots : undefined,
      }),
    );
    const plan = parsePlanJson(text, new Set(videos.map((v) => v.id)), language, onlySlots.length ? onlySlots : undefined);
    if (plan.meals.length === 0 && plan.workouts.length === 0) {
      return NextResponse.json({ error: 'The AI did not return a valid plan. Try again.' }, { status: 502 });
    }
    let savedRecipes = 0;
    const recipes = plan.meals.flatMap((m) => (m.recipe ? [m.recipe] : []));
    if (recipes.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const result = await saveCatalogRecipes(createAdminClient(), recipes, 'gemini');
        savedRecipes = result.saved.length;
      } catch (err) {
        // The plan is still useful if the catalog write fails.
        console.error('Saving planner recipes failed:', err);
      }
    }
    return NextResponse.json({
      meals: plan.meals.map(({ recipe: _recipe, ...meal }) => meal),
      workouts: plan.workouts,
      savedRecipes,
    });
  } catch (error: any) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: 'Plan generation failed' }, { status: 502 });
  }
}
