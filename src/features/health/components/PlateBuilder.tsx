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
  PlateIngredient,
  NutritionTargets,
} from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { NewRecipe } from '@/types/recipes';

interface PlateBuilderProps {
  weightKg: number;
  onSaveAsRecipe?: (recipe: NewRecipe) => Promise<void>;
  language?: 'es' | 'en';
}

const PRESET_PLATES: {
  title: string;
  description: string;
  items: { foodId: string; grams: number }[];
}[] = [
  {
    title: 'Plato Clásico Recomposición',
    description: 'Pechuga magra con arroz, brócoli al vapor y toque de aceite de oliva.',
    items: [
      { foodId: 'pechuga-pollo', grams: 150 },
      { foodId: 'arroz-blanco', grams: 120 },
      { foodId: 'brocoli-cocido', grams: 120 },
      { foodId: 'aceite-oliva', grams: 10 },
    ],
  },
  {
    title: 'Salmón Omega-3 & Batata',
    description: 'Pescado graso antiinflamatorio con carbohidratos lentos y espinacas.',
    items: [
      { foodId: 'salmon-cocinado', grams: 140 },
      { foodId: 'camote-batata', grams: 140 },
      { foodId: 'espinaca-cruda', grams: 80 },
      { foodId: 'aguacate', grams: 40 },
    ],
  },
  {
    title: 'Bowl Proteico Vegetal',
    description: 'Tofu firme con quinoa, garbanzos y semillas de chía.',
    items: [
      { foodId: 'tofu-firme', grams: 140 },
      { foodId: 'quinoa', grams: 120 },
      { foodId: 'garbanzos-cocidos', grams: 100 },
      { foodId: 'semillas-chia', grams: 15 },
    ],
  },
  {
    title: 'Desayuno Proteico con Huevos y Avena',
    description: 'Huevos enteros, claras extras, avena en copos y fresas frescas.',
    items: [
      { foodId: 'huevo-cocido', grams: 100 },
      { foodId: 'claras-huevo', grams: 100 },
      { foodId: 'avena', grams: 40 },
      { foodId: 'fresa', grams: 100 },
    ],
  },
];

