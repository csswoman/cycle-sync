'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { Bloom } from '@/components/ui/Bloom';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { computeCycleInfo } from '@/hooks/useCycleInfo';
import { toISODate } from '@/lib/cycle/cycleEngine';
import { CyclePhase, type CycleConfig } from '@/types';
import type { OnboardingAnswers } from '@/features/setup/onboarding';
import { PhaseRecommendations } from './PhaseRecommendations';
import { dashboardText, phaseKey } from '../dashboardText';

const PREVIEW_KEY = 'cs_dashboard_preview_period';

/** Reference ranges for a 28-day cycle, only to orient someone with no data yet. */
const PHASES = [
    { phase: CyclePhase.MENSTRUAL, tone: 'menstrual', days: [1, 5], energy: 1, growth: 0.1 },
    { phase: CyclePhase.FOLLICULAR, tone: 'follicular', days: [6, 13], energy: 3, growth: 0.45 },
    { phase: CyclePhase.OVULATION, tone: 'ovulation', days: [14, 15], energy: 4, growth: 1 },
    { phase: CyclePhase.LUTEAL, tone: 'luteal', days: [16, 28], energy: 2, growth: 1 },
] as const;

const COPY = {
    es: {
        title: 'Conoce las fases de tu ciclo',
        subtitle: 'Toca una fase para ver cómo cambian tu energía, el movimiento y la comida. Rangos de referencia para un ciclo de 28 días.',
        days: (a: number, b: number) => `Días ${a}–${b}`,
        energy: 'Energía',
        tryTitle: '¿Cuándo empezó tu última regla?',
        tryBody: 'Te mostramos en qué fase estarías hoy. Es solo una vista previa: no se guarda.',
        youAre: (day: number, phase: string) => `Hoy estarías en el día ${day}, fase ${phase}.`,
        clear: 'Borrar',
        movement: 'Movimiento',
        food: 'Comida',
    },
    en: {
        title: 'Get to know your cycle phases',
        subtitle: 'Tap a phase to see how energy, movement and food change. Reference ranges for a 28-day cycle.',
        days: (a: number, b: number) => `Days ${a}–${b}`,
        energy: 'Energy',
        tryTitle: 'When did your last period start?',
        tryBody: 'We will show which phase you would be in today. It is only a preview: nothing is saved.',
        youAre: (day: number, phase: string) => `Today you would be on day ${day}, ${phase} phase.`,
        clear: 'Clear',
        movement: 'Movement',
        food: 'Food',
    },
};

function readPreview(): string {
    try { return window.localStorage.getItem(PREVIEW_KEY) ?? ''; } catch { return ''; }
}
function writePreview(v: string) {
    try {
        if (v) window.localStorage.setItem(PREVIEW_KEY, v);
        else window.localStorage.removeItem(PREVIEW_KEY);
    } catch { /* storage blocked */ }
}

/**
 * Shown while there is no period history (guests and new accounts): an interactive
 * tour of the four phases, an unsaved "what phase would I be in" preview, and the
 * same phase suggestions a tracked user gets, for whichever phase is selected.
 */
