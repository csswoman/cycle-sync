'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatRange, type MealAnalysis, type Range } from '@/lib/nutrition/mealAnalysis';

interface MealAnalysisResultProps {
  result: MealAnalysis;
  isEs: boolean;
  /** Names the score after PMOS; otherwise it is a blood-sugar balance score. */
  pmos: boolean;
}

const card = 'bg-card rounded-xl border border-border p-5 sm:p-6 flex flex-col gap-4';

function scoreTone(value: number) {
  if (value >= 7) return { text: 'text-leaf', ring: 'var(--leaf)', soft: 'bg-leaf-soft' };
  if (value >= 4) return { text: 'text-sun-ink', ring: 'var(--sun)', soft: 'bg-sun/15' };
  return { text: 'text-coral', ring: 'var(--coral)', soft: 'bg-coral/15' };
}

const CardTitle: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <h4 className="flex items-center gap-2 text-foreground text-base font-semibold text-balance">
    <Icon name={icon} size={20} className="text-primary shrink-0" />
    {children}
  </h4>
);

const mid = (r: Range) => (r.min + r.max) / 2;

/** Meal photo analysis split into cards: score, macros, foods, micronutrients and suggestions. */
export const MealAnalysisResult: React.FC<MealAnalysisResultProps> = ({ result, isEs, pmos }) => {
  const { summary, foods, calories, macros, micronutrients, score, protein, suggestions } = result;
  const tone = score ? scoreTone(score.value) : null;
  const scoreLabel = pmos ? (isEs ? 'Puntuación PMOS' : 'PMOS score') : (isEs ? 'Equilibrio' : 'Balance score');

  // Share of calories from each macro (4/4/9 kcal per gram), for the split bar.
  const macroItems = macros ? [
    { key: 'protein', label: isEs ? 'Proteína' : 'Protein', range: macros.protein, kcal: mid(macros.protein) * 4, color: 'bg-blossom' },
    { key: 'carbs', label: isEs ? 'Carbohidratos' : 'Carbs', range: macros.carbs, kcal: mid(macros.carbs) * 4, color: 'bg-sun' },
    { key: 'fat', label: isEs ? 'Grasas' : 'Fat', range: macros.fat, kcal: mid(macros.fat) * 9, color: 'bg-leaf' },
  ] : [];
  const macroTotal = macroItems.reduce((sum, m) => sum + m.kcal, 0) || 1;

  const proteinTone = protein?.status === 'ok'
    ? { icon: 'check_circle', cls: 'bg-leaf-soft text-leaf' }
    : { icon: 'info', cls: 'bg-sun/15 text-sun-ink' };

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {/* Overview: score, verdict and calories */}
      <section className={`${card} sm:flex-row sm:items-center sm:gap-6`}>
        {score && tone && (
          <div className="flex sm:flex-col items-center gap-3 shrink-0">
            <div
              role="img"
              aria-label={`${scoreLabel}: ${score.value}/10`}
              className="relative size-24 rounded-full grid place-items-center"
              style={{ background: `conic-gradient(${tone.ring} ${score.value * 10}%, var(--border) 0)` }}
            >
              <div className="size-[80px] rounded-full bg-card grid place-items-center">
                <span className={`text-3xl font-bold tabular-nums ${tone.text}`}>
                  {score.value}<span className="text-sm text-muted-foreground font-medium">/10</span>
                </span>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{scoreLabel}</span>
          </div>
        )}
        <div className="flex flex-col gap-3 min-w-0">
          <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold text-balance">
            <Icon name="analytics" size={22} className="text-primary" />
            {isEs ? 'Resultados del análisis' : 'Analysis results'}
          </h3>
          {summary && <p className="text-foreground/90 text-sm leading-relaxed text-pretty">{summary}</p>}
          {calories && (
            <span className="self-start inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground tabular-nums">
              <Icon name="local_fire_department" size={16} className="text-coral" />
              ~{formatRange(calories)} kcal
            </span>
          )}
        </div>
      </section>

      {/* Macros and protein per meal */}
      {macros && (
        <section className={card}>
          <CardTitle icon="bolt">{isEs ? 'Macronutrientes' : 'Macronutrients'}</CardTitle>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary" aria-hidden="true">
            {macroItems.map((m) => (
              <div key={m.key} className={m.color} style={{ width: `${(m.kcal / macroTotal) * 100}%` }} />
            ))}
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {macroItems.map((m) => (
              <li key={m.key} className="rounded-xl bg-secondary/60 px-3 py-3 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className={`size-2.5 rounded-full shrink-0 ${m.color}`} aria-hidden="true" />
                  {m.label}
                </span>
                <span className="text-base sm:text-lg font-semibold text-foreground tabular-nums">{formatRange(m.range)} g</span>
                <span className="text-xs text-muted-foreground tabular-nums">{Math.round((m.kcal / macroTotal) * 100)}%</span>
              </li>
            ))}
          </ul>
          {protein && (
            <div className={`rounded-xl px-4 py-3 flex gap-3 ${proteinTone.cls}`}>
              <Icon name={proteinTone.icon} size={20} className="shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{isEs ? 'Proteína por comida' : 'Protein per meal'}</span>
                <p className="text-sm text-foreground/90 text-pretty">{protein.message}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Why the score */}
      {score && score.reasons.length > 0 && (
        <section className={card}>
          <CardTitle icon="monitor_heart">{isEs ? `Por qué tiene ${score.value}/10` : `Why it scores ${score.value}/10`}</CardTitle>
          <ul className="flex flex-col gap-3">
            {score.reasons.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className={`size-8 rounded-full grid place-items-center shrink-0 ${r.positive ? 'bg-leaf-soft text-leaf' : 'bg-sun/15 text-sun-ink'}`}>
                  <Icon name={r.positive ? 'check' : 'warning'} size={16} weight="bold" />
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {r.title && <span className="text-sm font-semibold text-foreground">{r.title}</span>}
                  {r.detail && <p className="text-sm text-muted-foreground text-pretty">{r.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Foods on the plate */}
        {foods.length > 0 && (
          <section className={card}>
            <CardTitle icon="restaurant">{isEs ? 'En tu plato' : 'On your plate'}</CardTitle>
            <ul className="flex flex-col divide-y divide-border">
              {foods.map((f, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                    {f.portion && <span className="text-xs text-muted-foreground">{f.portion}</span>}
                  </div>
                  {f.kcal && <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap pt-0.5">~{formatRange(f.kcal)} kcal</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Micronutrients */}
        {micronutrients.length > 0 && (
          <section className={card}>
            <CardTitle icon="science">{isEs ? 'Micronutrientes destacados' : 'Micronutrient highlights'}</CardTitle>
            <ul className="flex flex-col gap-3">
              {micronutrients.map((m, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {m.nutrient}
                    {m.sources && <span className="font-normal text-muted-foreground"> · {m.sources}</span>}
                  </span>
                  {m.benefit && <p className="text-sm text-muted-foreground text-pretty">{m.benefit}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section className={card}>
          <CardTitle icon="lightbulb">{isEs ? 'Cómo mejorarla' : 'How to improve it'}</CardTitle>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <li key={i} className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex gap-3">
                <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold grid place-items-center shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {s.title && <span className="text-sm font-semibold text-foreground">{s.title}</span>}
                  {s.detail && <p className="text-sm text-muted-foreground text-pretty">{s.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs text-muted-foreground text-center text-pretty px-4">
        {isEs ? 'Estimaciones aproximadas a partir de la foto; pueden variar según la preparación y la porción.' : 'Rough estimates from the photo; they vary with preparation and portion size.'}
      </p>
    </div>
  );
};
