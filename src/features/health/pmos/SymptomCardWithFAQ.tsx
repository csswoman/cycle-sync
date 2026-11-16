'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PMOS_SYMPTOM_CONFIGS, SymptomConfig } from './symptomFaqData';

interface SymptomCardWithFAQProps {
  symptomKey: string;
  value: number;
  onChange: (val: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemoveFromRoutine?: () => void;
  lang: 'es' | 'en';
}

const SEVERITY_COLORS = [
  'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold',
  'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold',
  'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold',
  'bg-rose-500 text-white shadow-rose-500/20 font-bold',
];

const SEVERITY_BADGE_STYLES = [
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
];

const LEVEL_DESCRIPTIONS: Record<string, { es: string[]; en: string[] }> = {
  acne: {
    es: [
      'Piel limpia y sin brotes activos',
      'Puntos negros aislados o granitos leves',
      'Pápulas inflamadas en mandíbula, mentón o mejillas',
      'Acné quístico profundo, doloroso o con riesgo de cicatriz',
    ],
    en: [
      'Clear skin, no active breakouts',
      'Isolated blemishes or mild surface spots',
      'Inflamed papules on jawline, chin, or cheeks',
      'Severe, painful cystic acne with risk of scarring',
    ],
  },
  fatigue: {
    es: [
      'Energía estable y buena vitalidad durante todo el día',
      'Cansancio leve y normal al final de la jornada',
      'Bajones marcados tras comidas o fatiga al despertar',
      'Agotamiento extremo que limita tus actividades diarias',
    ],
    en: [
      'Steady, balanced energy throughout the day',
      'Mild, normal tiredness toward the evening',
      'Noticeable post-meal slumps or sluggish mornings',
      'Severe exhaustion that impairs daily routine',
    ],
  },
  hirsutism: {
    es: [
      'Sin vello fuera de lo habitual o imperceptible',
      'Vello fino aislado en barbilla, labio o patillas',
      'Vello oscuro más grueso en mentón, cuello o abdomen',
      'Crecimiento denso, rápido y continuo que requiere depilación frecuente',
    ],
    en: [
      'No unusual or noticeable hair growth',
      'Fine isolated hairs on chin, lip, or sideburns',
      'Thicker recurring dark hair on jaw, neck, or belly',
      'Dense, rapid terminal hair growth needing frequent removal',
    ],
  },
  hair_loss: {
    es: [
      'Caída normal habitual (50-100 cabellos/día) y buena densidad',
      'Caída ligeramente mayor al peinarte o lavarte el pelo',
      'Pérdida perceptible de densidad o raya central más ancha',
      'Caída abundante en mechones y áreas claras visibles en el cuero cabelludo',
    ],
    en: [
      'Normal daily shedding with healthy, full density',
      'Slightly higher shedding when washing or styling',
      'Observable thinning along the central parting or crown',
      'Heavy shedding in clumps with visible scalp areas',
    ],
  },
  mood_swings: {
    es: [
      'Estado anímico sereno, equilibrado y con buena resiliencia',
      'Leve irritabilidad o sensibilidad emocional pasajera',
      'Ansiedad marcada, frustración rápida o cambios de humor',
      'Desborde emocional, angustia intensa o llanto frecuente',
    ],
    en: [
      'Calm, steady mood with healthy emotional resilience',
      'Mild, fleeting irritability or sensitivity',
      'Noticeable anxiety, low frustration threshold, or mood shifts',
      'Overwhelming distress, severe irritability, or persistent low mood',
    ],
  },
  bloating: {
    es: [
      'Digestión ligera, vientre desinflamado y cómodo',
      'Leve sensación de pesadez o plenitud tras algunas comidas',
      'Distensión visible, ropa ajustada y gases incómodos',
      'Hinchazón dolorosa, abdomen tenso y malestar continuo',
    ],
    en: [
      'Light digestion with a comfortable, flat abdomen',
      'Mild fullness or heaviness following certain meals',
      'Visible distension, tight waistband, and bothersome gas',
      'Painful distension, rigid abdomen, and ongoing discomfort',
    ],
  },
};

export const SymptomCardWithFAQ: React.FC<SymptomCardWithFAQProps> = ({
  symptomKey,
  value,
  onChange,
  isExpanded,
  onToggleExpand,
  onRemoveFromRoutine,
  lang,
}) => {
  const config: SymptomConfig | undefined = PMOS_SYMPTOM_CONFIGS[symptomKey];
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTooltipOpen(false);
    };

