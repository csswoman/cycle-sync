import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://exercisedb.p.rapidapi.com';

/**
 * Proxy for ExerciseDB (RapidAPI).
 *   /api/exercises?limit=20
 *   /api/exercises?bodyPart=chest&limit=15
 *   /api/exercises?name=squat&limit=10
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return missingKey('RAPIDAPI_KEY');

  const search = new URL(request.url).searchParams;
  const limit = String(Math.min(Number(search.get('limit')) || 20, 50));
  const bodyPart = search.get('bodyPart');
  const name = search.get('name');

  let path = '/exercises';
  if (bodyPart) path = `/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
  else if (name) path = `/exercises/name/${encodeURIComponent(name)}`;

  const response = await fetch(`${BASE_URL}${path}?limit=${limit}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
