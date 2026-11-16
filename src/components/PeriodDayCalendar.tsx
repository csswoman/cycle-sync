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
}

const MAX_RANGE_DAYS = 10;

/**
 * Month calendar for marking bleeding days. Click a day to mark it, click a later day to fill the
 * range between them, click a marked day to unmark it. Future days can be viewed (predictions) but not marked.
 */
export const PeriodDayCalendar: React.FC<PeriodDayCalendarProps> = ({
  selected, onChange, saved = [], fertileDays = [], ovulationDays = [], initialMonth,
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'es' ? 'es' : 'en';
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const [month, setMonth] = useState(() => {
    const base = initialMonth ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [anchor, setAnchor] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const savedSet = useMemo(() => new Set(saved), [saved]);
  const fertileSet = useMemo(() => new Set(fertileDays), [fertileDays]);
  const ovulationSet = useMemo(() => new Set(ovulationDays), [ovulationDays]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
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

  const handleDay = (iso: string) => {
    if (savedSet.has(iso)) return;
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

  return (
    <div className="w-full max-w-[360px]">
      <div className="flex items-center justify-between mb-3 text-foreground">
        <button
          type="button"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          aria-label={t.previousMonth}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <p className="text-base font-bold text-center capitalize">{monthLabel}</p>
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="p-2 hover:bg-secondary rounded-full transition-colors disabled:opacity-30"
          aria-label={t.nextMonth}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-muted-foreground py-2">{d}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} />;
          const future = parseLocalDate(iso) > today;
          const isSaved = savedSet.has(iso);
          const isSelected = selectedSet.has(iso);
          const isOvulation = ovulationSet.has(iso);
          const isFertile = fertileSet.has(iso);
          let cls = 'hover:bg-secondary';
          if (isSaved) cls = 'bg-primary/40 text-foreground cursor-default';
          else if (isSelected) cls = 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 font-bold';
          else if (isOvulation) cls = 'bg-sky-500/30 text-foreground font-bold';
          else if (isFertile) cls = 'bg-sky-500/10 text-foreground';
          return (
            <button
              key={iso}
              type="button"
              disabled={future}
              onClick={() => handleDay(iso)}
              className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${cls} ${anchor === iso ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-primary" />{t.legendNewDays}</span>
        {saved.length > 0 && <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-primary/40" />{t.legendSavedDays}</span>}
        {fertileDays.length > 0 && <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-sky-500/30" />{t.legendFertile}</span>}
      </div>
    </div>
  );
};

export default PeriodDayCalendar;
