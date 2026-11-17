import type { Pregnancy } from '@/lib/cycle/pregnancy';
import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { daysBetween, type PeriodInput } from '@/lib/cycle/cycleEngine';
import type { BleedingSign } from '@/lib/cycle/bleeding';
import {
    analyzeCycles, cycleHealthFlags, MAX_REGULAR_DIFFERENCE, MIN_CYCLES_PER_YEAR, NO_PERIOD_DAYS, NORMAL_CYCLE_MAX,
    NORMAL_CYCLE_MIN, NORMAL_PERIOD_MAX, NORMAL_PERIOD_MIN, PROLONGED_BLEEDING_DAYS,
    type CycleFlag, type Rating,
} from '@/lib/cycle/cycleAnalysis';

const copy = {
    es: {
        title: 'Análisis del ciclo',
        lastCycle: 'Último ciclo', lastPeriod: 'Último período', nextPeriod: 'Próxima menstruación',
        days: 'días',
        inDays: (n: number) => `en ${n} días`, today: 'hoy', late: (n: number) => `${n} ${n === 1 ? 'día' : 'días'} de retraso`,
        cycleLength: 'Duración del ciclo', periodLength: 'Duración del período',
        normal: 'Normal', abnormal: 'Anormal', avg: 'PROM.',
        summary: (mean: number, n: number) => `Tus ciclos duraron una media de ${mean} días durante los últimos ${n} ciclos.`,
        summaryAbnormal: ' Es un patrón inusual. Si continúa, considera consultar a un profesional sanitario.',
        variation: 'Variación', variationHelp: 'Comparación de los últimos 2 ciclos',
        periodSummary: (mean: number, n: number) => `Tus períodos duraron una media de ${mean} días durante los últimos ${n} períodos.`,
        noPeriodEnd: 'Marca el último día de cada regla para ver cuánto dura.',
        aboutCycle: 'Sobre la duración del ciclo',
        aboutCycleBody: [
            'Tu ciclo se cuenta desde el primer día de un período hasta el primer día del siguiente.',
            `Una duración del ciclo de ${NORMAL_CYCLE_MIN} a ${NORMAL_CYCLE_MAX} días es normal. Una diferencia de hasta ${MAX_REGULAR_DIFFERENCE} días entre tu ciclo más corto y el más largo sigue siendo regular.`,
            'Cuantos más ciclos registres, más precisa será tu media.',
        ],
        aboutPeriod: 'Sobre la duración del período',
        aboutPeriodBody: [`Un período dura normalmente entre ${NORMAL_PERIOD_MIN} y ${NORMAL_PERIOD_MAX} días.`],
        ok: 'Entendido', info: 'Información', notEnough: 'Registra al menos dos períodos para ver tus ciclos.',
        flagsTitle: 'Para comentar con tu médica',
        flagsBody: 'Son patrones de tu registro según las guías clínicas de ciclo menstrual (SOP/PMOS 2023 y FIGO). No son un diagnóstico.',
        flags: {
            noPeriod90: `Llevas más de ${NO_PERIOD_DAYS} días sin registrar una regla. Si no es un olvido de registro, conviene revisarlo: las pausas largas sin sangrado pueden necesitar tratamiento para proteger el endometrio.`,
            longCycles: `Varios de tus ciclos recientes duraron más de ${NORMAL_CYCLE_MAX} días, lo que suele indicar ovulación tardía o ausente.`,
            shortCycles: `Varios de tus ciclos recientes duraron menos de ${NORMAL_CYCLE_MIN} días.`,
            fewPeriodsYear: `Has tenido menos de ${MIN_CYCLES_PER_YEAR} reglas en el último año.`,
            longBleeding: `Tus últimas reglas duraron más de ${PROLONGED_BLEEDING_DAYS} días. Si además son abundantes, vale la pena revisar tu hierro.`,
            heavyBleeding: 'En una de tus últimas reglas anotaste 2 o más días de sangrado muy abundante (o abundante con coágulos). Conviene comentarlo y revisar tu hierro.',
            heavyAfterGap: 'Tuviste una regla abundante después de 90 días o más sin sangrado. Conviene comentarlo en consulta.',
            severePain: 'En varias de tus últimas reglas anotaste dolor de 7/10 o más. Un dolor que te frena no es algo que tengas que aguantar: coméntalo, puede tener tratamiento y a veces indica endometriosis.',
        } as Record<CycleFlag, string>,
    },
    en: {
        title: 'Cycle analysis',
        lastCycle: 'Last cycle', lastPeriod: 'Last period', nextPeriod: 'Next period',
        days: 'days',
        inDays: (n: number) => `in ${n} days`, today: 'today', late: (n: number) => `${n} ${n === 1 ? 'day' : 'days'} late`,
        cycleLength: 'Cycle length', periodLength: 'Period length',
        normal: 'Normal', abnormal: 'Abnormal', avg: 'AVG',
        summary: (mean: number, n: number) => `Your cycles averaged ${mean} days over the last ${n} cycles.`,
        summaryAbnormal: ' This is an unusual pattern. If it continues, consider talking to a healthcare professional.',
        variation: 'Variation', variationHelp: 'Comparison of the last 2 cycles',
        periodSummary: (mean: number, n: number) => `Your periods averaged ${mean} days over the last ${n} periods.`,
        noPeriodEnd: 'Mark the last day of each period to see how long it lasts.',
        aboutCycle: 'About cycle length',
        aboutCycleBody: [
            'Your cycle is counted from the first day of one period to the first day of the next.',
            `A cycle length of ${NORMAL_CYCLE_MIN} to ${NORMAL_CYCLE_MAX} days is normal. A difference of up to ${MAX_REGULAR_DIFFERENCE} days between your shortest and longest cycle is still regular.`,
            'The more cycles you log, the more accurate your average will be.',
        ],
        aboutPeriod: 'About period length',
        aboutPeriodBody: [`A period usually lasts between ${NORMAL_PERIOD_MIN} and ${NORMAL_PERIOD_MAX} days.`],
        ok: 'Got it', info: 'Information', notEnough: 'Log at least two periods to see your cycles.',
        flagsTitle: 'Worth raising with your doctor',
        flagsBody: 'These are patterns in your log based on menstrual cycle guidelines (PCOS/PMOS 2023 and FIGO). They are not a diagnosis.',
        flags: {
            noPeriod90: `It has been more than ${NO_PERIOD_DAYS} days since you logged a period. If that is not a missed entry, get it checked: long gaps without bleeding may need treatment to protect the uterine lining.`,
            longCycles: `Several of your recent cycles lasted more than ${NORMAL_CYCLE_MAX} days, which usually points to late or absent ovulation.`,
            shortCycles: `Several of your recent cycles lasted less than ${NORMAL_CYCLE_MIN} days.`,
            fewPeriodsYear: `You have had fewer than ${MIN_CYCLES_PER_YEAR} periods in the last year.`,
            longBleeding: `Your last periods lasted more than ${PROLONGED_BLEEDING_DAYS} days. If they are also heavy, it is worth checking your iron.`,
            heavyBleeding: 'In one of your recent periods you logged 2 or more days of very heavy bleeding (or heavy with clots). Worth mentioning, and worth checking your iron.',
            heavyAfterGap: 'You had a heavy period after 90 days or more without bleeding. Worth mentioning at your appointment.',
            severePain: 'In several of your recent periods you logged pain of 7/10 or more. Pain that stops you is not something you have to put up with: mention it, it can be treated and sometimes points to endometriosis.',
        } as Record<CycleFlag, string>,
    },
};

