'use client';

import React, { useState, useRef } from 'react';
import { useRecipes, EMPTY_RECIPE_FILTERS } from '@/hooks/useRecipes';
import { useNutritionAI } from '@/hooks/useNutritionAI';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import { generateRecipes, suggestedTags, type GenerateResult } from '@/services/recipesService';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeForm } from './components/RecipeForm';

type ActiveTab = 'recipes' | 'analyze' | 'generate';

const Nutrition: React.FC = () => {
  const library = useRecipes();
  const { analysis, analyzePlate } = useNutritionAI();
  const { cycleInfo } = useCycleInfo();
  const { language } = useLanguage();
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [generation, setGeneration] = useState<{ loading: boolean; error: string | null; result: GenerateResult | null }>({
    loading: false,
    error: null,
    result: null,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');

  // Analyze tab state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate tab state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  const phase = cycleInfo?.phase ?? 'Follicular';

  const openRecipe = library.recipes.find((r) => r.id === openRecipeId) ?? null;
  const suggestions = suggestedTags(language);

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

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter((i) => i !== ing));
  };

  const toggleDietary = (pref: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) return;
    setGeneration({ loading: true, error: null, result: null });
    try {
      const result = await generateRecipes({ ingredients, phase, dietary: dietaryPrefs, language });
      setGeneration({ loading: false, error: null, result });
      await library.refresh();
    } catch (err: any) {
      setGeneration({ loading: false, error: err.message || 'Failed to generate recipes', result: null });
    }
  };

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'recipes', label: 'Recipes', icon: 'restaurant' },
    { id: 'analyze', label: 'Analyze Plate', icon: 'photo_camera' },
    { id: 'generate', label: 'AI Recipes', icon: 'auto_awesome' },
  ];

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-8 pb-32">

        {/* Hero */}
        <section className="w-full rounded-3xl overflow-hidden relative bg-gradient-to-br from-card via-card to-blossom-soft/40 border border-border shadow-sm">
          <div className="flex flex-col gap-4 items-start justify-center px-6 py-8 md:px-10 relative z-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blossom-soft text-blossom text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">water_drop</span>
              {phase} Phase {cycleInfo ? `• Day ${cycleInfo.cycleDay}` : ''}
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-2xl">
              Nourish Your Body
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-normal leading-relaxed max-w-xl">
              Cycle-synced nutrition powered by AI. Analyze your meals, discover recipes, and optimize for your hormonal phase.
            </p>
          </div>
        </section>


        {/* Tab Switcher */}
        <div className="w-full flex gap-1.5 bg-card/80 backdrop-blur p-1.5 rounded-full border border-border shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-blossom/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* === RECIPES TAB === */}
        {activeTab === 'recipes' && (
          <section className="w-full flex flex-col gap-6">
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">search</span>
                  <input
                    value={library.filters.text}
                    onChange={(e) => library.setFilters({ ...library.filters, text: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Search by title, tag or ingredient..."
                  />
                </div>
                <button
                  onClick={() => setShowRecipeForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  New recipe
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => library.setFilters({ ...library.filters, favoritesOnly: !library.filters.favoritesOnly })}
                  aria-pressed={library.filters.favoritesOnly}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${
                    library.filters.favoritesOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">favorite</span> Favorites
                </button>
                <button
                  onClick={() => library.setFilters({ ...library.filters, mineOnly: !library.filters.mineOnly })}
                  aria-pressed={library.filters.mineOnly}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${
                    library.filters.mineOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span> My recipes
                </button>
                {library.allTags.map((tag) => {
                  const active = library.filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        library.setFilters({
                          ...library.filters,
                          tags: active ? library.filters.tags.filter((t) => t !== tag) : [...library.filters.tags, tag],
                        })
                      }
                      aria-pressed={active}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
                {(library.filters.favoritesOnly || library.filters.mineOnly || library.filters.tags.length > 0 || library.filters.text) && (
                  <button
                    onClick={() => library.setFilters(EMPTY_RECIPE_FILTERS)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {library.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">{library.error}</div>
            )}

            {library.loading ? (
              <p className="text-muted-foreground text-center py-12">Loading your recipes...</p>
            ) : library.filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {library.filtered.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onToggleFavorite={library.toggleFavorite}
                    onOpen={(rec) => setOpenRecipeId(rec.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-muted-foreground opacity-50">bookmark</span>
                <p className="text-muted-foreground mt-4">
                  {library.recipes.length === 0
                    ? 'No saved recipes yet. Recipes you search for are saved here, and you can add your own.'
                    : 'No recipes match your filters.'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* === ANALYZE PLATE TAB === */}
        {activeTab === 'analyze' && (
          <section className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-bold">Analyze Your Plate</h3>
                  <p className="text-muted-foreground text-sm">Upload a photo of your meal for AI-powered nutritional analysis</p>
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
                    className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/80 transition-colors"
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
                  <p className="text-muted-foreground font-medium">Click to upload a photo of your meal</p>
                  <p className="text-muted-foreground text-xs">JPG, PNG up to 10MB</p>
                </button>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!previewImage || analysis.loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">{analysis.loading ? 'hourglass_empty' : 'auto_awesome'}</span>
                {analysis.loading ? 'Analyzing with AI...' : 'Analyze Nutrition'}
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
                  <h3 className="text-foreground text-lg font-bold">Analysis Results</h3>
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
        {activeTab === 'generate' && (
          <section className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-bold">AI Recipe Generator</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your available ingredients and get anti-inflammatory recipes for your {phase} phase
                  </p>
                </div>
              </div>

              {/* Ingredient Input */}
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground">Your Ingredients</label>
                <div className="flex gap-2">
                  <input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type an ingredient and press Enter..."
                  />
                  <button
                    onClick={addIngredient}
                    className="px-4 py-3 bg-secondary hover:bg-accent rounded-lg border border-border transition-colors"
                  >
                    <span className="material-symbols-outlined text-foreground">add</span>
                  </button>
                </div>
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ingredients.map((ing) => (
                      <button
                        key={ing}
                        onClick={() => removeIngredient(ing)}
                        className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition flex items-center gap-1 font-medium"
                      >
                        {ing}
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground">Dietary Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {['Low GI', 'Anti-inflammatory', 'Gluten Free', 'Dairy Free', 'Vegetarian', 'Vegan', 'High Protein'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => toggleDietary(pref)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dietaryPrefs.includes(pref)
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={ingredients.length === 0 || generation.loading}
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">{generation.loading ? 'hourglass_empty' : 'auto_awesome'}</span>
                {generation.loading ? 'Generating Recipes...' : `Generate ${phase}-Phase Recipes`}
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
                  <h3 className="text-foreground text-lg font-bold">
                    {generation.result.saved.length > 0 ? 'New recipes added to the catalog' : 'No new recipes this time'}
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
                          onToggleFavorite={library.toggleFavorite}
                          onOpen={(rec) => setOpenRecipeId(rec.id)}
                        />
                      ))}
                  </div>
                )}
                {generation.result.duplicates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Already in the catalog, so not added again: {generation.result.duplicates.join(', ')}.
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
          onToggleFavorite={library.toggleFavorite}
          onSetTags={library.setMyTags}
          onDelete={openRecipe.ownerId ? library.removeOwn : undefined}
          suggestions={suggestions}
        />
      )}
      {showRecipeForm && (
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
