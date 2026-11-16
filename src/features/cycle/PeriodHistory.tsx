import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { loadOnboardingAnswers, usesHormonalContraception, type OnboardingAnswers } from '@/features/setup/onboarding';
import { CycleAnalysisCard } from './CycleAnalysisCard';
import { PeriodDayCalendar } from '@/components/PeriodDayCalendar';
import {
    addDays, daysBetween, estimateCycle, groupDaysIntoPeriods, parseLocalDate, projectCycles, toISODate,
} from '@/lib/cycle/cycleEngine';

interface Period {
    id: string;
    start_date: string;
    end_date: string | null;
}

const PeriodHistory: React.FC = () => {
    const { language, t } = useLanguage();
    const locale = language === 'es' ? 'es' : 'en';
    const [periods, setPeriods] = useState<Period[]>([]);
    const [configLength, setConfigLength] = useState<number | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [answers, setAnswers] = useState<OnboardingAnswers>({});

    useEffect(() => {
        setAnswers(loadOnboardingAnswers());
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [periodsRes, configRes] = await Promise.all([
            supabase.from('periods').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
            supabase.from('cycle_config').select('cycle_length').eq('user_id', user.id).maybeSingle(),
        ]);
        if (periodsRes.error) {
            console.error('Error fetching periods:', periodsRes.error);
        } else if (periodsRes.data) {
            setPeriods(periodsRes.data);
        }
        setConfigLength(configRes.data?.cycle_length ?? null);
    };

    const estimate = useMemo(() => estimateCycle(periods, configLength), [periods, configLength]);
    const regularity = estimate.lengths.length < 2 ? 'notEnoughData' : estimate.irregular ? 'irregular' : 'regular';

    const latestStart = useMemo(
        () => (periods.length ? periods.map((p) => p.start_date.slice(0, 10)).sort().pop() as string : null),
        [periods],
    );
    const projections = useMemo(
        () => (latestStart ? projectCycles(latestStart, estimate, 3) : []),
        [latestStart, estimate],
    );

    // Exact days from each period start to the next one (all of them, newest first).
    const cycleSpans = useMemo(() => {
        const starts = Array.from(new Set(periods.map((p) => p.start_date.slice(0, 10)))).sort();
        const spans = new Map<string, { days: number; next: string }>();
        for (let i = 0; i < starts.length - 1; i++) {
            spans.set(starts[i], {
                days: daysBetween(parseLocalDate(starts[i]), parseLocalDate(starts[i + 1])),
                next: starts[i + 1],
            });
        }
        return spans;
    }, [periods]);

    const savedDays = useMemo(() => {
        const days: string[] = [];
        for (const p of periods) {
            const start = parseLocalDate(p.start_date);
            const end = p.end_date ? parseLocalDate(p.end_date) : start;
            for (let d = start; d <= end; d = addDays(d, 1)) days.push(toISODate(d));
        }
        return days;
    }, [periods]);

    // Past cycles: ovulation is placed 14 days before the next period; fertile window = 5 days before to 1 day after.
    const pastWindows = useMemo(() => {
        const out: { ovulation: Date; fertileStart: Date; fertileEnd: Date }[] = [];
        cycleSpans.forEach((span) => {
            if (span.days < 15) return;
            const ovulation = addDays(parseLocalDate(span.next), -14);
            out.push({ ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1) });
        });
        return out;
    }, [cycleSpans]);

    const fertileDays = useMemo(() => {
        const days: string[] = [];
        for (const p of [...pastWindows, ...projections]) {
            for (let d = p.fertileStart; d <= p.fertileEnd; d = addDays(d, 1)) days.push(toISODate(d));
        }
        return days;
    }, [pastWindows, projections]);
    const ovulationDays = useMemo(
        () => [...pastWindows, ...projections].map((p) => toISODate(p.ovulation)),
        [pastWindows, projections],
    );

    const fmt = (d: Date) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
    const fmtFull = (iso: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parseLocalDate(iso));

    const handleSaveDays = async () => {
        if (!selectedDays.length) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');
            const existingStarts = new Set(periods.map((p) => p.start_date.slice(0, 10)));
            const rows = groupDaysIntoPeriods(selectedDays)
                .filter((r) => !existingStarts.has(r.start))
                .map((r) => ({
                    user_id: user.id,
                    start_date: r.start,
                    end_date: r.end === r.start ? null : r.end,
                }));
            if (rows.length) {
                const { error } = await supabase.from('periods').insert(rows);
                if (error) throw error;
                // Keep the config in sync so the dashboard works before history is long enough.
                const latest = rows.map((r) => r.start_date).concat(latestStart ? [latestStart] : []).sort().pop() as string;
                await supabase.from('cycle_config').upsert(
                    { user_id: user.id, last_period_start: latest, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
            }
            setSelectedDays([]);
            await fetchPeriods();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const deletePeriod = async (id: string) => {
        const { error } = await supabase
            .from('periods')
            .delete()
            .eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchPeriods();
        }
    };

    const next = projections[0];
    const periodsFound = groupDaysIntoPeriods(selectedDays).length;

    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
                <div className="flex flex-col gap-2">
                    <h1 className="text-foreground text-3xl md:text-4xl font-semibold tracking-tight">{t.cycleHistoryTitle}</h1>
                    <p className="text-muted-foreground">{t.markDaysDescription}</p>
                </div>

                {/* Regularity Status Card */}
                <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className={`size-16 rounded-full flex items-center justify-center shrink-0 ${
                        regularity === 'regular' ? 'bg-green-500/20 text-green-500' :
                        regularity === 'irregular' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-primary/20 text-primary'
                    }`}>
                        <span className="material-symbols-outlined text-4xl">
                            {regularity === 'regular' ? 'check_circle' : regularity === 'irregular' ? 'warning' : 'info'}
                        </span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-foreground font-bold text-xl">{t.regularityStatus}</h3>
                        <p className="text-muted-foreground">
                            {regularity === 'regular' ? t.regular : regularity === 'irregular' ? t.irregular : t.notEnoughData}
                            {estimate.lengths.length > 0 && ` • ${t.averageCycleLabel}: ${estimate.cycleLength} ${t.daysUnit}`}
                        </p>
                    </div>
                </div>

                {periods.length > 0 && <CycleAnalysisCard periods={periods} />}

                {/* Forecast */}
                {next && (
                    <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-foreground font-bold text-lg">{t.forecastTitle}</h3>
                            <span className="text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1">
                                {t.confidenceLabel}: {estimate.confidence === 'high' ? t.confidenceHigh : estimate.confidence === 'medium' ? t.confidenceMedium : t.confidenceLow}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-secondary/40 rounded-xl p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase">{t.nextPeriodLabel}</p>
                                <p className="text-foreground font-bold text-lg mt-1">
                                    {next.periodEarliest.getTime() === next.periodLatest.getTime()
                                        ? fmt(next.periodStart)
                                        : `${fmt(next.periodEarliest)} – ${fmt(next.periodLatest)}`}
                                </p>
                            </div>
                            <div className="bg-secondary/40 rounded-xl p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase">{t.ovulationLabel}</p>
                                <p className="text-foreground font-bold text-lg mt-1">~ {fmt(next.ovulation)}</p>
                            </div>
                            <div className="bg-secondary/40 rounded-xl p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase">{t.fertileWindowLabel}</p>
                                <p className="text-foreground font-bold text-lg mt-1">{fmt(next.fertileStart)} – {fmt(next.fertileEnd)}</p>
                            </div>
                        </div>
                        {answers.goal === 'fertility' && <p className="text-sm text-foreground">{t.forecastFertilityTip}</p>}
                        {usesHormonalContraception(answers) && <p className="text-sm text-amber-500">{t.forecastHormonalNote}</p>}
                        {estimate.irregular && <p className="text-sm text-amber-500">{t.forecastIrregularNote}</p>}
                        <p className="text-xs text-muted-foreground">{t.forecastDisclaimer}</p>
                    </div>
                )}

                {/* Add periods: calendar */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-foreground font-bold text-lg">{t.addPeriod}</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-5">{t.calendarHint}</p>
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <PeriodDayCalendar
                            selected={selectedDays}
                            onChange={setSelectedDays}
                            saved={savedDays}
                            fertileDays={fertileDays}
                            ovulationDays={ovulationDays}
                        />
                        <div className="flex-1 w-full flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground">
                                {selectedDays.length === 0
                                    ? t.noDaysSelected
                                    : `${selectedDays.length} ${t.daysUnit} · ${periodsFound} ${periodsFound === 1 ? t.periodSingular : t.periodPlural}`}
                            </p>
                            <button
                                type="button"
                                onClick={handleSaveDays}
                                disabled={saving || selectedDays.length === 0}
                                className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {t.saveMarkedDays}
                            </button>
                            {selectedDays.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDays([])}
                                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                                >
                                    {t.clearSelection}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-foreground font-bold text-lg px-2">{t.periodHistory}</h3>
                    <div className="flex flex-col gap-3">
                        {periods.length === 0 ? (
                            <div className="p-8 text-center bg-secondary/20 border border-dashed border-border rounded-2xl">
                                <p className="text-muted-foreground">{t.noPeriodsYet}</p>
                            </div>
                        ) : (
                            periods.map((period) => {
                                const start = fmtFull(period.start_date);
                                const end = period.end_date ? fmtFull(period.end_date) : null;
                                const span = cycleSpans.get(period.start_date.slice(0, 10));
                                const isLatest = period.start_date.slice(0, 10) === latestStart;
                                const todayLocal = new Date();
                                const currentDay = isLatest
                                    ? daysBetween(parseLocalDate(period.start_date), new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate())) + 1
                                    : null;
                                const duration = period.end_date
                                    ? Math.round((parseLocalDate(period.end_date).getTime() - parseLocalDate(period.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                    : null;
                                return (
                                    <div key={period.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-foreground font-bold">{end ? `${start} - ${end}` : start}</p>
                                                {duration && <p className="text-xs text-muted-foreground">{duration} {t.daysUnit}</p>}
                                                {span && (
                                                    <p className="text-xs font-semibold text-primary mt-0.5">
                                                        {t.cycleOfDays} {span.days} {t.daysUnit} · {t.untilNextPeriod} {fmtFull(span.next)}
                                                    </p>
                                                )}
                                                {currentDay && <p className="text-xs font-semibold text-primary mt-0.5">{t.currentCycleDay} {currentDay}</p>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deletePeriod(period.id)}
                                            className="text-muted-foreground hover:text-destructive p-2 rounded-lg bg-secondary/50 hover:bg-destructive/10 transition-all"
                                            aria-label={t.deletePeriod}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodHistory;
