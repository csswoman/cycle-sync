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
import { useLanguage } from '@/i18n/LanguageContext';

interface ProteinWaterIdeasProps {
  targets: NutritionTargets;
  plan: ProteinMealPlan;
  hideNumbers?: boolean;
  /** Recipes from the catalog; the ones with the most protein are shown with their photo. */
  recipes?: LibraryRecipe[];
  onOpenRecipe?: (recipe: LibraryRecipe) => void;
}

type Tab = 'protein' | 'water';

const FOOD_EQUIV_NAMES_EN: Record<string, string> = {
  'pechuga-pollo': 'Chicken breast (skinless, cooked)',
  'lomo-cerdo': 'Pork tenderloin',
  'ternera-magra': 'Lean beef (sirloin / flank)',
  'salmon-cocinado': 'Baked salmon',
  'atun-agua': 'Canned tuna in water',
  'camaron-gamba': 'Cooked shrimp',
  'huevo-cocido': 'Whole hard-boiled eggs',
  'claras-huevo': 'Egg whites',
  'tofu-firme': 'Firm tofu',
  'yogur-griego': 'Plain nonfat Greek yogurt',
  'queso-cottage': 'Low-fat cottage cheese',
  'queso-fresco': 'Fresh cheese / panela',
  'lentejas-cocidas': 'Cooked lentils',
  'garbanzos-cocidos': 'Cooked chickpeas',
  'frijoles-negros': 'Cooked black beans',
  'edamame': 'Cooked edamame',
  'tempeh': 'Steamed tempeh',
  'seitan': 'Seitan (wheat protein)',
};

const PROTEIN_MEAL_IDEAS_EN: IdeaGroup[] = [
  {
    title: 'Breakfasts',
    icon: 'light_mode',
    items: [
      'Scrambled eggs with spinach and fresh cheese, with a corn tortilla',
      'Plain Greek yogurt with berries, walnuts, and chia seeds',
      'Egg white and whole egg omelet with mushrooms and bell pepper',
      'Oatmeal cooked in milk topped with Greek yogurt',
      'Whole grain toast with ricotta or cottage cheese, tomato, and oregano',
    ],
  },
  {
    title: 'Lunches & dinners',
    icon: 'restaurant',
    items: [
      'Shredded chicken tacos with pico de gallo and avocado',
      'Baked salmon with lemon and roasted vegetables',
      'Tuna bowl with brown rice, cucumber, edamame, and sesame seeds',
      'Stir-fried tofu with broccoli, ginger, and soy sauce',
      'Lean beef with zucchini or cactus and beans',
      'Lentil soup topped with chicken or hard-boiled egg',
      'Garlic shrimp with salad and quinoa',
    ],
  },
  {
    title: 'Snacks',
    icon: 'favorite',
    items: [
      'Cottage cheese with diced fruit and cinnamon',
      'Cucumber slices topped with tuna and lime',
      'Edamame with sea salt',
      'Smoothie made with milk or soy beverage, Greek yogurt, and strawberries',
      'Two hard-boiled eggs with tomato and garlic salt',
      'Hummus with carrot sticks and Greek yogurt',
    ],
  },
];

const PROTEIN_TRICKS_EN: IdeaGroup[] = [
  {
    title: "Don't let it feel like a chore",
    icon: 'lightbulb',
    items: [
      'Eat protein and vegetables first, carbohydrates last: blood sugar spikes less and you stay full longer.',
      'Rotate at least 5 different protein sources each week: chicken, fish, eggs, dairy, and a plant-based option.',
      'Change the format, not just the food: the same chicken works in tacos, soup, salad, or shredded bowls.',
      'Keep three staple marinades on hand: lime, garlic & cumin; yogurt & chipotle; soy sauce & ginger.',
    ],
  },
  {
    title: 'If eating this much is tough',
    icon: 'bowl_food',
    items: [
      'Choose dense sources packed with protein in low volume: chicken breast, tuna, egg whites, Greek yogurt, and cottage cheese.',
      'Drinks count too: a milk and Greek yogurt smoothie can easily provide 20 to 30 g.',
      'Increase gradually: adding 10 g more per week is plenty. No need to hit the target on day one.',
      'Batch cook two proteins on Sunday and keep them ready to build plates in minutes.',
    ],
  },
];

const WATER_TRICKS_EN: IdeaGroup[] = [
  {
    title: 'Flavorful and sugar-free',
    icon: 'drop',
    items: [
      'Water with cucumber and mint, or lemon and ginger',
      'Hibiscus or cinnamon iced tea, unsweetened or with a drop of stevia',
      'Strawberries with basil, or orange slices with rosemary, infused in a pitcher in the fridge',
      'Sparkling mineral water with a lime wedge',
      'Hot or iced herbal teas: they count towards your hydration too',
    ],
  },
  {
    title: 'Habits that make it effortless',
    icon: 'schedule',
    items: [
      'Keep a 1-liter bottle in sight with time marks. Refilling once is simpler than counting glasses.',
      'A glass before each meal promotes early satiety and easier digestion.',
      'About one-fifth of your water comes from food: soups, broths, cucumbers, watermelon, and fruit.',
      'Drink more if it is warm, when you exercise, or if your urine is dark. Pale light yellow is the goal.',
      'Finish your last glass about two hours before bed to avoid waking up during the night.',
    ],
  },
];

