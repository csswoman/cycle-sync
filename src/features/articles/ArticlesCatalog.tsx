'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { getInAppArticles, getInAppArticleById } from '@/services/articlesService';
import { IN_APP_ARTICLES } from '@/data/articlesData';
import { InAppArticle, ArticleCategory, ArticleAudience } from '@/types/articles';
import { Flower } from '@/components/ui/Flower';

export default function ArticlesCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [selectedAudience, setSelectedAudience] = useState<ArticleAudience | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Sync state with URL search params
  useEffect(() => {
    const articleId = searchParams.get('id');
    if (articleId) {
      setActiveArticleId(articleId);
      // Scroll to top when opening an article
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveArticleId(null);
    }

    const cat = searchParams.get('category');
    if (cat && ['training', 'nutrition', 'pmos', 'recovery', 'tracking'].includes(cat)) {
      setSelectedCategory(cat as ArticleCategory);
    }
  }, [searchParams]);

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return getInAppArticleById(activeArticleId) ?? null;
  }, [activeArticleId]);

  const categories: { key: ArticleCategory | 'all'; label: string; icon: string }[] = [
    { key: 'all', label: t.filterAll, icon: 'apps' },
    { key: 'training', label: t.filterTraining, icon: 'fitness_center' },
    { key: 'nutrition', label: t.filterNutrition, icon: 'restaurant' },
    { key: 'pmos', label: t.filterPmos, icon: 'spa' },
    { key: 'recovery', label: t.filterRecovery, icon: 'bedtime' },
    { key: 'tracking', label: t.filterTracking, icon: 'insights' },
  ];

  const filteredArticles = useMemo(() => {
    return getInAppArticles(language, {
      category: selectedCategory,
      audience: selectedAudience,
      query: searchQuery,
    });
  }, [language, selectedCategory, selectedAudience, searchQuery]);

  const handleSelectArticle = (article: InAppArticle) => {
    setActiveArticleId(article.id);
    router.push(`/articles?id=${article.id}`, { scroll: false });
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setActiveArticleId(null);
    router.push('/articles', { scroll: false });
  };

  // Previous and Next article navigation calculation
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!activeArticle) return { prevArticle: null, nextArticle: null };
    const currentIndex = IN_APP_ARTICLES.findIndex((a) => a.id === activeArticle.id);
    const prev = currentIndex > 0 ? IN_APP_ARTICLES[currentIndex - 1] : null;
    const next = currentIndex < IN_APP_ARTICLES.length - 1 ? IN_APP_ARTICLES[currentIndex + 1] : null;
    return { prevArticle: prev, nextArticle: next };
  }, [activeArticle]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 w-full h-full overflow-y-auto overscroll-contain relative transition-colors duration-300 pb-28 md:pb-16"
    >
      {/* Background ambient accents */}
      <Flower
        petal="var(--leaf-soft)"
        center="var(--blossom-soft)"
        petals={6}
        rotate={25}
        className="absolute top-12 right-6 size-[320px] opacity-20 dark:opacity-10 pointer-events-none"
      />

      {/* ARTICLE READER VIEW (In-page full reader with native scroll) */}
      {activeArticle ? (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fade-in">
          {/* Back Button Navigation */}
          <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
            <button
              onClick={handleBackToCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card hover:bg-card/90 border border-border/60 text-xs sm:text-sm font-semibold text-foreground shadow-xs hover:shadow-sm transition-all group"
            >
              <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>{language === 'es' ? 'Volver a la biblioteca' : 'Back to library'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blossom-soft text-foreground">
                {activeArticle.category.toUpperCase()}
              </span>
              {activeArticle.targetAudience === 'pmos' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  PMOS / SOP
                </span>
              )}
            </div>
          </div>

          {/* Article Header (Masthead & Typeset) */}
          <header className="space-y-4 max-w-[72ch]">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              <span className="material-symbols-outlined text-sm text-blossom">verified</span>
              <span>CycleSync Health Library</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {activeArticle.readTimeMinutes} {t.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.18] font-display">
              {activeArticle[language].title}
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground font-normal leading-relaxed">
              {activeArticle[language].summary}
            </p>
          </header>

          {/* Hero Image */}
          <div className="rounded-3xl overflow-hidden border border-border/60 bg-muted shadow-sm aspect-[16/9] sm:aspect-[21/9] w-full relative">
            <img
              src={activeArticle.imageUrl}
              alt={activeArticle[language].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white text-[11px] font-medium">
              <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                {activeArticle.tags.map((t) => `#${t}`).join(' ')}
              </span>
            </div>
          </div>

          {/* Article Core Reading Column (Strict 65-72ch optimal measure) */}
          <article className="max-w-[72ch] mx-auto space-y-8">
            {/* Key Takeaway Callout */}
            <aside className="p-5 sm:p-6 rounded-2xl bg-blossom-soft/40 border border-blossom/30 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm sm:text-base">
                <span className="material-symbols-outlined text-blossom text-lg">lightbulb</span>
                <span>{t.keyTakeaway}</span>
              </div>
              <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
                {activeArticle[language].keyTakeaway}
              </p>
            </aside>

            {/* Prose Body */}
            <div className="space-y-5 text-[17px] sm:text-[18px] leading-[1.85] text-foreground/90 font-normal">
              {activeArticle[language].fullText.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Dual Perspective: Regular Cycle vs PMOS/SOP */}
            <section className="space-y-4 pt-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {language === 'es'
                  ? 'Guía personalizada según tu patrón biológico'
                  : 'Personalized guidance for your biological rhythm'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Regular Cycle Card */}
                <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                    <span className="text-lg">🌸</span>
                    <span>{t.forRegularCycle}</span>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                    {activeArticle[language].regularCycleTips}
                  </p>
                </div>

                {/* PMOS / Irregular Cycle Card */}
                <div className="p-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/25 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-emerald-800 dark:text-emerald-300">
                    <span className="text-lg">🌿</span>
                    <span>{t.forPmos}</span>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                    {activeArticle[language].pmosTips}
                  </p>
                </div>
              </div>
            </section>

            {/* Action in CycleSync App */}
            <section className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 flex items-start gap-4 shadow-xs">
              <div className="size-10 rounded-full bg-blossom-soft flex items-center justify-center shrink-0 text-foreground">
                <span className="material-symbols-outlined text-lg text-blossom">touch_app</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground">{t.actionInApp}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {activeArticle[language].appAction}
                </p>
              </div>
            </section>

            {/* Medical Disclaimer */}
            <footer className="pt-6 border-t border-border/40 text-xs text-muted-foreground/80 leading-relaxed flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
              <span>{t.medicalDisclaimer}</span>
            </footer>

            {/* Article Pagination (Next / Previous Navigation) */}
            <nav className="pt-8 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <button
                  onClick={() => handleSelectArticle(prevArticle)}
                  className="p-4 rounded-2xl bg-card border border-border/70 hover:border-border text-left space-y-1 group transition-all"
                >
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    {language === 'es' ? 'Artículo anterior' : 'Previous article'}
                  </span>
                  <p className="text-sm font-bold text-foreground line-clamp-2">
                    {prevArticle[language].title}
                  </p>
                </button>
              ) : <div />}

              {nextArticle ? (
                <button
                  onClick={() => handleSelectArticle(nextArticle)}
                  className="p-4 rounded-2xl bg-card border border-border/70 hover:border-border text-right space-y-1 group transition-all sm:col-start-2"
                >
                  <span className="text-xs font-semibold text-muted-foreground flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">
                    {language === 'es' ? 'Siguiente artículo' : 'Next article'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                  <p className="text-sm font-bold text-foreground line-clamp-2">
                    {nextArticle[language].title}
                  </p>
                </button>
              ) : null}
            </nav>
          </article>
        </main>
      ) : (
        /* CATALOG LIST VIEW */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-card/80 border border-border/60 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm relative overflow-hidden">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blossom-soft text-foreground text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-blossom">menu_book</span>
                <span>{t.healthLibrary}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight font-display">
                {language === 'es'
                  ? 'Guía de Salud Femenina: Ciclo, Entrenamiento y PMOS'
                  : 'Female Health Guide: Cycle, Training & PMOS'}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {language === 'es'
                  ? 'Artículos clínicos y educativos diseñados para acompañarte tanto si tienes un ciclo regular ovulatorio como si vives con PMOS o ciclos irregulares.'
                  : 'Clinical and educational articles designed to support you whether you have regular ovulatory cycles or navigate PMOS and irregular rhythms.'}
              </p>
            </div>

            {/* Search and Audience Controls */}
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchArticles}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blossom/40 transition-all placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Audience Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl shrink-0 overflow-x-auto">
                <button
                  onClick={() => setSelectedAudience('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedAudience === 'all'
                      ? 'bg-blossom-soft text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.allAudiences}
                </button>
                <button
                  onClick={() => setSelectedAudience('regular')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedAudience === 'regular'
                      ? 'bg-blossom-soft text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌸 {t.forRegularCycle}
                </button>
                <button
                  onClick={() => setSelectedAudience('pmos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedAudience === 'pmos'
                      ? 'bg-blossom-soft text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌿 {t.forPmos}
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-foreground text-background border-foreground shadow-sm'
                      : 'bg-card/70 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Count summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {language === 'es'
                ? `Mostrando ${filteredArticles.length} artículos`
                : `Showing ${filteredArticles.length} articles`}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const content = article[language];
              const isPmosTarget = article.targetAudience === 'pmos';

              return (
                <article
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  className="group bg-card/70 hover:bg-card border border-border/70 hover:border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={article.imageUrl}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white">
                        {article.category.toUpperCase()}
                      </span>
                      {isPmosTarget && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600/80 backdrop-blur-md text-white">
                          PMOS / SOP
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 backdrop-blur-sm text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{article.readTimeMinutes} {t.readTime}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-blossom transition-colors line-clamp-2 leading-snug">
                        {content.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {content.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-blossom font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {t.readArticle}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                      <div className="flex gap-1">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredArticles.length === 0 && (
            <div className="text-center py-16 px-4 bg-card/40 border border-dashed border-border rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">search_off</span>
              <p className="text-sm font-semibold text-foreground">
                {language === 'es' ? 'No se encontraron artículos' : 'No articles found'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {language === 'es'
                  ? 'Prueba ajustando los términos de búsqueda o cambiando el filtro de categoría.'
                  : 'Try adjusting your search terms or switching the category filter.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedAudience('all');
                }}
                className="mt-2 text-xs font-semibold text-blossom hover:underline"
              >
                {language === 'es' ? 'Restablecer filtros' : 'Reset filters'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
