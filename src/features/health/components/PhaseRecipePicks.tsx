'use client';

import React from 'react';
import type { RecipeMatch } from '@/lib/cycle/phaseSuggestions';

interface PickRecipe {
  id: string;
  title: string;
  imageUrl: string | null;
}

interface Props<R extends PickRecipe> {
  matches: RecipeMatch<R>[];
  onOpen: (recipe: R) => void;
  /** Smaller rows for the dashboard. */
  compact?: boolean;
}

/** Recipes ranked for the current phase, each with the reasons it fits (nutrients/foods). */
export function PhaseRecipePicks<R extends PickRecipe>({ matches, onOpen, compact = false }: Props<R>) {
  return (
    <ul className={compact ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
      {matches.map(({ recipe, reasons }) => (
        <li key={recipe.id}>
          <button
            type="button"
            onClick={() => onOpen(recipe)}
            className="w-full text-left flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-2 pr-3"
          >
            <div className={`${compact ? 'size-11' : 'size-14'} shrink-0 rounded-lg overflow-hidden garden-wash wash-leaf`}>
              {recipe.imageUrl && <img src={recipe.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold leading-snug line-clamp-2">{recipe.title}</p>
              {reasons.length > 0 && (
                <p className="text-xs text-phase truncate">{reasons.join(' · ')}</p>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