function formatWaterMomentLabel(label: string, isEn: boolean): string {
  if (!isEn) return label;
  if (label === 'Al despertar') return 'Upon waking';
  return label
    .replace(/^Con /i, 'With ')
    .replace(/ y después$/i, ' & after')
    .replace(/desayuno/i, 'breakfast')
    .replace(/almuerzo|comida/i, 'lunch')
    .replace(/merienda/i, 'snack')
    .replace(/cena/i, 'dinner');
}

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

/** Bold lead-in (text before the first period or colon, when short) so tips can be scanned. */
const splitLead = (item: string): [string, string] => {
  const m = item.match(/^(.{4,60}?[.:])\s+(.+)$/);
  return m ? [m[1], m[2]] : ['', item];
};

const IdeaList: React.FC<{ group: IdeaGroup; isEn: boolean }> = ({ group, isEn }) => {
  const [expanded, setExpanded] = useState(false);
  const extra = group.items.length - 2;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/40 p-3 sm:bg-transparent sm:p-0 sm:rounded-none">
      <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon name={group.icon} size={18} weight="duotone" className="text-leaf shrink-0" />
        {group.title}
      </h4>
      <ul className="flex flex-col gap-2 sm:gap-1.5">
        {group.items.map((item, i) => {
          const [lead, rest] = splitLead(item);
          return (
            <li key={item} className={`text-sm text-muted-foreground leading-relaxed text-pretty pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2.5 before:size-1.5 before:rounded-full before:bg-leaf/60 ${!expanded && i >= 2 ? 'max-sm:hidden' : ''}`}>
              {lead && <strong className="font-semibold text-foreground">{lead} </strong>}
              {rest}
            </li>
          );
        })}
      </ul>
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="sm:hidden self-start min-h-11 text-sm font-medium text-foreground underline underline-offset-4"
        >
          {expanded ? (isEn ? 'Show less' : 'Ver menos') : (isEn ? `View ${extra} more` : `Ver ${extra} más`)}
        </button>
      )}
    </div>
  );
};

