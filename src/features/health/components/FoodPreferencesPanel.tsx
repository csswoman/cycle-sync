'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  FOOD_CATALOG,
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  foodLabel,
  foodState,
  getCatalogFood,
  nextFoodState,
  type ActivityLevel,
  type FoodPreferences,
  type FoodState,
  type SunExposure,
} from '@/lib/nutrition/foodPreferences';
import { getDishTips } from '@/lib/nutrition/dishTips';
import {
  MEASURE_GUIDE,
  MIN_LIKES_FOR_DIET_GAPS,
  SUPPLEMENT_DISCLAIMER,
  getSupplementSuggestions,
} from '@/lib/nutrition/supplementSuggestions';

interface Props {
  prefs: FoodPreferences;
  language: 'es' | 'en';
  onSetFood: (entry: string, state: FoodState) => void;
  onSetSun: (sun: SunExposure | null) => void;
  onSetActivity: (activity: ActivityLevel | null) => void;
  onClearFoods: () => void;
  onSeeRecipes: () => void;
  onGenerate: () => void;
}

const SUN_OPTIONS: { id: SunExposure; es: string; en: string }[] = [
  { id: 'daily', es: 'Casi todos los días', en: 'Almost every day' },
  { id: 'sometimes', es: 'A veces', en: 'Sometimes' },
  { id: 'rarely', es: 'Casi nunca', en: 'Rarely' },
];

const ACTIVITY_OPTIONS: { id: ActivityLevel; es: string; en: string }[] = [
  { id: 'sedentary', es: 'Sedentaria', en: 'Sedentary' },
  { id: 'light', es: 'Algo activa', en: 'Lightly active' },
  { id: 'active', es: 'Activa', en: 'Active' },
];

