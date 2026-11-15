import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return missingKey('SPOONACULAR_API_KEY');

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }

  const query = new URLSearchParams({ apiKey, includeNutrition: 'true' });
  const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?${query}`);
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
