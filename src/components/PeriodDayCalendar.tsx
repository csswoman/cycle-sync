'use client';
import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { addDays, daysBetween, parseLocalDate, toISODate } from '@/lib/cycle/cycleEngine';

interface PeriodDayCalendarProps {
  /** Days newly marked in this session (YYYY-MM-DD). */
  selected: string[];
  onChange: (days: string[]) => void;
  /** Days already saved. Shown filled and not editable here. */
  saved?: string[];
  /** Predicted ovulation / fertile days to highlight (YYYY-MM-DD). */
  fertileDays?: string[];
  ovulationDays?: string[];
  /** First month displayed (defaults to the current month). */
  initialMonth?: Date;
  /**
   * 'period' marks bleeding days (default). 'spotting' and 'sex' toggle that marker on the tapped
   * day through onMarkerToggle instead.
   */
  mode?: CalendarMode;
  onMarkerToggle?: (iso: string) => void;
  /** Period mode: a saved bleeding day was tapped (e.g. to log its flow and pain). */
  onSavedDayClick?: (iso: string) => void;
  /** Days with bleeding intensity logged, mapped to their level, shown as a dot. */
  flowByDay?: Record<string, 'light' | 'medium' | 'heavy' | 'very_heavy'>;
  spottingDays?: string[];
  sexDays?: string[];
  /** Ovulation confirmed by a basal temperature shift (stronger than the calendar estimate). */
  confirmedOvulationDays?: string[];
}

export type CalendarMode = 'period' | 'spotting' | 'sex';

const MAX_RANGE_DAYS = 10;

/**
 * Month calendar for marking bleeding days. Click a day to mark it, click a later day to fill the
 * range between them, click a marked day to unmark it. Future days can be viewed (predictions) but not marked.
 */