export const FoodPreferencesPanel: React.FC<Props> = ({
  prefs,
  language,
  onSetFood,
  onSetSun,
  onSetActivity,
  onClearFoods,
  onSeeRecipes,
  onGenerate,
}) => {
  const isEs = language === 'es';
  const t = (es: string, en: string) => (isEs ? es : en);
  const [custom, setCustom] = useState('');

  const suggestions = getSupplementSuggestions(prefs, language);
  const dishTips = getDishTips(prefs.likes, language);
  const customEntries = [...prefs.likes, ...prefs.avoid].filter((e) => !getCatalogFood(e));
  const hasFoods = prefs.likes.length + prefs.avoid.length > 0;

  const addCustom = (state: 'like' | 'avoid') => {
    const value = custom.trim().slice(0, 40);
    if (!value) return;
    onSetFood(value, state);
    setCustom('');
  };

  const chipClass = (state: FoodState) =>
    state === 'like'
      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
      : state === 'avoid'
        ? 'bg-destructive/10 text-destructive border-destructive/40 line-through'
        : 'bg-secondary text-muted-foreground hover:bg-accent';

  const renderChip = (entry: string) => {
    const state = foodState(prefs, entry);
    return (
      <button
        key={entry}
        onClick={() => onSetFood(entry, nextFoodState(state))}
        aria-label={`${foodLabel(entry, language)}: ${
          state === 'like' ? t('me gusta', 'liked') : state === 'avoid' ? t('evito', 'avoided') : t('sin elegir', 'not set')
        }`}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium border border-transparent transition-all flex items-center gap-1.5 ${chipClass(state)}`}
      >
        {state === 'like' && <Icon name="favorite" size={14} weight="fill" />}
        {state === 'avoid' && <Icon name="close" size={14} weight="bold" />}
        {foodLabel(entry, language)}
      </button>
    );
  };

  const optionClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-accent'
    }`;

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Foods */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-foreground text-lg font-bold">{t('Mis gustos', 'My tastes')}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {t(
                'Toca un alimento una vez si te gusta, dos veces si lo evitas y una tercera para quitarlo. Se guarda en este dispositivo.',
                'Tap a food once if you like it, twice if you avoid it, and a third time to clear it. Saved on this device.'
              )}
            </p>
          </div>
          {hasFoods && (
            <button onClick={onClearFoods} className="text-sm text-muted-foreground hover:text-foreground underline shrink-0">
              {t('Borrar todo', 'Clear all')}
            </button>
          )}
        </div>

        {FOOD_CATEGORIES.map((cat) => (
          <div key={cat}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {FOOD_CATEGORY_LABELS[cat][language]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {FOOD_CATALOG.filter((f) => f.category === cat).map((f) => renderChip(f.id))}
            </div>
          </div>
        ))}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {t('Otros alimentos o preparaciones', 'Other foods or dishes')}
          </h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom('like')}
              maxLength={40}
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('Ej: pescado hervido, hígado, coco...', 'E.g. boiled fish, liver, coconut...')}
            />
            <div className="flex gap-2">
              <button
                onClick={() => addCustom('like')}
                disabled={!custom.trim()}
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
              >
                {t('Me gusta', 'I like it')}
              </button>
              <button
                onClick={() => addCustom('avoid')}
                disabled={!custom.trim()}
                className="px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/40 text-sm font-bold disabled:opacity-50"
              >
                {t('Lo evito', 'Avoid it')}
              </button>
            </div>
          </div>
          {customEntries.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{customEntries.map(renderChip)}</div>}
          <p className="text-xs text-muted-foreground mt-2">
            {t(
              'Si escribes dos palabras, como "pescado hervido", solo se descartan las recetas que mencionen las dos.',
              'If you type two words, like "boiled fish", only recipes that mention both are filtered out.'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <button
            onClick={onSeeRecipes}
            className="flex-1 bg-secondary hover:bg-accent text-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon name="restaurant" size={18} weight="bold" />
            {t('Ver recetas según mis gustos', 'See recipes for my tastes')}
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon name="auto_awesome" size={18} weight="bold" />
            {t('Crear recetas con mis gustos', 'Create recipes for my tastes')}
          </button>
        </div>
      </div>

      {/* Habits */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h3 className="text-foreground text-lg font-bold">{t('Tus hábitos', 'Your habits')}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Sirven para ajustar las sugerencias de vitaminas.', 'They help tune the vitamin suggestions.')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-foreground">
            {t('¿Cuánto sol te da en el día?', 'How much sun do you get?')}
          </label>
          <div className="flex flex-wrap gap-2">
            {SUN_OPTIONS.map((o) => (
              <button key={o.id} onClick={() => onSetSun(prefs.sun === o.id ? null : o.id)} className={optionClass(prefs.sun === o.id)}>
                {o[language]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-foreground">{t('¿Qué tan activa eres?', 'How active are you?')}</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => onSetActivity(prefs.activity === o.id ? null : o.id)}
                className={optionClass(prefs.activity === o.id)}
              >
                {o[language]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish upgrades */}
      {dishTips.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-foreground text-lg font-bold">{t('Cómo mejorar tus platos favoritos', 'How to upgrade your favorite dishes')}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {t('No tienes que dejarlos: se ajusta la porción y la receta.', 'You do not have to give them up: tune the portion and the recipe.')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dishTips.map((d) => (
              <div key={d.id} className="bg-secondary/40 rounded-xl p-4 border border-border/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">{d.name}</span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      d.quality === 'solid'
                        ? 'bg-leaf/10 text-leaf'
                        : d.quality === 'tweak'
                          ? 'bg-blossom-soft text-blossom'
                          : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {d.qualityLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.summary}</p>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  <strong>{t('Porción: ', 'Portion: ')}</strong>
                  {d.portion}
                </p>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  {d.upgrades.map((u) => (
                    <li key={u} className="text-xs text-muted-foreground leading-relaxed">
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
            <Icon name="science" size={22} weight="duotone" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-bold">{t('Sugerencias para completar tu dieta', 'Ideas to round out your diet')}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t('Primero alimentos que sí toleras, después suplementos.', 'Foods you tolerate first, supplements second.')}
            </p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {prefs.likes.length < MIN_LIKES_FOR_DIET_GAPS && prefs.sun === null
              ? t(
                  `Marca al menos ${MIN_LIKES_FOR_DIET_GAPS} alimentos que sí comes, los que evitas y cuánto sol te da, y aquí aparecerán las sugerencias.`,
                  `Mark at least ${MIN_LIKES_FOR_DIET_GAPS} foods you eat, the ones you avoid and how much sun you get, and suggestions will show up here.`
                )
              : t('Con lo que marcaste no veo carencias evidentes. Si agregas más alimentos o hábitos, reviso de nuevo.', 'With what you marked I see no obvious gaps. Add more foods or habits and I will check again.')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-secondary/40 rounded-xl p-4 border border-border/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">{s.nutrient}</span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      s.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-blossom-soft text-blossom'
                    }`}
                  >
                    {s.priority === 'high' ? t('Prioridad', 'Priority') : t('A considerar', 'Consider')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.reason}</p>
                <p className="text-xs text-foreground/90 leading-relaxed">{s.target}</p>
                {s.replaces && (
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong>{t('Lo que te daría: ', 'What it would give you: ')}</strong>
                    {s.replaces}
                  </p>
                )}
                {s.foods.length > 0 && (
                  <div className="text-xs text-foreground/90 leading-relaxed">
                    <strong>{t('Prueba con:', 'Try:')}</strong>
                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">
                      {s.foods.map((f) => (
                        <li key={f.id}>
                          <span className="font-medium">{f.name}:</span> {f.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.equivalence && <p className="text-xs text-foreground/90 leading-relaxed">{s.equivalence}</p>}
                {s.tip && <p className="text-xs text-muted-foreground leading-relaxed">{s.tip}</p>}
                <p className="text-xs text-foreground/90 leading-relaxed">
                  <strong>{t('Suplemento: ', 'Supplement: ')}</strong>
                  {s.supplement}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{MEASURE_GUIDE[language]}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{SUPPLEMENT_DISCLAIMER[language]}</p>
      </div>
    </section>
  );
};
