'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Flower } from '@/components/ui/Flower';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import type { CycleOverview } from '@/hooks/useCycleOverview';
import { dashboardText, phaseKey } from '../dashboardText';

export const CycleHero: React.FC<{ overview: CycleOverview }> = ({ overview }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const text = dashboardText[language === 'es' ? 'es' : 'en'];
    const { info, estimate, next, daysToPeriod, daysLate, flags, daysToOvulation, answers, hasHistory, loading } = overview;

    if (loading) return <div className="rounded-3xl border border-border bg-card h-48 animate-pulse" />;

    if (!hasHistory || !info || !estimate) {
        return (
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-blossom-soft/40 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-foreground text-xl sm:text-2xl font-semibold">{text.noDataTitle}</h2>
                    <p className="text-muted-foreground text-sm mt-1 max-w-xl">{text.noDataBody}</p>
                </div>
                <button onClick={() => router.push('/period-history')} className="shrink-0 px-6 h-11 rounded-xl bg-primary text-primary-foreground font-bold">
                    {text.noDataCta}
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

    return (
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-blossom-soft/40 shadow-sm p-6 sm:p-7 flex flex-col gap-5">
            <Flower petal="var(--blossom-soft)" center="var(--sun)" rotate={12} className="absolute -top-8 -right-8 size-36 opacity-60 pointer-events-none" />
            <div className="relative flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {overdue ? text.overdueDay(info.cycleDay) : `${phase.name} · ${text.dayOf(info.cycleDay, info.cycleLength)}`}
                </p>
                <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight">{late ? text.lateTitle : phase.focus}</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">{late ? text.lateBody : phase.hormones}</p>
            </div>
            <div className="relative h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blossom to-coral rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{text.nextPeriod}</p>
                    <p className="text-foreground font-bold text-xl mt-1">{periodText}</p>
                    {next && (
                        <p className="text-xs text-muted-foreground">
                            {next.periodEarliest.getTime() === next.periodLatest.getTime()
                                ? `~ ${fmt(next.periodStart)}`
                                : text.expectedBetween(fmt(next.periodEarliest), fmt(next.periodLatest))}
                        </p>
                    )}
                </div>
                <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{text.ovulation}</p>
                    <p className="text-foreground font-bold text-xl mt-1">{ovulationText}</p>
                </div>
                <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{text.fertileWindow}</p>
                    {next && (
                        <p className="text-foreground font-bold text-xl mt-1">{overdue ? '-' : `${fmt(next.fertileStart)} – ${fmt(next.fertileEnd)}`}</p>
                    )}
                </div>
            </div>
            <div className="relative flex flex-col gap-1 text-sm">
                {inFertile && !hormonal && answers.goal === 'fertility' && <p className="text-foreground font-semibold">{text.fertileNow} {text.fertileTip}</p>}
                {hormonal && <p className="text-amber-500">{text.hormonalNote}</p>}
                {flags.includes('noPeriod90') && (
                    <p className="text-amber-500 font-semibold">
                        {text.noPeriod90}{' '}
                        <button onClick={() => router.push('/period-history')} className="underline font-bold">{text.logPeriodCta}</button>
                    </p>
                )}
                {estimate.irregular && <p className="text-amber-500">{text.irregularNote}</p>}
                <p className="text-xs text-muted-foreground">
                    {text.approx} {text.confidence}: {text.confidenceLevels[estimate.confidence]}.
                </p>
            </div>
        </div>
    );
};