export const PeriodDayCalendar: React.FC<PeriodDayCalendarProps> = ({
  selected, onChange, saved = [], fertileDays = [], ovulationDays = [], initialMonth,
  mode = 'period', onMarkerToggle, onSavedDayClick, flowByDay = {}, spottingDays = [], sexDays = [], confirmedOvulationDays = [],
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'es' ? 'es' : 'en';
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const todayIso = toISODate(today);
  const [month, setMonth] = useState(() => {
    const base = initialMonth ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [anchor, setAnchor] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const savedSet = useMemo(() => new Set(saved), [saved]);
  const fertileSet = useMemo(() => new Set(fertileDays), [fertileDays]);
  const ovulationSet = useMemo(() => new Set(ovulationDays), [ovulationDays]);
  const spottingSet = useMemo(() => new Set(spottingDays), [spottingDays]);
  const sexSet = useMemo(() => new Set(sexDays), [sexDays]);
  const confirmedSet = useMemo(() => new Set(confirmedOvulationDays), [confirmedOvulationDays]);
  const es = locale === 'es';

  const rawMonthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  // Capitalize only the first letter ("Noviembre de 2026", not "Noviembre De 2026").
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);
  const weekdays = useMemo(() => {
    // 2023-01-01 is a Sunday
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)));
  }, [locale]);

  const leading = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  const isNextDisabled = new Date(month.getFullYear(), month.getMonth() + 1, 1) > new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const isBleeding = (iso: string | null | undefined) => !!iso && (savedSet.has(iso) || selectedSet.has(iso));
  const isFertileish = (iso: string | null | undefined) => !!iso && !isBleeding(iso) && (fertileSet.has(iso) || ovulationSet.has(iso));

  const handleDay = (iso: string) => {
    if (mode !== 'period') {
      // Spotting is bleeding outside a period, so it cannot go on a period day.
      if (mode === 'spotting' && (savedSet.has(iso) || selectedSet.has(iso))) return;
      onMarkerToggle?.(iso);
      return;
    }
    if (savedSet.has(iso)) {
      onSavedDayClick?.(iso);
      return;
    }
    if (selectedSet.has(iso)) {
      onChange(selected.filter((d) => d !== iso));
      setAnchor(null);
      return;
    }
    if (anchor) {
      const span = daysBetween(parseLocalDate(anchor), parseLocalDate(iso));
      if (span > 0 && span < MAX_RANGE_DAYS) {
        const range = Array.from({ length: span + 1 }, (_, i) => toISODate(addDays(parseLocalDate(anchor), i)))
          .filter((d) => !savedSet.has(d));
        onChange(Array.from(new Set([...selected, ...range])).sort());
        setAnchor(null);
        return;
      }
    }
    onChange([...selected, iso].sort());
    setAnchor(iso);
  };

  const navBtn = 'size-9 inline-flex items-center justify-center rounded-full border border-border/70 bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="w-full max-w-[360px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className={navBtn}
          aria-label={t.previousMonth}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <div className="flex flex-col items-center leading-tight">
          <p className="text-sm font-bold text-foreground" aria-live="polite">{monthLabel}</p>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {es ? 'Volver a hoy' : 'Back to today'}
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className={navBtn}
          aria-label={t.nextMonth}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 text-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 pb-1.5">{d}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} className="h-10" />;
          const col = i % 7;
          const future = parseLocalDate(iso) > today;
          const isToday = iso === todayIso;
          const isSaved = savedSet.has(iso);
          const isSelected = selectedSet.has(iso);
          const isOvulation = ovulationSet.has(iso);
          const isConfirmed = confirmedSet.has(iso);
          const isFertile = fertileSet.has(iso);
          const hasSpotting = spottingSet.has(iso);
          const hasSex = sexSet.has(iso);
          const flow = flowByDay[iso];

          // Connected range band behind consecutive days in the same week row.
          const bleeding = isSaved || isSelected;
          const fertileish = !bleeding && (isFertile || isOvulation);
          const prev = col > 0 ? cells[i - 1] : null;
          const next = col < 6 ? cells[i + 1] : null;
          const joinPrev = bleeding ? isBleeding(prev) : fertileish && isFertileish(prev);
          const joinNext = bleeding ? isBleeding(next) : fertileish && isFertileish(next);
          const bandCls = bleeding ? (isSelected ? 'bg-primary/20' : 'bg-primary/15') : 'bg-sun/10';

          let cls = 'text-foreground hover:bg-secondary';
          if (isSaved) cls = `bg-primary/30 text-foreground font-semibold ${mode === 'period' ? 'hover:bg-primary/40' : ''}`;
          else if (isSelected) cls = 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30';
          else if (isConfirmed) cls = 'bg-sun/35 text-sun-ink font-bold ring-2 ring-sun';
          else if (isOvulation) cls = 'bg-sun/35 text-sun-ink font-bold';
          else if (isFertile) cls = 'bg-sun/15 text-sun-ink';
          if (future) cls += ' cursor-not-allowed';
          const todayCls = isToday && !bleeding ? 'ring-[1.5px] ring-primary/70 font-bold text-primary' : '';

          return (
            <div key={iso} className="relative h-10 flex items-center justify-center">
              {joinPrev && <span aria-hidden className={`absolute inset-y-1 left-0 right-1/2 ${bandCls}`} />}
              {joinNext && <span aria-hidden className={`absolute inset-y-1 left-1/2 right-0 ${bandCls}`} />}
              {/* Opaque underlay so the band doesn't tint half of the translucent circle. */}
              {(joinPrev || joinNext) && <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-9 rounded-full bg-card" />}
              <button
                type="button"
                disabled={future}
                onClick={() => handleDay(iso)}
                aria-pressed={bleeding || undefined}
                aria-label={[
                  iso,
                  isToday ? (es ? 'hoy' : 'today') : '',
                  isSaved ? (es ? 'regla guardada' : 'saved period') : isSelected ? (es ? 'marcado' : 'marked') : '',
                  hasSpotting ? (es ? 'manchado' : 'spotting') : '',
                  hasSex ? (es ? 'relación sexual' : 'sexual activity') : '',
                  isConfirmed ? (es ? 'ovulación confirmada' : 'confirmed ovulation') : isOvulation ? (es ? 'ovulación estimada' : 'estimated ovulation') : isFertile ? (es ? 'ventana fértil' : 'fertile window') : '',
                ].filter(Boolean).join(', ')}
                className={`relative z-10 size-9 flex items-center justify-center rounded-full text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cls} ${todayCls} ${future && !fertileish ? 'text-muted-foreground/45' : ''} ${anchor === iso ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
              >
                {Number(iso.slice(8))}
                {flow && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-bud ${flow === 'very_heavy' ? 'w-4 h-1' : flow === 'heavy' ? 'w-3 h-1' : flow === 'medium' ? 'size-1' : 'size-1 opacity-60'}`} />}
                {hasSpotting && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-petal" />}
                {hasSex && <span aria-hidden className="material-symbols-outlined absolute top-[2px] left-1/2 -translate-x-1/2 leading-none text-blossom" style={{ fontSize: 9, fontVariationSettings: "'FILL' 1" }}>favorite</span>}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" />{t.legendNewDays}</span>
        {saved.length > 0 && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary/30" />{t.legendSavedDays}</span>}
        {fertileDays.length > 0 && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sun/35" />{t.legendFertile}</span>}
        {confirmedOvulationDays.length > 0 && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-sun" />{es ? 'Ovulación confirmada' : 'Confirmed ovulation'}</span>}
        {Object.keys(flowByDay).length > 0 && <span className="flex items-center gap-1.5"><span className="h-1 w-3 rounded-full bg-bud" />{es ? 'Intensidad' : 'Intensity'}</span>}
        {spottingDays.length > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-petal" />{es ? 'Manchado' : 'Spotting'}</span>}
        {sexDays.length > 0 && <span className="flex items-center gap-1.5"><span aria-hidden className="material-symbols-outlined leading-none text-blossom" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>favorite</span>{es ? 'Relación' : 'Sex'}</span>}
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-[1.5px] ring-primary/70" />{es ? 'Hoy' : 'Today'}</span>
      </div>
    </div>
  );
};

export default PeriodDayCalendar;
