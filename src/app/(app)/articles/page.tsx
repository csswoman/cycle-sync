'use client';

import { Suspense } from 'react';
import ArticlesCatalog from '@/features/articles/ArticlesCatalog';

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading articles...</div>}>
      <ArticlesCatalog />
    </Suspense>
  );
}
