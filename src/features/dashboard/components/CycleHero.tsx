'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Bloom } from '@/components/ui/Bloom';
import { GrowingBloom } from '@/components/ui/GrowingBloom';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { Icon } from '@/components/ui/Icon';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { bloomGrowth, bloomTone } from '@/lib/cycle/bloom';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import { useGuest } from '@/hooks/useGuest';
import type { CycleOverview } from '@/hooks/useCycleOverview';
import { dashboardText, phaseKey } from '../dashboardText';

export const CycleHero: React.FC<{ overview: CycleOverview }> = ({ overview }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const text = dashboardText[language === 'es' ? 'es' : 'en'];
    const { info, estimate, next, daysToPeriod, daysLate, flags, daysToOvulation, answers, hasHistory, loading } = overview;
    const { isGuest, promptSignup } = useGuest();

    if (loading) return <div className="rounded-3xl border border-border bg-card h-48 animate-pulse" />;

    if (!hasHistory || !info || !estimate) {
        const es = language === 'es';
        const points = es
            ? ['Próxima regla y ovulación estimadas', 'Consejos de movimiento y comida por fase', 'Patrones de energía, sueño y síntomas']
            : ['Estimated next period and ovulation', 'Movement and food tips by phase', 'Patterns in energy, sleep and symptoms'];
        return (
            <div data-phase="follicular" className="phase-wash relative isolate overflow-hidden rounded-3xl border border-border/80 shadow-sm p-6 sm:p-8 flex flex-col gap-5">
                <CardFlowers variant="hero" />
                <GrowingBloom className="absolute -bottom-1 right-0 sm:right-6 h-32 sm:h-60 w-auto" />
                <div className="relative flex flex-col gap-1 pr-24 sm:pr-44">
                    <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
                        {isGuest ? (es ? 'Tu ciclo, explicado día a día' : 'Your cycle, explained day by day') : text.noDataTitle}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-xl">
                        {isGuest
                            ? (es ? 'Crea una cuenta gratis para guardar tus reglas y ver tus predicciones.' : 'Create a free account to save your periods and see your predictions.')
                            : text.noDataBody}
                    </p>
                </div>
                <ul className="relative flex flex-col sm:flex-row sm:flex-wrap gap-2 pr-24 sm:pr-44">
                    {points.map((p, i) => (
                        <li key={p} className={`${i > 0 ? 'hidden sm:inline-flex' : 'inline-flex'}  items-center gap-2 rounded-full bg-card/70 border border-border/60 px-3 py-1.5 text-sm text-foreground`}>
                            <span className="size-1.5 rounded-full bg-phase" aria-hidden="true" />{p}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => (isGuest ? promptSignup() : router.push('/period-history'))}
                    className="relative self-start px-6 h-11 rounded-full bg-bloom text-primary-foreground font-bold shadow-md shadow-blossom/20 transition-transform hover:scale-[1.02] active:scale-95"
                >
                    {isGuest ? (es ? 'Crear cuenta gratis' : 'Create free account') : text.noDataCta}
                </button>
            </div>
        );
    }

    const phase = text.phases[phaseKey(info.phase)];
    const progress = Math.min(100, Math.round((info.cycleDay / info.cycleLength) * 100));
    const hormonal = usesHormonalContraception(answers);
    const inFertile = !!info.fertileStartDay && !!info.fertileEndDay
        && info.cycleDay >= info.fertileStartDay && info.cycleDay <= info.fertileEndDay;

    // Past the most likely date but still inside the expected range is not late yet.
    const late = daysLate > 0;
    const overdue = !!info.overdue;
    const periodText = daysToPeriod === null ? '-'
        : late ? text.late(daysLate)
        : daysToPeriod > 0 ? text.inDays(daysToPeriod) : daysToPeriod === 0 ? text.today : text.anyDay;
    const ovulationText = daysToOvulation === null ? '-'
        : overdue ? text.ovulationUnsure
        : daysToOvulation > 0 ? text.ovulationIn(daysToOvulation) : daysToOvulation === 0 ? text.ovulationToday : text.ovulationPassed;
    const fmt = (d: Date) => new Intl.DateTimeFormat(language === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short' }).format(d);

    const tone = bloomTone(info.phase);
    const growth = bloomGrowth(info.cycleDay, estimate.ovulationDay, overdue);

    return (
        <div data-phase={tone} className="phase-wash relative isolate overflow-hidden rounded-3xl border border-border/80 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
            <CardFlowers variant="heroData" />
            <Bloom growth={growth} tone={tone} className="absolute -top-2 right-0 h-24 sm:h-28 w-auto opacity-90" />
            <div className="relative flex flex-col gap-1 pr-20 sm:pr-32">
                <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight text-balance">{late ? text.lateTitle : phase.focus}</h2>
                <p className="text-sm sm:text-base font-semibold text-phase">
                    {overdue ? text.overdueDay(info.cycleDay) : `${phase.name} · ${text.dayOf(info.cycleDay, info.cycleLength)}`}
                    {!late && <span className="font-normal text-muted-foreground"> · {phase.hormones}</span>}
                </p>
                {late && <p className="text-sm text-muted-foreground max-w-2xl text-pretty">{text.lateBody}</p>}
            </div>
            <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={overdue ? text.overdueDay(info.cycleDay) : `${phase.name} · ${text.dayOf(info.cycleDay, info.cycleLength)}`}
                className="relative h-2.5 w-full bg-secondary/70 rounded-full"
            >
                <div className="h-full bg-phase rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full bg-card border-2 shadow-sm transition-all duration-700"
                    style={{ left: `${progress}%`, borderColor: 'var(--phase)' }}
                    aria-hidden="true"
                />
            </div>
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-secondary/40 rounded-2xl px-3 py-2.5">
                    <p className="text-sm font-medium text-muted-foreground">{text.nextPeriod}</p>
                    <p className="text-foreground font-bold text-xl xl:text-lg 2xl:text-xl mt-1">{periodText}</p>
                    {next && (
                        <p className="text-sm text-muted-foreground">
                            {next.periodEarliest.getTime() === next.periodLatest.getTime()
                                ? `~ ${fmt(next.periodStart)}`
                                : text.expectedBetween(fmt(next.periodEarliest), fmt(next.periodLatest))}
                        </p>
                    )}
                </div>
                <div className="bg-secondary/40 rounded-2xl px-3 py-2.5">
                    <p className="text-sm font-medium text-muted-foreground">{text.ovulation}</p>
                    <p className="text-foreground font-bold text-xl xl:text-lg 2xl:text-xl mt-1">{ovulationText}</p>
                </div>
                <div className="bg-secondary/40 rounded-2xl px-3 py-2.5">
                    <p className="text-sm font-medium text-muted-foreground">{text.fertileWindow}</p>
                    {next && (
                        <p className="text-foreground font-bold text-xl xl:text-lg 2xl:text-xl mt-1">{overdue ? '-' : `${fmt(next.fertileStart)} – ${fmt(next.fertileEnd)}`}</p>
                    )}
                </div>
            </div>
            <div className="relative flex flex-col gap-1 text-sm">
                {inFertile && !hormonal && answers.goal === 'fertility' && <p className="text-foreground font-semibold">{text.fertileNow} {text.fertileTip}</p>}
                {flags.includes('noPeriod90') && (
                    <p className="text-sun-ink font-semibold">
                        {text.noPeriod90}{' '}
                        <button onClick={() => router.push('/period-history')} className="underline font-bold">{text.logPeriodCta}</button>
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                    {(estimate.irregular || hormonal) && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/15 px-2.5 py-0.5 font-medium text-sun-ink">
                            <Icon name="info" size={14} />
                            {estimate.irregular ? text.irregularShort : text.hormonalShort}
                        </span>
                    )}
                    <span>{text.confidence}: <b className="font-semibold text-foreground">{text.confidenceLevels[estimate.confidence]}</b></span>
                    <InfoTooltip label={text.estimateInfo}>
                        {estimate.irregular && <p>{text.irregularNote}</p>}
                        {hormonal && <p>{text.hormonalNote}</p>}
                        <p className="text-muted-foreground">{text.approx}</p>
                    </InfoTooltip>
                </div>
            </div>
        </div>
    );
};
