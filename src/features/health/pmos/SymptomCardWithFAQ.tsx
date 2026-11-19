'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
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
  'bg-leaf text-card',
  'bg-sun text-sun-on',
  'bg-coral text-primary-foreground',
  'bg-bud text-primary-foreground',
];

const SEVERITY_BADGE_STYLES = [
  'bg-leaf/10 text-leaf border-leaf/30',
  'bg-sun/10 text-sun-ink border-sun/30',
  'bg-coral/10 text-sun-ink border-coral/30',
  'bg-bud/10 text-bud border-bud/30',
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
  if (!config) return null;
  const currentLevelLabel = config.levels[lang][value] ?? config.levels[lang][0];
  const currentLevelDesc = LEVEL_DESCRIPTIONS[symptomKey]?.[lang]?.[value] ?? '';
  const { cause, tips, doctor } = config.faqSummary;
  const panelId = `symptom-panel-${symptomKey}`;
  return (
    <div className="relative">
      {/* Row header: the toggle is a real button; the FAQ button is its sibling, not nested. */}
      <div className="flex items-center gap-1 pr-2 sm:pr-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex-1 min-w-0 min-h-[64px] px-4 sm:px-5 py-3 flex items-center gap-3.5 text-left rounded-xl hover:bg-secondary/40 transition-colors"
        >
          <span
            className={`size-11 rounded-xl flex items-center justify-center shrink-0 border ${config.accentBg} ${config.accentBorder}`}
          >
            <span className={`material-symbols-outlined text-[24px] ${config.color}`} aria-hidden="true">{config.icon}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-base font-semibold text-foreground leading-snug">{config.name[lang]}</span>
            <span className="block text-sm text-muted-foreground leading-snug line-clamp-2 sm:truncate">{config.tagline[lang]}</span>
            <span className={`sm:hidden inline-block mt-1.5 text-sm font-semibold px-3 py-0.5 rounded-full border ${SEVERITY_BADGE_STYLES[value]}`}>
              {currentLevelLabel}
            </span>
          </span>
          <span
            className={`hidden sm:inline shrink-0 text-sm font-semibold px-3 py-1 rounded-full border ${SEVERITY_BADGE_STYLES[value]}`}
          >
            {currentLevelLabel}
          </span>
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[24px] text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
          >
            expand_more
          </span>
        </button>
        <InfoTooltip label={lang === 'es' ? `Más información sobre ${config.name.es}` : `More about ${config.name.en}`} className="!size-10">
          <h4 className="font-semibold text-base text-foreground tracking-tight">{config.name[lang]}</h4>
          <div className="flex flex-col gap-1">
            <h5 className="text-sm font-semibold text-primary">{lang === 'es' ? '¿Por qué ocurre?' : 'Why does it happen?'}</h5>
            <p className="text-sm text-muted-foreground">{cause[lang]}</p>
          </div>
          <div className="flex flex-col gap-1">
            <h5 className="text-sm font-semibold text-primary">{lang === 'es' ? 'Qué suele ayudar' : 'What often helps'}</h5>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5 marker:text-primary/50">
              {tips[lang].map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          </div>
          <div className="flex flex-col gap-1 bg-secondary/50 p-3 rounded-xl">
            <h5 className="text-sm font-semibold text-foreground">{lang === 'es' ? 'Cuándo consultar a tu médica o médico' : 'When to see a doctor'}</h5>
            <p className="text-sm text-muted-foreground">{doctor[lang]}</p>
          </div>
        </InfoTooltip>
      </div>
      {isExpanded && (
        <div id={panelId} className="px-4 sm:px-5 pb-5 pt-1 flex flex-col gap-4 animate-in fade-in duration-200">
          <div
            role="radiogroup"
            aria-label={lang === 'es' ? `Intensidad de ${config.name.es} hoy` : `Today's intensity for ${config.name.en}`}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            {config.levels[lang].map((label, idx) => {
              const isSelected = value === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange(idx)}
                  className={`min-h-[48px] px-3 rounded-xl text-base font-semibold transition-colors border ${
                    isSelected
                      ? `${SEVERITY_COLORS[idx]} border-transparent`
                      : 'bg-card hover:bg-secondary border-border text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-start justify-between gap-4">
            {currentLevelDesc ? (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-prose text-pretty">{currentLevelDesc}</p>
            ) : <span />}
            {onRemoveFromRoutine && (
              <button
                type="button"
                onClick={onRemoveFromRoutine}
                className="shrink-0 min-h-10 px-2 -mr-2 text-sm text-muted-foreground hover:text-destructive inline-flex items-center gap-1.5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete_outline</span>
                {lang === 'es' ? 'Quitar de mi rutina' : 'Remove from routine'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SymptomCardWithFAQ;
