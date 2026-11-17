'use client';

import React, { useMemo, useState } from 'react';
import type { NutritionTargets, ProteinMealPlan } from '@/lib/nutrition/targets';
import {
  proteinEquivalents,
  waterSchedule,
  PROTEIN_MEAL_IDEAS,
  PROTEIN_TRICKS,
  WATER_TRICKS,
  type IdeaGroup,
} from '@/lib/nutrition/proteinWaterIdeas';
import { Icon } from '@/components/ui/Icon';
import { getFoodImageUrl } from '@/data/nutritionFoods';
import type { FoodItem } from '@/data/nutritionFoods';
import type { LibraryRecipe } from '@/types/recipes';

interface ProteinWaterIdeasProps {
  targets: NutritionTargets;
  plan: ProteinMealPlan;
  hideNumbers?: boolean;
  /** Recipes from the catalog; the ones with the most protein are shown with their photo. */
  recipes?: LibraryRecipe[];
  onOpenRecipe?: (recipe: LibraryRecipe) => void;
}

type Tab = 'protein' | 'water';

/** Food photo from /public/foods; falls back to a leaf-tinted tile when the file is missing. */
const FoodThumb: React.FC<{ food: FoodItem; className?: string }> = ({ food, className = 'size-12' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${className} shrink-0 rounded-xl overflow-hidden garden-wash wash-leaf`}>
      {!failed && (
        <img src={getFoodImageUrl(food)} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      )}
    </div>
  );
};

const IdeaList: React.FC<{ group: IdeaGroup }> = ({ group }) => (
  <div className="flex flex-col gap-2">
    <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
      <Icon name={group.icon} size={18} weight="duotone" className="text-leaf shrink-0" />
      {group.title}
    </h4>
    <ul className="flex flex-col gap-1.5">
      {group.items.map((item) => (
        <li key={item} className="text-sm text-muted-foreground leading-relaxed text-pretty pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2.5 before:size-1.5 before:rounded-full before:bg-leaf/60">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

/** Friendly ideas to reach the protein and water targets without getting bored. */
export const ProteinWaterIdeas: React.FC<ProteinWaterIdeasProps> = ({ targets, plan, hideNumbers = false, recipes = [], onOpenRecipe }) => {
  const [tab, setTab] = useState<Tab>('protein');
  const [showAllEquivalents, setShowAllEquivalents] = useState(false);
  const equivalents = useMemo(() => proteinEquivalents(plan.perMealGrams), [plan.perMealGrams]);
  const water = useMemo(() => waterSchedule(plan, targets.waterGlasses), [plan, targets.waterGlasses]);
  const shownEquivalents = showAllEquivalents ? equivalents : equivalents.slice(0, 6);
  // Catalog recipes with the most protein per serving, only ones with a photo.
  const proteinRecipes = useMemo(
    () => recipes
      .filter((r) => r.imageUrl && (r.nutrition?.protein ?? 0) > 0)
      .sort((a, b) => (b.nutrition?.protein ?? 0) - (a.nutrition?.protein ?? 0))
      .slice(0, 6),
    [recipes]
  );

  return (
    <section aria-labelledby="ideas-title" className="w-full bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-prose">
          <h3 id="ideas-title" className="text-foreground text-lg font-semibold text-balance">Ideas para llegar sin aburrirte</h3>
          <p className="text-muted-foreground text-sm text-pretty">
            Llegar a tu proteína y a tu agua es más fácil con variedad y con hábitos pequeños que con fuerza de voluntad.
          </p>
        </div>
        <div role="tablist" aria-label="Tipo de ideas" className="flex gap-1 bg-secondary/80 p-1 rounded-full border border-border self-start shrink-0">
          {([
            { id: 'protein', label: 'Proteína', icon: 'bowl_food' },
            { id: 'water', label: 'Agua', icon: 'drop' },
          ] as { id: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 px-4 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={t.icon} size={16} weight={tab === t.id ? 'bold' : 'duotone'} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'protein' && (
        <div role="tabpanel" className="flex flex-col gap-6">
          {!hideNumbers && equivalents.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">
                Una comida de {plan.perMealGrams} g de proteína puede ser…
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {shownEquivalents.map((e) => (
                  <li key={e.food.id} className="rounded-2xl bg-secondary/60 p-2 pr-4 flex items-center gap-3">
                    <FoodThumb food={e.food} />
                    <span className="flex-1 min-w-0 text-sm text-foreground font-medium text-balance">{e.food.name}</span>
                    <span className="text-sm text-primary font-semibold tabular-nums shrink-0">{e.grams} g</span>
                  </li>
                ))}
              </ul>
              {equivalents.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllEquivalents((v) => !v)}
                  aria-expanded={showAllEquivalents}
                  className="self-start min-h-10 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  {showAllEquivalents ? 'Ver menos' : `Ver ${equivalents.length - 6} más`}
                </button>
              )}
              <p className="text-sm text-muted-foreground text-pretty">
                También puedes combinar: medio plato de una y medio de otra, por ejemplo huevo con yogur griego, o lentejas con pollo. Las legumbres suman, pero solas necesitan porciones grandes.
              </p>
            </div>
          )}

          {proteinRecipes.length > 0 && onOpenRecipe && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">Recetas de tu catálogo con más proteína</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {proteinRecipes.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenRecipe(r)}
                      className="w-full h-full text-left flex items-center gap-3 rounded-2xl border border-border bg-background hover:border-primary/50 transition-colors p-2 pr-3 group"
                    >
                      <div className="size-16 shrink-0 rounded-xl overflow-hidden garden-wash wash-leaf">
                        <img src={r.imageUrl as string} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {[!hideNumbers && r.nutrition?.protein != null ? `${Math.round(r.nutrition.protein)} g proteína` : null, r.readyInMinutes ? `${r.readyInMinutes} min` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <details className="group">
            <summary className="flex items-center gap-2 min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
              <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
              Más ideas de comidas sin receta
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
              {PROTEIN_MEAL_IDEAS.map((g) => <IdeaList key={g.title} group={g} />)}
            </div>
          </details>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border">
            {PROTEIN_TRICKS.map((g) => <div key={g.title} className="pt-4"><IdeaList group={g} /></div>)}
          </div>
        </div>
      )}

      {tab === 'water' && (
        <div role="tabpanel" className="flex flex-col gap-6">
          {water.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">
                {hideNumbers ? 'Reparte el agua junto a tus comidas' : `Tus ${targets.waterGlasses} vasos repartidos en el día`}
              </h4>
              <ol className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                {water.map((w) => (
                  <li key={w.time + w.label} className="shrink-0 min-w-[9rem] rounded-2xl bg-secondary/60 px-4 py-3 flex flex-col gap-0.5">
                    <span className="text-sm text-muted-foreground tabular-nums">{w.time}</span>
                    <span className="text-sm font-medium text-foreground">{w.label}</span>
                    {!hideNumbers && (
                      <span className="text-sm text-primary font-semibold tabular-nums">
                        {w.glasses} {w.glasses === 1 ? 'vaso' : 'vasos'}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {!hideNumbers && targets.usesAdjustedWeight && (
                <p className="text-sm text-muted-foreground text-pretty">
                  Tu meta de agua sube con tu peso, pero no al mismo ritmo: la calculamos sobre {targets.adjustedWeightKg} kg para que sea realista.
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WATER_TRICKS.map((g) => <IdeaList key={g.title} group={g} />)}
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            Si tienes una enfermedad del riñón o del corazón, o te indicaron limitar líquidos o proteína, sigue la indicación de tu médico.
          </p>
        </div>
      )}
    </section>
  );
};
