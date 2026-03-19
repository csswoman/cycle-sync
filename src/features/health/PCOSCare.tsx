'use client';

import React, { useState, useEffect } from 'react';
import { fetchHealthArticles } from '@/services/articlesService';
import { Article } from '@/types/articles';
import { usePCOSSymptoms } from '@/hooks/usePCOSSymptoms';
import { useCycleInfo } from '@/hooks/useCycleInfo';

const SYMPTOM_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  acne: { label: 'Acne', icon: 'face_retouching_off', color: 'text-red-400' },
  fatigue: { label: 'Fatigue', icon: 'battery_1_bar', color: 'text-amber-400' },
  hirsutism: { label: 'Hirsutism', icon: 'dermatology', color: 'text-orange-400' },
  hair_loss: { label: 'Hair Loss', icon: 'sentiment_dissatisfied', color: 'text-purple-400' },
  mood_swings: { label: 'Mood Swings', icon: 'mood_bad', color: 'text-blue-400' },
  bloating: { label: 'Bloating', icon: 'water_drop', color: 'text-teal-400' },
};

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const SEVERITY_COLORS = ['bg-green-500', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500'];

const PCOSCare: React.FC = () => {
  const { entries, todayEntry, loading, saving, saveToday, alerts, SYMPTOM_KEYS } = usePCOSSymptoms();
  const { cycleInfo } = useCycleInfo();
  const [values, setValues] = useState<Record<string, number>>({
    acne: 0, fatigue: 0, hirsutism: 0, hair_loss: 0, mood_swings: 0, bloating: 0,
  });
  const [saved, setSaved] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    if (todayEntry) {
      setValues({
        acne: todayEntry.acne ?? 0,
        fatigue: todayEntry.fatigue ?? 0,
        hirsutism: todayEntry.hirsutism ?? 0,
        hair_loss: todayEntry.hair_loss ?? 0,
        mood_swings: todayEntry.mood_swings ?? 0,
        bloating: todayEntry.bloating ?? 0,
      });
      if (todayEntry.id) setSaved(true);
    }
  }, [todayEntry]);

  useEffect(() => {
    fetchHealthArticles({ topic: 'PCOS', language: 'en' })
      .then((a) => setArticles(a.slice(0, 3)))
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
  }, []);

  const handleSliderChange = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveToday(values as any);
    setSaved(true);
  };

  const todayTotal = Object.values(values).reduce((s, v) => s + v, 0);
  const maxTotal = SYMPTOM_KEYS.length * 3;
  const severityPct = Math.round((todayTotal / maxTotal) * 100);

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 lg:p-10 gap-8 pb-24">

        {/* Header */}
        <header className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Your PCOS Toolkit
            </h1>
            <p className="text-muted-foreground text-lg">
              Holistic management synchronized with your body.
              {cycleInfo && (
                <span className="ml-2 text-primary font-semibold">
                  {cycleInfo.phase} Phase &bull; Day {cycleInfo.cycleDay}
                </span>
              )}
            </p>
          </div>
        </header>

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 flex items-start gap-4">
            <div className="p-2 bg-destructive/20 rounded-lg shrink-0">
              <span className="material-symbols-outlined text-destructive text-2xl">warning</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground font-bold text-base">Elevated Symptoms Detected</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your <strong>{alerts.map((a) => SYMPTOM_LABELS[a]?.label).join(', ')}</strong>{' '}
                {alerts.length === 1 ? 'has' : 'have'} been consistently elevated over the past 7 days.
                Consider consulting with your healthcare provider.
              </p>
            </div>
          </div>
        )}

        {/* Symptom Tracker Form */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
            <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">monitor_heart</span>
              Daily Symptom Check-in
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${severityPct > 60 ? 'bg-red-500' : severityPct > 30 ? 'bg-orange-400' : 'bg-green-500'}`}
                  style={{ width: `${severityPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{severityPct}%</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {SYMPTOM_KEYS.map((key) => {
              const meta = SYMPTOM_LABELS[key];
              const val = values[key] ?? 0;
              return (
                <div key={key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined ${meta.color}`}>{meta.icon}</span>
                      <span className="text-foreground font-semibold text-sm">{meta.label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[val]} text-white`}>
                      {SEVERITY_LABELS[val]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={val}
                    onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    {SEVERITY_LABELS.map((l) => <span key={l}>{l}</span>)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 border-t border-border bg-secondary/10">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">{saved ? 'check_circle' : 'save'}</span>
              {saving ? 'Saving...' : saved ? 'Saved for Today' : 'Log Symptoms'}
            </button>
          </div>
        </section>

        {/* Trends Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symptom Trend Chart */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">insights</span>
                Symptom Trends (30 Days)
              </h3>
            </div>

            {loading || entries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
                {loading ? 'Loading...' : 'Start logging symptoms to see trends'}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {SYMPTOM_KEYS.map((key) => {
                  const meta = SYMPTOM_LABELS[key];
                  const avg = entries.length > 0
                    ? entries.reduce((s, e) => s + (e[key] ?? 0), 0) / entries.length
                    : 0;
                  const pct = (avg / 3) * 100;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-sm ${meta.color}`}>{meta.icon}</span>
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{meta.label}</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 66 ? 'bg-red-500' : pct > 33 ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8 text-right">{avg.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Severity Heatmap */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400">calendar_month</span>
              Daily Severity
            </h3>

            {loading || entries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
                {loading ? 'Loading...' : 'No data yet'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {entries.map((entry) => {
                  const total = SYMPTOM_KEYS.reduce((s, k) => s + (entry[k] ?? 0), 0);
                  const pct = total / maxTotal;
                  const bg = pct > 0.6 ? 'bg-red-500' : pct > 0.3 ? 'bg-orange-400' : pct > 0 ? 'bg-green-500' : 'bg-secondary';
                  return (
                    <div
                      key={entry.date}
                      className={`w-7 h-7 rounded-md ${bg} transition-all hover:scale-125 cursor-default relative group`}
                      title={`${entry.date}: ${Math.round(pct * 100)}% severity`}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {entry.date.slice(5)} &bull; {Math.round(pct * 100)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span>Low</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-green-500" />
                <div className="w-4 h-4 rounded bg-orange-400" />
                <div className="w-4 h-4 rounded bg-red-500" />
              </div>
              <span>High</span>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-xl font-bold">Latest Research & Articles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesLoading ? (
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
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">
                      {article.source}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <h4 className="text-foreground text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">{article.description}</p>
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
            {!articlesLoading && articles.length === 0 && (
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
