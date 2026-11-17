'use client';

import React, { useEffect, useState } from 'react';
import type { LibraryRecipe } from '@/types/recipes';
import { TagEditor } from './TagEditor';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { useLanguage } from '@/i18n/LanguageContext';
import { tagKey, tagLabel } from '@/lib/nutrition/recipeTags';

interface RecipeDetailModalProps {
  recipe: LibraryRecipe;
  onClose: () => void;
  /** Favorite and tag actions are left out in read-only (guest) mode. */
  onToggleFavorite?: (recipe: LibraryRecipe) => void;
  onSetTags?: (recipe: LibraryRecipe, tags: string[]) => void;
  /** Only passed for recipes the user created. */
  onDelete?: (recipe: LibraryRecipe) => Promise<void>;
  suggestions: string[];
}

const Icon: React.FC<{ name: string; className?: string; filled?: boolean }> = ({ name, className = '', filled }) => (
  <span
    aria-hidden="true"
    className={`material-symbols-outlined block ${className}`}
    style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
  >
    {name}
  </span>
);

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
  const { language } = useLanguage();
  const isEs = language === 'es';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tags = Array.from(new Map(recipe.tags.map((t) => [tagKey(t), tagLabel(t)])).values());
  const n = recipe.nutrition;
  const macros = n && !hideNumbers
    ? [
        { label: 'kcal', value: n.calories },
        { label: isEs ? 'Proteína' : 'Protein', value: n.protein, unit: 'g' },
        { label: isEs ? 'Carbohidratos' : 'Carbs', value: n.carbohydrates, unit: 'g' },
        { label: isEs ? 'Grasa' : 'Fat', value: n.fat, unit: 'g' },
      ].filter((m) => m.value != null)
    : [];

  const iconBtn = 'size-11 inline-flex items-center justify-center rounded-full border border-border transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title}
    >
      <div
        className="bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto scroll-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {recipe.imageUrl && <img src={recipe.imageUrl} alt="" className="w-full h-36 sm:h-48 object-cover" />}

        <div className="p-5 sm:p-7 flex flex-col gap-5">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-3 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight text-balance">{recipe.title}</h2>
              <div className="flex flex-wrap gap-2 text-sm text-foreground">
                {recipe.readyInMinutes ? (
                  <span className="inline-flex items-center gap-1.5 px-3 min-h-8 rounded-full bg-secondary">
                    <Icon name="schedule" className="text-[18px]" />
                    {recipe.readyInMinutes} min
                  </span>
                ) : null}
                {recipe.servings ? (
                  <span className="inline-flex items-center gap-1.5 px-3 min-h-8 rounded-full bg-secondary">
                    <Icon name="restaurant" className="text-[18px]" />
                    {recipe.servings} {isEs ? (recipe.servings === 1 ? 'porción' : 'porciones') : recipe.servings === 1 ? 'serving' : 'servings'}
                  </span>
                ) : null}
                {tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="inline-flex items-center px-3 min-h-8 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(recipe)}
                  className={`${iconBtn} ${recipe.isFavorite ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-primary'}`}
                  aria-label={recipe.isFavorite ? (isEs ? 'Quitar de favoritos' : 'Remove from favorites') : (isEs ? 'Añadir a favoritos' : 'Add to favorites')}
                  aria-pressed={recipe.isFavorite}
                >
                  <Icon name="favorite" className="text-[22px]" filled={recipe.isFavorite} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`${iconBtn} bg-secondary text-muted-foreground hover:text-foreground`}
                aria-label={isEs ? 'Cerrar' : 'Close'}
              >
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
          </header>

          {recipe.description && <p className="text-base text-muted-foreground leading-relaxed max-w-prose text-pretty">{recipe.description}</p>}

          {macros.length > 0 && (
            <section aria-label={isEs ? 'Nutrición por porción' : 'Nutrition per serving'}>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
                {macros.map((m) => (
                  <div key={m.label} className="bg-card px-4 py-3">
                    <dd className="text-xl font-semibold text-foreground tabular-nums">{Math.round(m.value as number)}{m.unit ?? ''}</dd>
                    <dt className="text-sm text-muted-foreground">{m.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sm text-muted-foreground">{isEs ? 'Por porción.' : 'Per serving.'}</p>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8">
            {recipe.ingredients.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">{isEs ? 'Ingredientes' : 'Ingredients'}</h3>
                <ul className="divide-y divide-border border-y border-border text-base text-foreground">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="py-2.5">{ing}</li>
                  ))}
                </ul>
              </section>
            )}
            {recipe.steps.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">{isEs ? 'Preparación' : 'Instructions'}</h3>
                <ol className="flex flex-col gap-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="size-8 shrink-0 rounded-full bg-phase-soft text-phase text-sm font-semibold inline-flex items-center justify-center tabular-nums" aria-hidden="true">{i + 1}</span>
                      <p className="text-base text-foreground leading-relaxed pt-0.5 text-pretty">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {onSetTags && (
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{isEs ? 'Mis etiquetas' : 'My tags'}</h3>
              <TagEditor tags={recipe.myTags} onChange={(t) => onSetTags(recipe, t)} suggestions={suggestions} />
            </section>
          )}

          {onDelete && (
            <div className="pt-4 border-t border-border flex justify-end">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{isEs ? '¿Eliminar esta receta?' : 'Delete this recipe?'}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDelete(recipe);
                      onClose();
                    }}
                    className="px-4 min-h-10 rounded-full bg-destructive text-destructive-foreground font-semibold"
                  >
                    {isEs ? 'Eliminar' : 'Delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-4 min-h-10 rounded-full bg-secondary text-foreground">
                    {isEs ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="min-h-10 px-2 text-sm text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="delete" className="text-[18px]" /> {isEs ? 'Eliminar receta' : 'Delete recipe'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
