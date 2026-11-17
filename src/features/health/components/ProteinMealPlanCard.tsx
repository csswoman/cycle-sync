'use client';

import React from 'react';
import type { MealsPerDay, ProteinMealPlan } from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';

interface ProteinMealPlanCardProps {
  plan: ProteinMealPlan;
  firstMealTime: string;
  onMealsPerDayChange: (meals: MealsPerDay) => void;
  onFirstMealTimeChange: (time: string) => void;
  /** Hides grams for no-numbers mode; the schedule stays. */
  hideNumbers?: boolean;
}

/** Daily protein split into 3 or 4 meals, with suggested times. */
export const ProteinMealPlanCard: React.FC<ProteinMealPlanCardProps> = ({
  plan,
  firstMealTime,
  onMealsPerDayChange,
  onFirstMealTimeChange,
  hideNumbers = false,
}) => {
  return (
    <section aria-labelledby="protein-plan" className="w-full bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-prose">
          <h3 id="protein-plan" className="text-foreground text-lg font-semibold text-balance">Reparte tu proteína en el día</h3>
          <p className="text-muted-foreground text-sm text-pretty">
            {hideNumbers
              ? `Tu cuerpo aprovecha mejor la proteína si la repartes en ${plan.mealsPerDay} comidas, una cada ${plan.spacingHours} horas, que si la juntas en una sola.`
              : `Tu músculo usa unos ${plan.perMealRange[0]} a ${plan.perMealRange[1]} g por comida para construirse. Repartir tu meta en ${plan.mealsPerDay} comidas, una cada ${plan.spacingHours} horas, le da ese estímulo varias veces al día.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div role="group" aria-label="Comidas al día" className="flex gap-1 bg-secondary/80 p-1 rounded-full border border-border">
            {([3, 4] as MealsPerDay[]).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={plan.mealsPerDay === n}
                onClick={() => onMealsPerDayChange(n)}
                className={`min-h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                  plan.mealsPerDay === n ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n} comidas
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Primera comida
            <input
              type="time"
              value={firstMealTime}
              onChange={(e) => e.target.value && onFirstMealTimeChange(e.target.value)}
              className="min-h-10 px-3 rounded-full bg-background border border-border text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
      </div>

      <ol className={`grid grid-cols-2 ${plan.mealsPerDay === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
        {plan.slots.map((slot) => (
          <li key={slot.index} className="rounded-2xl bg-secondary/60 px-4 py-3 flex flex-col gap-0.5">
            <span className="text-sm text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
              <Icon name="schedule" size={14} weight="bold" />
              {slot.time}
            </span>
            <span className="text-base font-semibold text-foreground">{slot.label}</span>
            <span className="text-sm text-primary font-medium tabular-nums">
              {hideNumbers ? 'Una palma de proteína' : `~${slot.proteinGrams} g de proteína`}
            </span>
          </li>
        ))}
      </ol>

      <details className="group">
        <summary className="flex items-center gap-2 min-h-10 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-foreground rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <Icon name="chevron_right" size={16} weight="bold" className="text-muted-foreground transition-transform group-open:rotate-90" />
          ¿Y si como mucha proteína en un solo plato?
        </summary>
        <div className="pl-6 pt-1 flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed max-w-prose text-pretty">
          <p>
            Tu cuerpo absorbe toda la proteína que comes; lo que tiene un límite es cuánta de una sola comida se convierte en músculo en las horas siguientes. Lo que sobra no se pierde: se usa para otros tejidos o como energía.
          </p>
          <p>
            Por eso un plato muy grande no es dañino, pero rinde más repartir: en los estudios, 4 tomas de 20 g cada 3 horas construyeron más músculo que 2 tomas de 40 g, y un día parejo (unos 30 g en cada comida) dio 25% más síntesis de proteína que uno con casi todo en la cena.
          </p>
          <p className="text-xs">
            Fuentes: Schoenfeld y Aragon 2018 (JISSN), Areta y cols. 2013, Mamerow y cols. 2014, Trommelen y cols. 2023, postura de la ISSN 2017.
          </p>
        </div>
      </details>
    </section>
  );
};
