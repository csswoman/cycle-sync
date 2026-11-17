'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Bloom } from '@/components/ui/Bloom';
import { bloomGrowth, bloomTone } from '@/lib/cycle/bloom';
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
            <div data-phase="follicular" className="phase-wash relative overflow-hidden rounded-3xl border border-border/80 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Bloom growth={0.08} className="absolute bottom-0 right-2 h-24 w-auto opacity-80 sm:static sm:order-last sm:h-28" />
                <div className="relative">
                    <h2 className="text-foreground text-xl sm:text-2xl font-semibold">{text.noDataTitle}</h2>
                    <p className="text-muted-foreground text-sm mt-1 max-w-xl">{text.noDataBody}</p>
                </div>
                <button onClick={() => router.push('/period-history')} className="relative shrink-0 self-start sm:self-auto px-6 h-11 rounded-full bg-bloom text-primary-foreground font-bold shadow-md shadow-blossom/20 transition-transform hover:scale-[1.02] active:scale-95">
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

    const tone = bloomTone(info.phase);
    const growth = bloomGrowth(info.cycleDay, estimate.ovulationDay, overdue);

    return (
        <div data-phase={tone} className="phase-wash relative overflow-hidden rounded-3xl border border-border/80 shadow-sm p-6 sm:p-7 flex flex-col gap-5">
            <Bloom growth={growth} tone={tone} className="absolute -top-2 right-0 h-32 sm:h-44 w-auto opacity-90" />
            <div className="relative flex flex-col gap-1 pr-20 sm:pr-32">
                <p className="text-xs font-bold uppercase tracking-wider text-phase">
                    {overdue ? text.overdueDay(info.cycleDay) : `${phase.name} · ${text.dayOf(info.cycleDay, info.cycleLength)}`}
                </p>
                <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight">{late ? text.lateTitle : phase.focus}</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">{late ? text.lateBody : phase.hormones}</p>
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