const RatingBadge: React.FC<{ rating: Rating; label: string }> = ({ rating, label }) => (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${rating === 'normal' ? 'text-leaf' : 'text-sun-ink'}`}>
        <span className="material-symbols-outlined text-[18px]">{rating === 'normal' ? 'check_circle' : 'error'}</span>
        {label}
    </span>
);

const Bars: React.FC<{ values: number[]; mean: number; avgLabel: string; color: string }> = ({ values, mean, avgLabel, color }) => {
    const top = Math.max(...values, 1);
    return (
        <div className="relative pt-4">
            <div className="flex items-end justify-between gap-2 h-24 relative">
                <div
                    className="absolute left-0 right-0 border-t border-dashed border-foreground/40 pointer-events-none"
                    style={{ bottom: `${(mean / top) * 100}%` }}
                >
                    <span className="absolute right-0 -top-4 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">{avgLabel}</span>
                </div>
                {values.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className={`w-full max-w-[36px] rounded-md transition-all ${color}`} style={{ height: `${Math.max((v / top) * 100, 8)}%` }} />
                    </div>
                ))}
            </div>
            <div className="flex justify-between gap-2 mt-1.5">
                {values.map((v, i) => (
                    <span key={i} className="flex-1 text-center text-[11px] font-semibold text-muted-foreground">{v}</span>
                ))}
            </div>
        </div>
    );
};

interface Props {
    periods: PeriodInput[];
    /** Per-day flow log, used for the heavy-bleeding flags. */
    signs?: BleedingSign[];
    /** Pregnancy intervals, left out of the cycle statistics. */
    pregnancies?: Pregnancy[];
    /** Expected start of the next period (same date as the forecast card). */
    expectedNext?: Date;
    /** Long gaps have a known cause (breastfeeding, contraception, menopause): skip the gap alerts. */
    expectsLongGaps?: boolean;
}

const GAP_FLAGS: CycleFlag[] = ['noPeriod90', 'fewPeriodsYear', 'longCycles'];

export const CycleAnalysisCard: React.FC<Props> = ({ periods, signs = [], pregnancies = [], expectedNext, expectsLongGaps = false }) => {
    const { language } = useLanguage();
    const c = copy[language === 'es' ? 'es' : 'en'];
    // Re-render every minute so the countdown drops by one when the day changes.
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);
    const a = useMemo(() => analyzeCycles(periods, now, pregnancies), [periods, now, pregnancies]);
    const flags = useMemo(
        () => cycleHealthFlags(periods, now, signs, pregnancies).filter((f) => !expectsLongGaps || !GAP_FLAGS.includes(f)),
        [periods, now, signs, pregnancies, expectsLongGaps],
    );
    const [modal, setModal] = useState<'cycle' | 'period' | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-foreground font-bold text-xl">{c.title}</h3>
                {a.lastCycle && (
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                        {c.lastCycle}: <strong className="text-foreground">{a.lastCycle} {c.days}</strong>
                        {a.lastPeriodLength && <> · {c.lastPeriod}: <strong className="text-foreground">{a.lastPeriodLength} {c.days}</strong></>}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Cycle Length */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground text-base">{c.cycleLength}</h4>
                        <button
                            type="button"
                            onClick={() => setModal('cycle')}
                            aria-label={c.info}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
                        >
                            <span className="material-symbols-outlined text-[18px]">info</span>
                        </button>
                    </div>

                    {a.cycles.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">{c.notEnough}</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-foreground font-black text-3xl tracking-tight">
                                    {a.min === a.max ? a.min : `${a.min}–${a.max}`} <span className="text-base font-semibold text-muted-foreground">{c.days}</span>
                                </p>
                                <RatingBadge rating={a.cycleRating} label={a.cycleRating === 'normal' ? c.normal : c.abnormal} />
                            </div>
                            <Bars values={a.cycles} mean={a.mean} avgLabel={c.avg} color="bg-blossom/50" />
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {c.summary(a.mean, a.cycles.length)}{a.cycleRating === 'abnormal' && c.summaryAbnormal}
                            </p>
                            {a.variation !== null && (
                                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                                    <span className="text-muted-foreground">{c.variation} ({c.variationHelp}):</span>
                                    <span className="font-bold text-foreground">{a.variation > 0 ? '+' : ''}{a.variation} {c.days}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 2: Period Length */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground text-base">{c.periodLength}</h4>
                        <button
                            type="button"
                            onClick={() => setModal('period')}
                            aria-label={c.info}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
                        >
                            <span className="material-symbols-outlined text-[18px]">info</span>
                        </button>
                    </div>

                    {a.periodLengths.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">{c.noPeriodEnd}</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-foreground font-black text-3xl tracking-tight">
                                    {a.lastPeriodLength} <span className="text-base font-semibold text-muted-foreground">{c.days}</span>
                                </p>
                                <RatingBadge rating={a.periodRating} label={a.periodRating === 'normal' ? c.normal : c.abnormal} />
                            </div>
                            <Bars values={a.periodLengths} mean={a.periodMean} avgLabel={c.avg} color="bg-bud/50" />
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {c.periodSummary(a.periodMean, a.periodLengths.length)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {flags.length > 0 && (
                <div className="bg-sun/10 border border-sun/30 rounded-2xl p-5 flex flex-col gap-2.5">
                    <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-sun-ink text-[20px]">stethoscope</span>
                        {c.flagsTitle}
                    </h4>
                    <ul className="flex flex-col gap-1.5 list-disc pl-5">
                        {flags.map((f) => (
                            <li key={f} className="text-sm text-foreground leading-relaxed">{c.flags[f]}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">{c.flagsBody}</p>
                </div>
            )}

            {modal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
                    <div className="bg-card rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-xl font-black text-foreground">{modal === 'cycle' ? c.aboutCycle : c.aboutPeriod}</h4>
                        {(modal === 'cycle' ? c.aboutCycleBody : c.aboutPeriodBody).map((p, i) => (
                            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                        ))}
                        <button onClick={() => setModal(null)} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold">{c.ok}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CycleAnalysisCard;
