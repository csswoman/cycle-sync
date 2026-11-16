import { FoodItem } from '@/data/nutritionFoods';

export interface NutritionTargets {
  weightKg: number;
  /** Protein target in grams per day for muscle building + fat loss */
  proteinGrams: number;
  /** Safe protein range [min, max] (1.6 to 2.2 g/kg) */
  proteinRange: [number, number];
  /** Water target in liters per day (35 - 40 ml/kg) */
  waterLiters: number;
  waterRangeLiters: [number, number];
  /** Equivalent in 250ml glasses */
  waterGlasses: number;
  /** Estimated maintenance calories (kcal) */
  maintenanceCalories: number;
  /** Target calories for fat loss without muscle loss (moderate deficit, ~24-26 kcal/kg) */
  cuttingCalories: number;
}

/**
 * Calculates evidence-based daily protein, hydration, and caloric targets
 * specifically calibrated to build muscle and burn fat without losing muscle mass.
 *
 * Evidence base:
 * - Protein: 1.6 - 2.2 g/kg (ISSN / Morton et al. 2018 / Helms et al. 2014) in deficit to preserve LBM.
 * - Hydration: 35 - 40 ml/kg (WHO / EFSA / American College of Sports Medicine).
 * - Deficit: Moderate 15-20% caloric reduction to prevent muscle catabolism and metabolic slowdown.
 */
export function calculateNutritionTargets(weightKg: number): NutritionTargets {
  let val = weightKg;
  if (!Number.isFinite(val) || val === 0) {
    val = 60;
  }
  const safeWeight = Math.max(30, Math.min(250, val));

  // Protein targets: 2.0 g/kg as prime target, [1.6, 2.2] range
  const minProtein = Math.round(safeWeight * 1.6);
  const targetProtein = Math.round(safeWeight * 2.0);
  const maxProtein = Math.round(safeWeight * 2.2);

  // Water targets: 35ml to 40ml per kg
  const minWater = Number(((safeWeight * 35) / 1000).toFixed(1));
  const targetWater = Number(((safeWeight * 37.5) / 1000).toFixed(1));
  const maxWater = Number(((safeWeight * 40) / 1000).toFixed(1));
  const waterGlasses = Math.round((targetWater * 1000) / 250);

  // Calories: maintenance ~31 kcal/kg, moderate cutting ~25 kcal/kg
  const maintenanceCalories = Math.round(safeWeight * 31);
  const cuttingCalories = Math.round(safeWeight * 25);

  return {
    weightKg: safeWeight,
    proteinGrams: targetProtein,
    proteinRange: [minProtein, maxProtein],
    waterLiters: targetWater,
    waterRangeLiters: [minWater, maxWater],
    waterGlasses,
    maintenanceCalories,
    cuttingCalories,
  };
}

export interface PlateIngredient {
  food: FoodItem;
  grams: number;
}

export interface PlateTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  totalWeightGrams: number;
  /** Percentage of daily protein target reached by this plate */
  proteinPercentOfDaily?: number;
  /** Percentage of daily cutting calories reached by this plate */
  caloriesPercentOfDaily?: number;
}

/**
 * Computes exact nutritional totals for an assembled meal/plate.
 */
export function calculatePlateTotals(
  ingredients: PlateIngredient[],
  dailyTargets?: NutritionTargets
): PlateTotals {
  let calories = 0;
  let protein = 0;
  let carbohydrates = 0;
  let fat = 0;
  let totalWeightGrams = 0;

  for (const item of ingredients) {
    const factor = Math.max(0, item.grams) / 100;
    calories += item.food.calories * factor;
    protein += item.food.protein * factor;
    carbohydrates += item.food.carbohydrates * factor;
    fat += item.food.fat * factor;
    totalWeightGrams += item.grams;
  }

  const roundedCalories = Math.round(calories);
  const roundedProtein = Number(protein.toFixed(1));
  const roundedCarbs = Number(carbohydrates.toFixed(1));
  const roundedFat = Number(fat.toFixed(1));

  let proteinPercentOfDaily: number | undefined;
  let caloriesPercentOfDaily: number | undefined;

  if (dailyTargets && dailyTargets.proteinGrams > 0) {
    proteinPercentOfDaily = Math.round((roundedProtein / dailyTargets.proteinGrams) * 100);
  }
  if (dailyTargets && dailyTargets.cuttingCalories > 0) {
    caloriesPercentOfDaily = Math.round((roundedCalories / dailyTargets.cuttingCalories) * 100);
  }

  return {
    calories: roundedCalories,
    protein: roundedProtein,
    carbohydrates: roundedCarbs,
    fat: roundedFat,
    totalWeightGrams: Math.round(totalWeightGrams),
    proteinPercentOfDaily,
    caloriesPercentOfDaily,
  };
}