/** Friendly ideas to reach the protein and water targets without getting bored. */
export const ProteinWaterIdeas: React.FC<ProteinWaterIdeasProps> = ({ targets, plan, hideNumbers = false, recipes = [], onOpenRecipe }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
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

  const mealIdeas = isEn ? PROTEIN_MEAL_IDEAS_EN : PROTEIN_MEAL_IDEAS;
  const proteinTricks = isEn ? PROTEIN_TRICKS_EN : PROTEIN_TRICKS;
  const waterTricks = isEn ? WATER_TRICKS_EN : WATER_TRICKS;

  return (
    <section aria-labelledby="ideas-title" className="w-full bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-prose">
          <h3 id="ideas-title" className="text-foreground text-lg sm:text-xl font-semibold text-balance">
            {isEn ? 'Ideas to hit your targets without getting bored' : 'Ideas para llegar sin aburrirte'}
          </h3>
          <p className="text-muted-foreground text-sm text-pretty">
            {isEn ? 'Variety and small habits beat willpower.' : 'Variedad y hábitos pequeños rinden más que la fuerza de voluntad.'}
            <span className="max-sm:hidden">
              {isEn
                ? ' Hitting your protein and water targets is easier that way.'
                : ' Así es más fácil llegar a tu proteína y a tu agua.'}
            </span>
          </p>
        </div>
        <div role="tablist" aria-label={isEn ? 'Idea types' : 'Tipo de ideas'} className="flex gap-1 bg-secondary/80 p-1 rounded-full border border-border w-full sm:w-auto sm:self-start shrink-0">
          {([
            { id: 'protein', label: isEn ? 'Protein' : 'Proteína', icon: 'bowl_food' },
            { id: 'water', label: isEn ? 'Water' : 'Agua', icon: 'drop' },
          ] as { id: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none justify-center min-h-11 sm:min-h-10 px-4 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
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
        <div role="tabpanel" className="flex flex-col gap-4 sm:gap-6">
          {!hideNumbers && equivalents.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">
                {isEn ? `A meal with ${plan.perMealGrams} g of protein can look like…` : `Una comida de ${plan.perMealGrams} g de proteína puede ser…`}
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {shownEquivalents.map((e) => (
                  <li key={e.food.id} className="rounded-xl sm:rounded-2xl bg-secondary/60 p-2 pr-3 sm:pr-4 flex items-center gap-3">
                    <FoodThumb food={e.food} />
                    <span className="flex-1 min-w-0 text-sm text-foreground font-medium text-balance">
                      {isEn && FOOD_EQUIV_NAMES_EN[e.food.id] ? FOOD_EQUIV_NAMES_EN[e.food.id] : e.food.name}
                    </span>
                    <span className="text-sm text-primary font-semibold tabular-nums shrink-0">{e.grams} g</span>
                  </li>
                ))}
              </ul>
              {equivalents.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllEquivalents((v) => !v)}
                  aria-expanded={showAllEquivalents}
                  className="self-start min-h-11 sm:min-h-10 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  {showAllEquivalents ? (isEn ? 'Show less' : 'Ver menos') : (isEn ? `View ${equivalents.length - 6} more` : `Ver ${equivalents.length - 6} más`)}
                </button>
              )}
              <p className="text-sm text-muted-foreground text-pretty">
                {isEn
                  ? 'You can also mix and match: half a plate of one and half of another, like eggs with Greek yogurt, or lentils with chicken. Legumes contribute, but alone require large portions.'
                  : 'También puedes combinar: medio plato de una y medio de otra, por ejemplo huevo con yogur griego, o lentejas con pollo. Las legumbres suman, pero solas necesitan porciones grandes.'}
              </p>
            </div>
          )}

          {proteinRecipes.length > 0 && onOpenRecipe && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">
                {isEn ? 'Highest-protein catalog recipes' : 'Recetas de tu catálogo con más proteína'}
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {proteinRecipes.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenRecipe(r)}
                      className="w-full h-full text-left flex items-center gap-3 rounded-xl sm:rounded-2xl border border-border bg-background hover:border-primary/50 transition-colors p-2 pr-3 group"
                    >
                      <div className="size-16 shrink-0 rounded-xl overflow-hidden garden-wash wash-leaf">
                        <img src={r.imageUrl as string} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {[!hideNumbers && r.nutrition?.protein != null ? `${Math.round(r.nutrition.protein)} g ${isEn ? 'protein' : 'proteína'}` : null, r.readyInMinutes ? `${r.readyInMinutes} min` : null]
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
            <summary className="flex items-center gap-2 min-h-11 sm:min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
              <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
              {isEn ? 'More meal ideas without recipes' : 'Más ideas de comidas sin receta'}
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-3">
              {mealIdeas.map((g) => <IdeaList key={g.title} group={g} isEn={isEn} />)}
            </div>
          </details>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t border-border">
            {proteinTricks.map((g) => <div key={g.title} className="sm:pt-4"><IdeaList group={g} isEn={isEn} /></div>)}
          </div>
        </div>
      )}

      {tab === 'water' && (
        <div role="tabpanel" className="flex flex-col gap-4 sm:gap-6">
          {water.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-semibold text-foreground text-balance">
                {hideNumbers
                  ? (isEn ? 'Spread your water with your meals' : 'Reparte el agua junto a tus comidas')
                  : (isEn ? `Your ${targets.waterGlasses} glasses spread throughout the day` : `Tus ${targets.waterGlasses} vasos repartidos en el día`)}
              </h4>
              <ol className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                {water.map((w) => (
                  <li key={w.time + w.label} className="shrink-0 min-w-[9rem] rounded-xl sm:rounded-2xl bg-secondary/60 px-4 py-3 flex flex-col gap-0.5">
                    <span className="text-sm text-muted-foreground tabular-nums">{w.time}</span>
                    <span className="text-sm font-medium text-foreground">{formatWaterMomentLabel(w.label, isEn)}</span>
                    {!hideNumbers && (
                      <span className="text-sm text-primary font-semibold tabular-nums">
                        {w.glasses} {isEn ? (w.glasses === 1 ? 'glass' : 'glasses') : (w.glasses === 1 ? 'vaso' : 'vasos')}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {!hideNumbers && targets.usesAdjustedWeight && (
                <p className="text-sm text-muted-foreground text-pretty">
                  {isEn
                    ? `Your water target increases with body weight, but not at the same rate: we calculate it based on ${targets.adjustedWeightKg} kg so it stays realistic.`
                    : `Tu meta de agua sube con tu peso, pero no al mismo ritmo: la calculamos sobre ${targets.adjustedWeightKg} kg para que sea realista.`}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {waterTricks.map((g) => <IdeaList key={g.title} group={g} isEn={isEn} />)}
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            {isEn
              ? 'If you have kidney or heart disease, or were advised to restrict fluids or protein, always follow your physician’s instructions.'
              : 'Si tienes una enfermedad del riñón o del corazón, o te indicaron limitar líquidos o proteína, sigue la indicación de tu médico.'}
          </p>
        </div>
      )}
    </section>
  );
};
