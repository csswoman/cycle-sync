import React from 'react';

const Nutrition: React.FC = () => {
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
              {/* Card 1 */}
              <article className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> 25m
                  </div>
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
                    Top Match
                  </div>
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDwDkvCjFZNikaF3jPrrnR_rjjr-iVpuiqEWsOEs6FzdHxwBA6FlA9uBwLw4hUgkcjfBPs7LREcXvF2KYhpeJWIjG71sV3l9ljRZ7fWDs5CjLqrkTKu_acwR2Nku-tjpa8fUKo04PFrXX4V_MY9I70yFYvLcxjQmoqchKh_N2iOJGe1BixpbWfwS9ihliOBc7mbIFLf-fIltzU18lZ4dGtUe4ipCOfK6E1CbESvf2f1TGsGVJi-4atYNeuBJVijc-kZwB5ktEyBcY" alt="Roasted Salmon" />
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">Omega-3 Power Bowl</h3>
                    <button className="text-muted-foreground hover:text-primary"><span className="material-symbols-outlined">favorite</span></button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">Roasted salmon with quinoa and steamed asparagus. Rich in anti-inflammatory fats perfect for PCOS.</p>
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                      <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span> Cycle Sync
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                      GF
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                      High Protein
                    </span>
                  </div>
                </div>
              </article>
              {/* Card 2 */}
              <article className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> 15m
                  </div>
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnyklguMUFC_r-DfIFitZtm45BMZ2A_1xAWrQO-a0dldrN-5nslPHOi0Sz49JrIt2vWfsC14R46uDZPUQaUGOqNa_BcnKKbcD7PvmJU3sDnfVKoyx8VNYPvJYdXKMsa18Nd7JD3kl3b5e4p6crKn5zG3CdaYRmXOdVkjRujJ0p9WWy2ascjW_2PciWBXOwJqwiXdzrZKsqIh1KfWGACGQ8BuBdBuSKPMZkiyk_5q0UG8fOpGeQzaOYnFj7z9Rnqi9dG_efk8uN-Dk" alt="Spinach Salad" />
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">Magnesium Boost Salad</h3>
                    <button className="text-muted-foreground hover:text-primary"><span className="material-symbols-outlined">favorite</span></button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">Spinach base with pumpkin seeds, avocado, and tahini dressing to fight cramps.</p>
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                      <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span> PMS Relief
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                      Vegan
                    </span>
                  </div>
                </div>
              </article>
              {/* Card 3 */}
              <article className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> 35m
                  </div>
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6tePsbDEzu5Qr35DlXs8dmytbC7fquM29PwsH3U5ZH8TOydHbMIMhDBKPTT575_4WU7YVRmJg63xYPyEHuOQ0hHm6Im1VGLZ_ro29JYpO5VHPo5SGGkUEVwPazCv8RQNKjLEkaeAL2MdIHzPwne3yrB-Q2yeNzSTTBaPoZAbnBWp28L_Lojnzf8bPxr4f75VXOX_vJckTBfZU2fMZtZpObJbvwbu8sDP3GydaYw6b0su8XmY-5QfriaKCj6g-RzT58fMH48N9-Ik" alt="Stuffed Sweet Potato" />
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">Stuffed Sweet Potato</h3>
                    <button className="text-muted-foreground hover:text-primary"><span className="material-symbols-outlined">favorite</span></button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">Slow-releasing carbs to stabilize blood sugar, topped with spiced chickpeas.</p>
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                      <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span> Steady Energy
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                      Low GI
                    </span>
                  </div>
                </div>
              </article>
              {/* Card 4 */}
              <article className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col h-full opacity-60 hover:opacity-100">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <span className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold border border-border">Missing Ingredients</span>
                  </div>
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9YnX-8xUU80z63tSFkoahMBHE_wBqqUIDqtnuUIxv27WqEMqaX-Mwm4fY1VJVdIXiomlCTdnZ-i92rnIMW_5luOSwQ_DiltPTGvKxW27gFNYKFVD-bXnEs8w7my1XbdrQJXRALkt-ezk_FQVPpbWl8xhuWGJl747XoyscqBO82tYVsrZFdKs6YY1PUtDKIU_N_i7fBdQim3kkGZ6hNIGeyhnacOONANioqn0SyYSneaYSS00nWDso9Pg2J8kwFvtCA-01ob2BqhQ" alt="Chia Pudding" />
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">Chocolate Chia Pudding</h3>
                    <button className="text-muted-foreground hover:text-primary"><span className="material-symbols-outlined">favorite</span></button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">Satisfy cravings healthily. You are missing Chia Seeds.</p>
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium">
                      Dessert
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                      Missing 1 Item
                    </span>
                  </div>
                </div>
              </article>
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
      </div>
    </div>
  );
};

export default Nutrition;