export const PhaseExplorer: React.FC<{ answers: OnboardingAnswers }> = ({ answers }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const text = dashboardText[lang];
    const copy = COPY[lang];
    const [selected, setSelected] = useState<CyclePhase>(CyclePhase.FOLLICULAR);
    const [lastStart, setLastStart] = useState('');
    const today = toISODate(new Date());

    useEffect(() => { setLastStart(readPreview()); }, []);

    const preview = useMemo(() => {
        if (!lastStart || lastStart > today) return null;
        const cfg: CycleConfig = {
            id: '', user_id: '', cycle_length: 28, last_period_start: lastStart,
            workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
        };
        return computeCycleInfo(cfg, []);
    }, [lastStart, today]);

    // A preview inside one typical cycle picks its phase; a stale date would only show "late".
    useEffect(() => {
        if (preview && preview.cycleDay <= preview.cycleLength) setSelected(preview.phase);
    }, [preview]);

    const current = PHASES.find((p) => p.phase === selected) ?? PHASES[1];
    const phaseCopy = text.phases[phaseKey(selected)];

    const onDate = (v: string) => { setLastStart(v); writePreview(v); };

    return (
        <section aria-labelledby="phase-explorer-title" className="flex flex-col gap-4">
            <div data-phase={current.tone} className="relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-5">
                <CardFlowers variant="explorer" />
                <header>
                    <h2 id="phase-explorer-title" className="text-foreground text-xl font-semibold tracking-tight">{copy.title}</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">{copy.subtitle}</p>
                </header>

                {/* Phase selector: one segment per phase, sized by its reference length. */}
                <div role="tablist" aria-label={copy.title} className="flex gap-1.5">
                    {PHASES.map((p) => {
                        const active = p.phase === selected;
                        const len = p.days[1] - p.days[0] + 1;
                        return (
                            <button
                                key={p.phase}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                data-phase={p.tone}
                                onClick={() => setSelected(p.phase)}
                                style={{ flexGrow: Math.max(len, 4), flexBasis: 0 }}
                                className={`min-w-0 rounded-2xl px-2.5 py-2.5 text-left transition-all duration-300 cursor-pointer border ${active
                                    ? 'bg-phase-soft border-transparent shadow-sm'
                                    : 'bg-secondary/40 border-transparent hover:bg-secondary/70'
                                    }`}
                            >
                                <span className={`block h-1.5 rounded-full mb-2 ${active ? 'bg-phase' : 'bg-phase opacity-40'}`} />
                                <span className={`block text-xs sm:text-sm font-semibold truncate ${active ? 'text-phase' : 'text-foreground'}`}>
                                    {text.phases[phaseKey(p.phase)].name}
                                </span>
                                <span className="block text-[11px] sm:text-xs text-muted-foreground truncate">{copy.days(p.days[0], p.days[1])}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] gap-5">
                    <div className="phase-wash relative overflow-hidden rounded-2xl border border-border/60 p-5 flex flex-col gap-3 min-h-44">
                        <Bloom growth={current.growth} tone={current.tone} className="absolute -bottom-1 right-1 h-28 w-auto opacity-90" />
                        <div className="relative pr-20">
                            <p className="text-xs font-bold uppercase tracking-wider text-phase">{phaseCopy.hormones}</p>
                            <h3 className="text-foreground text-2xl font-semibold tracking-tight mt-1">{phaseCopy.focus}</h3>
                        </div>
                        <div className="relative flex items-center gap-2" aria-label={`${copy.energy}: ${current.energy}/4`}>
                            <span className="text-xs font-semibold text-muted-foreground">{copy.energy}</span>
                            <span className="flex gap-1" aria-hidden="true">
                                {[1, 2, 3, 4].map((i) => (
                                    <Icon key={i} name="bolt" size={16} weight={i <= current.energy ? 'fill' : 'regular'} className={i <= current.energy ? 'text-phase' : 'text-muted-foreground/40'} />
                                ))}
                            </span>
                        </div>
                        <dl className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 pr-0 sm:pr-16 text-sm">
                            <div>
                                <dt className="flex items-center gap-1.5 font-semibold text-foreground"><Icon name="fitness_center" size={16} className="text-phase" />{copy.movement}</dt>
                                <dd className="text-muted-foreground mt-0.5">{phaseCopy.movement.title}</dd>
                            </div>
                            <div>
                                <dt className="flex items-center gap-1.5 font-semibold text-foreground"><Icon name="restaurant" size={16} className="text-phase" />{copy.food}</dt>
                                <dd className="text-muted-foreground mt-0.5">{phaseCopy.food.title}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Unsaved preview: a date gives a phase today, nothing is stored server side. */}
                    <div className="rounded-2xl bg-secondary/40 p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Icon name="calendar_today" size={18} className="text-blossom" />
                            <p className="text-sm font-semibold text-foreground">{copy.tryTitle}</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{copy.tryBody}</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={lastStart}
                                max={today}
                                onChange={(e) => onDate(e.target.value)}
                                aria-label={copy.tryTitle}
                                className="flex-1 min-w-0 h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                            />
                            {lastStart && (
                                <button type="button" onClick={() => onDate('')} className="shrink-0 px-3 h-11 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                                    {copy.clear}
                                </button>
                            )}
                        </div>
                        {preview && (
                            <p className="text-sm font-semibold text-foreground" aria-live="polite">
                                {preview.cycleDay > preview.cycleLength
                                    ? text.overdueDay(preview.cycleDay)
                                    : copy.youAre(preview.cycleDay, text.phases[phaseKey(preview.phase)].name)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <PhaseRecommendations phase={selected} answers={answers} />
        </section>
    );
};
