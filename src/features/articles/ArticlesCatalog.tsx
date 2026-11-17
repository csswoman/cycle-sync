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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-8 animate-fade-in relative">
          {/* Back navigation */}
          <button
            onClick={handleBackToCatalog}
            className="inline-flex items-center gap-2 h-10 pl-3 pr-4 rounded-full bg-card hover:bg-card/90 border border-border/60 text-sm font-semibold text-foreground shadow-xs hover:shadow-sm transition-all group"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>{language === 'es' ? 'Volver a la biblioteca' : 'Back to library'}</span>
          </button>

          {/* Article header */}
          <header className="space-y-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blossom-soft text-foreground">
                {categories.find((c) => c.key === activeArticle.category)?.label ?? activeArticle.category}
              </span>
              {activeArticle.targetAudience === 'pmos' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-leaf/20 text-leaf">
                  PMOS / SOP
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="material-symbols-outlined text-base">schedule</span>
                {activeArticle.readTimeMinutes} {t.readTime}
              </span>
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.15] font-display text-balance">
              {activeArticle[language].title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              {activeArticle[language].summary}
            </p>
          </header>

          {/* Hero image */}
          <div className="rounded-3xl overflow-hidden border border-border/60 bg-muted aspect-[16/9] sm:aspect-[2/1] w-full">
            <img
              src={activeArticle.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/exercise-fallback.png')) img.src = '/exercise-fallback.png';
              }}
            />
          </div>

          <article className="space-y-10">
            {/* Key takeaway */}
            <aside className="p-5 sm:p-6 rounded-2xl bg-blossom-soft/40 border border-blossom/30 space-y-2">
              <h2 className="flex items-center gap-2 text-foreground font-bold text-base">
                <span aria-hidden="true" className="material-symbols-outlined text-blossom text-xl">lightbulb</span>
                {t.keyTakeaway}
              </h2>
              <p className="text-base text-foreground/90 font-medium leading-relaxed text-pretty">
                {activeArticle[language].keyTakeaway}
              </p>
            </aside>

            {/* Prose body */}
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/90 text-pretty">
              {activeArticle[language].fullText.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Guidance by cycle type */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight text-balance">
                {language === 'es'
                  ? 'Guía personalizada según tu patrón biológico'
                  : 'Personalized guidance for your biological rhythm'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2">
                  <h3 className="flex items-center gap-2 font-bold text-base text-foreground">
                    <span aria-hidden="true" className="material-symbols-outlined text-xl text-blossom">local_florist</span>
                    {t.forRegularCycle}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed text-pretty">
                    {activeArticle[language].regularCycleTips}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-leaf/5 border border-leaf/25 space-y-2">
                  <h3 className="flex items-center gap-2 font-bold text-base text-leaf">
                    <span aria-hidden="true" className="material-symbols-outlined text-xl">spa</span>
                    {t.forPmos}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed text-pretty">
                    {activeArticle[language].pmosTips}
                  </p>
                </div>
              </div>
            </section>

            {/* Action in CycleSync */}
            <section className="p-5 rounded-2xl bg-card border border-border/80 flex items-start gap-4">
              <div className="size-10 rounded-full bg-blossom-soft grid place-items-center shrink-0">
                <span aria-hidden="true" className="material-symbols-outlined text-xl text-blossom">touch_app</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">{t.actionInApp}</h2>
                <p className="text-base text-muted-foreground leading-relaxed text-pretty">
                  {activeArticle[language].appAction}
                </p>
              </div>
            </section>

            {/* Tags + disclaimer */}
            <footer className="pt-6 border-t border-border/40 space-y-4">
              <ul className="flex flex-wrap gap-2">
                {activeArticle.tags.map((tag) => (
                  <li key={tag} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-muted-foreground">
                    #{tag}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                <span aria-hidden="true" className="material-symbols-outlined text-base shrink-0">info</span>
                <span>{t.medicalDisclaimer}</span>
              </p>
            </footer>

            {/* Previous / next */}
            <nav
              aria-label={language === 'es' ? 'Más artículos' : 'More articles'}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {prevArticle ? (
                <button
                  onClick={() => handleSelectArticle(prevArticle)}
                  className="p-4 rounded-2xl bg-card border border-border/70 hover:border-border text-left space-y-1 group transition-all"
                >
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <span aria-hidden="true" className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    {language === 'es' ? 'Anterior' : 'Previous'}
                  </span>
                  <p className="text-base font-bold text-foreground line-clamp-2 text-balance">
                    {prevArticle[language].title}
                  </p>
                </button>
              ) : <div />}

              {nextArticle ? (
                <button
                  onClick={() => handleSelectArticle(nextArticle)}
                  className="p-4 rounded-2xl bg-card border border-border/70 hover:border-border text-right space-y-1 group transition-all sm:col-start-2"
                >
                  <span className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-1">
                    {language === 'es' ? 'Siguiente' : 'Next'}
                    <span aria-hidden="true" className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </span>
                  <p className="text-base font-bold text-foreground line-clamp-2 text-balance">
                    {nextArticle[language].title}
                  </p>
                </button>
              ) : null}
            </nav>
          </article>
        </main>
      ) : (
        /* CATALOG LIST VIEW */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-fade-in relative">
          {/* Header: compact title + one toolbar */}
          <header className="flex flex-col gap-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight font-display text-balance">
              {language === 'es' ? 'Guía de salud femenina' : 'Female health guide'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
              {language === 'es'
                ? 'Artículos para entender tu ciclo, entrenar y comer a tu ritmo, tengas ciclo regular o PMOS.'
                : 'Articles to understand your cycle, train and eat at your pace, whether your cycle is regular or you have PMOS.'}
            </p>
          </header>

          <div className="space-y-3">
            {/* Search and Audience Controls */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xl"
                >
                  search
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchArticles}
                  aria-label={t.searchArticles}
                  className="w-full h-11 pl-11 pr-11 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blossom/40 transition-all placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label={language === 'es' ? 'Borrar búsqueda' : 'Clear search'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>

              {/* Audience segmented control */}
              <div
                role="group"
                aria-label={language === 'es' ? 'Tipo de ciclo' : 'Cycle type'}
                className="flex items-center gap-1 p-1 bg-card border border-border rounded-2xl shrink-0 overflow-x-auto"
              >
                {([
                  { key: 'all', label: t.allAudiences, icon: null },
                  { key: 'regular', label: t.forRegularCycle, icon: 'local_florist' },
                  { key: 'pmos', label: t.forPmos, icon: 'spa' },
                ] as { key: ArticleAudience | 'all'; label: string; icon: string | null }[]).map((opt) => {
                  const isActive = selectedAudience === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedAudience(opt.key)}
                      aria-pressed={isActive}
                      className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-blossom-soft text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground font-medium'
                      }`}
                    >
                      {opt.icon && (
                        <span aria-hidden="true" className="material-symbols-outlined text-base">{opt.icon}</span>
                      )}
                      {opt.label}
                    </button>
                  );
                })}
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
                    aria-pressed={isActive}
                    className={`flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-card/70 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count summary */}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {language === 'es'
              ? `${filteredArticles.length} ${filteredArticles.length === 1 ? 'artículo' : 'artículos'}`
              : `${filteredArticles.length} ${filteredArticles.length === 1 ? 'article' : 'articles'}`}
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6 -mt-2">
            {filteredArticles.map((article) => {
              const content = article[language];
              const isPmosTarget = article.targetAudience === 'pmos';
              const categoryLabel = categories.find((c) => c.key === article.category)?.label ?? article.category;

              return (
                <article
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  className="group relative bg-card/70 hover:bg-card border border-border/70 hover:border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.endsWith('/exercise-fallback.png')) img.src = '/exercise-fallback.png';
                      }}
                    />
                    {isPmosTarget && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-leaf/85 backdrop-blur-md text-card">
                        PMOS / SOP
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span>{categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTimeMinutes} {t.readTime}</span>
                    </p>
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-foreground group-hover:text-blossom transition-colors line-clamp-2 leading-snug text-balance">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelectArticle(article); }}
                          className="text-left focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                        >
                          {content.title}
                        </button>
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {content.summary}
                      </p>
                    </div>
                    <span className="mt-auto pt-1 text-sm text-blossom font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {t.readArticle}
                      <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
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
