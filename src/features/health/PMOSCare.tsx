'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHealthArticles } from '@/services/articlesService';
import { Article } from '@/types/articles';
import { usePMOSSymptoms } from '@/hooks/usePMOSSymptoms';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
import { GardenCorner } from '@/components/ui/Botanical';
import PMOSMemberTools from '@/features/health/pmos/PMOSMemberTools';
import { useConfiguredSymptoms } from '@/features/health/pmos/useConfiguredSymptoms';
import { PMOS_SYMPTOM_CONFIGS } from '@/features/health/pmos/symptomFaqData';


export const PMOSCare: React.FC = () => {
  const router = useRouter();
  const { language, t } = useLanguage();
  const lang: 'es' | 'en' = language === 'es' ? 'es' : 'en';

  const { entries, todayEntry, loading, alerts } = usePMOSSymptoms();
  const { cycleInfo } = useCycleInfo();

  const [configuredSymptoms] = useConfiguredSymptoms();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    setArticlesLoading(true);
    fetchHealthArticles({ topic: 'PMOS', language })
      .then((a) => setArticles(a.slice(0, 3)))
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
  }, [language]);

  const todayTotal = configuredSymptoms.reduce((sum, k) => sum + ((todayEntry as Record<string, number> | null)?.[k] ?? 0), 0);
  const maxTotal = Math.max(configuredSymptoms.length, 1) * 3;
  const severityPct = Math.round((todayTotal / maxTotal) * 100);
  const getStatusDetails = (pct: number) => {
    if (pct === 0) {
      return {
        label: lang === 'es' ? 'Equilibrado / Sin síntomas' : 'Balanced / No symptoms',
        color: 'text-leaf',
        badge: 'bg-leaf/10 text-leaf border-leaf/30',
      };
    }
    if (pct <= 33) {
      return {
        label: lang === 'es' ? 'Carga leve' : 'Mild burden',
        color: 'text-leaf',
        badge: 'bg-leaf/10 text-leaf border-leaf/30',
      };
    }
    if (pct <= 66) {
      return {
        label: lang === 'es' ? 'Carga moderada' : 'Moderate burden',
        color: 'text-sun-ink',
        badge: 'bg-sun/10 text-sun-ink border-sun/30',
      };
    }
    return {
      label: lang === 'es' ? 'Carga elevada' : 'Elevated burden',
      color: 'text-bud',
      badge: 'bg-bud/10 text-bud border-bud/30',
    };
  };

  const status = getStatusDetails(severityPct);

  const es = lang === 'es';
  const openArticle = (url: string) => {
    if (url.startsWith('/')) router.push(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 gap-6 sm:gap-8 pb-32">
        <header className="relative overflow-hidden rounded-3xl garden-wash wash-leaf border border-border p-5 sm:p-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <GardenCorner variant="leaf" className="size-40 sm:size-56 opacity-70" />
          <div className="relative flex flex-col gap-3 min-w-0">
            {cycleInfo && (
              <p className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground bg-card/70 border border-border px-3 py-1 rounded-full">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                {cycleInfo.paused
                  ? es ? 'Modo embarazo' : 'Pregnancy mode'
                  : <>{cycleInfo.phase} &bull; {es ? 'Día' : 'Day'} {cycleInfo.cycleDay}</>}
              </p>
            )}
            <h1 className="text-foreground text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-balance">
              {es ? 'Tu espacio PMOS' : 'Your PMOS toolkit'}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch] text-pretty">
              {es
                ? 'Sigue tus síntomas, análisis y citas en un solo lugar, y mira cómo cambian con tu ciclo.'
                : 'Follow your symptoms, labs and appointments in one place, and see how they change with your cycle.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/log?tab=symptoms')}
              className="mt-1 inline-flex w-full sm:w-fit min-h-11 items-center justify-center gap-2 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit_note</span>
              {t.pmosLogMovedCta}
            </button>
          </div>

          <div className="relative flex items-center gap-4 md:flex-col md:items-start md:gap-2 p-4 sm:p-5 rounded-2xl bg-card/80 border border-border md:min-w-52">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{es ? 'Síntomas de hoy' : "Today's symptoms"}</p>
              <p className={`text-xl sm:text-2xl font-semibold tracking-tight ${status.color}`}>{status.label}</p>
            </div>
            <div className="shrink-0 md:w-full flex flex-col gap-1.5 items-end md:items-stretch">
              <div
                className="hidden md:block h-2 rounded-full bg-secondary overflow-hidden"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={maxTotal}
                aria-valuenow={todayTotal}
                aria-label={es ? 'Carga de síntomas de hoy' : "Today's symptom load"}
              >
                <div
                  className={`h-full rounded-full ${severityPct > 66 ? 'bg-bud' : severityPct > 33 ? 'bg-sun' : 'bg-leaf'}`}
                  style={{ width: `${Math.max(severityPct, 3)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {todayTotal} / {maxTotal} {es ? 'puntos' : 'pts'}
              </p>
            </div>
          </div>
        </header>

        {alerts.length > 0 && (
          <div role="status" className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
            <span className="material-symbols-outlined text-destructive text-2xl shrink-0" aria-hidden="true">warning</span>
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-foreground font-semibold text-base sm:text-lg text-balance">
                {es ? 'Síntomas elevados en los últimos 7 días' : 'Elevated symptoms in the past 7 days'}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-pretty">
                {es ? (
                  <>
                    Tus niveles de{' '}
                    <strong className="text-foreground">{alerts.map((a) => PMOS_SYMPTOM_CONFIGS[a]?.name.es ?? a).join(', ')}</strong>{' '}
                    han estado altos de forma constante durante la última semana. Revisa las recomendaciones en el icono (?) de cada síntoma y considera comentarlo con tu especialista.
                  </>
                ) : (
                  <>
                    Your{' '}
                    <strong className="text-foreground">{alerts.map((a) => PMOS_SYMPTOM_CONFIGS[a]?.name.en ?? a).join(', ')}</strong>{' '}
                    {alerts.length === 1 ? 'has' : 'have'} been consistently high over the past 7 days. Check the tips behind the (?) icon on each symptom and consider reviewing this with your healthcare provider.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <PMOSMemberTools />

        <section aria-labelledby="pmos-trends-title" className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] grid lg:grid-cols-2 lg:divide-x divide-y lg:divide-y-0 divide-border">
          <div className="p-5 sm:p-6 flex flex-col gap-5 min-w-0">
            <div>
              <h2 id="pmos-trends-title" className="text-foreground text-lg font-semibold tracking-tight text-balance">
                {es ? 'Promedio por síntoma' : 'Average per symptom'}
              </h2>
              <p className="text-sm text-muted-foreground">{es ? 'Últimos 30 días, de 0 a 3' : 'Past 30 days, 0 to 3'}</p>
            </div>
            {loading || entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-40 text-muted-foreground text-sm gap-2 text-center p-6 bg-secondary/30 rounded-2xl">
                <span className="material-symbols-outlined text-3xl opacity-60" aria-hidden="true">query_stats</span>
                <span className="text-pretty">
                  {loading
                    ? es ? 'Cargando datos…' : 'Loading data…'
                    : es ? 'Registra tus síntomas durante varios días para ver tus tendencias.' : 'Start logging symptoms to visualize long-term trends.'}
                </span>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {configuredSymptoms.map((key) => {
                  const cfg = PMOS_SYMPTOM_CONFIGS[key];
                  const avg = entries.reduce((s, e) => s + (e[key] ?? 0), 0) / entries.length;
                  const pct = (avg / 3) * 100;
                  return (
                    <li key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`material-symbols-outlined text-[20px] shrink-0 ${cfg?.color}`} aria-hidden="true">{cfg?.icon}</span>
                          <span className="text-foreground font-medium truncate">{cfg ? cfg.name[lang] : key}</span>
                        </span>
                        <span className="font-semibold text-foreground tabular-nums shrink-0">{avg.toFixed(1)}</span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden" role="presentation">
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${pct > 66 ? 'bg-bud' : pct > 33 ? 'bg-sun' : 'bg-leaf'}`}
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-5 min-w-0">
            <div>
              <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">
                {es ? 'Severidad por día' : 'Severity by day'}
              </h2>
              <p className="text-sm text-muted-foreground">{es ? 'Número del día del mes, últimos 30 días' : 'Day of the month, past 30 days'}</p>
            </div>
            {loading || entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-40 text-muted-foreground text-sm gap-2 text-center p-6 bg-secondary/30 rounded-2xl">
                <span className="material-symbols-outlined text-3xl opacity-60" aria-hidden="true">calendar_today</span>
                <span className="text-pretty">
                  {loading
                    ? es ? 'Cargando registros…' : 'Loading logs…'
                    : es ? 'No hay registros guardados todavía.' : 'No data logged yet.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
                  {entries.map((entry) => {
                    const total = configuredSymptoms.reduce((s, k) => s + (entry[k] ?? 0), 0);
                    const pct = total / (Math.max(configuredSymptoms.length, 1) * 3);
                    const bg =
                      pct > 0.6 ? 'bg-bud text-primary-foreground'
                      : pct > 0.3 ? 'bg-sun text-sun-on'
                      : pct > 0 ? 'bg-leaf text-card'
                      : 'bg-secondary text-muted-foreground';
                    const label = `${entry.date}: ${Math.round(pct * 100)}% ${es ? 'severidad' : 'severity'}`;
                    return (
                      <li
                        key={entry.date}
                        title={label}
                        aria-label={label}
                        className={`h-10 rounded-xl ${bg} flex items-center justify-center text-sm font-medium tabular-nums`}
                      >
                        {entry.date.slice(8)}
                      </li>
                    );
                  })}
                </ul>
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-3 border-t border-border/60">
                  {[
                    ['bg-leaf', es ? 'Bajo' : 'Low'],
                    ['bg-sun', es ? 'Moderado' : 'Moderate'],
                    ['bg-bud', es ? 'Alto' : 'High'],
                  ].map(([c, l]) => (
                    <li key={l} className="flex items-center gap-1.5">
                      <span className={`size-3 rounded ${c}`} aria-hidden="true" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="pmos-articles-title" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="pmos-articles-title" className="text-foreground text-xl sm:text-2xl font-semibold tracking-tight text-balance">
                {es ? 'Lecturas sobre PMOS' : 'Reading on PMOS'}
              </h2>
              <p className="text-sm text-muted-foreground text-pretty">
                {es ? 'Guías y estudios para entender tu ciclo' : 'Guides and studies to understand your cycle'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/articles')}
              className="inline-flex min-h-10 w-fit items-center gap-1.5 px-4 rounded-full text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {es ? 'Ver todos los artículos' : 'View all articles'}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articlesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-28 md:h-72 rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              articles.map((article) => (
                <article
                  key={article.id}
                  className="relative bg-card rounded-2xl border border-border overflow-hidden flex flex-row md:flex-col shadow-[var(--shadow-low)] transition-colors hover:border-primary/40 focus-within:border-primary/60"
                >
                  <div
                    className="w-28 sm:w-40 md:w-full shrink-0 md:h-40 bg-cover bg-center bg-secondary"
                    style={{ backgroundImage: `url(${article.imageUrl})` }}
                    aria-hidden="true"
                  />
                  <div className="p-4 flex flex-col gap-1.5 flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {article.source} &bull; {new Date(article.publishedAt).toLocaleDateString(es ? 'es' : 'en')}
                    </p>
                    <h3 className="text-foreground text-base font-semibold leading-snug line-clamp-3 md:line-clamp-2 text-balance">
                      <button
                        type="button"
                        onClick={() => openArticle(article.url)}
                        className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                      >
                        {article.title}
                      </button>
                    </h3>
                    <p className="hidden md:block text-muted-foreground text-sm line-clamp-3 leading-relaxed">{article.description}</p>
                  </div>
                </article>
              ))
            )}
            {!articlesLoading && articles.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground bg-secondary/30 rounded-2xl text-sm">
                {es ? 'No hay artículos disponibles en este momento.' : 'No articles found at the moment.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PMOSCare;
