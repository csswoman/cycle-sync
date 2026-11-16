'use client';

import React from 'react';
import { calculateNutritionTargets, NutritionTargets } from '@/lib/nutrition/targets';
import { Icon } from '@/components/ui/Icon';

interface MacroWaterCalculatorProps {
  weightKg: number;
  onWeightChange: (newWeight: number) => void;
  compact?: boolean;
}

export const MacroWaterCalculator: React.FC<MacroWaterCalculatorProps> = ({
  weightKg,
  onWeightChange,
  compact = false,
}) => {
  const targets: NutritionTargets = calculateNutritionTargets(weightKg);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onWeightChange(val);
    }
  };

  const adjustWeight = (delta: number) => {
    const next = Math.max(30, Math.min(200, Math.round((weightKg + delta) * 10) / 10));
    onWeightChange(next);
  };

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
      {/* Header with weight selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="barbell" size={22} weight="duotone" />
          </div>
          <div>
            <h3 className="text-foreground text-base sm:text-lg font-bold flex items-center gap-2">
              Metas según tu Peso
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blossom-soft text-blossom border border-blossom/20">
                Ganar Músculo & Bajar Grasa
              </span>
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Proteína y agua para cuidar tu masa muscular, tu energía y tu glucosa
            </p>
          </div>
        </div>

        {/* Weight input controls */}
        <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-xl border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => adjustWeight(-1)}
            aria-label="Disminuir peso"
            className="w-8 h-8 rounded-lg bg-card hover:bg-accent text-foreground flex items-center justify-center transition-colors font-bold text-base shadow-sm border border-border/40"
          >
            -
          </button>
          <div className="flex items-baseline gap-1 px-2 min-w-[70px] justify-center">
            <input
              type="number"
              min="30"
              max="200"
              step="0.5"
              value={weightKg || ''}
              onChange={handleInputChange}
              aria-label="Peso en kilogramos"
              className="w-14 text-center font-bold text-foreground text-base bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
            />
            <span className="text-xs text-muted-foreground font-semibold">kg</span>
          </div>
          <button
            type="button"
            onClick={() => adjustWeight(1)}
            aria-label="Aumentar peso"
            className="w-8 h-8 rounded-lg bg-card hover:bg-accent text-foreground flex items-center justify-center transition-colors font-bold text-base shadow-sm border border-border/40"
          >
            +
          </button>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Protein Target */}
        <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-xl border border-primary/20 p-4.5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Proteína Diaria
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  {targets.proteinGrams}
                </span>
                <span className="text-sm font-bold text-muted-foreground">g / día</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon name="bowl_food" size={20} weight="duotone" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Rango óptimo (1.6 - 2.2 g/kg):</span>
              <span className="font-bold text-foreground">
                {targets.proteinRange[0]} - {targets.proteinRange[1]} g
              </span>
            </div>
            {!compact && (
              <p className="text-muted-foreground/90 leading-relaxed mt-1">
                En déficit calórico, un aporte de 2.0 g/kg protege tu tejido muscular del catabolismo y aumenta la saciedad.
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Water Target */}
        <div className="bg-gradient-to-br from-blue-500/5 via-card to-card rounded-xl border border-blue-500/20 p-4.5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                Agua Diaria
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  {targets.waterLiters}
                </span>
                <span className="text-sm font-bold text-muted-foreground">L / día</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Icon name="drop" size={20} weight="duotone" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Rango (35 - 40 ml/kg):</span>
              <span className="font-bold text-foreground">
                {targets.waterRangeLiters[0]} - {targets.waterRangeLiters[1]} L
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Equivalente:</span>
              <span className="font-bold text-foreground">~{targets.waterGlasses} vasos (250ml)</span>
            </div>
            {!compact && (
              <p className="text-muted-foreground/90 leading-relaxed mt-1">
                El músculo es ~75% agua. La hidratación celular es vital para transportar nutrientes y sintetizar masa magra.
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Caloric Guidance */}
        <div className="bg-gradient-to-br from-amber-500/5 via-card to-card rounded-xl border border-amber-500/20 p-4.5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Calorías Recomendadas
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  ~{targets.cuttingCalories}
                </span>
                <span className="text-sm font-bold text-muted-foreground">kcal / día</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Icon name="flame" size={20} weight="duotone" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Mantenimiento aprox:</span>
              <span className="font-bold text-foreground">~{targets.maintenanceCalories} kcal</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Déficit moderado:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">-15% a -20%</span>
            </div>
            {!compact && (
              <p className="text-muted-foreground/90 leading-relaxed mt-1">
                Un déficit moderado permite perder grasa constante sin fatigar tu tiroides ni destruir masa muscular.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
