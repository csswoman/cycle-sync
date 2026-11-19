'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { getFoodImageUrl } from '@/data/nutritionFoods';
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

const TIPS_PREVIEW = 5;

/** Drops parenthetical asides so amounts fit one or two lines; the full text goes in a tooltip. */
const shortAmount = (a: string) => a.replace(/\s*\([^)]*\)/g, '');

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

/** Catalog id -> photo id in /public/foods. Entries without a photo get an icon tile. */
const PHOTO: Record<string, string> = {
  pollo: 'pechuga-pollo', res: 'ternera-magra', pescado: 'salmon-cocinado', mariscos: 'camaron-gamba', huevo: 'huevo-cocido',
  tofu: 'tofu-firme', lentejas: 'lentejas-cocidas', garbanzos: 'garbanzos-cocidos', frijoles: 'frijoles-negros',
  yogur: 'yogur-griego', queso: 'queso-cottage', espinaca: 'espinaca-cruda', brocoli: 'brocoli-cocido', coliflor: 'coliflor',
  zanahoria: 'zanahoria', tomate: 'tomate', cebolla: 'cebolla', calabacin: 'calabacin', berenjena: 'berenjena',
  champinones: 'champinones', aguacate: 'aguacate', remolacha: 'remolacha', banano: 'platano-banana', manzana: 'manzana',
  'frutos-rojos': 'frambuesa', mango: 'mango', citricos: 'naranja', 'papaya-pina': 'pina', avena: 'avena', arroz: 'arroz-blanco',
  quinoa: 'quinoa', 'papa-camote': 'camote-batata', pan: 'pan-integral', almendras: 'almendras', nueces: 'nueces',
  chia: 'semillas-chia', linaza: 'semillas-lino', 'semillas-calabaza': 'semillas-calabaza', mani: 'cacahuetes', cacao: 'chocolate-negro',
  arepa: 'arepa', cachapa: 'cachapa', empanada: 'empanada', tequenos: 'tequenos', patacon: 'patacon',
  pabellon: 'pabellon', taco: 'taco', pizza: 'pizza', hamburguesa: 'hamburguesa', panqueques: 'panqueques',
  cerdo: 'cerdo',
};
const FoodPhoto: React.FC<{ id: string; dish: boolean }> = ({ id, dish }) => {
  const [failed, setFailed] = useState(false);
  const photo = PHOTO[id];
  if (!photo || failed) {
    return (
      <span className="w-full h-full bg-leaf-soft text-leaf flex items-center justify-center">
        <Icon name={dish ? 'restaurant' : 'plant'} size={20} weight="duotone" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={getFoodImageUrl(photo)} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />;
};
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
  const [compact, setCompact] = useState(false);
  const [allTips, setAllTips] = useState(false);

  const suggestions = getSupplementSuggestions(prefs, language);
  const dishTips = getDishTips(prefs.likes, language);
  const shownTips = allTips ? dishTips : dishTips.slice(0, TIPS_PREVIEW);
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

  const renderTile = (id: string, dish: boolean) => {
    const state = foodState(prefs, id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => onSetFood(id, nextFoodState(state))}
        aria-label={`${foodLabel(id, language)}: ${
          state === 'like' ? t('me gusta', 'liked') : state === 'avoid' ? t('evito', 'avoided') : t('sin elegir', 'not set')
        }`}
        className={`flex items-center gap-2.5 text-left rounded-xl p-1.5 pr-3 min-h-14 border-2 bg-secondary/40 transition-colors ${
          state === 'like' ? 'border-primary' : state === 'avoid' ? 'border-destructive/50' : 'border-transparent hover:border-border'
        }`}
      >
        <span className={`block size-11 shrink-0 rounded-lg overflow-hidden ${state === 'avoid' ? 'grayscale opacity-50' : ''}`}>
          <FoodPhoto id={id} dish={dish} />
        </span>
        <span className={`flex-1 min-w-0 text-sm font-medium text-balance leading-tight ${state === 'avoid' ? 'text-destructive line-through' : 'text-foreground'}`}>
          {foodLabel(id, language)}
        </span>
        {state !== 'none' && (
          <Icon
            name={state === 'like' ? 'favorite' : 'close'}
            size={16}
            weight={state === 'like' ? 'fill' : 'bold'}
            className={`shrink-0 ${state === 'like' ? 'text-primary' : 'text-destructive'}`}
          />
        )}
      </button>
    );
  };
  const optionClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-accent'
    }`;

  return (
    <section className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 sm:gap-6 items-start">
      {/* Foods */}
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3 -mb-2 sm:mb-0">
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
            <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
              <button
                onClick={() => setCompact((c) => !c)}
                aria-expanded={!compact}
                className="min-h-11 sm:min-h-10 flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
              >
                <Icon name="chevron_right" size={16} weight="bold" className={`text-muted-foreground transition-transform ${compact ? '' : 'rotate-90'}`} />
                {compact ? t('Editar', 'Edit') : t('Compactar', 'Collapse')}
              </button>
              <button onClick={onClearFoods} className="min-h-11 sm:min-h-10 text-sm text-muted-foreground hover:text-foreground underline">
                {t('Borrar todo', 'Clear all')}
              </button>
            </div>
          )}
        </div>

        {hasFoods && (
          <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {t(`${prefs.likes.length} que te gustan · ${prefs.avoid.length} que evitas`, `${prefs.likes.length} liked · ${prefs.avoid.length} avoided`)}
          </p>
        )}
        {compact && hasFoods
          ? [
              { state: 'like' as const, label: t('Me gustan', 'Liked'), entries: prefs.likes },
              { state: 'avoid' as const, label: t('Evito', 'Avoided'), entries: prefs.avoid },
            ]
              .filter((g) => g.entries.length > 0)
              .map((g) => (
                <div key={g.state}>
                  <h4 className="text-sm font-semibold text-foreground mb-3">{g.label}</h4>
                  <div className="flex flex-wrap gap-2">{g.entries.map(renderChip)}</div>
                </div>
              ))
          : FOOD_CATEGORIES.map((cat) => (
              <div key={cat}>
                <h4 className="text-sm font-semibold text-foreground mb-3">{FOOD_CATEGORY_LABELS[cat][language]}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {FOOD_CATALOG.filter((f) => f.category === cat).map((f) => renderTile(f.id, cat === 'dish'))}
                </div>
              </div>
            ))}

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
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
          <p className="text-sm text-muted-foreground mt-2">
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

      <div className="flex flex-col gap-4 sm:gap-6 min-w-0">
      {/* Habits */}
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-5">
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
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-5">
          <div>
            <h3 className="text-foreground text-lg font-semibold text-balance">{t('Cómo mejorar tus platos favoritos', 'How to upgrade your favorite dishes')}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {t('No tienes que dejarlos: se ajusta la porción y la receta.', 'You do not have to give them up: tune the portion and the recipe.')}
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {shownTips.map((d) => (
              <li key={d.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="size-12 shrink-0 rounded-xl overflow-hidden">
                  <FoodPhoto id={d.id} dish />
                </span>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-foreground">{d.name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.quality === 'solid' ? 'bg-leaf/10 text-leaf' : d.quality === 'tweak' ? 'bg-blossom-soft text-blossom' : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {d.qualityLabel}
                    </span>
                    <InfoTooltip label={t('Por qué', 'Why')}>
                      <p>{d.summary}</p>
                    </InfoTooltip>
                  </div>
                  <p className="text-sm text-foreground text-pretty">
                    <strong className="font-semibold">{t('Porción: ', 'Portion: ')}</strong>
                    {d.portion}
                  </p>
                  <details className="group">
                    <summary className="flex items-center gap-1.5 min-h-11 sm:min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground">
                      <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
                      {t(`Cómo mejorarlo (${d.upgrades.length})`, `How to improve it (${d.upgrades.length})`)}
                    </summary>
                    <ul className="list-disc pl-9 pb-1 flex flex-col gap-1.5">
                      {d.upgrades.map((u) => (
                        <li key={u} className="text-sm text-muted-foreground text-pretty">{u}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </li>
            ))}
          </ul>
          {dishTips.length > TIPS_PREVIEW && (
            <button
              onClick={() => setAllTips((v) => !v)}
              aria-expanded={allTips}
              className="min-h-11 sm:min-h-10 self-start text-sm font-medium text-foreground hover:text-primary underline"
            >
              {allTips
                ? t('Ver menos', 'Show less')
                : t(`Ver más (${dishTips.length - TIPS_PREVIEW})`, `Show more (${dishTips.length - TIPS_PREVIEW})`)}
            </button>
          )}
        </div>
      )}
      {/* Suggestions */}
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h3 className="text-foreground text-lg font-semibold text-balance">{t('Sugerencias para completar tu dieta', 'Ideas to round out your diet')}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Primero alimentos que sí toleras, después suplementos.', 'Foods you tolerate first, supplements second.')}
          </p>
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
          <ul className="flex flex-col divide-y divide-border">
            {suggestions.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-foreground">{s.nutrient}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-blossom-soft text-blossom'
                    }`}
                  >
                    {s.priority === 'high' ? t('Prioridad', 'Priority') : t('A considerar', 'Consider')}
                  </span>
                  <InfoTooltip label={t('Por qué te lo sugerimos', 'Why we suggest it')}>
                    <p>{s.reason}</p>
                  </InfoTooltip>
                </div>
                <p className="text-sm text-foreground text-pretty">{s.target}</p>
                {s.foods.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">{t('Prueba con', 'Try')}</p>
                    <ul className="grid grid-cols-1 gap-3">
                      {s.foods.map((f) => (
                        <li key={f.id} className="flex items-center gap-2.5 rounded-xl bg-secondary/40 p-1.5 pr-3 min-h-14">
                          <span className="size-11 shrink-0 rounded-lg overflow-hidden">
                            <FoodPhoto id={f.id} dish={false} />
                          </span>
                          <span className="min-w-0 text-sm leading-tight">
                            <span className="block font-medium text-foreground">{f.name}</span>
                            <span className="block text-muted-foreground">
                              {shortAmount(f.amount)}
                              {shortAmount(f.amount) !== f.amount && (
                                <InfoTooltip label={t('Medida completa', 'Full measure')} className="ml-1">
                                  <p>{f.amount}</p>
                                </InfoTooltip>
                              )}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="group">
                  <summary className="flex items-center gap-1.5 min-h-11 sm:min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground">
                    <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
                    {t('Equivalencias y suplemento', 'Equivalents and supplement')}
                  </summary>
                  <div className="pl-6 pb-1 flex flex-col gap-2">
                    {s.replaces && (
                      <p className="text-sm text-muted-foreground text-pretty">
                        <strong className="font-semibold text-foreground">{t('Lo que te daría: ', 'What it would give you: ')}</strong>
                        {s.replaces}
                      </p>
                    )}
                    {s.equivalence && <p className="text-sm text-muted-foreground text-pretty">{s.equivalence}</p>}
                    {s.tip && <p className="text-sm text-muted-foreground text-pretty">{s.tip}</p>}
                    <p className="text-sm text-muted-foreground text-pretty">
                      <strong className="font-semibold text-foreground">{t('Suplemento: ', 'Supplement: ')}</strong>
                      {s.supplement}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground text-pretty border-t border-border pt-4">
          {t('Sugerencias generales, no consejo médico.', 'General suggestions, not medical advice.')}
          <InfoTooltip label={t('Aviso y medidas caseras', 'Notice and household measures')} className="ml-1">
            <p>{SUPPLEMENT_DISCLAIMER[language]}</p>
            <p>{MEASURE_GUIDE[language]}</p>
          </InfoTooltip>
        </p>
      </div>
      </div>
    </section>
  );
};
