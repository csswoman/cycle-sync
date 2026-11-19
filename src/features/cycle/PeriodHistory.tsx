import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { cycleProfile, expectsLongGaps } from '@/features/setup/onboarding';
import { CycleAnalysisCard } from './CycleAnalysisCard';
import PremenstrualPatternCard from './PremenstrualPatternCard';
import PeriodForecastCard from '@/features/health/pmos/PeriodForecastCard';
import { GardenCorner, TitleSprig } from '@/components/ui/Botanical';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { PeriodDayCalendar, type CalendarMode } from '@/components/PeriodDayCalendar';
import {
    addDays, daysBetween, estimateCycle, groupDaysIntoPeriods, parseLocalDate, projectCycles, toISODate,
} from '@/lib/cycle/cycleEngine';
import { detectTemperatureShift, readingsInCycle } from '@/lib/cycle/fertilitySigns';
import { useCycleSigns } from '@/hooks/useCycleSigns';
import { usePregnancies } from '@/hooks/usePregnancies';
import { predictionsPaused } from '@/lib/cycle/pregnancy';
import { FlowQuickEditor } from './components/FlowQuickEditor';
import { periodBleedingDays } from '@/lib/cycle/bleeding';

const PAGE_SIZE = 6;
const SIGNS_FROM = toISODate(addDays(new Date(), -400));

interface Period {
    id: string;
    start_date: string;
    end_date: string | null;
}

