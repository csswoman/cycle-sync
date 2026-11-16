'use client';

import React from 'react';
import type { LibraryRecipe } from '@/types/recipes';

interface RecipeCardProps {
  recipe: LibraryRecipe;
  onToggleFavorite: (recipe: LibraryRecipe) => void;
  onOpen: (recipe: LibraryRecipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe: r, onToggleFavorite, onOpen }) => {
  const tags = Array.from(new Set([...r.tags, ...r.myTags]));
  return (
    <article
      onClick={() => onOpen(r)}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-blossom-soft/60 to-secondary">
        {r.readyInMinutes ? (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span> {r.readyInMinutes}m
          </div>
        ) : null}
        {r.ownerId && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">Mine</div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(r);
          }}
          className={`absolute bottom-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-colors ${r.isFavorite ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white hover:bg-black/80'}`}
          aria-label={r.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={r.isFavorite}
        >
          <span
            className="material-symbols-outlined text-[18px] block"
            style={{ fontVariationSettings: `'FILL' ${r.isFavorite ? 1 : 0}` }}
          >
            favorite
          </span>
        </button>
        {r.imageUrl ? (
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={r.imageUrl} alt={r.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/40">
            <span className="material-symbols-outlined text-6xl">restaurant</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">{r.title}</h3>
        {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
        {tags.length > 0 && (
          <div className="mt-auto pt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
