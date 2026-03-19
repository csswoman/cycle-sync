'use client';

import React, { useState, useRef } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useNutritionAI } from '@/hooks/useNutritionAI';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import { QuotaWarning } from '@/components/ui/QuotaWarning';
import { RecipeFilters } from '@/types/recipes';

type ActiveTab = 'recipes' | 'analyze' | 'generate';

const Nutrition: React.FC = () => {
  const { recipes, loading, quotaStatus, quotaExceeded, searchRecipes } = useRecipes();
  const { analysis, analyzePlate, recipe, generateRecipes } = useNutritionAI();
  const { cycleInfo } = useCycleInfo();
  const { language } = useLanguage();
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');

  // Analyze tab state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate tab state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  const phase = cycleInfo?.phase ?? 'Follicular';

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

  const handleGenerate = () => {
    if (ingredients.length > 0) {
      generateRecipes(ingredients, phase, dietaryPrefs, language);
    }
  };

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'recipes', label: 'Recipe Search', icon: 'restaurant' },
    { id: 'analyze', label: 'Analyze Plate', icon: 'photo_camera' },
    { id: 'generate', label: 'AI Recipes', icon: 'auto_awesome' },
  ];

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="flex flex-col items-center w-full px-4 md:px-10 py-6 md:py-8 gap-8 max-w-7xl mx-auto pb-24">

        {/* Hero */}
        <section className="w-full rounded-2xl overflow-hidden relative bg-gradient-to-r from-card to-secondary border border-border">
          <div className="flex flex-col gap-4 items-start justify-center px-6 py-10 md:px-12 relative z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">water_drop</span>
              {phase} Phase {cycleInfo ? `• Day ${cycleInfo.cycleDay}` : ''}
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-foreground max-w-2xl">
              Nourish Your Body
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg font-normal leading-relaxed max-w-xl">
              Cycle-synced nutrition powered by AI. Analyze your meals, discover recipes, and optimize for your hormonal phase.
            </p>
          </div>
        </section>

        <QuotaWarning quotaStatus={quotaStatus} show={quotaExceeded} />

        {/* Tab Switcher */}
        <div className="w-full flex gap-2 bg-secondary/50 p-1.5 rounded-xl border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* === RECIPES TAB === */}
        {activeTab === 'recipes' && (
          <section className="w-full flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-1/3 flex flex-col gap-6">
              <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
                <label className="block text-sm font-bold mb-3 text-foreground">What&apos;s in your kitchen?</label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., Spinach, Salmon, Chickpeas..."
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Meal Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((type) => (
                      <button key={type} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-muted-foreground text-sm font-medium transition-colors">
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dietary Preferences</h3>
                  <div className="space-y-2">
                    {['PCOS Friendly (Low GI)', 'Gluten Free', 'Vegetarian'].map((pref) => (
                      <label key={pref} className="flex items-center gap-3 cursor-pointer group">
                        <input className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary" type="checkbox" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => searchRecipes(filters)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Generate Ideas
                </button>
              </div>
            </aside>

            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
                      <div className="h-48 bg-secondary" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-full" />
                      </div>
                    </div>
                  ))
                ) : recipes.length > 0 ? (
                  recipes.map((r, idx) => (
                    <article key={r.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl cursor-pointer flex flex-col h-full">
                      <div className="relative h-48 w-full overflow-hidden">
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> {r.readyInMinutes}m
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">Top Match</div>
                        )}
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={r.image} alt={r.title} />
                      </div>
                      <div className="p-5 flex flex-col flex-1 gap-3">
                        <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">{r.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.summary?.replace(/<[^>]*>/g, '').substring(0, 120) || 'Delicious and healthy recipe'}</p>
                        <div className="mt-auto pt-3 flex flex-wrap gap-2">
                          {r.healthScore && r.healthScore > 80 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span> Healthy
                            </span>
                          )}
                          {r.diets?.slice(0, 2).map((diet) => (
                            <span key={diet} className="px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">{diet}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-muted-foreground opacity-50">restaurant</span>
                    <p className="text-muted-foreground mt-4">No recipes found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            </div>
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
                disabled={ingredients.length === 0 || recipe.loading}
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">{recipe.loading ? 'hourglass_empty' : 'auto_awesome'}</span>
                {recipe.loading ? 'Generating Recipes...' : `Generate ${phase}-Phase Recipes`}
              </button>
            </div>

            {recipe.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
                {recipe.error}
              </div>
            )}

            {recipe.raw && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  <h3 className="text-foreground text-lg font-bold">Generated Recipes</h3>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_strong]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: recipe.raw
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
      </div>
    </div>
  );
};

export default Nutrition;
