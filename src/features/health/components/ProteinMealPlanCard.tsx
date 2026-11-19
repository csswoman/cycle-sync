'use client';

import React from 'react';
import type { MealsPerDay, ProteinMealPlan } from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface ProteinMealPlanCardProps {
  plan: ProteinMealPlan;
  firstMealTime: string;
  onMealsPerDayChange: (meals: MealsPerDay) => void;
  onFirstMealTimeChange: (time: string) => void;
  /** Hides grams for no-numbers mode; the schedule stays. */
  hideNumbers?: boolean;
}

const translateSlotLabel = (label: string, isEn: boolean) => {
  if (!isEn) return label;
  if (label === 'Desayuno') return 'Breakfast';
  if (label === 'Comida') return 'Lunch';
  if (label === 'Merienda') return 'Snack';
  if (label === 'Cena') return 'Dinner';
  return label;
};

/** Daily protein split into 3 or 4 meals, with suggested times. */
export const ProteinMealPlanCard: React.FC<ProteinMealPlanCardProps> = ({
  plan,
  firstMealTime,
  onMealsPerDayChange,
  onFirstMealTimeChange,
  hideNumbers = false,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const intro = hideNumbers
              ? (isEn
                  ? `Your body utilizes protein better when distributed across ${plan.mealsPerDay} meals, one every ${plan.spacingHours} hours, rather than crowded into one.`
                  : `Tu cuerpo aprovecha mejor la proteína si la repartes en ${plan.mealsPerDay} comidas, una cada ${plan.spacingHours} horas, que si la juntas en una sola.`)
              : (isEn
                  ? `Your muscles use about ${plan.perMealRange[0]} to ${plan.perMealRange[1]} g per meal to stimulate synthesis. Spreading your goal across ${plan.mealsPerDay} meals, one every ${plan.spacingHours} hours, triggers that response multiple times a day.`
                  : `Tu músculo usa unos ${plan.perMealRange[0]} a ${plan.perMealRange[1]} g por comida para construirse. Repartir tu meta en ${plan.mealsPerDay} comidas, una cada ${plan.spacingHours} horas, le da ese estímulo varias veces al día.`);

  return (
    <section aria-labelledby="protein-plan" className="w-full bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex-1 basis-60 min-w-0 max-w-prose">
          <div className="flex items-center gap-2">
            <h3 id="protein-plan" className="text-foreground text-lg sm:text-xl font-semibold text-balance">
              {isEn ? 'Spread your protein across the day' : 'Reparte tu proteína en el día'}
            </h3>
            <InfoTooltip label={isEn ? 'Why spread protein' : 'Por qué repartir la proteína'}>{intro}</InfoTooltip>
          </div>
          <p className="text-muted-foreground text-sm text-pretty">
            {isEn ? 'Several meals a day work better than one big plate.' : 'Varias comidas al día rinden más que un solo plato grande.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          <div role="group" aria-label={isEn ? "Meals per day" : "Comidas al día"} className="flex w-full sm:w-auto gap-1 bg-secondary/80 p-1 rounded-full border border-border">
            {([3, 4] as MealsPerDay[]).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={plan.mealsPerDay === n}
                onClick={() => onMealsPerDayChange(n)}
                className={`flex-1 sm:flex-none min-h-11 sm:min-h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                  plan.mealsPerDay === n ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n} {isEn ? 'meals' : 'comidas'}
              </button>
            ))}
          </div>
          <label className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2 text-sm text-muted-foreground">
            {isEn ? 'First meal' : 'Primera comida'}
            <input
              type="time"
              value={firstMealTime}
              onChange={(e) => e.target.value && onFirstMealTimeChange(e.target.value)}
              className="min-h-11 sm:min-h-10 px-3 rounded-full bg-background border border-border text-base sm:text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
      </div>

      <ol className={`grid grid-cols-2 ${plan.mealsPerDay === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3 max-md:[&>li:last-child]:col-span-2'} gap-2 sm:gap-3`}>
        {plan.slots.map((slot) => (
          <li key={slot.index} className="rounded-xl sm:rounded-2xl bg-secondary/60 px-3 sm:px-4 py-3 flex flex-col gap-0.5">
            <span className="text-sm text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
              <Icon name="schedule" size={14} weight="bold" />
              {slot.time}
            </span>
            <span className="text-base font-semibold text-foreground">{translateSlotLabel(slot.label, isEn)}</span>
            <span className="text-sm text-primary font-medium tabular-nums">
              {hideNumbers ? (isEn ? 'One palm of protein' : 'Una palma de proteína') : (isEn ? `~${slot.proteinGrams} g of protein` : `~${slot.proteinGrams} g de proteína`)}
            </span>
          </li>
        ))}
      </ol>

      <details className="group">
        <summary className="flex items-center gap-2 min-h-11 sm:min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
          {isEn ? 'What if I eat a lot of protein in a single meal?' : '¿Y si como mucha proteína en un solo plato?'}
        </summary>
        <div className="pl-6 pt-1 flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed max-w-prose text-pretty">
          <p>
            {isEn
              ? 'Your body absorbs all the protein you consume; what has a threshold is how much from a single meal is converted into muscle synthesis over the following hours. The rest is not wasted: it is utilized for other tissues or energy.'
              : 'Tu cuerpo absorbe toda la proteína que comes; lo que tiene un límite es cuánta de una sola comida se convierte en músculo en las horas siguientes. Lo que sobra no se pierde: se usa para otros tejidos o como energía.'}
          </p>
          <p>
            {isEn
              ? 'That is why a very large plate is not harmful, but distributing it is more efficient: in research, 4 doses of 20 g every 3 hours built more muscle than 2 doses of 40 g, and an even distribution (~30 g per meal) produced 25% higher protein synthesis than backloading most in dinner.'
              : 'Por eso un plato muy grande no es dañino, pero rinde más repartir: en los estudios, 4 tomas de 20 g cada 3 horas construyeron más músculo que 2 tomas de 40 g, y un día parejo (unos 30 g en cada comida) dio 25% más síntesis de proteína que uno con casi todo en la cena.'}
          </p>
          <p>
            {isEn
              ? 'Sources: Schoenfeld & Aragon 2018 (JISSN), Areta et al. 2013, Mamerow et al. 2014, Trommelen et al. 2023, ISSN position stand 2017.'
              : 'Fuentes: Schoenfeld y Aragon 2018 (JISSN), Areta y cols. 2013, Mamerow y cols. 2014, Trommelen y cols. 2023, postura de la ISSN 2017.'}
          </p>
        </div>
      </details>
    </section>
  );
};