const PeriodHistory: React.FC = () => {
    const { language, t } = useLanguage();
    const locale = language === 'es' ? 'es' : 'en';
    const [rawPeriods, setPeriods] = useState<Period[]>([]);
    const [pendingDelete, setPendingDelete] = useState<Period | null>(null);
    const pendingRef = useRef<{ period: Period; timer: ReturnType<typeof setTimeout> } | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const listRef = useRef<HTMLElement | null>(null);
    // A period waiting for its undo window to close is hidden everywhere.
    const periods = useMemo(() => rawPeriods.filter((p) => p.id !== pendingDelete?.id), [rawPeriods, pendingDelete]);
    const [configLength, setConfigLength] = useState<number | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const answers = useOnboardingAnswers();

    const [mobileTab, setMobileTab] = useState<'log' | 'history'>('log');
    const [calendarMode, setCalendarMode] = useState<CalendarMode>('period');
    const { signs, signFor, saveSign, error: signsError } = useCycleSigns(SIGNS_FROM);
    const [flowDay, setFlowDay] = useState<string | null>(null);
    const [yearChoice, setYearChoice] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const flowByDay = useMemo(() => {
        const out: Record<string, NonNullable<(typeof signs)[number]['flow']>> = {};
        for (const s of signs) if (s.flow) out[s.date] = s.flow;
        return out;
    }, [signs]);
    const spottingDays = useMemo(() => signs.filter((s) => s.spotting).map((s) => s.date), [signs]);
    const sexDays = useMemo(() => signs.filter((s) => s.sexCount > 0).map((s) => s.date), [signs]);

    const toggleMarker = (iso: string) => {
        const s = signFor(iso);
        if (calendarMode === 'spotting') void saveSign({ ...s, spotting: !s.spotting });
        else if (calendarMode === 'sex') void saveSign({ ...s, sexCount: s.sexCount > 0 ? 0 : 1, sexProtection: s.sexCount > 0 ? null : s.sexProtection });
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    useEffect(() => {
        // If user already has periods, default mobile tab to history for quick viewing
        if (periods.length > 0) {
            setMobileTab('history');
        }
    }, [periods.length]);

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

    const { pregnancies } = usePregnancies();
    const estimate = useMemo(() => estimateCycle(periods, configLength, pregnancies), [periods, configLength, pregnancies]);
    const regularity = estimate.lengths.length < 2 ? 'notEnoughData' : estimate.irregular ? 'irregular' : 'regular';

    const latestStart = useMemo(
        () => (periods.length ? periods.map((p) => p.start_date.slice(0, 10)).sort().pop() as string : null),
        [periods],
    );
    const periodStarts = useMemo(() => periods.map((p) => p.start_date), [periods]);
    // Irregular cycles without PMOS get the forecast range here (PMOS users have it in their toolkit).
    const showForecast = cycleProfile(answers) === 'irregular' && !!latestStart && !predictionsPaused(latestStart, pregnancies, toISODate(new Date()));
    const projections = useMemo(
        () => (latestStart && !predictionsPaused(latestStart, pregnancies, toISODate(new Date())) ? projectCycles(latestStart, estimate, 3) : []),
        [latestStart, estimate, pregnancies],
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

    // Ovulation confirmed by a basal temperature shift, per logged cycle (including the current one).
    const confirmedOvulations = useMemo(() => {
        const starts = Array.from(new Set(periods.map((p) => p.start_date.slice(0, 10)))).sort();
        const out = new Map<string, string>(); // cycle start -> ovulation day
        starts.forEach((start, i) => {
            const shift = detectTemperatureShift(readingsInCycle(signs, start, starts[i + 1]));
            if (shift) out.set(start, shift.ovulationDate);
        });
        return out;
    }, [periods, signs]);

    // Past cycles: ovulation is placed 14 days before the next period, unless the temperature
    // confirmed it; fertile window = 5 days before to 1 day after.
    const pastWindows = useMemo(() => {
        const out: { ovulation: Date; fertileStart: Date; fertileEnd: Date }[] = [];
        cycleSpans.forEach((span, start) => {
            if (span.days < 15) return;
            const confirmed = confirmedOvulations.get(start);
            const ovulation = confirmed ? parseLocalDate(confirmed) : addDays(parseLocalDate(span.next), -14);
            out.push({ ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1) });
        });
        return out;
    }, [cycleSpans, confirmedOvulations]);

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
            setErrorMsg(error.message);
        } finally {
            setSaving(false);
        }
    };

    const commitDelete = async (id: string) => {
        const { error } = await supabase.from('periods').delete().eq('id', id);
        if (error) setErrorMsg(error.message);
        await fetchPeriods();
    };
    const flushPending = () => {
        const p = pendingRef.current;
        if (!p) return;
        clearTimeout(p.timer);
        pendingRef.current = null;
        setPendingDelete(null);
        void commitDelete(p.period.id);
    };
    const deletePeriod = (id: string) => {
        setConfirmId(null);
        flushPending();
        const period = rawPeriods.find((p) => p.id === id);
        if (!period) return;
        const timer = setTimeout(() => {
            pendingRef.current = null;
            setPendingDelete(null);
            void commitDelete(id);
        }, 6000);
        pendingRef.current = { period, timer };
        setPendingDelete(period);
    };
    const undoDelete = () => {
        const p = pendingRef.current;
        if (p) clearTimeout(p.timer);
        pendingRef.current = null;
        setPendingDelete(null);
    };
    // Leaving the page commits a pending delete instead of dropping it.
    useEffect(() => () => {
        const p = pendingRef.current;
        if (p) { clearTimeout(p.timer); void supabase.from('periods').delete().eq('id', p.period.id); }
    }, []);

    const next = projections[0];
    const periodsFound = groupDaysIntoPeriods(selectedDays).length;

    const periodsByYear = useMemo(() => {
        const map = new Map<number, Period[]>();
        for (const p of periods) {
            const year = parseLocalDate(p.start_date).getFullYear();
            const list = map.get(year) ?? [];
            list.push(p);
            map.set(year, list);
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => b - a)
            .map(([year, list]) => ({ year, periods: list }));
    }, [periods]);

    // Pagination: one year at a time (newest by default), PAGE_SIZE periods per page.
    const activeYear = periodsByYear.find((y) => y.year === yearChoice) ?? periodsByYear[0];
    const activePeriods = activeYear?.periods ?? [];
    const pageCount = Math.max(1, Math.ceil(activePeriods.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount - 1);
    const pagePeriods = activePeriods.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const visibleYears = activeYear ? [{ year: activeYear.year, periods: pagePeriods }] : [];
    const scrollToList = () => {
        const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        listRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    const goPage = (n: number) => { setPage(n); scrollToList(); };
    const pickYear = (year: number) => { setYearChoice(year); setPage(0); scrollToList(); };
    const countdownDays = useMemo(() => {
        if (!next) return null;
        const today = new Date();
        const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return daysBetween(todayNorm, next.periodStart);
    }, [next]);

    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col gap-5 sm:gap-8 pb-32">
                {/* Header with inline regularity indicator */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 sm:pb-2 sm:border-b border-border/50">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-foreground text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight"><TitleSprig />{t.cycleHistoryTitle}</h1>
                        <p className="text-muted-foreground text-sm max-w-xl">
                            {locale === 'es' ? 'Analiza la duración de tus ciclos y predice tus próximas fases.' : t.markDaysDescription}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-2 sm:py-1.5 rounded-full bg-card border border-border/70 text-sm sm:text-xs font-medium shrink-0">
                        <span className={`size-2.5 rounded-full shrink-0 ${
                            regularity === 'regular' ? 'bg-leaf' :
                            regularity === 'irregular' ? 'bg-sun' :
                            'bg-primary'
                        }`} />
                        <span className="text-foreground font-semibold">
                            {regularity === 'regular'
                                ? t.regular
                                : regularity === 'irregular'
                                ? t.irregular
                                : (locale === 'es' ? 'Requiere 2+ períodos' : t.notEnoughData)}
                        </span>
                        {estimate.lengths.length > 0 && (
                            <>
                                <span className="text-border">|</span>
                                <span className="text-muted-foreground">
                                    {t.averageCycleLabel}: <strong className="text-foreground">{estimate.cycleLength} {t.daysUnit}</strong>
                                </span>
                            </>
                        )}
                    </div>
                </header>

                {/* Forecast Hero: clean typographic metrics with rhythm instead of generic cards */}
                {next && (
                    <section className="max-lg:order-last relative overflow-hidden rounded-2xl sm:rounded-3xl garden-wash border border-border/80 p-4 sm:p-5 shadow-sm">
                        <GardenCorner variant="blossom" className="hidden sm:block size-24 opacity-60" />

                        <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                    <h2 className="text-foreground font-bold text-base md:text-lg tracking-tight">{t.forecastTitle}</h2>
                                    <InfoTooltip label={locale === 'es' ? 'Cómo se calculan' : 'How these are calculated'}>
                                        <p>{locale === 'es'
                                            ? `Se calculan con la duración media de tus ciclos registrados (${estimate.cycleLength} días) y cuánto varían entre sí.`
                                            : `Based on the average length of your logged cycles (${estimate.cycleLength} days) and how much they vary.`}</p>
                                        <p className="text-xs text-muted-foreground">{t.forecastDisclaimer}</p>
                                    </InfoTooltip>
                                </div>
                                <div className="flex items-center gap-1">
                                    {estimate.irregular && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sun-ink bg-sun/15 border border-sun/30 rounded-full px-2.5 py-0.5">
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            {locale === 'es' ? 'Ciclos variables' : 'Variable cycles'}
                                        </span>
                                    )}
                                    <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                                        {t.confidenceLabel}: {estimate.confidence === 'high' ? t.confidenceHigh : estimate.confidence === 'medium' ? t.confidenceMedium : t.confidenceLow}
                                    </span>
                                    <InfoTooltip label={locale === 'es' ? 'Qué significa la confianza' : 'What confidence means'}>
                                        <p>{locale === 'es'
                                            ? 'La confianza sube cuantos más ciclos registras y más parecidos son entre sí. Con ciclos variables, el rango de fechas se amplía.'
                                            : 'Confidence grows the more cycles you log and the more similar they are. With variable cycles the date range widens.'}</p>
                                        {estimate.irregular && <p className="text-sun-ink">{t.forecastIrregularNote}</p>}
                                    </InfoTooltip>
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                                <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 sm:flex-col sm:items-stretch">
                                    <dt className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <span className="size-2 rounded-full bg-primary" />
                                        {t.nextPeriodLabel}
                                        <InfoTooltip label={locale === 'es' ? 'Sobre la próxima menstruación' : 'About the next period'} className="-my-1 size-5">
                                            <p>{locale === 'es'
                                                ? 'Rango de días en que es más probable que empiece tu próxima regla. Cuanto más variables son tus ciclos, más amplio es.'
                                                : 'The days your next period is most likely to start. The more your cycles vary, the wider it gets.'}</p>
                                        </InfoTooltip>
                                    </dt>
                                    <dd className="text-2xl sm:text-xl md:text-2xl font-semibold text-foreground tracking-tight leading-tight">
                                        {next.periodEarliest.getTime() === next.periodLatest.getTime()
                                            ? fmt(next.periodStart)
                                            : `${fmt(next.periodEarliest)} – ${fmt(next.periodLatest)}`}
                                    </dd>
                                    {countdownDays !== null && (
                                        <dd className="text-xs font-semibold text-primary">
                                            {countdownDays > 0 ? (locale === 'es' ? `en ${countdownDays} días` : `in ${countdownDays} days`) : countdownDays === 0 ? (locale === 'es' ? 'hoy' : 'today') : (locale === 'es' ? `${-countdownDays} días de retraso` : `${-countdownDays} days late`)}
                                        </dd>
                                    )}
                                </div>
                                <div className="rounded-xl sm:rounded-2xl bg-card/70 border border-border/60 px-3 sm:px-3.5 py-2.5 flex flex-col gap-0.5">
                                    <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <span className="size-2 rounded-full bg-sun" />
                                        {t.ovulationLabel}
                                        <InfoTooltip label={locale === 'es' ? 'Sobre la ovulación' : 'About ovulation'} className="-my-1 size-5">
                                            <p>{locale === 'es'
                                                ? 'Día pico estimado: suele ocurrir unos 14 días antes de la siguiente regla. Si registras temperatura basal, podemos confirmarla.'
                                                : 'Estimated peak day: usually about 14 days before the next period. Logging basal temperature lets us confirm it.'}</p>
                                        </InfoTooltip>
                                    </dt>
                                    <dd className="text-base sm:text-xl md:text-2xl font-semibold text-foreground tracking-tight leading-tight">~{fmt(next.ovulation)}</dd>
                                    <dd className="hidden sm:block text-xs font-medium text-sun-ink">{locale === 'es' ? 'Día pico estimado' : 'Estimated peak day'}</dd>
                                </div>
                                <div className="rounded-xl sm:rounded-2xl bg-card/70 border border-border/60 px-3 sm:px-3.5 py-2.5 flex flex-col gap-0.5">
                                    <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <span className="size-2 rounded-full bg-sun/40" />
                                        {t.fertileWindowLabel}
                                        <InfoTooltip label={locale === 'es' ? 'Sobre la ventana fértil' : 'About the fertile window'} className="-my-1 size-5">
                                            <p>{locale === 'es'
                                                ? 'Los ~5 días antes de la ovulación y el propio día. Es cuando hay más probabilidad de embarazo.'
                                                : 'The ~5 days before ovulation plus the day itself, when pregnancy is most likely.'}</p>
                                            {answers.goal === 'fertility' && <p className="text-xs">{t.forecastFertilityTip}</p>}
                                        </InfoTooltip>
                                    </dt>
                                    <dd className="text-base sm:text-xl md:text-2xl font-semibold text-foreground tracking-tight leading-tight">{fmt(next.fertileStart)} – {fmt(next.fertileEnd)}</dd>
                                    <dd className="hidden sm:block text-xs font-medium text-muted-foreground">{locale === 'es' ? 'Mayor probabilidad' : 'Highest chance'}</dd>
                                </div>
                            </dl>

                            {usesHormonalContraception(answers) && (
                                <p className="text-xs text-sun-ink flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    {t.forecastHormonalNote}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {errorMsg && (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
        <span>{errorMsg}</span>
        <button type="button" onClick={() => setErrorMsg(null)} className="shrink-0 min-h-10 px-2 font-semibold text-foreground">{locale === 'es' ? 'Cerrar' : 'Dismiss'}</button>
    </div>
)}
{/* Mobile View Switcher (Hidden on Desktop) */}
                <div role="tablist" className="flex lg:hidden bg-secondary/60 p-1 rounded-2xl border border-border/60">
                    <button
                        type="button"
                        role="tab" aria-selected={mobileTab === 'log'} onClick={() => setMobileTab('log')}
                        className={`flex-1 min-h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            mobileTab === 'log'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                        {t.addPeriod}
                        {selectedDays.length > 0 && (
                            <span className="size-2 rounded-full bg-primary" />
                        )}
                    </button>
                    <button
                        type="button"
                        role="tab" aria-selected={mobileTab === 'history'} onClick={() => setMobileTab('history')}
                        className={`flex-1 min-h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            mobileTab === 'history'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        {locale === 'es' ? 'Períodos' : 'Periods'}
                    </button>
                </div>

                {/* Main Two-Column Responsive Layout: Logging Input on Left, Analysis & History on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Column 1: Interactive Period Logger (Desktop Left, Mobile when mobileTab === 'log') */}
                    <aside className={`lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto scrollbar-hide ${mobileTab === 'log' ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="size-8 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                                    </span>
                                    <h3 className="text-foreground font-bold text-lg">{t.addPeriod}</h3>
                                    <InfoTooltip label={locale === 'es' ? 'Cómo marcar días' : 'How to mark days'} className="ml-auto">
                                        <p>{locale === 'es'
                                            ? 'Toca el primer día de sangrado y luego el último: se rellena el rango (hasta 10 días). Toca un día marcado para quitarlo.'
                                            : 'Tap the first bleeding day, then the last: the range fills in (up to 10 days). Tap a marked day to remove it.'}</p>
                                        <p>{locale === 'es'
                                            ? 'Toca un día de regla ya guardado para anotar la intensidad del sangrado y el dolor.'
                                            : 'Tap a saved period day to log bleeding intensity and pain.'}</p>
                                        <p className="text-xs text-muted-foreground">{locale === 'es'
                                            ? 'Los días futuros solo muestran predicciones y no se pueden marcar.'
                                            : 'Future days only show predictions and cannot be marked.'}</p>
                                    </InfoTooltip>
                                </div>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    {calendarMode === 'period'
                                        ? (locale === 'es' ? 'Toca el primer y último día de sangrado para marcar el rango.' : t.calendarHint)
                                        : calendarMode === 'spotting'
                                        ? (locale === 'es' ? 'Toca un día para marcar o quitar manchado (sangrado leve fuera de la regla). Se guarda al momento y no cuenta como regla.' : 'Tap a day to add or remove spotting (light bleeding outside your period). It saves right away and does not count as a period.')
                                        : (locale === 'es' ? 'Toca un día para marcar o quitar una relación sexual. Se guarda al momento y solo tú puedes verlo. Para añadir detalles (protección, número de veces) usa el registro diario.' : 'Tap a day to add or remove sexual activity. It saves right away and only you can see it. Add details (protection, times) in the daily log.')}
                                </p>
                            </div>

                            <div role="radiogroup" aria-label={locale === 'es' ? 'Qué marcar' : 'What to mark'} className="grid grid-cols-3 p-1 rounded-xl bg-secondary/60 gap-1">
                                {([
                                    { id: 'period', icon: 'water_drop', tint: 'text-primary', es: 'Regla', en: 'Period' },
                                    { id: 'spotting', icon: 'grain', tint: 'text-petal', es: 'Manchado', en: 'Spotting' },
                                    { id: 'sex', icon: 'favorite', tint: 'text-blossom', es: 'Relación', en: 'Sex' },
                                ] as const).map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={calendarMode === m.id}
                                        onClick={() => setCalendarMode(m.id)}
                                        className={`flex items-center justify-center gap-1 sm:gap-1.5 h-11 sm:h-9 rounded-lg text-xs sm:text-xs font-bold transition-all ${calendarMode === m.id ? 'bg-card text-foreground shadow-sm ring-1 ring-border/70' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <span
                                            className={`material-symbols-outlined text-[16px] ${calendarMode === m.id ? m.tint : ''}`}
                                            style={calendarMode === m.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                        >{m.icon}</span>
                                        {locale === 'es' ? m.es : m.en}
                                    </button>
                                ))}
                            </div>
                            {signsError && calendarMode !== 'period' && (
                                <p className="text-xs font-semibold text-destructive" role="alert">
                                    {locale === 'es' ? 'No se pudo guardar. Falta aplicar la migración de la tabla cycle_signs.' : 'Could not save. The cycle_signs migration has not been applied.'}
                                </p>
                            )}

                            <div className="flex justify-center rounded-2xl bg-background/60 border border-border/50 px-2 py-3 sm:px-3">
                                <PeriodDayCalendar
                                    selected={selectedDays}
                                    onChange={setSelectedDays}
                                    saved={savedDays}
                                    fertileDays={fertileDays}
                                    ovulationDays={ovulationDays}
                                    mode={calendarMode}
                                    onMarkerToggle={toggleMarker}
                                    onSavedDayClick={setFlowDay}
                                    flowByDay={flowByDay}
                                    spottingDays={spottingDays}
                                    sexDays={sexDays}
                                    confirmedOvulationDays={Array.from(confirmedOvulations.values())}
                                />
                            </div>

                            {calendarMode === 'period' && (
                                flowDay ? (
                                    <FlowQuickEditor lang={locale} sign={signFor(flowDay)} onSave={saveSign} onClose={() => setFlowDay(null)} />
                                ) : null
                            )}
                            <div className={`pt-3 border-t border-border/60 flex-col gap-3 ${calendarMode === 'period' ? 'flex' : 'hidden'}`}>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">
                                        {selectedDays.length === 0
                                            ? t.noDaysSelected
                                            : `${selectedDays.length} ${t.daysUnit} · ${periodsFound} ${periodsFound === 1 ? t.periodSingular : t.periodPlural}`}
                                    </span>
                                    {selectedDays.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDays([])}
                                            className="text-muted-foreground hover:text-foreground font-semibold transition-colors py-2.5 -my-2.5 sm:py-0 sm:my-0"
                                        >
                                            {t.clearSelection}
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveDays}
                                    disabled={saving || selectedDays.length === 0}
                                    className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {saving ? 'progress_activity' : 'check'}
                                    </span>
                                    {saving ? (locale === 'es' ? 'Guardando...' : 'Saving...') : t.saveMarkedDays}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Column 2: Analysis & Connected Timeline (Desktop Right, Mobile when mobileTab === 'history') */}
                    <div className={`lg:col-span-7 xl:col-span-7 flex flex-col gap-5 sm:gap-8 ${mobileTab === 'history' ? 'block' : 'hidden lg:block'}`}>
                        {/* Logged periods: first in the column, it is what the page is for */}
                        <section ref={listRef} className="flex flex-col gap-4 scroll-mt-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-foreground font-bold text-lg sm:text-xl">
                                    {locale === 'es' ? 'Períodos registrados' : 'Logged periods'}
                                </h3>
                                <span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full">
                                    {periods.length} {periods.length === 1 ? t.periodSingular : t.periodPlural}
                                </span>
                            </div>
                            {periods.length === 0 ? (
                                <div className="p-8 text-center bg-card border border-border/80 rounded-3xl flex flex-col items-center gap-3 shadow-sm">
                                    <div className="flex flex-col gap-1 max-w-sm">
                                        <h4 className="font-bold text-foreground text-base">
                                            {locale === 'es' ? 'Comienza registrando tu último período' : t.noPeriodsYet}
                                        </h4>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            {locale === 'es'
                                                ? 'Marca los días de sangrado en el calendario. Al registrar 2 o más períodos calcularemos automáticamente tu regularidad, duración media y fases.'
                                                : t.calendarHint}
                                        </p>
                                        <button type="button" onClick={() => setMobileTab('log')} className="lg:hidden mt-3 min-h-10 self-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
                                            {locale === 'es' ? 'Marcar en el calendario' : 'Mark on the calendar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {periodsByYear.length > 1 && (
                                        <div role="tablist" aria-label={locale === 'es' ? 'Año' : 'Year'} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
                                            {periodsByYear.map(({ year, periods: yp }) => {
                                                const on = year === activeYear.year;
                                                return (
                                                    <button
                                                        key={year}
                                                        type="button"
                                                        role="tab"
                                                        aria-selected={on}
                                                        onClick={() => pickYear(year)}
                                                        className={`shrink-0 min-h-10 inline-flex items-center gap-2 rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border/70 hover:border-primary/40'}`}
                                                    >
                                                        {year}
                                                        <span className={`text-xs font-medium ${on ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{yp.length}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {visibleYears.map(({ year, periods: yearPeriods }) => (
                                        <div key={year} className="flex flex-col gap-4">
                                            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                                                {yearPeriods.map((period) => {
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
                                                    const days = periodBleedingDays(signs, period);
                                                    const flowText = locale === 'es'
                                                        ? { light: 'ligero', medium: 'medio', heavy: 'abundante', very_heavy: 'muy abundante' }
                                                        : { light: 'light', medium: 'medium', heavy: 'heavy', very_heavy: 'very heavy' };
                                                    return (
                                                        <div key={period.id} className="relative group">
                                                            <div className={`absolute -left-6 top-4 size-3 rounded-full ring-4 ring-background transition-colors ${
                                                                isLatest ? 'bg-primary ring-primary/20' : 'bg-muted-foreground/40 group-hover:bg-primary/70'
                                                            }`} />
                                                            <div className="bg-card border border-border/70 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm">
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div className="flex min-w-0 basis-40 grow flex-col gap-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <p className="text-foreground font-bold text-base sm:text-lg">
                                                                                {end ? `${start} – ${end}` : start}
                                                                            </p>
                                                                            {isLatest && (
                                                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                                                    {locale === 'es' ? 'Más reciente' : 'Latest'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                            {duration && (
                                                                                <span className="font-medium text-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
                                                                                    {duration} {t.daysUnit} {locale === 'es' ? 'de sangrado' : 'bleeding'}
                                                                                </span>
                                                                            )}
                                                                            {span && (
                                                                                <span className="text-muted-foreground">
                                                                                    · {t.cycleOfDays} <strong className="text-foreground">{span.days} {t.daysUnit}</strong>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {days.length > 0 && (
                                                                            <details className="mt-2">
                                                                                <summary className="cursor-pointer text-xs font-medium text-primary min-h-6 inline-flex items-center">
                                                                                    {locale === 'es' ? `Detalle por día (${days.length})` : `Day details (${days.length})`}
                                                                                </summary>
                                                                                <ul className="flex flex-wrap gap-1.5 mt-2">
                                                                                    {days.map((d) => (
                                                                                        <li key={d.date} className={`text-xs font-medium px-2 py-1 rounded-md border ${d.flow === 'very_heavy' || d.flow === 'heavy' ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                                                                                            {Number(d.date.slice(8))}
                                                                                            {d.flow ? ` · ${flowText[d.flow]}` : ''}
                                                                                            {d.clots ? (locale === 'es' ? ' · coágulos' : ' · clots') : ''}
                                                                                            {d.pain != null ? (locale === 'es' ? ` · dolor ${d.pain}/10` : ` · pain ${d.pain}/10`) : ''}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </details>
                                                                        )}
                                                                        {currentDay && (
                                                                            <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
                                                                                <span className="size-1.5 rounded-full bg-primary" />
                                                                                {t.currentCycleDay} {currentDay}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {confirmId === period.id ? (
                                                                        <div role="group" aria-label={t.deletePeriod} className="flex shrink-0 flex-col items-end gap-1.5">
                                                                            <span className="text-xs font-medium text-foreground">{locale === 'es' ? '¿Eliminar este período?' : 'Delete this period?'}</span>
                                                                            <div className="flex gap-1.5">
                                                                                <button type="button" onClick={() => setConfirmId(null)} autoFocus
                                                                                    className="min-h-10 rounded-full border border-border/70 px-3 text-xs font-semibold text-foreground hover:bg-secondary">
                                                                                    {locale === 'es' ? 'Cancelar' : 'Cancel'}
                                                                                </button>
                                                                                <button type="button" onClick={() => deletePeriod(period.id)}
                                                                                    className="min-h-10 rounded-full bg-destructive px-3 text-xs font-semibold text-white hover:bg-destructive/90">
                                                                                    {locale === 'es' ? 'Eliminar' : 'Delete'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setConfirmId(period.id)}
                                                                            className="size-10 inline-flex items-center justify-center text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                                                                            aria-label={t.deletePeriod}
                                                                            title={t.deletePeriod}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {pageCount > 1 && (
                                        <nav aria-label={locale === 'es' ? 'Paginación de períodos' : 'Period pages'} className="flex items-center justify-between gap-3">
                                            <button type="button" onClick={() => goPage(currentPage - 1)} disabled={currentPage === 0}
                                                className="min-h-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-card pl-3 pr-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none">
                                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
                                                {locale === 'es' ? 'Anterior' : 'Previous'}
                                            </button>
                                            <span className="text-xs font-medium text-muted-foreground tabular-nums" aria-live="polite">
                                                {currentPage * PAGE_SIZE + 1}–{currentPage * PAGE_SIZE + pagePeriods.length} {locale === 'es' ? 'de' : 'of'} {activePeriods.length}
                                            </span>
                                            <button type="button" onClick={() => goPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}
                                                className="min-h-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-card pl-4 pr-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none">
                                                {locale === 'es' ? 'Siguiente' : 'Next'}
                                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
                                            </button>
                                        </nav>
                                    )}
                                </div>
                            )}
                        </section>

                        {periods.length > 0 && (
                            <CycleAnalysisCard periods={periods} signs={signs} pregnancies={pregnancies} expectedNext={projections[0]?.periodStart} expectsLongGaps={expectsLongGaps(answers)} />
                        )}
                        {showForecast && <PeriodForecastCard lang={locale} pmos={false} />}
                        {periods.length >= 2 && <PremenstrualPatternCard periodStarts={periodStarts} lang={locale} />}
                    </div>
                </div>
            </div>
        {pendingDelete && typeof document !== 'undefined' && createPortal(
            <div role="status" className="fixed bottom-24 md:bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-full border border-border bg-card py-1 pl-5 pr-1 text-sm shadow-lg">
                <span className="text-foreground">{locale === 'es' ? 'Período eliminado' : 'Period deleted'}</span>
                <button type="button" onClick={undoDelete} className="min-h-10 rounded-full px-4 font-semibold text-primary hover:bg-primary/10">
                    {locale === 'es' ? 'Deshacer' : 'Undo'}
                </button>
            </div>,
            document.body,
        )}
        </div>
    );
};

export default PeriodHistory;
