'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRecipes, EMPTY_RECIPE_FILTERS } from '@/hooks/useRecipes';
import { useNutritionAI } from '@/hooks/useNutritionAI';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { entriesToNames, avoidedIn } from '@/lib/nutrition/foodPreferences';
import { toPhaseKey, rankRecipesForPhase, FOOD_FOCUS } from '@/lib/cycle/phaseSuggestions';
import { PhaseRecipePicks } from './components/PhaseRecipePicks';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { generateRecipes, suggestedTags, type GenerateResult } from '@/services/recipesService';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeForm } from './components/RecipeForm';
import { PlateBuilder } from './components/PlateBuilder';
import { MacroWaterCalculator } from './components/MacroWaterCalculator';
import { FoodPreferencesPanel } from './components/FoodPreferencesPanel';
import { Icon } from '@/components/ui/Icon';
import { calculateNutritionTargets, buildProteinMealPlan, type MealsPerDay } from '@/lib/nutrition/targets';
import { ProteinMealPlanCard } from './components/ProteinMealPlanCard';
import { ProteinWaterIdeas } from './components/ProteinWaterIdeas';
import { BodyProgress } from './components/BodyProgress';
import { usePMOSMetrics } from '@/hooks/usePMOSMetrics';
import { useBodyProfile } from '@/hooks/useBodyProfile';
import { latestWeight } from '@/lib/body/progress';
import { todayLocal } from '@/features/health/pmos/shared';
import { GardenCorner } from '@/components/ui/Botanical';
import { useGuest } from '@/hooks/useGuest';
import GuestPreviewBanner from '@/components/layout/GuestPreviewBanner';
import { usePmosToolsVisible } from '@/hooks/useOnboardingAnswers';

const TAGS_COLLAPSED = 8;
type ActiveTab = 'plate' | 'calculator' | 'progress' | 'tastes' | 'recipes' | 'analyze' | 'generate';

// Guests can browse recipes and try the calculators; tabs that save data or call the AI are locked.
const GUEST_TABS: ActiveTab[] = ['recipes', 'plate', 'calculator'];

