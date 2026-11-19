'use client';
import React from 'react';
import Link from 'next/link';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FLOW_LEVELS, type FlowLevel } from '@/lib/cycle/bleeding';
type Lang = 'es' | 'en';
const copy = {
  es: {
    flowTitle: 'Intensidad del sangrado',
    flow: { light: 'Ligero', medium: 'Medio', heavy: 'Abundante', very_heavy: 'Muy abundante' } as Record<FlowLevel, string>,
    veryHeavyHelp: 'Muy abundante: empapas una toalla o tampón cada 1 a 2 horas.',
    clots: 'Hubo coágulos',
    painTitle: 'Dolor',
    painNone: 'Sin registrar',
    painClear: 'Quitar',
    iron: 'En días de sangrado abundante conviene cuidar el hierro.',
    ironLink: 'Ver sugerencias de hierro',
  },
  en: {
    flowTitle: 'Bleeding intensity',
    flow: { light: 'Light', medium: 'Medium', heavy: 'Heavy', very_heavy: 'Very heavy' } as Record<FlowLevel, string>,
    veryHeavyHelp: 'Very heavy: you soak a pad or tampon every 1 to 2 hours.',
    clots: 'There were clots',
    painTitle: 'Pain',
    painNone: 'Not logged',
    painClear: 'Clear',
    iron: 'On heavy bleeding days it is worth looking after your iron.',
    ironLink: 'See iron suggestions',
  },
};
export interface FlowValue {
  flow?: FlowLevel | null;
  clots?: boolean;
  pain?: number | null;
}
const chip = (active: boolean) =>
  `min-h-11 sm:min-h-10 px-4 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-foreground border-transparent hover:bg-secondary'
  }`;
/** Flow, clots and pain for one day. Used by the body-signs form and the calendar quick editor. */
export const FlowFields: React.FC<{ lang: Lang; value: FlowValue; onChange: (patch: FlowValue) => void }> = ({ lang, value, onChange }) => {
  const c = copy[lang];
  const heavy = value.flow === 'heavy' || value.flow === 'very_heavy';
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">{c.flowTitle}</p>
        <div className="flex flex-wrap gap-2">
          {FLOW_LEVELS.map((f) => (
            <button key={f} type="button" aria-pressed={value.flow === f} className={chip(value.flow === f)}
              onClick={() => onChange({ flow: value.flow === f ? null : f })}>
              {c.flow[f]}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{c.veryHeavyHelp}</p>
      </div>
      <label className="flex items-center gap-3 min-h-11 sm:min-h-10 text-sm font-semibold text-foreground cursor-pointer">
        <input type="checkbox" className="size-5 accent-primary" checked={!!value.clots} onChange={(e) => onChange({ clots: e.target.checked })} />
        {c.clots}
        <InfoTooltip label={c.clots} className="-ml-1"><p>{lang === 'es' ? 'Coágulos grandes (más que una moneda) o que se repiten ciclo tras ciclo son útiles de comentar en consulta.' : 'Large clots (bigger than a coin) or clots that repeat cycle after cycle are worth mentioning to your doctor.'}</p></InfoTooltip>
      </label>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="flex items-center gap-1">
            <label htmlFor="flow-pain" className="text-sm font-semibold text-foreground">{c.painTitle}</label>
            <InfoTooltip label={c.painTitle}><p>{lang === 'es' ? '0 es sin dolor y 10 el peor dolor que has sentido. Si limita tus actividades o no mejora con el tiempo, coméntalo en consulta.' : '0 is no pain and 10 is the worst you have felt. If it limits your activities or does not improve, mention it to your doctor.'}</p></InfoTooltip>
          </span>
          <span className={`text-sm tabular-nums ${value.pain == null ? 'font-medium text-muted-foreground' : 'font-bold text-foreground'}`}>{value.pain == null ? c.painNone : `${value.pain}/10`}</span>
        </div>
        <div className="flex items-center gap-3">
          <input id="flow-pain" type="range" min={0} max={10} step={1} value={value.pain ?? 0} className="flex-1 h-10 accent-primary"
            onChange={(e) => onChange({ pain: Number(e.target.value) })} />
          {value.pain != null && (
            <button type="button" className="min-h-10 px-3 rounded-full text-sm font-semibold text-primary hover:bg-primary/10" onClick={() => onChange({ pain: null })}>{c.painClear}</button>
          )}
        </div>
      </div>
      {heavy && (
        <p className="text-sm text-muted-foreground bg-sun/10 rounded-2xl px-4 py-3">
          {c.iron}{' '}
          <Link href="/nutrition?tab=tastes" className="font-bold text-primary hover:underline">{c.ironLink}</Link>
        </p>
      )}
    </div>
  );
};
export default FlowFields;
