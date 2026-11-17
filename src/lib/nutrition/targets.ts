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
  /** Healthy hormonal fat target in grams (minimum 1.0 g/kg for estrogen and progesterone health) */
  fatGrams: number;
  /** Safe fat range [min, max] (1.0 to 1.2 g/kg) */
  fatRange: [number, number];
  /** Caloric expenditure components & guidelines */
  calorieBreakdown: {
    /** Basal Metabolic Rate (~75-80% of maintenance) */
    bmr: number;
    /** Thermic Effect of Food (~10% of total) */
    tef: number;
    /** Activity expenditure estimate (~15% of total) */
    activity: number;
    /** Recommended moderate deficit range for safe fat loss [minDeficit, maxDeficit] (300 to 500 kcal) */
    deficitRange: [number, number];
    /** Target calories with safe 400 kcal deficit */
    safeDeficitCalories: number;
    /** Target calories with controlled 300-500 kcal surplus for muscle building */
    safeSurplusCalories: number;
  };
  /** Height used, in cm, when known. */
  heightCm?: number;
  /** Body mass index, when height is known. */
  bmi?: number;
  /**
   * Weight protein is calculated on. Equals the body weight, except above
   * BMI 25 where it is the weight at BMI 25 for the height.
   */
  proteinReferenceKg: number;
  /** Adjusted weight for water and energy (reference + 40% of the excess). */
  adjustedWeightKg: number;
  /** True when protein, water and energy use the reference/adjusted weights. */
  usesAdjustedWeight: boolean;
}

/**
 * Calculates evidence-based daily protein, hydration, and caloric targets
 * specifically calibrated to build muscle and burn fat without losing muscle mass.
 *
 * Evidence base:
 * - Protein: 1.6 - 2.2 g/kg (ISSN / Morton et al. 2018 / Helms et al. 2014) in deficit to preserve LBM.
 * - Hydration: 35 - 40 ml/kg (WHO / EFSA / American College of Sports Medicine).
 * - Deficit: Moderate 15-20% caloric reduction to prevent muscle catabolism and metabolic slowdown.
 *
 * Larger bodies (BMI > 25, needs height): extra weight is mostly fat, which
 * needs little protein, so g/kg of total weight overshoots (100 kg x 2 g =
 * 200 g/day). Protein uses the weight at BMI 25 for the height (an ideal/goal
 * weight, as bariatric and obesity guidelines do), never below 0.9 g/kg of
 * total weight; reviews on weight loss in obesity point to >= 1.0-1.2 g/kg
 * of total weight to protect muscle. Water and energy use the clinical
 * adjusted weight (reference + 40% of the excess): fat tissue holds less water
 * and burns less energy than lean tissue, but a larger body still needs more.
 */
