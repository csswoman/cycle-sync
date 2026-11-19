'use client';

import React from 'react';
import type { LibraryRecipe } from '@/types/recipes';
import { tagKey, tagLabel } from '@/lib/nutrition/recipeTags';
import { useLanguage } from '@/i18n/LanguageContext';

interface RecipeCardProps {
  recipe: LibraryRecipe;
  /** Left out in read-only (guest) mode, which hides the favorite button. */
  onToggleFavorite?: (recipe: LibraryRecipe) => void;
  onOpen: (recipe: LibraryRecipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe: r, onToggleFavorite, onOpen }) => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const allTags = Array.from(new Map([...r.tags, ...r.myTags].map((t) => [tagKey(t), tagLabel(t)])).values());
  const tags = allTags.slice(0, 3);
  const hiddenTags = allTags.length - tags.length;
  return (
    <article
      onClick={() => onOpen(r)}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-40 w-full overflow-hidden garden-wash wash-leaf pattern-leaves">
        {r.readyInMinutes ? (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span> {r.readyInMinutes}m
          </div>
        ) : null}
        {r.ownerId && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">{isEs ? 'Mía' : 'Mine'}</div>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(r);
            }}
            className={`absolute bottom-3 right-3 z-10 h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${r.isFavorite ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white hover:bg-black/80'}`}
            aria-label={r.isFavorite ? (isEs ? 'Quitar de favoritos' : 'Remove from favorites') : (isEs ? 'Añadir a favoritos' : 'Add to favorites')}
            aria-pressed={r.isFavorite}
          >
            <span
              className="material-symbols-outlined text-[20px] leading-none"
              style={{ fontVariationSettings: `'FILL' ${r.isFavorite ? 1 : 0}` }}
            >
              favorite
            </span>
          </button>
        )}
        {r.imageUrl ? (
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={r.imageUrl} alt={r.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/40">
            <span className="material-symbols-outlined text-6xl">restaurant</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-semibold leading-snug text-foreground text-balance group-hover:text-primary transition-colors">{r.title}</h3>
        {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
        {r.nutrition && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {r.nutrition.calories != null && (
              <span className="text-foreground bg-secondary px-2 py-1 rounded-md">
                {Math.round(r.nutrition.calories)} kcal
              </span>
            )}
            {r.nutrition.protein != null && (
              <span className="text-primary bg-primary/10 px-2 py-1 rounded-md">
                {Math.round(r.nutrition.protein)}g {isEs ? 'proteína' : 'protein'}
              </span>
            )}
            {r.nutrition.carbohydrates != null && (
              <span className="text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
                {Math.round(r.nutrition.carbohydrates)}g {isEs ? 'carbohidratos' : 'carbs'}
              </span>
            )}
          </div>
        )}
        {tags.length > 0 && (
          <div className="mt-auto pt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full border border-border text-muted-foreground text-xs font-medium">{tag}</span>
            ))}
            {hiddenTags > 0 && <span className="px-1 py-1 text-xs text-muted-foreground">+{hiddenTags}</span>}
          </div>
        )}
      </div>
    </article>
  );
};
