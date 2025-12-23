import React, { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { QuotaWarning } from '@/components/ui/QuotaWarning';
import { RecipeFilters } from '@/types/recipes';

const Nutrition: React.FC = () => {
  const { recipes, loading, quotaStatus, quotaExceeded, searchRecipes } = useRecipes();
  const [filters, setFilters] = useState<RecipeFilters>({});

  const handleSearch = () => {
    searchRecipes(filters);
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="flex flex-col items-center w-full px-4 md:px-10 py-6 md:py-8 gap-8 max-w-7xl mx-auto pb-24">

        {/* Hero Status Section */}
        <section className="w-full @container rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none"></div>
          <div className="flex min-h-[320px] md:min-h-[380px] flex-col gap-4 bg-cover bg-center bg-no-repeat items-start justify-center px-6 py-10 md:px-12 relative z-20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAi6jwP2aes_G_Fb4rBpEs4xPfVQmkT1gLVXktwRbvxYy3iqST4QXacm1-3GWERgzHPkCzQkZUhWMWA7SvqhJ9EFw6SpI2HGNyR2k3SKSh0_32sdcFycDKM6JaSDvH2jqUXZfygzbL1_z96LxMBfPmi_KFO01QDKDRAsEKKWMjhmJU4op8--UzhoQ3X6dAlEACIHdBHcOGNYawwO7HbKRaEiJjzIt8YbO4XXaDc6_x-XcuCiGlY8m_EOqVtdU4i2CKOhWdYgtrFt-E")' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm">water_drop</span>
              Luteal Phase • Day 22
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-foreground max-w-2xl">
              Nourish Your Body:<br /> <span className="text-primary">PMS Support Focus</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg font-normal leading-relaxed max-w-xl">
              Progesterone is dominant. Focus on complex carbs to stabilize mood, magnesium-rich foods for cramps, and hydration to reduce bloating.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-2 bg-secondary/40 backdrop-blur-md px-4 py-2 rounded-lg border border-border">
                <span className="text-2xl">🥑</span>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Recommended Fat</span>
                  <span className="text-sm font-bold text-foreground">Healthy Omega-3s</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 backdrop-blur-md px-4 py-2 rounded-lg border border-border">
                <span className="text-2xl">🍠</span>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Carb Focus</span>
                  <span className="text-sm font-bold text-foreground">Sweet Potatoes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quota Warning */}
        <QuotaWarning quotaStatus={quotaStatus} show={quotaExceeded} />

        {/* Search & Filters Area */}
        <section className="w-full flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar: Controls */}
          <aside className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* Search Input */}
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <label className="block text-sm font-bold mb-3 text-foreground">What's in your kitchen?</label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="e.g., Spinach, Salmon, Chickpeas..." />
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition">Salmon ×</button>
                  <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition">Kale ×</button>
                </div>
              </div>
            </div>
            {/* Cycle Sync Control */}
            <div className="bg-accent/10 rounded-xl p-5 border border-primary/20 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">sync_lock</span>
                    <p className="text-base font-bold leading-tight text-foreground">Cycle Sync Priority</p>
                  </div>
                  <p className="text-muted-foreground text-xs font-normal leading-normal">Filter recipes to strictly match your luteal phase needs.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            {/* Detailed Filters */}
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col gap-6">
              {/* Meal Type */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Meal Type</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/20">All</button>
                  <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-muted-foreground text-sm font-medium transition-colors">Breakfast</button>
                  <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-muted-foreground text-sm font-medium transition-colors">Lunch</button>
                  <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-muted-foreground text-sm font-medium transition-colors">Dinner</button>
                  <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-muted-foreground text-sm font-medium transition-colors">Snacks</button>
                </div>
              </div>
              {/* Dietary Needs */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dietary Preferences</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-secondary checked:border-primary checked:bg-primary transition-all" type="checkbox" />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">PCOS Friendly (Low GI)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-secondary checked:border-primary checked:bg-primary transition-all" type="checkbox" />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Gluten Free</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-secondary checked:border-primary checked:bg-primary transition-all" type="checkbox" />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Vegetarian</span>
                  </label>
                </div>
              </div>
              {/* CTA Generate */}
              <button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                Generate Ideas
              </button>
            </div>
          </aside>
          {/* Right Side: Meal Grid */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <select className="bg-transparent border-none text-primary font-bold focus:ring-0 cursor-pointer p-0 pr-6">
                  <option>Best Match</option>
                  <option>Prep Time</option>
                  <option>Fewest Ingredients</option>
                </select>
              </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
                    <div className="h-48 bg-secondary"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-6 bg-secondary rounded w-3/4"></div>
                      <div className="h-4 bg-secondary rounded w-full"></div>
                      <div className="h-4 bg-secondary rounded w-2/3"></div>
                    </div>
                  </div>
                ))
              ) : recipes.length > 0 ? (
                // Dynamic recipe cards
                recipes.map((recipe, index) => (
                  <article key={recipe.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col h-full">
                    <div className="relative h-48 w-full overflow-hidden">
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> {recipe.readyInMinutes}m
                      </div>
                      {index === 0 && (
                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
                          Top Match
                        </div>
                      )}
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={recipe.image} alt={recipe.title} />
                    </div>
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">{recipe.title}</h3>
                        <button className="text-muted-foreground hover:text-primary">
                          <span className="material-symbols-outlined">favorite</span>
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 120) || 'Delicious and healthy recipe'}</p>
                      <div className="mt-auto pt-3 flex flex-wrap gap-2">
                        {recipe.healthScore && recipe.healthScore > 80 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                            <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span> Healthy
                          </span>
                        )}
                        {recipe.diets?.map((diet) => (
                          <span key={diet} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                            {diet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                // No recipes found
                <div className="col-span-2 text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-muted-foreground opacity-50">restaurant</span>
                  <p className="text-muted-foreground mt-4">No recipes found. Try adjusting your filters.</p>
                </div>
              )}
            </div>
            <div className="flex justify-center mt-4">
              <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                Load more suggestions
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-12 py-8 bg-secondary border-t border-border text-center text-muted-foreground text-sm w-full rounded-xl">
          <p>© 2024 CycleSync Fit. Empowering women through cycle-synced nutrition.</p>
          <p className="mt-2 text-xs opacity-60 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span> Your health data is processed locally and never shared with third parties.
          </p>
        </footer>
      </div >
    </div >
  );
};

export default Nutrition;