export function calculateNutritionTargets(weightKg: number, heightCm?: number): NutritionTargets {
  let val = weightKg;
  if (!Number.isFinite(val) || val === 0) {
    val = 60;
  }
  const safeWeight = Math.max(30, Math.min(250, val));

  const validHeight = typeof heightCm === 'number' && Number.isFinite(heightCm) && heightCm >= 120 && heightCm <= 220
    ? Math.round(heightCm)
    : undefined;
  const heightM = validHeight ? validHeight / 100 : undefined;
  const bmi = heightM ? Number((safeWeight / (heightM * heightM)).toFixed(1)) : undefined;
  const usesAdjustedWeight = !!heightM && !!bmi && bmi > 25;
  const referenceKg = usesAdjustedWeight ? Math.round(25 * heightM! * heightM! * 10) / 10 : safeWeight;
  const adjustedKg = usesAdjustedWeight
    ? Math.round((referenceKg + 0.4 * (safeWeight - referenceKg)) * 10) / 10
    : safeWeight;

  // Protein: 2.0 g/kg as prime target, [1.6, 2.2] range, on the reference weight.
  // With adjusted weight, keep floors on total weight so the target never drops too low.
  const targetProtein = Math.round(Math.max(referenceKg * 2.0, usesAdjustedWeight ? safeWeight * 1.0 : 0));
  const maxProtein = Math.round(Math.max(referenceKg * 2.2, usesAdjustedWeight ? safeWeight * 1.2 : 0));
  const minProtein = Math.min(
    targetProtein,
    Math.round(Math.max(referenceKg * 1.6, usesAdjustedWeight ? safeWeight * 0.9 : 0))
  );

  // Water targets: 35ml to 40ml per kg (adjusted weight)
  const minWater = Number(((adjustedKg * 35) / 1000).toFixed(1));
  const targetWater = Number(((adjustedKg * 37.5) / 1000).toFixed(1));
  const maxWater = Number(((adjustedKg * 40) / 1000).toFixed(1));
  const waterGlasses = Math.round((targetWater * 1000) / 250);

  // Calories: maintenance ~31 kcal/kg, moderate cutting ~25 kcal/kg (adjusted weight)
  const maintenanceCalories = Math.round(adjustedKg * 31);
  const cuttingCalories = Math.round(adjustedKg * 25);

  // Hormonal fat floor: at least 1.0 g/kg (reference weight) to safeguard female endocrine function
  const targetFat = Math.round(referenceKg * 1.0);
  const maxFat = Math.round(referenceKg * 1.2);

  // Caloric breakdown: BMR ~75-80%, TEF ~10%, Activity remainder
  const bmr = Math.round(maintenanceCalories * 0.75);
  const tef = Math.round(maintenanceCalories * 0.10);
  const activity = Math.max(0, maintenanceCalories - bmr - tef);

  return {
    heightCm: validHeight,
    bmi,
    proteinReferenceKg: referenceKg,
    adjustedWeightKg: adjustedKg,
    usesAdjustedWeight,
    weightKg: safeWeight,
    proteinGrams: targetProtein,
    proteinRange: [minProtein, maxProtein],
    fatGrams: targetFat,
    fatRange: [targetFat, maxFat],
    waterLiters: targetWater,
    waterRangeLiters: [minWater, maxWater],
    waterGlasses,
    maintenanceCalories,
    cuttingCalories,
    calorieBreakdown: {
      bmr,
      tef,
      activity,
      deficitRange: [300, 500],
      safeDeficitCalories: Math.max(1200, maintenanceCalories - 400),
      safeSurplusCalories: maintenanceCalories + 400,
    },
  };
}

// ---------------------------------------------------------------------------
// Protein per meal
//
// All the protein you eat is absorbed; what has a ceiling is how much of one
// meal the muscle uses for building (muscle protein synthesis, MPS). The rest
// is still used for other tissues or as energy, so it is not "wasted", but
// spreading the day's protein over several meals makes better use of it.
//
// Evidence base:
// - Schoenfeld & Aragon 2018 (JISSN 15:10): ~0.4 g/kg per meal over at least
//   4 meals to reach 1.6 g/kg/day; up to 0.55 g/kg per meal to reach 2.2 g/kg.
// - Areta et al. 2013: 4 x 20 g every 3 h beat 8 x 10 g and 2 x 40 g for MPS.
// - Mamerow et al. 2014: even distribution (~30 g x 3) gave 25% more MPS
//   than a skewed day (10 / 15 / 65 g).
// - Trommelen et al. 2023 (Cell Rep Med): 100 g in one meal is not lost; the
//   response lasts longer, so large meals are fine but even meals are simpler.
// - ISSN position stand 2017: 20-40 g per meal, every 3-4 h.
// ---------------------------------------------------------------------------

export type MealsPerDay = 3 | 4;

/** Minimum per meal to fully stimulate muscle protein synthesis (g/kg). */
export const PROTEIN_PER_MEAL_MIN_G_PER_KG = 0.4;
/** Upper end of the per-meal range used in the studies (g/kg). */
export const PROTEIN_PER_MEAL_MAX_G_PER_KG = 0.55;
/** Above this, a single meal holds much more than the muscle uses at once. */
export const PROTEIN_PER_MEAL_HIGH_G_PER_KG = 0.8;

export interface ProteinMealSlot {
  /** 0-based position in the day. */
  index: number;
  label: string;
  /** Suggested time, HH:MM in 24 h. */
  time: string;
  proteinGrams: number;
}

export interface ProteinMealPlan {
  mealsPerDay: MealsPerDay;
  /** Even share of the daily target for each meal. */
  perMealGrams: number;
  /** Evidence-based per-meal range [0.4, 0.55 g/kg]. */
  perMealRange: [number, number];
  /** Above this a plate is "very large" for a single meal. */
  highThresholdGrams: number;
  /** Hours between meals. */
  spacingHours: number;
  slots: ProteinMealSlot[];
}

