'use client';

import React from 'react';
import { calculateNutritionTargets, NutritionTargets } from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface MacroWaterCalculatorProps {
  weightKg: number;
  onWeightChange: (newWeight: number) => void;
  compact?: boolean;
  /** Optional call to action shown under the figures. */
  action?: React.ReactNode;
  /** Height in cm, optional. Makes the targets realistic for larger bodies. */
  heightCm?: number;
  onHeightChange?: (heightCm: number | undefined) => void;
}

export const MacroWaterCalculator: React.FC<MacroWaterCalculatorProps> = ({
  weightKg,
  onWeightChange,
  compact = false,
  action,
  heightCm,
  onHeightChange,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const targets: NutritionTargets = calculateNutritionTargets(weightKg, heightCm);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onWeightChange(val);
    }
  };

  const adjustWeight = (delta: number) => {
    const next = Math.max(30, Math.min(250, Math.round((weightKg + delta) * 10) / 10));
    onWeightChange(next);
  };

  const stepBtn = 'size-11 sm:size-10 rounded-full bg-card hover:bg-accent text-foreground inline-flex items-center justify-center transition-colors border border-border/60';

  const stats = [
    {
      key: 'protein',
      icon: 'bowl_food',
      label: isEn ? 'Daily protein' : 'Proteína diaria',
      value: `${targets.proteinGrams}`,
      unit: isEn ? 'g / day' : 'g al día',
      detail: targets.usesAdjustedWeight
        ? (isEn
            ? `Range ${targets.proteinRange[0]} to ${targets.proteinRange[1]} g, based on ${targets.proteinReferenceKg} kg reference weight`
            : `Rango ${targets.proteinRange[0]} a ${targets.proteinRange[1]} g, sobre peso referencia de ${targets.proteinReferenceKg} kg`)
        : (isEn
            ? `Range ${targets.proteinRange[0]} to ${targets.proteinRange[1]} g (1.6 to 2.2 g/kg)`
            : `Rango ${targets.proteinRange[0]} a ${targets.proteinRange[1]} g (1.6 a 2.2 g/kg)`),
    },
    {
      key: 'fat',
      icon: 'plant',
      label: isEn ? 'Healthy fats' : 'Grasas saludables',
      value: `≥${targets.fatGrams}`,
      unit: isEn ? 'g / day' : 'g al día',
      detail: isEn
        ? 'Hormonal minimum 1.0 g/kg for estrogen and progesterone synthesis'
        : 'Mínimo hormonal 1.0 g/kg para síntesis de estrógenos y progesterona',
    },
    {
      key: 'water',
      icon: 'drop',
      label: isEn ? 'Daily water' : 'Agua diaria',
      value: `${targets.waterLiters}`,
      unit: isEn ? 'L / day' : 'L al día',
      detail: isEn
        ? `Range ${targets.waterRangeLiters[0]} to ${targets.waterRangeLiters[1]} L (~${targets.waterGlasses} glasses of 250 ml)`
        : `Rango ${targets.waterRangeLiters[0]} a ${targets.waterRangeLiters[1]} L (~${targets.waterGlasses} vasos de 250 ml)`,
    },
    {
      key: 'energy',
      icon: 'flame',
      label: isEn ? 'Energy & safe deficit' : 'Energía y déficit seguro',
      value: `~${targets.maintenanceCalories}`,
      unit: isEn ? 'kcal / day' : 'kcal al día',
      detail: isEn
        ? `Moderate deficit: ~${targets.calorieBreakdown.safeDeficitCalories} kcal (-400 kcal) to lose fat without losing muscle`
        : `Déficit moderado: ~${targets.calorieBreakdown.safeDeficitCalories} kcal (-400 kcal) para perder grasa sin perder músculo`,
    },
  ];

  return (
    <section aria-labelledby="macro-targets" className="w-full bg-card rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-sm flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        <div className="flex-1 basis-60 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 id="macro-targets" className="text-foreground text-lg sm:text-xl font-semibold text-balance">
              {isEn ? 'Your targets based on your weight' : 'Tus metas según tu peso'}
            </h3>
          {targets.usesAdjustedWeight && (
            <p className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-leaf-soft/60 pl-3 pr-1.5 min-h-8 text-sm text-foreground">
              <Icon name="info" size={16} weight="bold" className="shrink-0 text-leaf" />
              <span>
                {isEn ? 'Targets adjusted to your height.' : 'Metas ajustadas a tu estatura.'}
                {' '}
                <InfoTooltip label={isEn ? 'How targets are adjusted' : 'Cómo se ajustan las metas'}>
                  {isEn
                    ? `Protein is calculated on ${targets.proteinReferenceKg} kg; water and energy on ${targets.adjustedWeightKg} kg. You still eat more protein than average, which protects your muscle during weight loss.`
                    : `La proteína se calcula sobre ${targets.proteinReferenceKg} kg; el agua y la energía sobre ${targets.adjustedWeightKg} kg. Sigues comiendo más proteína que la media, que protege tu músculo si bajas de peso.`}
                </InfoTooltip>
              </span>
            </p>
          )}
          </div>
          <p className="text-muted-foreground text-sm text-pretty mt-1.5">
            {isEn
              ? 'Protein and water to protect your muscle, energy, and blood sugar.'
              : 'Proteína y agua para cuidar tu músculo, tu energía y tu glucosa.'}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 sm:gap-5 w-full sm:w-auto sm:shrink-0">
        {onHeightChange && (
          <label className="flex flex-col gap-1.5 basis-28 grow sm:grow-0 sm:basis-auto">
            <span className="text-sm text-muted-foreground px-2">{isEn ? 'Height (optional)' : 'Estatura (opcional)'}</span>
            <span className="flex gap-1 bg-secondary/80 px-4 h-14 sm:h-12 items-center justify-center rounded-full border border-border">
            <input
              type="number"
              min="120"
              max="220"
              step="1"
              inputMode="numeric"
              placeholder="170"
              value={heightCm ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onHeightChange(Number.isFinite(v) && v > 0 ? v : undefined);
              }}
              className="w-12 sm:w-14 min-w-0 text-center font-semibold text-foreground text-base tabular-nums bg-transparent placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
            />
            <span className="text-sm text-muted-foreground">cm</span>
            </span>
          </label>
        )}
        <div className="flex flex-col gap-1.5 basis-44 grow sm:grow-0 sm:basis-auto">
        <span className="text-sm text-muted-foreground px-2">{isEn ? 'Weight' : 'Peso'}</span>
        <div className="flex items-center justify-between gap-1 sm:gap-2 bg-secondary/80 px-1.5 h-14 sm:h-12 rounded-full border border-border">
          <button type="button" onClick={() => adjustWeight(-1)} aria-label={isEn ? 'Decrease weight' : 'Disminuir peso'} className={stepBtn}>
            <Icon name="remove" size={16} weight="bold" />
          </button>
          <label className="flex items-baseline gap-1 px-0 sm:px-1 sm:min-w-[76px] min-w-0 justify-center">
            <span className="sr-only">{isEn ? 'Weight in kilograms' : 'Peso en kilogramos'}</span>
            <input
              type="number"
              min="30"
              max="250"
              step="0.5"
              value={weightKg || ''}
              onChange={handleInputChange}
              className="w-12 sm:w-14 min-w-0 text-center font-semibold text-foreground text-base tabular-nums bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded"
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </label>
          <button type="button" onClick={() => adjustWeight(1)} aria-label={isEn ? 'Increase weight' : 'Aumentar peso'} className={stepBtn}>
            <Icon name="add" size={16} weight="bold" />
          </button>
        </div>
        </div>
        </div>
      </div>

      {onHeightChange && !targets.heightCm && weightKg >= 75 && (
        <p className="text-sm text-muted-foreground text-pretty">
          {isEn
            ? 'With your height, the target adjusts to your body frame rather than just body weight.'
            : 'Con tu estatura la meta se ajusta a tu cuerpo y no solo a tu peso.'}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-10 sm:gap-y-6">
        {stats.map((s) => (
          <div key={s.key} className="flex flex-col gap-1 max-sm:[&:nth-child(n+3)]:border-t max-sm:[&:nth-child(n+3)]:border-border max-sm:[&:nth-child(n+3)]:pt-4 sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-border sm:[&:nth-child(n+3)]:pt-6">
            <dt className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon name={s.icon} size={18} weight="duotone" className="text-leaf shrink-0 mt-0.5" />
              <span className="min-w-0 flex-1 text-balance">{s.label}</span>
              <InfoTooltip label={s.label} className="sm:hidden -mt-0.5">{s.detail}</InfoTooltip>
            </dt>
            <dd className="flex flex-wrap items-baseline gap-x-1.5">
              <span className={`${compact ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-4xl'} font-semibold text-foreground tracking-tight tabular-nums`}>{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.unit}</span>
            </dd>
            <dd className="max-sm:hidden text-sm text-muted-foreground leading-snug">{s.detail}</dd>
          </div>
        ))}
      </dl>
      {action && <div>{action}</div>}
    </section>
  );
};
