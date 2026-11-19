'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { CardFlowers } from '@/components/ui/CardFlowers';
import type { CycleOverview } from '@/hooks/useCycleOverview';

const COPY = {
    es: {
        title: 'Tu ciclo en números',
        cycle: 'Ciclo típico',
        period: 'Regla',
        tracked: 'Ciclos medidos',
        variation: 'Variación',
        days: 'días',
        recent: 'Últimos ciclos',
        needMore: 'Registra dos o más reglas para comparar la duración de tus ciclos.',
        history: 'Ver historial',
        dayLabel: (n: number) => `${n} días`,
    },
    en: {
        title: 'Your cycle in numbers',
        cycle: 'Typical cycle',
        period: 'Period',
        tracked: 'Cycles measured',
        variation: 'Variation',
        days: 'days',
        recent: 'Recent cycles',
        needMore: 'Log two or more periods to compare your cycle lengths.',
        history: 'See history',
        dayLabel: (n: number) => `${n} days`,
    },
};

/** Typical cycle and period length, how many cycles back them, and a small bar for each recent cycle. */
export const CycleStatsCard: React.FC<{ overview: CycleOverview; lang: 'es' | 'en'; embedded?: boolean }> = ({ overview, lang, embedded = false }) => {
    const { estimate } = overview;
    if (!estimate) return null;
    const c = COPY[lang];
    const lengths = estimate.lengths.slice(-6);
    const max = Math.max(...lengths, estimate.cycleLength, 35);
    const min = Math.min(...lengths, 21);

    const stats = [
        { label: c.cycle, value: `${estimate.cycleLength}`, unit: c.days },
        { label: c.period, value: `${Math.round(estimate.periodLength)}`, unit: c.days },
        { label: c.tracked, value: `${estimate.lengths.length}`, unit: '' },
        { label: c.variation, value: estimate.lengths.length > 1 ? `±${Math.round(estimate.variability)}` : '–', unit: estimate.lengths.length > 1 ? c.days : '' },
    ];

    return (
        <section aria-labelledby="cycle-stats-title" className={embedded ? 'flex flex-col gap-4' : 'relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 flex flex-col gap-4'}>
            {!embedded && <CardFlowers variant="stats" />}
            <div className="flex items-center justify-between gap-2">
                <h3 id="cycle-stats-title" className="flex items-center gap-2 text-foreground text-base font-semibold">
                    <Icon name="insights" size={20} className="text-blossom" />{c.title}
                </h3>
                <Link href="/period-history" className="-mr-2 px-2 min-h-10 inline-flex items-center gap-1 text-sm font-semibold text-blossom hover:text-blossom/80">
                    {c.history}<Icon name="arrow_forward" size={14} />
                </Link>
            </div>

            <dl className={embedded ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2' : 'grid grid-cols-2 gap-2'}>
                {stats.map((s) => (
                    <div key={s.label} className={`rounded-xl bg-secondary/40 ${embedded ? 'px-3 py-2' : 'p-3'}`}>
                        <dt className="text-sm font-medium text-muted-foreground">{s.label}</dt>
                        <dd className={`text-foreground font-semibold tabular-nums leading-tight ${embedded ? 'text-xl' : 'text-2xl'}`}>
                            {s.value}{s.unit && <span className="text-sm font-medium text-muted-foreground ml-1">{s.unit}</span>}
                        </dd>
                    </div>
                ))}
            </dl>

            {lengths.length > 1 ? (
                <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{c.recent}</p>
                    <ul className={`flex items-end gap-1.5 ${embedded ? 'h-16' : 'h-20'}`} aria-label={c.recent}>
                        {lengths.map((len, i) => {
                            const out = len < 21 || len > 35;
                            const h = 25 + 75 * ((len - min) / Math.max(1, max - min));
                            return (
                                <li key={i} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1" aria-label={c.dayLabel(len)}>
                                    <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{len}</span>
                                    <span
                                        aria-hidden="true"
                                        className={`w-full max-w-8 rounded-t-lg ${out ? 'bg-sun' : i === lengths.length - 1 ? 'bg-blossom' : 'bg-petal'}`}
                                        style={{ height: `${h}%` }}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">{c.needMore}</p>
            )}
        </section>
    );
};
