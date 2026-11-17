'use client';

import React from 'react';
import { calculateNutritionTargets, NutritionTargets } from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';

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

  const stepBtn = 'size-10 rounded-full bg-card hover:bg-accent text-foreground inline-flex items-center justify-center transition-colors border border-border/60';

  const stats = [
    {
      key: 'protein',
      icon: 'bowl_food',
      label: 'Proteína diaria',
      value: `${targets.proteinGrams}`,
      unit: 'g al día',
      detail: targets.usesAdjustedWeight
        ? `Rango ${targets.proteinRange[0]} a ${targets.proteinRange[1]} g, sobre peso referencia de ${targets.proteinReferenceKg} kg`
        : `Rango ${targets.proteinRange[0]} a ${targets.proteinRange[1]} g (1.6 a 2.2 g/kg)`,
    },
    {
      key: 'fat',
      icon: 'plant',
      label: 'Grasas saludables',
      value: `≥${targets.fatGrams}`,
      unit: 'g al día',
      detail: `Mínimo hormonal 1.0 g/kg para síntesis de estrógenos y progesterona`,
    },
    {
      key: 'water',
      icon: 'drop',
      label: 'Agua diaria',
      value: `${targets.waterLiters}`,
      unit: 'L al día',
      detail: `Rango ${targets.waterRangeLiters[0]} a ${targets.waterRangeLiters[1]} L (~${targets.waterGlasses} vasos de 250 ml)`,
    },
    {
      key: 'energy',
      icon: 'flame',
      label: 'Energía y déficit seguro',
      value: `~${targets.maintenanceCalories}`,
      unit: 'kcal al día',
      detail: `Déficit moderado: ~${targets.calorieBreakdown.safeDeficitCalories} kcal (-400 kcal) para perder grasa sin perder músculo`,
    },
  ];

  return (
    <section aria-labelledby="macro-targets" className="w-full bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 id="macro-targets" className="text-foreground text-lg font-semibold text-balance">Tus metas según tu peso</h3>
          <p className="text-muted-foreground text-sm text-pretty">
            Proteína y agua para cuidar tu músculo, tu energía y tu glucosa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {onHeightChange && (
          <label className="flex gap-1 bg-secondary/80 px-4 min-h-[3.25rem] items-center rounded-full border border-border">
            <span className="sr-only">Estatura en centímetros (opcional)</span>
            <input
              type="number"
              min="120"
              max="220"
              step="1"
              inputMode="numeric"
              placeholder="Estatura"
              value={heightCm ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onHeightChange(Number.isFinite(v) && v > 0 ? v : undefined);
              }}
              className="w-20 text-center font-semibold text-foreground text-base tabular-nums bg-transparent placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </label>
        )}
        <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-full border border-border">
          <button type="button" onClick={() => adjustWeight(-1)} aria-label="Disminuir peso" className={stepBtn}>
            <Icon name="remove" size={16} weight="bold" />
          </button>
          <label className="flex items-baseline gap-1 px-1 min-w-[76px] justify-center">
            <span className="sr-only">Peso en kilogramos</span>
            <input
              type="number"
              min="30"
              max="250"
              step="0.5"
              value={weightKg || ''}
              onChange={handleInputChange}
              className="w-14 text-center font-semibold text-foreground text-base tabular-nums bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded"
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </label>
          <button type="button" onClick={() => adjustWeight(1)} aria-label="Aumentar peso" className={stepBtn}>
            <Icon name="add" size={16} weight="bold" />
          </button>
        </div>
        </div>
      </div>

      {targets.usesAdjustedWeight && (
        <p className="rounded-2xl bg-leaf-soft/60 px-4 py-3 text-sm text-foreground text-pretty">
          <Icon name="info" size={16} weight="bold" className="inline -mt-0.5 mr-1.5 text-leaf" />
          Con tu estatura ajustamos las metas para que sean alcanzables: tu músculo no necesita proteína por cada kilo de tu peso total, así que la calculamos sobre {targets.proteinReferenceKg} kg, y el agua y la energía sobre {targets.adjustedWeightKg} kg. Sigues comiendo más proteína que la media, que es lo que protege tu músculo{' '}
          si bajas de peso.
        </p>
      )}
      {onHeightChange && !targets.heightCm && weightKg >= 75 && (
        <p className="text-sm text-muted-foreground text-pretty">
          Añade tu estatura para una meta más realista: con más peso, calcular por cada kilo da cifras de proteína y agua más altas de lo que tu cuerpo necesita.
        </p>
      )}

      <dl className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-4 lg:gap-0 lg:divide-x lg:divide-border' : 'gap-6 lg:divide-x lg:divide-border'}`}>
        {stats.map((s, i) => (
          <div key={s.key} className={`flex flex-col gap-1 ${i > 0 ? 'lg:pl-5' : ''} ${i < stats.length - 1 ? 'lg:pr-5' : ''}`}>
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name={s.icon} size={18} weight="duotone" className="text-leaf shrink-0" />
              {s.label}
            </dt>
            <dd className="flex items-baseline gap-1.5">
              <span className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-semibold text-foreground tracking-tight tabular-nums`}>{s.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{s.unit}</span>
            </dd>
            <dd className="text-xs sm:text-sm text-muted-foreground leading-snug">{s.detail}</dd>
          </div>
        ))}
      </dl>
      {action && <div>{action}</div>}
    </section>
  );
};
