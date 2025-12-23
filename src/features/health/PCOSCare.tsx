import React, { useEffect, useState } from 'react';
import { fetchHealthArticles } from '@/services/articlesService';
import { Article } from '@/types/articles';

const PCOSCare: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                setLoading(true);
                const fetchedArticles = await fetchHealthArticles({ topic: 'PCOS', language: 'en' });
                setArticles(fetchedArticles.slice(0, 3));
                setError(null);
            } catch (err) {
                console.error('Error loading PCOS articles:', err);
                setError('Could not load latest research. Showing cached content.');
            } finally {
                setLoading(false);
            }
        };

        loadArticles();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">

            <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 lg:p-10 gap-8 pb-24">
                {/* Page Heading */}
                <header className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Your PCOS Toolkit</h1>
                        <p className="text-muted-foreground text-lg font-normal">Holistic management synchronized with your body.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-card border border-border hover:bg-accent text-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export Report
                        </button>
                    </div>
                </header>


                {/* Hero Section: Daily Tip */}
                <section className="@container w-full">
                    <div className="flex flex-col md:flex-row gap-6 bg-card rounded-xl p-6 md:p-8 border border-border relative overflow-hidden group">
                        {/* Background Gradient Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="w-full md:w-1/3 aspect-video md:aspect-auto md:h-auto bg-cover bg-center rounded-lg relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5h2zBi81sXfKN6Q_1n4witKmOPGzP-dA2oUUdvQssVXuBmyR66Tgrf70Igb0kB1dvt3p_1NFnvsp4pZ7zhLB35pnmxLHbEZexUoAUI8WDbQ4DMnqlBzdyMiIwWCOymN_eUH6OodWGxwx3JEQvYFvfAPBFQw6_cvBB_LSPjW-sWagmhNtgvTBQkgBKMMjUqRBVE1zi0qwzhi8GZVeROzZRG-tMPS3SQw0B9UHQNQu-TIwjMANq-pP7acWKKt59MOvxubbVN2LI2gY")' }}>
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>

                        <div className="flex flex-col justify-center gap-4 w-full md:w-2/3 z-10">
                            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                Daily Insight
                            </div>
                            <h2 className="text-foreground text-2xl md:text-3xl font-bold leading-tight">
                                Managing Cortisol in the Luteal Phase
                            </h2>
                            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
                                High intensity cardio can spike cortisol, which is naturally higher right now. Try swapping your run for a weighted strength session or yoga to support hormone balance and reduce inflammation.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2">
                                    Read Article
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>
                                <button className="px-5 py-2.5 rounded-lg text-foreground text-sm font-medium hover:bg-accent transition-colors border border-border bg-secondary">
                                    Save for later
                                </button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Stats Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-foreground text-xl font-bold">Nutrition Goals</h3>
                        <button className="text-primary text-sm font-medium hover:text-primary/80">Edit Goals</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Protein */}
                        <div className="bg-card rounded-xl p-5 border border-border flex flex-col gap-3 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                <span className="material-symbols-outlined text-6xl">egg_alt</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium">Protein Goal</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-foreground text-3xl font-bold">85g</span>
                                <span className="text-muted-foreground text-lg">/ 120g</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 mt-1">
                                <div className="bg-[#0bda73] h-2 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                            <p className="text-[#0bda73] text-xs font-bold flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                +70% today
                            </p>
                        </div>

                        {/* Fats */}
                        <div className="bg-card rounded-xl p-5 border border-border flex flex-col gap-3 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                <span className="material-symbols-outlined text-6xl">opacity</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium">Healthy Fats</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-foreground text-3xl font-bold">45g</span>
                                <span className="text-muted-foreground text-lg">/ 60g</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 mt-1">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <p className="text-primary text-xs font-bold flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                On track
                            </p>
                        </div>

                        {/* Fiber */}
                        <div className="bg-card rounded-xl p-5 border border-border flex flex-col gap-3 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                <span className="material-symbols-outlined text-6xl">grass</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium">Fiber Intake</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-foreground text-3xl font-bold">20g</span>
                                <span className="text-muted-foreground text-lg">/ 30g</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 mt-1">
                                <div className="bg-orange-400 h-2 rounded-full" style={{ width: '66%' }}></div>
                            </div>
                            <p className="text-orange-400 text-xs font-bold flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                Needs attention
                            </p>
                        </div>

                    </div>
                </section>

                {/* Dashboard Grid: Phase + Supplements + Symptoms */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Exercise Recommendation (Left Column) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <section className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full">
                            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
                                <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">fitness_center</span>
                                    Cycle Phase
                                </h3>
                                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Luteal</span>
                            </div>

                            <div className="p-5 flex flex-col gap-4 flex-1">
                                <p className="text-muted-foreground text-sm">Your energy might be tapering. Focus on form over speed.</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                                        <div className="size-10 rounded bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <span className="material-symbols-outlined">accessibility_new</span>
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium text-sm">Low Impact Strength</p>
                                            <p className="text-muted-foreground text-xs">25 mins • Moderate</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="material-symbols-outlined text-muted-foreground/30 group-hover:text-primary transition-colors">play_circle</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                                        <div className="size-10 rounded bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <span className="material-symbols-outlined">self_improvement</span>
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium text-sm">Evening Yoga Flow</p>
                                            <p className="text-muted-foreground text-xs">15 mins • Relaxing</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="material-symbols-outlined text-muted-foreground/30 group-hover:text-primary transition-colors">play_circle</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </section>
                    </div>

                    {/* Supplements & Symptom Tracking (Right Column) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Supplement Tracker */}
                            <section className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
                                    <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#0bda73]">medication</span>
                                        Supplements
                                    </h3>
                                    <span className="text-muted-foreground text-xs">2/4 Taken</span>
                                </div>

                                <div className="p-2 flex flex-col">
                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer group transition-colors">
                                        <input defaultChecked className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-background" type="checkbox" />
                                        <div className="flex flex-col">
                                            <span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors line-through opacity-50">Inositol (4g)</span>
                                            <span className="text-muted-foreground text-xs opacity-50">Morning</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer group transition-colors">
                                        <input defaultChecked className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-background" type="checkbox" />
                                        <div className="flex flex-col">
                                            <span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors line-through opacity-50">Vitamin D3</span>
                                            <span className="text-muted-foreground text-xs opacity-50">Morning</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer group transition-colors">
                                        <input className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-background" type="checkbox" />
                                        <div className="flex flex-col">
                                            <span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Magnesium Glycinate</span>
                                            <span className="text-muted-foreground text-xs">Before Bed</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer group transition-colors">
                                        <input className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-background" type="checkbox" />
                                        <div className="flex flex-col">
                                            <span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Spearmint Tea</span>
                                            <span className="text-muted-foreground text-xs">2 Cups</span>
                                        </div>
                                    </label>
                                </div>

                            </section>

                            {/* Symptom Insights */}
                            <section className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
                                    <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-orange-400">insights</span>
                                        Insights
                                    </h3>
                                    <select className="bg-secondary border-none text-xs text-muted-foreground rounded focus:ring-0 cursor-pointer p-1">
                                        <option>Last 30 Days</option>
                                    </select>
                                </div>
                                <div className="p-5 flex flex-col gap-4 flex-1 justify-center">
                                    <div className="flex items-end justify-between h-32 w-full gap-2 px-2">
                                        {/* Simulated Chart Bars */}
                                        <div className="w-full bg-primary/20 rounded-t-sm h-[40%] hover:bg-primary transition-colors relative group">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Low</div>
                                        </div>
                                        <div className="w-full bg-primary/20 rounded-t-sm h-[60%] hover:bg-primary transition-colors relative group">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Med</div>
                                        </div>
                                        <div className="w-full bg-primary/20 rounded-t-sm h-[30%] hover:bg-primary transition-colors relative group">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Low</div>
                                        </div>
                                        <div className="w-full bg-primary/20 rounded-t-sm h-[80%] hover:bg-primary transition-colors relative group">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">High</div>
                                        </div>
                                        <div className="w-full bg-primary/20 rounded-t-sm h-[50%] hover:bg-primary transition-colors relative group">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Med</div>
                                        </div>
                                        <div className="w-full bg-primary rounded-t-sm h-[90%] relative group"> {/* Current day */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded font-bold">Today</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground px-2">
                                        <span>Bloating Level</span>
                                    </div>
                                    <button className="w-full py-2 rounded-lg border border-border hover:bg-accent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary">
                                        Log Symptoms
                                    </button>
                                </div>

                            </section>
                        </div>
                    </div>
                </div>

                {/* Knowledge Base / Articles Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-foreground text-xl font-bold">Latest Research & Articles</h3>
                        <button className="text-primary text-sm font-medium hover:text-primary/80 flex items-center gap-1">
                            View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-80 rounded-xl bg-card animate-pulse border border-border" />
                            ))
                        ) : (
                            articles.map((article) => (
                                <article
                                    key={article.id}
                                    className="bg-card rounded-xl border border-border overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full"
                                    onClick={() => window.open(article.url, '_blank')}
                                >
                                    <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${article.imageUrl})` }}>
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                        <span className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">{article.source}</span>
                                    </div>
                                    <div className="p-5 flex flex-col gap-2 flex-1">
                                        <h4 className="text-foreground text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">{article.title}</h4>
                                        <p className="text-muted-foreground text-sm line-clamp-3">
                                            {article.description}
                                        </p>
                                        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                {new Date(article.publishedAt).toLocaleDateString()}
                                            </div>
                                            {article.author && <span className="line-clamp-1 max-w-[100px]">By {article.author}</span>}
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}

                        {!loading && articles.length === 0 && !error && (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                No articles found at the moment.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PCOSCare;