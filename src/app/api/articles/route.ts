import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';

export const dynamic = 'force-dynamic';

/** Proxy for NewsAPI /everything: /api/articles?q=...&language=es&sortBy=relevancy */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return missingKey('NEWSAPI_KEY');

  const search = new URL(request.url).searchParams;
  const q = search.get('q');
  if (!q) {
    return NextResponse.json({ status: 'error', message: 'q is required' }, { status: 400 });
  }

  const params = new URLSearchParams({
    q,
    language: search.get('language') === 'es' ? 'es' : 'en',
    sortBy: search.get('sortBy') === 'relevancy' ? 'relevancy' : 'publishedAt',
    pageSize: '10',
    apiKey,
  });

  const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