    if (tooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tooltipOpen]);

  if (!config) return null;

  const currentLevelLabel = config.levels[lang][value] ?? config.levels[lang][0];
  const currentLevelDesc = LEVEL_DESCRIPTIONS[symptomKey]?.[lang]?.[value] ?? '';
  const { cause, tips, doctor } = config.faqSummary;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-all duration-300 bg-card overflow-visible shadow-xs ${
        isExpanded
          ? 'border-primary/50 ring-1 ring-primary/20 shadow-md'
          : value > 0
          ? 'border-primary/30 hover:border-primary/50'
          : 'border-border hover:border-border/80'
      }`}
    >
      {/* Header Row: Clickable to expand / collapse */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.accentBg} ${config.accentBorder} border`}
          >
            <span className={`material-symbols-outlined text-2xl ${config.color}`}>{config.icon}</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-foreground text-base sm:text-lg font-bold leading-snug">
                {config.name[lang]}
              </h4>

              {/* FAQ Tooltip trigger button (stop propagation so clicking FAQ doesn't toggle card) */}
              <div
                className="relative inline-flex items-center shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setTooltipOpen((prev) => !prev)}
                  onMouseEnter={() => setTooltipOpen(true)}
                  className={`w-7 h-7 rounded-full text-xs transition-all flex items-center justify-center shrink-0 border ${
                    tooltipOpen
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10 border-border/70 hover:border-primary/40'
                  }`}
                  aria-label={lang === 'es' ? `FAQ de ${config.name.es}` : `FAQ for ${config.name.en}`}
                  title={lang === 'es' ? 'Ver FAQ clínica resumida' : 'View quick clinical FAQ'}
                >
                  <span className="material-symbols-outlined text-[17px]">help</span>
                </button>

                {/* Floating summarized Tooltip / Popover with readable typography */}
                {tooltipOpen && (
                  <div
                    className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2.5 w-80 sm:w-96 p-4 rounded-2xl bg-card text-foreground border border-border shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3 text-left pointer-events-auto"
                    onMouseLeave={() => setTooltipOpen(false)}
                  >
                    {/* Tooltip Header */}
                    <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                      <span className="font-bold flex items-center gap-2 text-foreground text-sm sm:text-base">
                        <span className={`material-symbols-outlined text-lg ${config.color}`}>
                          {config.icon}
                        </span>
                        <span>{config.name[lang]}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          ({lang === 'es' ? 'FAQ Clínica' : 'Clinical FAQ'})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTooltipOpen(false);
                        }}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    {/* 1. ¿Por qué ocurre? */}
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-primary text-xs sm:text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">biotech</span>
                        {lang === 'es' ? '¿Por qué ocurre?' : 'Why does it happen?'}
                      </span>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        {cause[lang]}
                      </p>
                    </div>

                    {/* 2. Qué ayuda */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-primary text-xs sm:text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">spa</span>
                        {lang === 'es' ? 'Qué hábitos y suplementos ayudan:' : 'What helps:'}
                      </span>
                      <ul className="text-muted-foreground text-xs sm:text-sm leading-relaxed space-y-1 list-disc pl-4">
                        {tips[lang].map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Cuándo consultar */}
                    <div className="flex flex-col gap-1 bg-secondary/50 p-2.5 rounded-xl border border-border/60">
                      <span className="font-bold text-destructive dark:text-rose-400 text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">stethoscope</span>
                        {lang === 'es' ? 'Cuándo consultar con un médico:' : 'When to see a doctor:'}
                      </span>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {doctor[lang]}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-full w-0 h-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-border" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-xs sm:text-sm leading-tight mt-0.5">
              {config.tagline[lang]}
            </p>
          </div>
        </div>

        {/* Right side: Current level badge & Chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border transition-colors ${SEVERITY_BADGE_STYLES[value]}`}
          >
            {currentLevelLabel} ({value}/3)
          </span>

          <span
            className={`material-symbols-outlined text-muted-foreground text-2xl transition-transform duration-300 ${
              isExpanded ? 'rotate-180 text-primary' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded Area: Visible ONLY when clicked/expanded */}
      {isExpanded && (
        <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-0 border-t border-border/70 mt-1 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {lang === 'es' ? 'Selecciona tu nivel de intensidad hoy:' : 'Rate your intensity for today:'}
            </span>
            {onRemoveFromRoutine && (
              <button
                type="button"
                onClick={onRemoveFromRoutine}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 hover:underline transition-colors"
                title={lang === 'es' ? 'Quitar este síntoma de mi rutina' : 'Remove this symptom from my routine'}
              >
                <span className="material-symbols-outlined text-[15px]">delete_outline</span>
                <span>{lang === 'es' ? 'Quitar de mi rutina' : 'Remove from routine'}</span>
              </button>
            )}
          </div>

          {/* 4 Large, Accessible, Legible Severity Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {config.levels[lang].map((label, idx) => {
              const isSelected = value === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(idx)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl text-sm sm:text-base font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                    isSelected
                      ? `${SEVERITY_COLORS[idx]} border-transparent scale-[1.02]`
                      : 'bg-secondary/40 hover:bg-secondary border-border/70 text-foreground/80 hover:text-foreground'
                  }`}
                >
                  <span className="leading-none">{label}</span>
                  <span className="text-xs opacity-80 font-normal">
                    {lang === 'es' ? `Nivel ${idx}` : `Level ${idx}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic description of current level with comfortable 14px text */}
          {currentLevelDesc && (
            <div className="text-sm text-foreground/90 bg-secondary/30 rounded-xl p-3.5 border border-border/50 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                info
              </span>
              <span className="leading-relaxed">{currentLevelDesc}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomCardWithFAQ;