const MEAL_LABELS: Record<MealsPerDay, string[]> = {
  3: ['Desayuno', 'Comida', 'Cena'],
  4: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
};

/** 4 meals every 4 h, or 3 meals every 5 h, fit a usual waking day. */
const SPACING_HOURS: Record<MealsPerDay, number> = { 3: 5, 4: 4 };

function addHours(time: string, hours: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  const start = match ? Number(match[1]) * 60 + Number(match[2]) : 8 * 60;
  const total = (start + Math.round(hours * 60)) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Splits the daily protein target into 3 or 4 even meals spaced through the day.
 * @param firstMealTime time of the first meal, HH:MM (default 08:00)
 */
export function buildProteinMealPlan(
  targets: NutritionTargets,
  mealsPerDay: MealsPerDay = 4,
  firstMealTime = '08:00'
): ProteinMealPlan {
  const meals: MealsPerDay = mealsPerDay === 3 ? 3 : 4;
  const w = targets.proteinReferenceKg;
  const perMealGrams = Math.round(targets.proteinGrams / meals);
  const spacingHours = SPACING_HOURS[meals];
  const slots = MEAL_LABELS[meals].map((label, index) => ({
    index,
    label,
    time: addHours(firstMealTime, index * spacingHours),
    proteinGrams: perMealGrams,
  }));
  return {
    mealsPerDay: meals,
    perMealGrams,
    perMealRange: [Math.round(w * PROTEIN_PER_MEAL_MIN_G_PER_KG), Math.round(w * PROTEIN_PER_MEAL_MAX_G_PER_KG)],
    highThresholdGrams: Math.round(w * PROTEIN_PER_MEAL_HIGH_G_PER_KG),
    spacingHours,
    slots,
  };
}

export type PlateProteinStatus = 'empty' | 'low' | 'good' | 'high';

export interface PlateProteinVerdict {
  status: PlateProteinStatus;
  /** Grams missing to reach the per-meal goal (0 when reached). */
  missingGrams: number;
  /** Grams above the high threshold (0 when below). */
  extraGrams: number;
  /** How many of the day's meals this plate covers (e.g. 1.6). */
  mealsCovered: number;
}

/** Rates a plate's protein against one meal of the plan. */
export function evaluatePlateProtein(proteinGrams: number, plan: ProteinMealPlan): PlateProteinVerdict {
  const p = Math.max(0, proteinGrams || 0);
  const goal = Math.max(plan.perMealRange[0], 1);
  const mealsCovered = plan.perMealGrams > 0 ? Math.round((p / plan.perMealGrams) * 10) / 10 : 0;
  let status: PlateProteinStatus;
  if (p === 0) status = 'empty';
  else if (p < goal) status = 'low';
  else if (p > plan.highThresholdGrams) status = 'high';
  else status = 'good';
  return {
    status,
    missingGrams: status === 'low' || status === 'empty' ? Math.round(goal - p) : 0,
    extraGrams: status === 'high' ? Math.round(p - plan.highThresholdGrams) : 0,
    mealsCovered,
  };
}

/**
 * Rescales the protein foods of a plate so the whole plate lands on `targetGrams`
 * of protein, keeping the proportions between them. Other foods are untouched.
 * Returns the plate unchanged when it has no protein food or the target can't
 * be reached by them alone.
 */
export function fitPlateProtein(ingredients: PlateIngredient[], targetGrams: number): PlateIngredient[] {
  const isSource = (i: PlateIngredient) => i.food.category === 'proteins';
  const proteinOf = (i: PlateIngredient) => (i.food.protein * Math.max(0, i.grams)) / 100;
  const fromSources = ingredients.filter(isSource).reduce((s, i) => s + proteinOf(i), 0);
  const fromRest = ingredients.filter((i) => !isSource(i)).reduce((s, i) => s + proteinOf(i), 0);
  const needed = targetGrams - fromRest;
  if (fromSources <= 0 || needed <= 0) return ingredients;
  const factor = needed / fromSources;
  return ingredients.map((i) =>
    isSource(i) ? { ...i, grams: Math.max(5, Math.round((i.grams * factor) / 5) * 5) } : i
  );
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
