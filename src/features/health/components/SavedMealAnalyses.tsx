'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { MealAnalysisResult } from './MealAnalysisResult';
import type { SavedMealAnalysis } from '@/hooks/useMealAnalyses';

interface SavedMealAnalysesProps {
  items: SavedMealAnalysis[];
  isEs: boolean;
  pmos: boolean;
  onRemove: (id: string) => void;
}

const formatWhen = (iso: string, isEs: boolean) =>
  new Date(iso).toLocaleString(isEs ? 'es-MX' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

/** History of saved meal photo analyses; each one opens to show the full result. */
export const SavedMealAnalyses: React.FC<SavedMealAnalysesProps> = ({ items, isEs, pmos, onRemove }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <section aria-labelledby="saved-analyses-title" className="bg-card rounded-xl border border-border p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon name="history" size={20} className="text-primary shrink-0" />
        <h3 id="saved-analyses-title" className="text-foreground text-lg font-semibold text-balance">
          {isEs ? 'Mis análisis guardados' : 'My saved analyses'}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          {isEs
            ? 'Cada foto que analices se guarda aquí para que puedas volver a verla.'
            : 'Every photo you analyze is saved here so you can look at it again.'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const title = item.result?.summary || item.result?.foods.map((f) => f.name).join(', ') || item.raw || '';
            return (
              <li key={item.id}>
                <details className="group py-2">
                  <summary className="flex items-center gap-3 min-h-16 py-1 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="size-14 rounded-lg object-cover shrink-0 bg-secondary" />
                    ) : (
                      <span className="size-14 rounded-lg bg-secondary inline-flex items-center justify-center shrink-0">
                        <Icon name="bowl_food" size={22} className="text-muted-foreground" />
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-muted-foreground">{formatWhen(item.created_at, isEs)}</span>
                      <span className="block text-sm font-medium text-foreground line-clamp-2 text-pretty">{title}</span>
                    </span>
                    {item.result?.score && (
                      <span className="shrink-0 text-sm font-semibold text-foreground bg-secondary rounded-full px-2.5 py-1">
                        {item.result.score.value}/10
                      </span>
                    )}
                    <Icon name="chevron_right" size={18} weight="bold" className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                  </summary>

                  <div className="pt-3 flex flex-col gap-4">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={isEs ? 'Foto del plato analizado' : 'Photo of the analyzed meal'} className="w-full max-w-sm rounded-xl object-cover" />
                    )}
                    {item.result ? (
                      <MealAnalysisResult result={item.result} isEs={isEs} pmos={pmos} />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-line text-pretty">{item.raw}</p>
                    )}
                    {confirmId === item.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-foreground">{isEs ? '¿Borrar este análisis?' : 'Delete this analysis?'}</span>
                        <button
                          type="button"
                          onClick={() => { onRemove(item.id); setConfirmId(null); }}
                          className="min-h-10 px-4 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90"
                        >
                          {isEs ? 'Sí, borrar' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="min-h-10 px-4 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-accent"
                        >
                          {isEs ? 'Cancelar' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(item.id)}
                        className="self-start inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="delete" size={16} /> {isEs ? 'Borrar' : 'Delete'}
                      </button>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
