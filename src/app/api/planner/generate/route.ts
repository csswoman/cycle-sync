import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';
import { createClient } from '@/lib/supabase/server';
import { generateJson } from '@/lib/ai/gemini.server';
import { buildPlanPrompt, parsePlanJson, type CandidateVideo } from '@/lib/planner/plan';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PHASES = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal'];
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const cleanList = (v: unknown, max: number, limit: number) =>
  (Array.isArray(v) ? v : []).map((i) => clean(i, max)).filter(Boolean).slice(0, limit);

/** Returns a suggested week (meals and/or workouts). Nothing is saved; the client previews and saves it under the user's own session. */
export async function POST(request: Request) {
  const auth = await requireUser();
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
      }),
    );
    const plan = parsePlanJson(text, new Set(videos.map((v) => v.id)));
    if (plan.meals.length === 0 && plan.workouts.length === 0) {
      return NextResponse.json({ error: 'The AI did not return a valid plan. Try again.' }, { status: 502 });
    }
    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: error?.message || 'Plan generation failed' }, { status: 502 });
  }
}
