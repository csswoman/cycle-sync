'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHealthArticles } from '@/services/articlesService';
import { Article } from '@/types/articles';
import { usePMOSSymptoms } from '@/hooks/usePMOSSymptoms';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useLanguage } from '@/i18n/LanguageContext';
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
        color: 'text-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      };
    }
    if (pct <= 33) {
      return {
        label: lang === 'es' ? 'Carga leve' : 'Mild burden',
        color: 'text-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      };
    }
    if (pct <= 66) {
      return {
        label: lang === 'es' ? 'Carga moderada' : 'Moderate burden',
        color: 'text-amber-500',
        badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      };
    }
    return {
      label: lang === 'es' ? 'Carga elevada' : 'Elevated burden',
      color: 'text-rose-500',
      badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    };
  };

  const status = getStatusDetails(severityPct);

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-8 pb-32">
        {/* Hero Header */}
        <header className="rounded-3xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[17px]">spa</span>
                {lang === 'es' ? 'Salud Hormonal Integral' : 'Holistic Hormone Health'}
              </span>
              {cycleInfo && (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground bg-secondary/80 border border-border px-3.5 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  {cycleInfo.phase} &bull; {lang === 'es' ? 'Día' : 'Day'} {cycleInfo.cycleDay}
                </span>
              )}
            </div>

            <h1 className="text-foreground text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {lang === 'es' ? 'Kit de Bienestar PMOS / SOP' : 'Your PMOS Toolkit'}
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {lang === 'es'
                ? 'Monitorea tus síntomas personalizados, consulta las FAQs clínicas resumidas de cada punto y sincroniza tus hábitos con el ritmo de tu cuerpo.'
                : 'Monitor your personalized symptoms, explore quick clinical FAQs for each point, and sync your habits harmoniously with your cycle.'}
            </p>
          </div>

          {/* Quick status widget */}
          <div className="shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl bg-secondary/30 border border-border/80 min-w-[210px] text-center shadow-xs">
            <span className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {lang === 'es' ? 'Carga de síntomas' : 'Symptom load'}
            </span>
            <div className="flex items-baseline gap-1 my-1.5">
              <span className={`text-3xl sm:text-4xl font-black ${status.color}`}>
                {severityPct}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                ({todayTotal}/{maxTotal} pts)
              </span>
            </div>
            <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${status.badge}`}>
              {status.label}
            </span>
          </div>
        </header>

        {/* Elevated Symptoms Alert Banner */}
        {alerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-destructive/20 text-destructive rounded-xl shrink-0">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <h3 className="text-foreground font-bold text-base sm:text-lg flex items-center gap-2">
                <span>{lang === 'es' ? 'Síntomas elevados detectados' : 'Elevated Symptoms Detected'}</span>
                <span className="text-xs bg-destructive/20 text-destructive font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {lang === 'es' ? 'Últimos 7 días' : 'Past 7 days'}
                </span>
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {lang === 'es' ? (
                  <>
                    Tus niveles de{' '}
                    <strong className="text-foreground">
                      {alerts
                        .map((a) => PMOS_SYMPTOM_CONFIGS[a]?.name.es ?? a)
                        .join(', ')}
                    </strong>{' '}
                    han permanecido elevados de forma constante durante la última semana. Revisa las recomendaciones en
                    el icono (?) de cada síntoma y considera consultar con tu especialista.
                  </>
                ) : (
                  <>
                    Your{' '}
                    <strong className="text-foreground">
                      {alerts
                        .map((a) => PMOS_SYMPTOM_CONFIGS[a]?.name.en ?? a)
                        .join(', ')}
                    </strong>{' '}
                    {alerts.length === 1 ? 'has' : 'have'} been consistently elevated over the past 7 days. Check the
                    symptom tooltip FAQs and consider reviewing this with your healthcare provider.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">monitor_heart</span>
            </div>
            <div>
              <h3 className="text-foreground text-lg font-bold">{t.pmosLogMovedTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.pmosLogMovedBody}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/log?tab=symptoms')}
            className="shrink-0 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
          >
            {t.pmosLogMovedCta}
          </button>
        </section>
        {/* Member Tools (Period Forecast, Glucose, Lab Results) */}
        <PMOSMemberTools />

        {/* Trends and Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symptom Trends Card (30 Days) */}
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">insights</span>
                </div>
                <div>
                  <h3 className="text-foreground text-base sm:text-lg font-bold">
                    {lang === 'es' ? 'Tendencia de Síntomas (30 Días)' : 'Symptom Trends (30 Days)'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'es' ? 'Promedio histórico por síntoma' : 'Historical average score per symptom'}
                  </p>
                </div>
              </div>
            </div>

            {loading || entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] text-muted-foreground text-sm gap-2 text-center p-6 bg-secondary/10 rounded-xl border border-dashed border-border">
                <span className="material-symbols-outlined text-3xl opacity-50">query_stats</span>
                <span>
                  {loading
                    ? lang === 'es'
                      ? 'Cargando datos...'
                      : 'Loading data...'
                    : lang === 'es'
                    ? 'Registra tus síntomas durante varios días para ver tus tendencias.'
                    : 'Start logging symptoms to visualize long-term trends.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {configuredSymptoms.map((key) => {
                  const cfg = PMOS_SYMPTOM_CONFIGS[key];
                  const avg =
                    entries.length > 0
                      ? entries.reduce((s, e) => s + (e[key] ?? 0), 0) / entries.length
                      : 0;
                  const pct = (avg / 3) * 100;

                  return (
                    <div key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${cfg?.color}`}>
                            {cfg?.icon}
                          </span>
                          <span className="text-foreground font-semibold">
                            {cfg ? cfg.name[lang] : key}
                          </span>
                        </div>
                        <span className="font-bold text-foreground">
                          {avg.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ 3</span>
                        </span>
                      </div>

                      <div className="h-3 bg-secondary rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 66 ? 'bg-rose-500' : pct > 33 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Severity Heatmap */}
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined text-xl">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-foreground text-base sm:text-lg font-bold">
                    {lang === 'es' ? 'Mapa de Severidad Diaria' : 'Daily Severity Heatmap'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'es' ? 'Historial visual de los últimos 30 días' : 'Visual log of past 30 days'}
                  </p>
                </div>
              </div>
            </div>

            {loading || entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] text-muted-foreground text-sm gap-2 text-center p-6 bg-secondary/10 rounded-xl border border-dashed border-border">
                <span className="material-symbols-outlined text-3xl opacity-50">calendar_today</span>
                <span>
                  {loading
                    ? lang === 'es'
                      ? 'Cargando registros...'
                      : 'Loading logs...'
                    : lang === 'es'
                    ? 'No hay registros guardados todavía.'
                    : 'No data logged yet.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {entries.map((entry) => {
                    const total = configuredSymptoms.reduce((s, k) => s + (entry[k] ?? 0), 0);
                    const pct = total / (configuredSymptoms.length * 3);
                    const bg =
                      pct > 0.6
                        ? 'bg-rose-500 text-white'
                        : pct > 0.3
                        ? 'bg-amber-500 text-white'
                        : pct > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-secondary text-muted-foreground';

                    return (
                      <div
                        key={entry.date}
                        className={`w-9 h-9 rounded-xl ${bg} transition-all duration-200 hover:scale-125 cursor-default relative group flex items-center justify-center text-xs font-bold shadow-xs`}
                        title={`${entry.date}: ${Math.round(pct * 100)}%`}
                      >
                        <span>{entry.date.slice(8)}</span>
                        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                          {entry.date} &bull; {Math.round(pct * 100)}% {lang === 'es' ? 'severidad' : 'severity'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mt-auto pt-2 border-t border-border/60">
                  <span>{lang === 'es' ? 'Nivel de severidad:' : 'Severity level:'}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span>{lang === 'es' ? 'Bajo' : 'Low'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-500" />
                      <span>{lang === 'es' ? 'Moderado' : 'Moderate'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-rose-500" />
                      <span>{lang === 'es' ? 'Alto' : 'High'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Research & Articles Section */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-foreground text-xl sm:text-2xl font-bold">
                {lang === 'es' ? 'Investigaciones y Artículos Recomendados' : 'Recommended Research & Articles'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {lang === 'es'
                  ? 'Contenido científico y guías prácticas para el cuidado de tu ciclo'
                  : 'Evidence-based guides and actionable articles for your cycle'}
              </p>
            </div>
            <button
              onClick={() => router.push('/articles')}
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              <span>{lang === 'es' ? 'Ver biblioteca completa' : 'View full library'}</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-md hover:border-primary/40"
                  onClick={() => {
                    if (article.url.startsWith('/')) {
                      router.push(article.url);
                    } else {
                      window.open(article.url, '_blank');
                    }
                  }}
                >
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${article.imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <span className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                      {article.source}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
                    <h4 className="text-foreground text-base sm:text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs sm:text-sm text-muted-foreground border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                      {article.author && (
                        <span className="line-clamp-1 max-w-[130px] font-medium">
                          {article.author}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
            {!articlesLoading && articles.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border text-sm">
                {lang === 'es' ? 'No se encontraron artículos disponibles en este momento.' : 'No articles found at the moment.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PMOSCare;