export const PlateBuilder: React.FC<PlateBuilderProps> = ({
  weightKg,
  onSaveAsRecipe,
  language = 'es',
}) => {
  const { hideNumbers } = useDisplayPrefs();
  const [plate, setPlate] = useState<PlateIngredient[]>([
    { food: FOOD_DATABASE.find((f) => f.id === 'pechuga-pollo')!, grams: 150 },
    { food: FOOD_DATABASE.find((f) => f.id === 'arroz-blanco')!, grams: 100 },
    { food: FOOD_DATABASE.find((f) => f.id === 'brocoli-cocido')!, grams: 100 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const targets: NutritionTargets = useMemo(
    () => calculateNutritionTargets(weightKg),
    [weightKg]
  );

  const plateTotals = useMemo(
    () => calculatePlateTotals(plate, targets),
    [plate, targets]
  );

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

  const handleApplyPreset = (preset: (typeof PRESET_PLATES)[0]) => {
    const items: PlateIngredient[] = [];
    for (const p of preset.items) {
      const f = FOOD_DATABASE.find((item) => item.id === p.foodId);
      if (f) {
        items.push({ food: f, grams: p.grams });
      }
    }
    setPlate(items);
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
          : `Disfrutar este plato que aporta ${plateTotals.protein}g de proteína y ${plateTotals.calories} kcal ajustadas a tu requerimiento diario.`,
      ];

      await onSaveAsRecipe({
        title,
        description: hideNumbers
          ? 'Plato armado con el constructor de platos.'
          : `Plato con buena proteína para tu músculo y tu glucosa. Aporta ${plateTotals.protein}g de proteína (${plateTotals.proteinPercentOfDaily}% de tu meta diaria).`,
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
        tags: hideNumbers ? ['Constructor de Platos'] : ['Alto en Proteína', 'Constructor de Platos'],
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
    <div className="w-full flex flex-col gap-8">
      {/* ── IDEAS RÁPIDAS (PRESETS) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-foreground text-sm font-bold flex items-center gap-2">
            <Icon name="sparkle" size={16} weight="duotone" className="text-primary" />
            Ideas de Platos Pre-armados (1 click para cargar)
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_PLATES.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left bg-card hover:bg-accent/60 border border-border rounded-xl p-3.5 transition-all flex flex-col justify-between gap-2 shadow-xs group"
            >
              <div>
                <p className="font-bold text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors">
                  {preset.title}
                </p>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                  {preset.description}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 mt-1">
                Usar combinación
                <Icon name="arrow_right" size={12} weight="bold" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2-COLUMN MAIN LAYOUT: ASSEMBLED PLATE (sticky on desktop) + FOOD CATALOG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Assembled Plate */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="bowl_food" size={20} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Tu Plato Actual</h3>
                  <p className="text-xs text-muted-foreground">
                    {plate.length === 0
                      ? 'Agrega alimentos del catálogo'
                      : `${plate.length} alimentos seleccionados (${plateTotals.totalWeightGrams}g total)`}
                  </p>
                </div>
              </div>
              {plate.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPlate}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Macro Totals Summary Box */}
            {!hideNumbers && <div className="bg-secondary/70 rounded-xl p-4 flex flex-col gap-3 border border-border/40">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-card p-2 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Calorías
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {plateTotals.calories}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">kcal</span>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                  <span className="text-[10px] uppercase font-bold text-primary block">
                    Proteína
                  </span>
                  <span className="text-lg font-black text-primary">
                    {plateTotals.protein}g
                  </span>
                  <span className="text-[10px] text-primary/80 block">clave músculo</span>
                </div>
                <div className="bg-card p-2 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Carbos
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {plateTotals.carbohydrates}g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">energía</span>
                </div>
                <div className="bg-card p-2 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Grasas
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {plateTotals.fat}g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">saludables</span>
                </div>
              </div>

              {/* Progress towards daily protein target */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Icon name="barbell" size={14} weight="bold" className="text-primary" />
                    Meta diaria de proteína ({targets.proteinGrams}g):
                  </span>
                  <span className="font-bold text-primary">
                    {plateTotals.proteinPercentOfDaily ?? 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-garden transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, plateTotals.proteinPercentOfDaily ?? 0)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Este plato aporta <strong>{plateTotals.protein}g</strong> de tu objetivo
                  diario de <strong>{targets.proteinGrams}g</strong> para conservar y generar
                  músculo y cuidar tu glucosa, con tu peso ({targets.weightKg} kg).
                </p>
              </div>
            </div>}

            {/* List of ingredients in plate */}
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {plate.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Icon name="bowl_food" size={40} weight="duotone" className="text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Tu plato está vacío.</p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs">
                    {hideNumbers ? 'Selecciona alimentos del catálogo de la derecha para armar tu plato.' : 'Selecciona alimentos del catálogo de la derecha para calcular sus calorías y proteínas en gramos.'}
                  </p>
                </div>
              ) : (
                plate.map((item) => {
                  const factor = item.grams / 100;
                  const itemCals = Math.round(item.food.calories * factor);
                  const itemProt = (item.food.protein * factor).toFixed(1);

                  return (
                    <div
                      key={item.food.id}
                      className="bg-background rounded-xl p-3 border border-border flex flex-col gap-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-foreground block">
                            {item.food.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {hideNumbers ? `${item.grams}g` : <>{itemCals} kcal · <strong className="text-primary font-bold">{itemProt}g prot</strong></>}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFood(item.food.id)}
                          aria-label={`Eliminar ${item.food.name}`}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        >
                          <Icon name="close" size={14} weight="bold" />
                        </button>
                      </div>

                      {/* Grams adjustment */}
                      <div className="flex items-center justify-between gap-2 bg-secondary/50 px-2 py-1.5 rounded-lg border border-border/40">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Cantidad:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateGrams(item.food.id, item.grams - 25)}
                            className="w-6 h-6 rounded bg-card hover:bg-accent text-foreground text-xs font-bold flex items-center justify-center border border-border/50"
                          >
                            -
                          </button>
                          <div className="flex items-baseline gap-0.5">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              step="5"
                              value={item.grams}
                              onChange={(e) =>
                                handleUpdateGrams(
                                  item.food.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center text-xs font-bold bg-transparent text-foreground focus:outline-none"
                            />
                            <span className="text-[10px] text-muted-foreground font-bold">g</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateGrams(item.food.id, item.grams + 25)}
                            className="w-6 h-6 rounded bg-card hover:bg-accent text-foreground text-xs font-bold flex items-center justify-center border border-border/50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Save Plate as Recipe button */}
            {onSaveAsRecipe && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  disabled={plate.length === 0 || isSaving}
                  onClick={handleSaveToRecipes}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-sm"
                >
                  <Icon name="floppy_disk" size={16} weight="bold" />
                  {isSaving ? 'Guardando en recetas...' : 'Guardar plato como receta'}
                </button>
                {saveSuccessMsg && (
                  <p className="text-xs text-center font-semibold text-leaf">
                    {saveSuccessMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Food Database & Search */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                <Icon name="restaurant" size={20} weight="duotone" className="text-primary" />
                {hideNumbers ? 'Catálogo de Alimentos' : 'Catálogo de Alimentos (Calorías & Proteínas)'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Selecciona alimentos para sumar a tu plato. Valores exactos por cada 100 gramos.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Icon name="search" size={18} weight="bold" />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por alimento (ej. pechuga, atún, arroz, aguacate, avena)..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name="close" size={14} weight="bold" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label =
                  cat === 'all'
                    ? 'Todos los alimentos'
                    : CATEGORY_LABELS[cat][language === 'en' ? 'en' : 'es'];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Foods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredFoods.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                  No se encontraron alimentos con ese término.
                </div>
              ) : (
                filteredFoods.map((food) => {
                  const isInPlate = plate.some((p) => p.food.id === food.id);

                  return (
                    <div
                      key={food.id}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                        isInPlate
                          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                          : 'bg-background hover:bg-secondary/40 border-border'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-foreground text-xs sm:text-sm">
                            {food.name}
                          </h4>
                          {food.category === 'proteins' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">
                              Proteína
                            </span>
                          )}
                        </div>
                        {food.highlight && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {food.highlight}
                          </p>
                        )}
                      </div>

                      {/* Nutrients per 100g */}
                      {!hideNumbers && <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">
                            {food.calories}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              kcal
                            </span>
                          </span>
                          <span className="text-border">·</span>
                          <span className="font-extrabold text-primary">
                            {food.protein}g{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              prot
                            </span>
                          </span>
                          <span className="text-border">·</span>
                          <span className="text-[11px] text-muted-foreground">
                            {food.carbohydrates}g C / {food.fat}g G
                          </span>
                        </div>
                      </div>}

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddFood(food)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isInPlate
                            ? 'bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30'
                            : 'bg-secondary hover:bg-accent text-foreground border border-border'
                        }`}
                      >
                        <Icon name="add" size={14} weight="bold" />
                        {isInPlate
                          ? `Añadir +${food.defaultServingGrams}g más`
                          : `Agregar al plato (${food.defaultServingGrams}g)`}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
