'use client';

import React, { useState, useMemo } from 'react';
import {
  FOOD_DATABASE,
  FoodItem,
  FoodCategory,
  CATEGORY_LABELS,
} from '@/data/nutritionFoods';
import {
  calculatePlateTotals,
  calculateNutritionTargets,
  buildProteinMealPlan,
  evaluatePlateProtein,
  fitPlateProtein,
  PlateIngredient,
  NutritionTargets,
  ProteinMealPlan,
} from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import type { NewRecipe, LibraryRecipe } from '@/types/recipes';

interface PlateBuilderProps {
  weightKg: number;
  /** Height in cm, optional; adjusts targets for larger bodies. */
  heightCm?: number;
  onSaveAsRecipe?: (recipe: NewRecipe) => Promise<void>;
  language?: 'es' | 'en';
  /** Recipes from the catalog suggested as a starting point. */
  suggestedRecipes?: LibraryRecipe[];
  onOpenRecipe?: (recipe: LibraryRecipe) => void;
  /** Daily protein split into meals; the plate is rated as one of those meals. */
  mealPlan?: ProteinMealPlan;
}

export const PlateBuilder: React.FC<PlateBuilderProps> = ({
  weightKg,
  heightCm,
  onSaveAsRecipe,
  language = 'es',
  suggestedRecipes = [],
  onOpenRecipe,
  mealPlan,
}) => {
  const { hideNumbers } = useDisplayPrefs();
  const [plate, setPlate] = useState<PlateIngredient[]>([
    { food: FOOD_DATABASE.find((f) => f.id === 'pechuga-pollo')!, grams: 120 },
    { food: FOOD_DATABASE.find((f) => f.id === 'arroz-blanco')!, grams: 100 },
    { food: FOOD_DATABASE.find((f) => f.id === 'brocoli-cocido')!, grams: 100 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const targets: NutritionTargets = useMemo(
    () => calculateNutritionTargets(weightKg, heightCm),
    [weightKg, heightCm]
  );

  const plateTotals = useMemo(
    () => calculatePlateTotals(plate, targets),
    [plate, targets]
  );

  const plan: ProteinMealPlan = useMemo(
    () => mealPlan ?? buildProteinMealPlan(targets, 4),
    [mealPlan, targets]
  );
  const verdict = evaluatePlateProtein(plateTotals.protein, plan);
  const hasProteinFood = plate.some((i) => i.food.category === 'proteins');
  const canFit = hasProteinFood && Math.abs(plateTotals.protein - plan.perMealGrams) >= 3;
  const handleFitToMeal = () => setPlate((prev) => fitPlateProtein(prev, plan.perMealGrams));
  // Bar scale: the high threshold sits at 100%.
  const barMax = Math.max(plan.highThresholdGrams, 1);
  const pct = (g: number) => Math.min(100, Math.round((g / barMax) * 100));

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return FOOD_DATABASE.filter((food) => {
      const matchesCategory =
        selectedCategory === 'all' || food.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        food.name.toLowerCase().includes(q) ||
        (food.highlight && food.highlight.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddFood = (food: FoodItem) => {
    setPlate((prev) => {
      const existing = prev.find((item) => item.food.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.food.id === food.id
            ? { ...item, grams: item.grams + food.defaultServingGrams }
            : item
        );
      }
      return [...prev, { food, grams: food.defaultServingGrams }];
    });
  };

  const handleRemoveFood = (foodId: string) => {
    setPlate((prev) => prev.filter((item) => item.food.id !== foodId));
  };

  const handleUpdateGrams = (foodId: string, grams: number) => {
    const safeGrams = Math.max(0, Math.min(1000, grams));
    if (safeGrams === 0) {
      handleRemoveFood(foodId);
    } else {
      setPlate((prev) =>
        prev.map((item) =>
          item.food.id === foodId ? { ...item, grams: safeGrams } : item
        )
      );
    }
  };

  const handleClearPlate = () => {
    setPlate([]);
  };

  const handleSaveToRecipes = async () => {
    if (plate.length === 0 || !onSaveAsRecipe) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const title = hideNumbers ? 'Mi plato' : `Plato Alto en Proteína (${plateTotals.protein}g P · ${plateTotals.calories} kcal)`;
      const ingredients = plate.map((item) =>
        hideNumbers
          ? `${item.grams}g de ${item.food.name}`
          : `${item.grams}g de ${item.food.name} (~${Math.round((item.food.protein * item.grams) / 100)}g proteína, ${Math.round((item.food.calories * item.grams) / 100)} kcal)`
      );
      const steps = [
        'Pesar y cocinar cada alimento según el método preferido (plancha, horno o vapor).',
        'Emplatar combinando la fuente principal de proteína con los carbohidratos y vegetales seleccionados.',
        hideNumbers
          ? 'Disfrutar este plato con calma.'
          : `Disfrutar este plato que aporta ${plateTotals.protein}g de proteína y ${plateTotals.calories} kcal. Deja unas ${plan.spacingHours} horas antes de tu siguiente comida con proteína.`,
      ];

      await onSaveAsRecipe({
        title,
        description: hideNumbers
          ? 'Plato armado con el constructor de platos.'
          : `Plato con buena proteína para tu músculo y tu glucosa. Aporta ${plateTotals.protein}g de proteína (${plateTotals.proteinPercentOfDaily}% de tu meta diaria; la meta por comida es ${plan.perMealRange[0]}-${plan.perMealRange[1]}g).`,
        language: 'es',
        readyInMinutes: 20,
        servings: 1,
        ingredients,
        steps,
        nutrition: {
          calories: plateTotals.calories,
          protein: plateTotals.protein,
          carbohydrates: plateTotals.carbohydrates,
          fat: plateTotals.fat,
        },
        tags: hideNumbers || verdict.status === 'low' ? ['Constructor de Platos'] : ['Alto en Proteína', 'Constructor de Platos'],
      });

      setSaveSuccessMsg('¡Plato guardado con éxito en tus Recetas!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch {
      setSaveSuccessMsg('Error al guardar la receta. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const categories: (FoodCategory | 'all')[] = [
    'all',
    'proteins',
    'carbohydrates',
    'vegetables',
    'fruits',
    'healthy_fats',
    'dairy_alternatives',
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Ideas desde las recetas */}
      {suggestedRecipes.length > 0 && onOpenRecipe && (
        <section aria-labelledby="plate-presets" className="flex flex-col gap-3">
          <h3 id="plate-presets" className="text-foreground text-lg font-semibold text-balance">
            Empieza con una idea
          </h3>
          <ul className="flex gap-3 overflow-x-auto scroll-rail snap-x snap-mandatory pb-3 -mx-1 px-1">
            {suggestedRecipes.map((r) => (
              <li key={r.id} className="snap-start shrink-0 w-72">
                <button
                  type="button"
                  onClick={() => onOpenRecipe(r)}
                  className="w-full h-full text-left bg-card hover:bg-accent/60 border border-border hover:border-primary/50 rounded-2xl p-2.5 pr-4 transition-colors flex items-center gap-3 group"
                >
                  <div className="size-16 shrink-0 rounded-xl overflow-hidden garden-wash wash-leaf">
                    {r.imageUrl && <img src={r.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {[r.readyInMinutes ? `${r.readyInMinutes} min` : null, !hideNumbers && r.nutrition?.protein != null ? `${Math.round(r.nutrition.protein)} g proteína` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tu plato (sticky on desktop) */}
        <section aria-labelledby="plate-current" className="lg:col-span-5 lg:sticky lg:top-4">
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="plate-current" className="font-semibold text-foreground text-lg text-balance">Tu plato</h3>
                <p className="text-sm text-muted-foreground">
                  {plate.length === 0
                    ? 'Agrega alimentos del catálogo.'
                    : `${plate.length} ${plate.length === 1 ? 'alimento' : 'alimentos'}, ${plateTotals.totalWeightGrams} g en total`}
                </p>
              </div>
              {plate.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPlate}
                  className="min-h-10 px-3 rounded-full text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                >
                  Vaciar
                </button>
              )}
            </div>

            {!hideNumbers && plate.length > 0 && (
              <div className="flex flex-col gap-4">
                <dl className="grid grid-cols-4 divide-x divide-border rounded-2xl bg-secondary/60 py-3">
                  {[
                    { label: 'kcal', value: plateTotals.calories, strong: false },
                    { label: 'Proteína', value: `${plateTotals.protein} g`, strong: true },
                    { label: 'Carbos', value: `${plateTotals.carbohydrates} g`, strong: false },
                    { label: 'Grasas', value: `${plateTotals.fat} g`, strong: false },
                  ].map((m) => (
                    <div key={m.label} className="px-2 text-center">
                      <dd className={`text-lg font-semibold tabular-nums ${m.strong ? 'text-primary' : 'text-foreground'}`}>{m.value}</dd>
                      <dt className="text-sm text-muted-foreground">{m.label}</dt>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline gap-3 text-sm">
                    <span className="text-foreground">
                      Proteína para una comida, meta {plan.perMealRange[0]} a {plan.perMealRange[1]} g
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">{plateTotals.protein} g</span>
                  </div>
                  <div
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={barMax}
                    aria-valuenow={Math.min(barMax, plateTotals.protein)}
                    aria-label="Proteína de este plato frente a la meta de una comida"
                    className="relative w-full h-2.5 bg-background rounded-full overflow-hidden border border-border/50"
                  >
                    {/* Target band */}
                    <div
                      aria-hidden
                      className="absolute inset-y-0 bg-leaf-soft"
                      style={{ left: `${pct(plan.perMealRange[0])}%`, width: `${pct(plan.perMealRange[1]) - pct(plan.perMealRange[0])}%` }}
                    />
                    <div
                      className={`relative h-full transition-[width] duration-300 rounded-full ${verdict.status === 'high' ? 'bg-sun' : 'bg-garden'}`}
                      style={{ width: `${pct(plateTotals.protein)}%` }}
                    />
                  </div>
                  <p role="status" className="text-sm text-muted-foreground text-pretty">
                    {verdict.status === 'low' && (
                      <>Te faltan unos <strong className="text-foreground">{verdict.missingGrams} g</strong> de proteína para que esta comida active bien tu músculo.</>
                    )}
                    {verdict.status === 'good' && (
                      <>Buena cantidad para una comida. Repite algo parecido cada {plan.spacingHours} horas, {plan.mealsPerDay} veces al día, y llegas a tus {targets.proteinGrams} g.</>
                    )}
                    {verdict.status === 'high' && (
                      <>Este plato equivale a unas <strong className="text-foreground">{verdict.mealsCovered} comidas</strong> de proteína. No se desperdicia, pero tu músculo aprovecha más si pasas parte a otra comida del día.</>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {plateTotals.proteinPercentOfDaily ?? 0}% de tu meta diaria de {targets.proteinGrams} g.
                  </p>
                  {canFit && (
                    <button
                      type="button"
                      onClick={handleFitToMeal}
                      className="self-start inline-flex items-center gap-2 min-h-10 px-4 rounded-full bg-secondary hover:bg-accent text-sm font-medium text-foreground transition-colors"
                    >
                      <Icon name="auto_fix_high" size={16} weight="bold" />
                      Ajustar proteína a {plan.perMealGrams} g
                    </button>
                  )}
                </div>
              </div>
            )}

            {hideNumbers && plate.length > 0 && (
              <p className="text-sm text-muted-foreground text-pretty">
                {!hasProteinFood
                  ? 'Agrega una fuente de proteína del tamaño de tu palma para que este plato te sostenga.'
                  : `Una porción de proteína como la de este plato, ${plan.mealsPerDay} veces al día, rinde más que juntarla en una sola comida.`}
              </p>
            )}

            {plate.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <Icon name="bowl_food" size={40} weight="duotone" className="text-muted-foreground/50" />
                <p className="text-base text-foreground">Tu plato está vacío</p>
                <p className="text-sm text-muted-foreground max-w-xs text-pretty">
                  {hideNumbers
                    ? 'Elige alimentos del catálogo para armar tu plato.'
                    : 'Elige alimentos del catálogo para ver sus calorías y su proteína.'}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border border-y border-border max-h-[340px] overflow-y-auto scroll-hover">
                {plate.map((item) => {
                  const factor = item.grams / 100;
                  const itemCals = Math.round(item.food.calories * factor);
                  const itemProt = (item.food.protein * factor).toFixed(1);
                  const stepBtn = 'size-10 shrink-0 rounded-full bg-secondary hover:bg-accent text-foreground inline-flex items-center justify-center transition-colors';

                  return (
                    <li key={item.food.id} className="py-3 flex items-center gap-3">
                      {item.food.imageUrl && (
                        <div className="size-11 shrink-0 rounded-xl overflow-hidden bg-secondary/80 border border-border/60">
                          <img
                            src={item.food.imageUrl}
                            alt={item.food.name}
                            loading="lazy"
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground block text-balance">{item.food.name}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {hideNumbers ? `${item.grams} g` : <>{itemCals} kcal, <span className="text-primary font-medium">{itemProt} g proteína</span></>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateGrams(item.food.id, item.grams - 25)}
                          aria-label={`Quitar 25 g de ${item.food.name}`}
                          className={stepBtn}
                        >
                          <Icon name="remove" size={16} weight="bold" />
                        </button>
                        <label className="flex items-baseline gap-0.5 min-w-[3.75rem] justify-center">
                          <span className="sr-only">Gramos de {item.food.name}</span>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            step="5"
                            value={item.grams}
                            onChange={(e) => handleUpdateGrams(item.food.id, parseInt(e.target.value) || 0)}
                            className="w-11 text-center text-sm font-semibold tabular-nums bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          />
                          <span className="text-sm text-muted-foreground">g</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleUpdateGrams(item.food.id, item.grams + 25)}
                          aria-label={`Añadir 25 g de ${item.food.name}`}
                          className={stepBtn}
                        >
                          <Icon name="add" size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFood(item.food.id)}
                          aria-label={`Eliminar ${item.food.name}`}
                          className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary inline-flex items-center justify-center transition-colors"
                        >
                          <Icon name="close" size={16} weight="bold" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {onSaveAsRecipe && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={plate.length === 0 || isSaving}
                  onClick={handleSaveToRecipes}
                  className="w-full min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <Icon name="floppy_disk" size={18} weight="bold" />
                  {isSaving ? 'Guardando...' : 'Guardar como receta'}
                </button>
                {saveSuccessMsg && (
                  <p role="status" className="text-sm text-center font-medium text-leaf">{saveSuccessMsg}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Catálogo */}
        <section aria-labelledby="plate-catalog" className="lg:col-span-7">
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h3 id="plate-catalog" className="font-semibold text-foreground text-lg text-balance">Catálogo de alimentos</h3>
              <p className="text-sm text-muted-foreground">
                {hideNumbers ? 'Toca un alimento para sumarlo a tu plato.' : 'Valores por cada 100 g. Toca un alimento para sumarlo a tu plato.'}
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Icon name="search" size={18} weight="bold" />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar alimento"
                placeholder="Buscar alimento, por ejemplo pollo o avena"
                className="w-full pl-11 pr-11 min-h-11 bg-background border border-border rounded-full text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Borrar búsqueda"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-10 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Icon name="close" size={16} weight="bold" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1" role="group" aria-label="Categorías">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label = cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat][language === 'en' ? 'en' : 'es'];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isSelected}
                    className={`shrink-0 px-4 min-h-10 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredFoods.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground text-base">No hay alimentos con ese término.</p>
            ) : (
              <ul className="divide-y divide-border border-y border-border max-h-[620px] overflow-y-auto scroll-hover">
                {filteredFoods.map((food) => {
                  const inPlate = plate.find((p) => p.food.id === food.id);
                  return (
                    <li key={food.id} className="py-3 flex items-center gap-3">
                      {food.imageUrl && (
                        <div className="size-14 shrink-0 rounded-2xl overflow-hidden bg-secondary/80 border border-border/60">
                          <img
                            src={food.imageUrl}
                            alt={food.name}
                            loading="lazy"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm text-balance">{food.name}</h4>
                        {food.highlight && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{food.highlight}</p>
                        )}
                        {!hideNumbers && (
                          <p className="text-sm text-muted-foreground tabular-nums">
                            {food.calories} kcal · <span className="text-primary font-medium">{food.protein} g proteína</span> · {food.carbohydrates} g carbos · {food.fat} g grasa
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddFood(food)}
                        aria-label={inPlate ? `Añadir ${food.defaultServingGrams} g más de ${food.name}` : `Agregar ${food.name} al plato`}
                        className={`shrink-0 min-h-10 px-4 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                          inPlate
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-secondary text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon name={inPlate ? 'check' : 'add'} size={16} weight="bold" />
                        {inPlate ? `${inPlate.grams} g` : `${food.defaultServingGrams} g`}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