const Nutrition: React.FC = () => {
  const foodPrefs = useFoodPreferences();
  const library = useRecipes(foodPrefs.prefs);
  const { hideNumbers } = useDisplayPrefs();
  const showPmos = usePmosToolsVisible();
  const { analysis, analyzePlate } = useNutritionAI(hideNumbers, showPmos);
  const { cycleInfo } = useCycleInfo();
  const { language, t } = useLanguage();
  const isEs = language === 'es';
  const { isGuest, promptSignup } = useGuest();

  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [generation, setGeneration] = useState<{ loading: boolean; error: string | null; result: GenerateResult | null }>({
    loading: false,
    error: null,
    result: null,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('plate');
  // Deep link such as /nutrition?tab=tastes
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && ['plate', 'calculator', 'progress', 'tastes', 'recipes', 'analyze', 'generate'].includes(requested)) setActiveTab(requested as ActiveTab);
  }, []);
  // Guests land on the recipe catalog, the part of this page they can fully use.
  useEffect(() => {
    if (isGuest && !new URLSearchParams(window.location.search).get('tab')) setActiveTab('recipes');
  }, [isGuest]);

  // Weight state for macro & water calculation
  const [userWeightKg, setUserWeightKg] = useState<number>(65);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cycle_sync_user_weight_kg');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) {
          setUserWeightKg(parsed);
        }
      }
    }
  }, []);

  const handleWeightChange = (newWeight: number) => {
    setUserWeightKg(newWeight);
    // Guests can try the calculator, but nothing is stored for them.
    if (typeof window !== 'undefined' && !isGuest) {
      localStorage.setItem('cycle_sync_user_weight_kg', newWeight.toString());
    }
  };

  // How the day's protein is split: meals per day and time of the first one.
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(4);
  const [firstMealTime, setFirstMealTime] = useState('08:00');
  useEffect(() => {
    try {
      const meals = localStorage.getItem('cycle_sync_meals_per_day');
      if (meals === '3' || meals === '4') setMealsPerDay(Number(meals) as MealsPerDay);
      const time = localStorage.getItem('cycle_sync_first_meal_time');
      if (time && /^\d{2}:\d{2}$/.test(time)) setFirstMealTime(time);
      const height = parseFloat(localStorage.getItem('cycle_sync_user_height_cm') ?? '');
      if (Number.isFinite(height) && height >= 120 && height <= 220) setUserHeightCm(height);
    } catch { /* storage unavailable */ }
  }, []);
  // Optional height: makes protein, water and energy realistic for larger bodies.
  const [userHeightCm, setUserHeightCm] = useState<number | undefined>(undefined);
  const handleHeightChange = (cm: number | undefined) => {
    setUserHeightCm(cm);
    if (isGuest) return;
    try {
      if (cm && cm >= 120 && cm <= 220) localStorage.setItem('cycle_sync_user_height_cm', String(cm));
      else if (!cm) localStorage.removeItem('cycle_sync_user_height_cm');
    } catch { /* storage unavailable */ }
  };
  // Weight and height also live in the profile: the latest logged weight and the
  // saved height prefill the calculator, so every device starts from real data.
  const metrics = usePMOSMetrics();
  const body = useBodyProfile();
  const saveBody = body.save;
  const lastLogged = useMemo(() => latestWeight(metrics.entries), [metrics.entries]);
  const prefilled = useRef({ weight: false, height: false });
  useEffect(() => {
    if (isGuest || prefilled.current.weight || metrics.loading) return;
    prefilled.current.weight = true;
    if (lastLogged) setUserWeightKg(lastLogged.value);
  }, [isGuest, metrics.loading, lastLogged]);
  useEffect(() => {
    if (isGuest || prefilled.current.height || body.loading) return;
    prefilled.current.height = true;
    if (body.profile.heightCm) setUserHeightCm(body.profile.heightCm);
  }, [isGuest, body.loading, body.profile.heightCm]);
  // Height is saved to the profile shortly after the user stops typing.
  useEffect(() => {
    if (isGuest || !body.signedIn || body.loading || !prefilled.current.height) return;
    if (!userHeightCm || userHeightCm < 120 || userHeightCm > 220 || userHeightCm === body.profile.heightCm) return;
    const id = setTimeout(() => { saveBody({ heightCm: userHeightCm }); }, 900);
    return () => clearTimeout(id);
  }, [userHeightCm, isGuest, body.signedIn, body.loading, body.profile.heightCm, saveBody]);

  const [weightSaved, setWeightSaved] = useState(false);
  const handleLogWeight = async () => {
    const ok = await metrics.add({ date: todayLocal(), weight_kg: userWeightKg });
    if (!ok) return;
    if (!body.profile.startWeightKg && !lastLogged) await body.save({ startWeightKg: userWeightKg, startDate: todayLocal() });
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 4000);
  };
  const weightBar = !isGuest && body.signedIn && (
    <div className="w-full -mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm text-muted-foreground">
      <span className="text-pretty">
        {lastLogged
          ? `Último peso guardado: ${lastLogged.value} kg, el ${lastLogged.date.split('-').reverse().join('/')}.`
          : 'Aún no has guardado tu peso. El primero que guardes será tu punto de inicio.'}
      </span>
      {weightSaved ? (
        <span role="status" className="inline-flex items-center gap-1.5 font-medium text-leaf">
          <Icon name="check" size={16} weight="bold" /> Guardado en tu progreso
        </span>
      ) : (!lastLogged || lastLogged.value !== userWeightKg || lastLogged.date !== todayLocal()) && userWeightKg >= 30 && (
        <button
          type="button"
          onClick={handleLogWeight}
          disabled={metrics.saving}
          className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full bg-secondary hover:bg-accent text-foreground font-medium transition-colors disabled:opacity-60"
        >
          <Icon name="floppy_disk" size={16} weight="bold" />
          {metrics.saving ? 'Guardando…' : `Guardar ${userWeightKg} kg de hoy`}
        </button>
      )}
      <button type="button" onClick={() => setActiveTab('progress')} className="min-h-10 font-medium text-foreground underline underline-offset-4 hover:text-primary">
        Ver mi progreso
      </button>
      {metrics.error && <span className="w-full text-destructive">{metrics.error}</span>}
    </div>
  );

  const saveMealPref = (key: string, value: string) => {
    if (isGuest) return;
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  };
  const handleMealsPerDayChange = (n: MealsPerDay) => {
    setMealsPerDay(n);
    saveMealPref('cycle_sync_meals_per_day', String(n));
  };
  const handleFirstMealTimeChange = (time: string) => {
    setFirstMealTime(time);
    saveMealPref('cycle_sync_first_meal_time', time);
  };

  // Analyze tab state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate tab state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  const phase = cycleInfo?.phase ?? 'Follicular';
  const phaseNameEs = ({ Menstrual: 'Menstrual', Follicular: 'Folicular', Ovulation: 'Ovulación', Luteal: 'Lútea' } as Record<string, string>)[phase] || phase;
  const phaseDisplay = isEs ? phaseNameEs : phase;
  const { likes, avoid } = foodPrefs.prefs;

  const openRecipe = library.recipes.find((r) => r.id === openRecipeId) ?? null;

  // Recipes ranked for the current phase, skipping foods the user avoids.
  const phaseKey = toPhaseKey(phase);
  const phaseFocus = FOOD_FOCUS[phaseKey];
  const phasePicks = useMemo(
    () => rankRecipesForPhase(library.recipes.filter((r) => avoidedIn(r, avoid).length === 0), phaseKey, isEs ? 'es' : 'en', 6),
    [library.recipes, avoid, phaseKey, isEs]
  );
  const filtersActive = library.filters.favoritesOnly || library.filters.mineOnly || library.filters.skipAvoided
    || library.filters.withLiked || library.filters.tags.length > 0 || !!library.filters.text;
  const suggestions = suggestedTags(language);
  const nutritionTargets = useMemo(
    () => calculateNutritionTargets(userWeightKg, userHeightCm),
    [userWeightKg, userHeightCm]
  );
  const mealPlan = useMemo(
    () => buildProteinMealPlan(nutritionTargets, mealsPerDay, firstMealTime),
    [nutritionTargets, mealsPerDay, firstMealTime]
  );
  const ideasCard = <ProteinWaterIdeas targets={nutritionTargets} plan={mealPlan} hideNumbers={hideNumbers} recipes={library.recipes} onOpenRecipe={(r) => setOpenRecipeId(r.id)} />;
  const mealPlanCard = (
    <ProteinMealPlanCard
      plan={mealPlan}
      firstMealTime={firstMealTime}
      onMealsPerDayChange={handleMealsPerDayChange}
      onFirstMealTimeChange={handleFirstMealTimeChange}
      hideNumbers={hideNumbers}
    />
  );
  const [showAllTags, setShowAllTags] = useState(false);
  // Show the most used tags; selected ones always stay visible.
  const visibleTags = showAllTags
    ? library.tagOptions
    : library.tagOptions.filter((t, i) => i < TAGS_COLLAPSED || library.filters.tags.includes(t.key));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPreviewImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (previewImage) analyzePlate(previewImage, language);
  };

  const addIngredient = (value = ingredientInput) => {
    const trimmed = value.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };
  // Phase foods to add with one tap, skipping what is already added or avoided.
  const avoidedNames = entriesToNames(avoid, language).map((n) => n.toLowerCase());
  const ingredientIdeas = [...new Set(phaseFocus.foods.map((fd) => fd.label[language === 'en' ? 'en' : 'es']))]
    .filter((n) => !ingredients.includes(n) && !avoidedNames.includes(n.toLowerCase()))
    .slice(0, 8);

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter((i) => i !== ing));
  };

  const toggleDietary = (pref: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0 && likes.length === 0) return;
    setGeneration({ loading: true, error: null, result: null });
    try {
      const result = await generateRecipes({
        ingredients: ingredients.length > 0 ? ingredients : entriesToNames(likes, language).slice(0, 20),
        phase,
        dietary: dietaryPrefs,
        language,
        proteinPerMeal: hideNumbers ? undefined : mealPlan.perMealRange,
        likes: entriesToNames(likes, language),
        avoid: entriesToNames(avoid, language),
        pmos: showPmos,
      });
      setGeneration({ loading: false, error: null, result });
      await library.refresh();
    } catch (err: any) {
      setGeneration({ loading: false, error: err.message || 'Failed to generate recipes', result: null });
    }
  };

  const allTabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'plate', label: isEs ? 'Armar plato y alimentos' : 'Plate builder', icon: 'bowl_food' },
    { id: 'calculator', label: isEs ? 'Metas según peso' : 'Weight targets', icon: 'barbell' },
    { id: 'progress', label: isEs ? 'Mi progreso' : 'My progress', icon: 'insights' },
    { id: 'tastes', label: isEs ? 'Mis gustos' : 'My Tastes', icon: 'favorite' },
    { id: 'recipes', label: isEs ? 'Recetas' : 'Recipes', icon: 'restaurant' },
    { id: 'analyze', label: isEs ? 'Analizar plato' : 'Analyze plate', icon: 'photo_camera' },
    { id: 'generate', label: isEs ? 'Recetas con IA' : 'AI recipes', icon: 'auto_awesome' },
  ];
  // The weight-based targets tab is all numbers: it is not shown in no-numbers mode.
  const visibleTabs = hideNumbers ? allTabs.filter((tab) => tab.id !== 'calculator' && tab.id !== 'progress') : allTabs;
  // Guests see what they can open first; the locked tabs stay visible so they know they exist.
  const tabs = isGuest
    ? [...visibleTabs].sort((a, b) => Number(!GUEST_TABS.includes(a.id)) - Number(!GUEST_TABS.includes(b.id))
        || GUEST_TABS.indexOf(a.id) - GUEST_TABS.indexOf(b.id))
    : visibleTabs;
  const isLocked = (tab: ActiveTab) => isGuest && !GUEST_TABS.includes(tab);
  const shownTab: ActiveTab = isLocked(activeTab)
    ? 'recipes'
    : hideNumbers && (activeTab === 'calculator' || activeTab === 'progress') ? 'plate' : activeTab;

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="flex flex-col items-center w-full max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-8 pb-32">

        {/* Hero */}
        <section className="w-full rounded-3xl overflow-hidden relative garden-wash wash-sun border border-border shadow-sm">
          <GardenCorner variant="sun" className="size-28 md:size-52 opacity-75" />
          <div data-phase={phaseKey} className="flex flex-col gap-3 items-start justify-center px-6 py-6 md:px-10 md:py-8 relative z-20">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-foreground text-balance max-w-2xl">
              {isEs ? 'Nutrición para tu ciclo' : 'Nutrition for your cycle'}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-prose text-pretty">
              {hideNumbers
                ? 'Diseña tus platos, explora recetas antiinflamatorias y cuida tu energía y tu glucosa.'
                : 'Calcula tu proteína y tu agua, diseña tus platos en gramos y explora recetas antiinflamatorias para cuidar tu músculo, tu energía y tu glucosa.'}
            </p>
            <p className="inline-flex items-center gap-2 px-3.5 min-h-8 rounded-full bg-phase-soft text-phase text-sm font-medium">
              <Icon name="drop" size={16} weight="bold" />
              {cycleInfo?.paused
                ? (isEs ? 'Modo embarazo' : 'Pregnancy mode')
                : isEs
                  ? `Fase ${phaseDisplay.toLowerCase()}${cycleInfo ? `, día ${cycleInfo.cycleDay}` : ''}`
                  : `${phase} phase${cycleInfo ? `, day ${cycleInfo.cycleDay}` : ''}`}
            </p>
          </div>
        </section>

        <GuestPreviewBanner message={t.guestNutritionPreview} />

        {/* Tab Switcher */}
        <div role="tablist" aria-label={isEs ? 'Secciones de nutrición' : 'Nutrition sections'} className="w-full flex gap-1 bg-card p-1.5 rounded-2xl border border-border shadow-sm overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`nutrition-tab-${tab.id}`}
              aria-selected={shownTab === tab.id}
              aria-controls={`nutrition-panel-${tab.id}`}
              onClick={(e) => {
                // Scroll only the tab strip: scrollIntoView also shifts overflow-hidden ancestors (the app shell/sidebar).
                const btn = e.currentTarget, strip = btn.parentElement;
                if (strip) strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
                if (isLocked(tab.id)) promptSignup();
                else setActiveTab(tab.id);
              }}
              aria-disabled={isLocked(tab.id) || undefined}
              className={`flex-none sm:flex-auto min-h-11 flex items-center justify-center gap-2 px-3.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                shownTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Icon name={tab.icon} size={18} weight={shownTab === tab.id ? 'bold' : 'duotone'} />
              <span>{tab.label}</span>
              {isLocked(tab.id) && <Icon name="lock" size={14} className="opacity-70" />}
            </button>
          ))}
        </div>

        {/* === TAB 1: PLATE BUILDER & FOODS === */}
        {shownTab === 'plate' && (
          <section role="tabpanel" id="nutrition-panel-plate" aria-labelledby="nutrition-tab-plate" tabIndex={0} className="w-full flex flex-col gap-6">
            {!hideNumbers && (
              <MacroWaterCalculator
                weightKg={userWeightKg}
                onWeightChange={handleWeightChange}
                heightCm={userHeightCm}
                onHeightChange={handleHeightChange}
                compact
              />
            )}
            {!hideNumbers && weightBar}
            {mealPlanCard}
            <PlateBuilder
              weightKg={userWeightKg}
              heightCm={userHeightCm}
              mealPlan={mealPlan}
              language={language}
              suggestedRecipes={phasePicks.map((m) => m.recipe)}
              onOpenRecipe={(r) => setOpenRecipeId(r.id)}
              onSaveAsRecipe={isGuest ? undefined : async (recipe) => {
                await library.addCustom(recipe);
              }}
            />
            {ideasCard}
          </section>
        )}

        {/* === TAB 2: WEIGHT TARGETS & SCIENCE === */}
        {shownTab === 'calculator' && (
          <section role="tabpanel" id="nutrition-panel-calculator" aria-labelledby="nutrition-tab-calculator" tabIndex={0} className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <MacroWaterCalculator
              weightKg={userWeightKg}
              onWeightChange={handleWeightChange}
              heightCm={userHeightCm}
              onHeightChange={handleHeightChange}
              compact={false}
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab('plate')}
                  className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Armar un plato con estas metas
                  <Icon name="arrow_forward" size={16} weight="bold" />
                </button>
              }
            />

            {weightBar}

            {mealPlanCard}

            {ideasCard}

            {/* Why these targets: short answer visible, detail on demand */}
            <section aria-labelledby="targets-why" className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-2">
              <h3 id="targets-why" className="text-foreground text-lg font-semibold text-balance">
                Por qué estas metas
              </h3>
              <div className="divide-y divide-border">
                {[
                  {
                    icon: 'barbell',
                    title: 'Proteína: 1.6 a 2.2 g por kg',
                    answer: nutritionTargets.usesAdjustedWeight
                      ? `Para ${userWeightKg} kg y ${nutritionTargets.heightCm} cm son ${nutritionTargets.proteinRange[0]} a ${nutritionTargets.proteinRange[1]} g al día, calculados sobre ${nutritionTargets.proteinReferenceKg} kg.`
                      : `Para ${userWeightKg} kg son ${nutritionTargets.proteinRange[0]} a ${nutritionTargets.proteinRange[1]} g al día.`,
                    body: (
                      <>
                        El músculo es el principal lugar donde tu cuerpo usa la glucosa, así que cuidarlo ayuda {showPmos ? 'con la resistencia a la insulina del PMOS' : 'a mantener estable tu glucosa'}. Si comes menos de lo que gastas y no recibes suficiente proteína, el cuerpo tiende a usar aminoácidos del músculo. Entre <strong>1.8 y 2.2 g/kg</strong> repara el músculo y gasta más energía al digerirse: entre 20 y 30% de las calorías de la proteína se queman al digerirla.
                        {' '}Con más peso, multiplicar por cada kilo da metas difíciles de alcanzar y que tu cuerpo no necesita, porque el tejido graso usa muy poca proteína. Si nos das tu estatura, calculamos sobre el peso que tendrías con un IMC de 25, sin bajar nunca de unos 0.9 a 1 g por kilo de tu peso actual, que es lo que protege el músculo al bajar de peso.
                      </>
                    ),
                  },
                  {
                    icon: 'drop',
                    title: 'Agua: 35 a 40 ml por kg',
                    answer: nutritionTargets.usesAdjustedWeight
                      ? `Para ti son unos ${nutritionTargets.waterLiters} litros al día, calculados sobre ${nutritionTargets.adjustedWeightKg} kg.`
                      : `Para ${userWeightKg} kg son unos ${nutritionTargets.waterLiters} litros al día.`,
                    body: (
                      <>
                        El músculo magro es más de <strong>75% agua</strong>. Con solo 2% de deshidratación en las células, la fuerza muscular puede bajar hasta 15% y se frena la quema de grasa. Un cuerpo más grande necesita más agua, pero el tejido graso tiene menos agua que el músculo, así que con tu estatura usamos un peso ajustado: el de referencia más 40% de la diferencia. Una quinta parte del agua llega con la comida.
                      </>
                    ),
                  },
                  {
                    icon: 'flame',
                    title: 'Comer suficiente',
                    answer: 'La energía de referencia es una estimación, no un objetivo.',
                    body: (
                      <>
                        Comer muy por debajo de lo que gastas puede alterar la ovulación, el sueño y la tiroides. Reparte la proteína en tus comidas y deja que el hambre y la energía guíen las porciones.
                      </>
                    ),
                  },
                  {
                    icon: 'bowl_food',
                    title: 'Cómo repartirla en cada plato',
                    answer: `Para ${userWeightKg} kg, unos ${mealPlan.perMealRange[0]} a ${mealPlan.perMealRange[1]} g en cada una de ${mealPlan.mealsPerDay} comidas, cada ${mealPlan.spacingHours} horas.`,
                    body: (
                      <>
                        Absorbes toda la proteína que comes, pero el músculo solo usa una parte de cada comida para construirse: con <strong>0.4 a 0.55 g/kg por comida</strong> esa respuesta se activa por completo. Lo que pasa de ahí no se desperdicia, se usa como energía o para otros tejidos, por eso conviene repartir la meta en 3 o 4 comidas en lugar de juntarla en una. Busca fuentes completas como pechuga, salmón, huevos, ternera magra o tofu, junto a carbohidratos complejos y fibra que te sacie.
                      </>
                    ),
                  },
                ].map((item, idx) => (
                  <details key={item.title} open={idx === 0} className="group py-1">
                    <summary className="flex items-center gap-3 min-h-14 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
                      <Icon name={item.icon} size={20} weight="duotone" className="text-leaf shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-base font-semibold text-foreground">{item.title}</span>
                        <span className="block text-sm text-muted-foreground">{item.answer}</span>
                      </span>
                      <Icon name="chevron_right" size={18} weight="bold" className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="pl-8 pb-3 pr-6 text-base text-muted-foreground leading-relaxed max-w-prose text-pretty">{item.body}</p>
                  </details>
                ))}
              </div>
              <p className="text-sm text-muted-foreground pt-2 text-pretty">
                Basado en las guías de la Sociedad Internacional de Nutrición Deportiva (ISSN) y de McMaster University.
              </p>
            </section>
          </section>
        )}

        {/* === BODY PROGRESS TAB === */}
        {shownTab === 'progress' && (
          <section role="tabpanel" id="nutrition-panel-progress" aria-labelledby="nutrition-tab-progress" tabIndex={0} className="w-full">
            <BodyProgress
              entries={metrics.entries}
              loading={metrics.loading}
              saving={metrics.saving}
              error={metrics.error}
              add={metrics.add}
              remove={metrics.remove}
              profile={body.profile}
              saveProfile={body.save}
              profileAvailable={body.available}
            />
          </section>
        )}

        {/* === MY TASTES TAB === */}
        {shownTab === 'tastes' && (
          <div role="tabpanel" id="nutrition-panel-tastes" aria-labelledby="nutrition-tab-tastes" className="w-full">
          <FoodPreferencesPanel
            prefs={foodPrefs.prefs}
            language={language}
            onSetFood={foodPrefs.setFood}
            onSetSun={foodPrefs.setSun}
            onSetActivity={foodPrefs.setActivity}
            onClearFoods={foodPrefs.clearFoods}
            onSeeRecipes={() => {
              library.setFilters({
                ...EMPTY_RECIPE_FILTERS,
                skipAvoided: avoid.length > 0,
                withLiked: likes.length > 0,
              });
              setActiveTab('recipes');
            }}
            onGenerate={() => setActiveTab('generate')}
          />
          </div>
        )}

        {/* === RECIPES TAB === */}
        {shownTab === 'recipes' && (
          <section role="tabpanel" id="nutrition-panel-recipes" aria-labelledby="nutrition-tab-recipes" tabIndex={0} className="w-full flex flex-col gap-6">
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">search</span>
                  <input
                    value={library.filters.text}
                    onChange={(e) => library.setFilters({ ...library.filters, text: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={isEs ? 'Buscar por título, etiqueta o ingrediente...' : 'Search by title, tag or ingredient...'}
                  />
                </div>
                {!isGuest && <button
                  onClick={() => setShowRecipeForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  {isEs ? 'Nueva receta' : 'New recipe'}
                </button>}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {!isGuest && <>
                <button
                  onClick={() => library.setFilters({ ...library.filters, favoritesOnly: !library.filters.favoritesOnly })}
                  aria-pressed={library.filters.favoritesOnly}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                    library.filters.favoritesOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">favorite</span> {isEs ? 'Favoritos' : 'Favorites'}
                </button>
                <button
                  onClick={() => library.setFilters({ ...library.filters, mineOnly: !library.filters.mineOnly })}
                  aria-pressed={library.filters.mineOnly}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                    library.filters.mineOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span> {isEs ? 'Mis recetas' : 'My recipes'}
                </button>
                {avoid.length > 0 && (
                  <button
                    onClick={() => library.setFilters({ ...library.filters, skipAvoided: !library.filters.skipAvoided })}
                    aria-pressed={library.filters.skipAvoided}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                      library.filters.skipAvoided ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon name="close" size={14} weight="bold" /> {isEs ? 'Sin lo que evito' : 'Without what I avoid'}
                  </button>
                )}
                {likes.length > 0 && (
                  <button
                    onClick={() => library.setFilters({ ...library.filters, withLiked: !library.filters.withLiked })}
                    aria-pressed={library.filters.withLiked}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                      library.filters.withLiked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon name="favorite" size={14} /> {isEs ? 'Con mis alimentos' : 'With foods I like'}
                  </button>
                )}
                {likes.length === 0 && avoid.length === 0 && (
                  <button
                    onClick={() => setActiveTab('tastes')}
                    className="inline-flex items-center px-4 min-h-10 rounded-full text-sm font-medium bg-secondary text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {isEs ? 'Elegir mis gustos' : 'Set my tastes'}
                  </button>
                )}
                </>}
                {visibleTags.map((tag) => {
                  const active = library.filters.tags.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      onClick={() =>
                        library.setFilters({
                          ...library.filters,
                          tags: active ? library.filters.tags.filter((t) => t !== tag.key) : [...library.filters.tags, tag.key],
                        })
                      }
                      aria-pressed={active}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
                {library.tagOptions.length > TAGS_COLLAPSED && (
                  <button
                    onClick={() => setShowAllTags((v) => !v)}
                    aria-expanded={showAllTags}
                    className="inline-flex items-center gap-1 px-3 min-h-10 rounded-full text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    {showAllTags
                      ? (isEs ? 'Ver menos' : 'Show fewer')
                      : (isEs ? `Más etiquetas (${library.tagOptions.length - TAGS_COLLAPSED})` : `More tags (${library.tagOptions.length - TAGS_COLLAPSED})`)}
                  </button>
                )}
                {(library.filters.favoritesOnly || library.filters.mineOnly || library.filters.skipAvoided || library.filters.withLiked || library.filters.tags.length > 0 || library.filters.text) && (
                  <button
                    onClick={() => library.setFilters(EMPTY_RECIPE_FILTERS)}
                    className="min-h-10 px-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    {isEs ? 'Limpiar filtros' : 'Clear filters'}
                  </button>
                )}
              </div>
            </div>

            {!filtersActive && !cycleInfo?.paused && phasePicks.length > 0 && (
              <div data-phase={phaseKey} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-phase">auto_awesome</span>
                    {isGuest
                      ? (isEs ? `Ejemplo: recetas para la fase ${phaseDisplay}` : `Example: recipes for the ${phase} phase`)
                      : (isEs ? `Para tu fase ${phaseDisplay}` : `For your ${phase} phase`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">{phaseFocus.why[isEs ? 'es' : 'en']}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {phaseFocus.nutrients.map((n) => (
                      <span key={n.en} className="text-xs font-bold px-2.5 py-1 rounded-full bg-phase-soft text-phase">{n[isEs ? 'es' : 'en']}</span>
                    ))}
                  </div>
                </div>
                <PhaseRecipePicks matches={phasePicks} onOpen={(r) => setOpenRecipeId(r.id)} />
              </div>
            )}

            {library.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">{library.error}</div>
            )}

            {library.loading ? (
              <p className="text-muted-foreground text-center py-12">{isEs ? 'Cargando tus recetas...' : 'Loading your recipes...'}</p>
            ) : library.filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {library.filtered.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onToggleFavorite={isGuest ? undefined : library.toggleFavorite}
                    onOpen={(rec) => setOpenRecipeId(rec.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-muted-foreground opacity-50">bookmark</span>
                <p className="text-muted-foreground mt-4">
                  {library.recipes.length === 0
                    ? (isEs ? 'Aún no tienes recetas guardadas. Las recetas que busques se guardan aquí, y puedes añadir las tuyas.' : 'No saved recipes yet. Recipes you search for are saved here, and you can add your own.')
                    : (isEs ? 'Ninguna receta coincide con tus filtros.' : 'No recipes match your filters.')}
                </p>
              </div>
            )}
          </section>
        )}

        {/* === ANALYZE PLATE TAB === */}
        {shownTab === 'analyze' && (
          <section role="tabpanel" id="nutrition-panel-analyze" aria-labelledby="nutrition-tab-analyze" tabIndex={0} className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-semibold text-balance">{isEs ? 'Analiza tu plato' : 'Analyze your plate'}</h3>
                  <p className="text-muted-foreground text-sm">{isEs ? 'Sube una foto de tu comida para obtener un análisis nutricional con IA' : 'Upload a photo of your meal for AI-powered nutritional analysis'}</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {previewImage ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={previewImage} alt="Meal preview" className="w-full max-h-[400px] object-cover" />
                  <button
                    onClick={() => { setPreviewImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    aria-label={isEs ? 'Quitar foto' : 'Remove photo'}
                    className="absolute top-3 right-3 bg-black/60 text-white size-11 inline-flex items-center justify-center rounded-full hover:bg-black/80 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-5xl text-muted-foreground">add_a_photo</span>
                  <p className="text-muted-foreground font-medium">{isEs ? 'Haz clic para subir una foto de tu comida' : 'Click to upload a photo of your meal'}</p>
                  <p className="text-muted-foreground text-xs">{isEs ? 'JPG, PNG hasta 10MB' : 'JPG, PNG up to 10MB'}</p>
                </button>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!previewImage || analysis.loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">{analysis.loading ? 'hourglass_empty' : 'auto_awesome'}</span>
                {analysis.loading ? (isEs ? 'Analizando con IA...' : 'Analyzing with AI...') : (isEs ? 'Analizar nutrición' : 'Analyze nutrition')}
              </button>
            </div>

            {analysis.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
                {analysis.error}
              </div>
            )}

            {analysis.raw && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <h3 className="text-foreground text-lg font-semibold text-balance">{isEs ? 'Resultados del análisis' : 'Analysis results'}</h3>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_strong]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: analysis.raw
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                      .replace(/^- (.*$)/gm, '<li>$1</li>')
                      .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* === AI RECIPE GENERATOR TAB === */}
        {shownTab === 'generate' && (
          <section role="tabpanel" id="nutrition-panel-generate" aria-labelledby="nutrition-tab-generate" data-phase={phaseKey} tabIndex={0} className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-semibold text-balance">{isEs ? 'Generador de recetas con IA' : 'AI recipe generator'}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">
                    {isEs
                      ? 'Dinos qué tienes en casa y creamos 3 recetas que respetan tus gustos y tu fase.'
                      : 'Tell us what you have at home and we create 3 recipes that fit your tastes and phase.'}
                  </p>
                </div>
              </div>
              <div className="bg-phase-soft rounded-xl p-4 flex flex-col gap-2">
                <p className="text-phase text-sm font-semibold">{isEs ? `Fase ${phaseDisplay}` : `${phase} phase`}</p>
                <p className="text-foreground/90 text-sm text-pretty">{phaseFocus.why[isEs ? 'es' : 'en']}</p>
              </div>

              {/* Ingredient Input */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{isEs ? 'Tus ingredientes' : 'Your ingredients'}</label>
                <div className="flex gap-2">
                  <input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={isEs ? 'Escribe un ingrediente y presiona Enter...' : 'Type an ingredient and press Enter...'}
                  />
                  <button
                    onClick={() => addIngredient()}
                    aria-label={isEs ? 'Añadir ingrediente' : 'Add ingredient'}
                    className="px-4 min-h-11 bg-secondary hover:bg-accent rounded-lg border border-border transition-colors"
                  >
                    <span className="material-symbols-outlined text-foreground">add</span>
                  </button>
                </div>
                {ingredientIdeas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">{isEs ? 'Ideas para tu fase, toca para añadir' : 'Ideas for your phase, tap to add'}</p>
                    <div className="flex flex-wrap gap-2">
                      {ingredientIdeas.map((idea) => (
                        <button
                          key={idea}
                          onClick={() => addIngredient(idea)}
                          className="text-sm bg-secondary text-muted-foreground px-3.5 min-h-10 rounded-full hover:bg-accent transition-colors inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">add</span>
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ingredients.map((ing) => (
                      <button
                        key={ing}
                        onClick={() => removeIngredient(ing)}
                        className="text-sm bg-primary/10 text-primary px-3.5 min-h-10 rounded-full hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5 font-medium"
                      >
                        {ing}
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tastes */}
              {(likes.length > 0 || avoid.length > 0) ? (
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 text-sm flex flex-col gap-1.5">
                  {likes.length > 0 && (
                    <p className="text-foreground/90">
                      <strong>{isEs ? 'Favoritos: ' : 'Favorites: '}</strong>
                      {entriesToNames(likes, language).join(', ')}
                      {ingredients.length === 0 && (isEs ? ' (se usan si no escribes ingredientes)' : ' (used when you type no ingredients)')}
                    </p>
                  )}
                  {avoid.length > 0 && (
                    <p className="text-foreground/90">
                      <strong>{isEs ? 'Se evitan: ' : 'Avoided: '}</strong>
                      {entriesToNames(avoid, language).join(', ')}
                    </p>
                  )}
                  <button onClick={() => setActiveTab('tastes')} className="self-start text-xs text-muted-foreground hover:text-foreground underline">
                    {isEs ? 'Editar mis gustos' : 'Edit my tastes'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setActiveTab('tastes')} className="self-start text-sm text-muted-foreground hover:text-foreground underline">
                  {isEs ? 'Elige tus alimentos favoritos y los que evitas para que las recetas se ajusten a ti' : 'Pick your favorite foods and the ones you avoid so recipes fit you'}
                </button>
              )}

              {/* Dietary Preferences */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{isEs ? 'Preferencias dietarias' : 'Dietary preferences'}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Low GI', es: 'Bajo IG', en: 'Low GI' },
                    { id: 'Anti-inflammatory', es: 'Antiinflamatorio', en: 'Anti-inflammatory' },
                    { id: 'Gluten Free', es: 'Sin gluten', en: 'Gluten Free' },
                    { id: 'Dairy Free', es: 'Sin lácteos', en: 'Dairy Free' },
                    { id: 'Vegetarian', es: 'Vegetariano', en: 'Vegetarian' },
                    { id: 'Vegan', es: 'Vegano', en: 'Vegan' },
                    { id: 'High Protein', es: 'Alto en proteína', en: 'High Protein' },
                  ].map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => toggleDietary(pref.id)}
                      className={`px-4 min-h-10 rounded-full text-sm font-medium transition-colors ${
                        dietaryPrefs.includes(pref.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {isEs ? pref.es : pref.en}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={(ingredients.length === 0 && likes.length === 0) || generation.loading}
                className="w-full bg-bloom hover:brightness-105 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <span className={`material-symbols-outlined ${generation.loading ? 'animate-spin' : ''}`} aria-hidden="true">{generation.loading ? 'progress_activity' : 'auto_awesome'}</span>
                {generation.loading ? (isEs ? 'Creando recetas, puede tardar unos segundos...' : 'Creating recipes, this can take a few seconds...') : (isEs ? `Generar recetas para la fase ${phaseDisplay}` : `Generate ${phase}-Phase Recipes`)}
              </button>
            </div>

            {generation.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
                {generation.error}
              </div>
            )}

            {generation.result && (
              <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  <h3 className="text-foreground text-lg font-semibold text-balance">
                    {isEs
                      ? (generation.result.saved.length > 0 ? 'Nuevas recetas añadidas al catálogo' : 'Sin recetas nuevas esta vez')
                      : (generation.result.saved.length > 0 ? 'New recipes added to the catalog' : 'No new recipes this time')}
                  </h3>
                </div>
                {generation.result.saved.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generation.result.saved
                      .map((s) => library.recipes.find((r) => r.id === s.id))
                      .filter((r): r is NonNullable<typeof r> => !!r)
                      .map((r) => (
                        <RecipeCard
                          key={r.id}
                          recipe={r}
                          onToggleFavorite={isGuest ? undefined : library.toggleFavorite}
                          onOpen={(rec) => setOpenRecipeId(rec.id)}
                        />
                      ))}
                  </div>
                )}
                {generation.result.duplicates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {isEs
                      ? `Ya estaban en el catálogo, por lo que no se agregaron de nuevo: ${generation.result.duplicates.join(', ')}.`
                      : `Already in the catalog, so not added again: ${generation.result.duplicates.join(', ')}.`}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {openRecipe && (
        <RecipeDetailModal
          recipe={openRecipe}
          onClose={() => setOpenRecipeId(null)}
          onToggleFavorite={isGuest ? undefined : library.toggleFavorite}
          onSetTags={isGuest ? undefined : library.setMyTags}
          onDelete={openRecipe.ownerId && !isGuest ? library.removeOwn : undefined}
          suggestions={suggestions}
        />
      )}
      {showRecipeForm && !isGuest && (
        <RecipeForm
          onSubmit={async (input) => {
            await library.addCustom(input);
          }}
          onClose={() => setShowRecipeForm(false)}
          language={language}
          suggestions={suggestions}
        />
      )}
    </div>
  );
};

export default Nutrition;
