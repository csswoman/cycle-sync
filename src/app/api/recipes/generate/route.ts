import { NextResponse } from 'next/server';
import { requireAiUser, missingKey } from '@/lib/api/requireUser';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateJson } from '@/lib/ai/gemini.server';
import { buildGeneratePrompt } from '@/lib/recipes/prompts';
import { parseRecipesJson } from '@/lib/recipes/sanitize';
import { FOOD_FOCUS, toPhaseKey } from '@/lib/cycle/phaseSuggestions';
import { listCatalogTitles, saveCatalogRecipes } from '@/lib/recipes/catalog.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  const auth = await requireAiUser();
  if (auth.response) return auth.response;
  if (!process.env.GEMINI_API_KEY) return missingKey('GEMINI_API_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return missingKey('SUPABASE_SERVICE_ROLE_KEY');

  const body = await request.json().catch(() => null);
  const language = body?.language === 'en' ? 'en' : 'es';
  const ingredients: string[] = (Array.isArray(body?.ingredients) ? body.ingredients : [])
    .map((i: unknown) => clean(i, 50))
    .filter(Boolean)
    .slice(0, 20);
  const dietary: string[] = (Array.isArray(body?.dietary) ? body.dietary : [])
    .map((i: unknown) => clean(i, 40))
    .filter(Boolean)
    .slice(0, 10);
  const names = (v: unknown): string[] =>
    (Array.isArray(v) ? v : []).map((i: unknown) => clean(i, 40)).filter(Boolean).slice(0, 40);
  const likes = names(body?.likes);
  const avoid = names(body?.avoid);
  const phase = clean(body?.phase, 30) || 'Follicular';
  const range: number[] = Array.isArray(body?.proteinPerMeal) ? body.proteinPerMeal.map(Number) : [];
  const proteinPerMeal: [number, number] | undefined =
    range.length === 2 && range.every((n) => Number.isFinite(n) && n >= 10 && n <= 120) && range[0] <= range[1]
      ? [Math.round(range[0]), Math.round(range[1])]
      : undefined;

  const focus = FOOD_FOCUS[toPhaseKey(phase)];
  const phaseFocus = `${focus.nutrients.map((n) => n.en).join(', ')}. ${focus.why.en}`;
  if (ingredients.length === 0) {
    return NextResponse.json({ error: 'ingredients are required' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const existingTitles = await listCatalogTitles(db, language);
    const text = await generateJson(buildGeneratePrompt({ ingredients, phase, dietary, language, existingTitles, likes, avoid, proteinPerMeal, pmos: body?.pmos === true, phaseFocus }));
    const recipes = parseRecipesJson(text, language);
    if (recipes.length === 0) {
      return NextResponse.json({ error: 'The AI did not return valid recipes. Try again.' }, { status: 502 });
    }
    const result = await saveCatalogRecipes(db, recipes, 'gemini');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Recipe generation error:', error);
    return NextResponse.json({ error: 'Recipe generation failed' }, { status: 502 });
  }
}
