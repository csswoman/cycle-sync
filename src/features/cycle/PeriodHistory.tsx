import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { CycleAnalysisCard } from './CycleAnalysisCard';
import { GardenCorner, TitleSprig } from '@/components/ui/Botanical';
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

const SIGNS_FROM = toISODate(addDays(new Date(), -400));

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
    const answers = useOnboardingAnswers();

    const [mobileTab, setMobileTab] = useState<'log' | 'history'>('log');
    const [calendarMode, setCalendarMode] = useState<CalendarMode>('period');
    const { signs, signFor, saveSign, error: signsError } = useCycleSigns(SIGNS_FROM);
    const [flowDay, setFlowDay] = useState<string | null>(null);
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

    const countdownDays = useMemo(() => {
        if (!next) return null;
        const today = new Date();
        const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return daysBetween(todayNorm, next.periodStart);
    }, [next]);

    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
                {/* Header with inline regularity indicator */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/50">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-foreground text-3xl md:text-4xl font-semibold tracking-tight"><TitleSprig />{t.cycleHistoryTitle}</h1>
                        <p className="text-muted-foreground text-sm max-w-xl">
                            {locale === 'es' ? 'Analiza la duración de tus ciclos y predice tus próximas fases.' : t.markDaysDescription}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-secondary/60 border border-border/70 text-xs font-medium shrink-0">
                        <span className={`size-2.5 rounded-full shrink-0 ${
                            regularity === 'regular' ? 'bg-emerald-500' :
                            regularity === 'irregular' ? 'bg-amber-500' :
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
                    <section className="relative overflow-hidden rounded-3xl garden-wash border border-border/80 p-6 md:p-8 shadow-sm">
                        <GardenCorner variant="blossom" className="size-32 sm:size-44 opacity-80" />

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
                                    <h2 className="text-foreground font-bold text-lg md:text-xl tracking-tight">{t.forecastTitle}</h2>
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                                    {t.confidenceLabel}: {estimate.confidence === 'high' ? t.confidenceHigh : estimate.confidence === 'medium' ? t.confidenceMedium : t.confidenceLow}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                                {/* Metric 1: Next Period with Countdown */}
                                <div className="flex flex-col gap-1 sm:pr-4 pt-3 sm:pt-0">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.nextPeriodLabel}</span>
                                    <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                                        {next.periodEarliest.getTime() === next.periodLatest.getTime()
                                            ? fmt(next.periodStart)
                                            : `${fmt(next.periodEarliest)} – ${fmt(next.periodLatest)}`}
                                    </p>
                                    {countdownDays !== null && (
                                        <p className="text-xs font-medium text-primary">
                                            {countdownDays > 0 ? (locale === 'es' ? `en ${countdownDays} días` : `in ${countdownDays} days`) : countdownDays === 0 ? (locale === 'es' ? 'hoy' : 'today') : (locale === 'es' ? `${-countdownDays} días de retraso` : `${-countdownDays} days late`)}
                                        </p>
                                    )}
                                </div>

                                {/* Metric 2: Ovulation */}
                                <div className="flex flex-col gap-1 sm:px-4 pt-4 sm:pt-0">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.ovulationLabel}</span>
                                    <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                                        ~ {fmt(next.ovulation)}
                                    </p>
                                    <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                                        {locale === 'es' ? 'Día pico estimado' : 'Estimated peak day'}
                                    </p>
                                </div>

                                {/* Metric 3: Fertile Window */}
                                <div className="flex flex-col gap-1 sm:pl-4 pt-4 sm:pt-0">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fertileWindowLabel}</span>
                                    <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                                        {fmt(next.fertileStart)} – {fmt(next.fertileEnd)}
                                    </p>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {locale === 'es' ? 'Mayor probabilidad' : 'Highest chance'}
                                    </p>
                                </div>
                            </div>

                            {/* Contextual Tips & Medical Disclaimer */}
                            {(answers.goal === 'fertility' || usesHormonalContraception(answers) || estimate.irregular) && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                                    {answers.goal === 'fertility' && (
                                        <div className="text-xs text-foreground bg-secondary/50 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-primary">favorite</span>
                                            {t.forecastFertilityTip}
                                        </div>
                                    )}
                                    {usesHormonalContraception(answers) && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">info</span>
                                            {t.forecastHormonalNote}
                                        </div>
                                    )}
                                    {estimate.irregular && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">warning</span>
                                            {t.forecastIrregularNote}
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground/80 leading-normal">{t.forecastDisclaimer}</p>
                        </div>
                    </section>
                )}

                {/* Mobile View Switcher (Hidden on Desktop) */}
                <div className="flex lg:hidden bg-secondary/60 p-1 rounded-2xl border border-border/60">
                    <button
                        type="button"
                        onClick={() => setMobileTab('log')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
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
                        onClick={() => setMobileTab('history')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            mobileTab === 'history'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        {locale === 'es' ? 'Períodos' : 'Periods'}
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-foreground font-semibold">
                            {periods.length}
                        </span>
                    </button>
                </div>

                {/* Main Two-Column Responsive Layout: Logging Input on Left, Analysis & History on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Column 1: Interactive Period Logger (Desktop Left, Mobile when mobileTab === 'log') */}
                    <aside className={`lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 ${mobileTab === 'log' ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">calendar_add_on</span>
                                    <h3 className="text-foreground font-bold text-lg">{t.addPeriod}</h3>
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
                                    { id: 'period', icon: 'water_drop', es: 'Regla', en: 'Period' },
                                    { id: 'spotting', icon: 'grain', es: 'Manchado', en: 'Spotting' },
                                    { id: 'sex', icon: 'favorite', es: 'Relación', en: 'Sex' },
                                ] as const).map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={calendarMode === m.id}
                                        onClick={() => setCalendarMode(m.id)}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${calendarMode === m.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                                        {locale === 'es' ? m.es : m.en}
                                    </button>
                                ))}
                            </div>
                            {signsError && calendarMode !== 'period' && (
                                <p className="text-xs font-semibold text-destructive" role="alert">
                                    {locale === 'es' ? 'No se pudo guardar. Falta aplicar la migración de la tabla cycle_signs.' : 'Could not save. The cycle_signs migration has not been applied.'}
                                </p>
                            )}

                            <div className="flex justify-center">
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
                                ) : savedDays.length > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'es' ? 'Toca un día de regla ya guardado para anotar la intensidad del sangrado y el dolor.' : 'Tap a saved period day to log bleeding intensity and pain.'}
                                    </p>
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
                                            className="text-muted-foreground hover:text-foreground font-semibold transition-colors"
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
                    <div className={`lg:col-span-7 xl:col-span-7 flex flex-col gap-8 ${mobileTab === 'history' ? 'block' : 'hidden lg:block'}`}>
                        {periods.length > 0 && (
                            <CycleAnalysisCard periods={periods} signs={signs} pregnancies={pregnancies} expectedNext={projections[0]?.periodStart} />
                        )}

                        {/* Connected Timeline for Logged Periods */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-foreground font-bold text-xl">
                                    {locale === 'es' ? 'Períodos registrados' : 'Logged periods'}
                                </h3>
                                <span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full">
                                    {periods.length} {periods.length === 1 ? t.periodSingular : t.periodPlural}
                                </span>
                            </div>

                            {periods.length === 0 ? (
                                <div className="p-8 text-center bg-card/60 border border-border/80 rounded-3xl flex flex-col items-center gap-3 shadow-sm">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">insights</span>
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-sm">
                                        <h4 className="font-bold text-foreground text-base">
                                            {locale === 'es' ? 'Comienza registrando tu último período' : t.noPeriodsYet}
                                        </h4>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            {locale === 'es'
                                                ? 'Marca los días de sangrado en el calendario. Al registrar 2 o más períodos calcularemos automáticamente tu regularidad, duración media y fases.'
                                                : t.calendarHint}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {periodsByYear.map(({ year, periods: yearPeriods }) => (
                                        <div key={year} className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-foreground bg-secondary/80 px-3 py-1 rounded-full border border-border/70 tracking-wide">
                                                    {year}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {yearPeriods.length} {yearPeriods.length === 1 ? t.periodSingular : t.periodPlural}
                                                </span>
                                                <div className="h-px flex-1 bg-border/40" />
                                            </div>

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

                                                    return (
                                                        <div key={period.id} className="relative group">
                                                            {/* Node dot on timeline */}
                                                            <div className={`absolute -left-6 top-4 size-3 rounded-full ring-4 ring-background transition-colors ${
                                                                isLatest ? 'bg-primary ring-primary/20' : 'bg-muted-foreground/40 group-hover:bg-primary/70'
                                                            }`} />

                                                            <div className="bg-card/70 hover:bg-card border border-border/70 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <p className="text-foreground font-bold text-base sm:text-lg">
                                                                                {end ? `${start} – ${end}` : start}
                                                                            </p>
                                                                            {isLatest && (
                                                                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
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

                                                                        {(() => {
                                                                            const days = periodBleedingDays(signs, period);
                                                                            if (days.length === 0) return null;
                                                                            const flowText = locale === 'es'
                                                                                ? { light: 'ligero', medium: 'medio', heavy: 'abundante', very_heavy: 'muy abundante' }
                                                                                : { light: 'light', medium: 'medium', heavy: 'heavy', very_heavy: 'very heavy' };
                                                                            return (
                                                                                <ul className="flex flex-wrap gap-1.5 mt-2">
                                                                                    {days.map((d) => (
                                                                                        <li key={d.date} className={`text-[11px] font-medium px-2 py-1 rounded-md border ${d.flow === 'very_heavy' || d.flow === 'heavy' ? 'border-red-500/40 bg-red-500/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                                                                                            {Number(d.date.slice(8))}
                                                                                            {d.flow ? ` · ${flowText[d.flow]}` : ''}
                                                                                            {d.clots ? (locale === 'es' ? ' · coágulos' : ' · clots') : ''}
                                                                                            {d.pain != null ? (locale === 'es' ? ` · dolor ${d.pain}/10` : ` · pain ${d.pain}/10`) : ''}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            );
                                                                        })()}
                                                                        {currentDay && (
                                                                            <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
                                                                                <span className="size-1.5 rounded-full bg-primary" />
                                                                                {t.currentCycleDay} {currentDay}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deletePeriod(period.id)}
                                                                        className="opacity-60 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-all shrink-0"
                                                                        aria-label={t.deletePeriod}
                                                                        title={t.deletePeriod}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodHistory;
