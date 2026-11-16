'use client';

import React, { useState } from 'react';
import type { LibraryRecipe } from '@/types/recipes';
import { TagEditor } from './TagEditor';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';

interface RecipeDetailModalProps {
  recipe: LibraryRecipe;
  onClose: () => void;
  onToggleFavorite: (recipe: LibraryRecipe) => void;
  onSetTags: (recipe: LibraryRecipe, tags: string[]) => void;
  /** Only passed for recipes the user created. */
  onDelete?: (recipe: LibraryRecipe) => Promise<void>;
  suggestions: string[];
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onToggleFavorite,
  onSetTags,
  onDelete,
  suggestions,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { hideNumbers } = useDisplayPrefs();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-56 object-cover rounded-t-2xl" />}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-black text-foreground leading-tight">{recipe.title}</h2>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavorite(recipe)}
                className={`p-2 rounded-full border border-border transition-colors ${recipe.isFavorite ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-primary'}`}
                aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={recipe.isFavorite}
              >
                <span
                  className="material-symbols-outlined text-[20px] block"
                  style={{ fontVariationSettings: `'FILL' ${recipe.isFavorite ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px] block">close</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {recipe.readyInMinutes ? <span>{recipe.readyInMinutes} min</span> : null}
            {recipe.servings ? <span>{recipe.servings} servings</span> : null}
          </div>
          {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}

          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium">{tag}</span>
                ))}
              </div>
            )}
            <TagEditor tags={recipe.myTags} onChange={(tags) => onSetTags(recipe, tags)} suggestions={suggestions} />
          </div>

          {recipe.ingredients.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Ingredients</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}
          {recipe.steps.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instructions</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {recipe.nutrition && !hideNumbers && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nutrition (per serving)</h3>
              <p className="text-sm text-foreground">
                {[
                  recipe.nutrition.calories != null && `${Math.round(recipe.nutrition.calories)} kcal`,
                  recipe.nutrition.protein != null && `${Math.round(recipe.nutrition.protein)}g protein`,
                  recipe.nutrition.carbohydrates != null && `${Math.round(recipe.nutrition.carbohydrates)}g carbs`,
                  recipe.nutrition.fat != null && `${Math.round(recipe.nutrition.fat)}g fat`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )}

          {onDelete && (
          <div className="pt-2 border-t border-border flex justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Delete this recipe?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(recipe);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-white font-bold"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-foreground">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span> Delete
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
