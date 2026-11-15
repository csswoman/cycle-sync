import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';

export const dynamic = 'force-dynamic';

const ALLOWED_PARAMS = ['query', 'cuisine', 'diet', 'intolerances', 'type', 'maxReadyTime', 'number'];

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return missingKey('SPOONACULAR_API_KEY');

  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams({
    apiKey,
    addRecipeInformation: 'true',
    fillIngredients: 'true',
  });
  for (const key of ALLOWED_PARAMS) {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  }

  const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
