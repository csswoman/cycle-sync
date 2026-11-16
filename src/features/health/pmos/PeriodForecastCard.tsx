'use client';
import React from 'react';
import { usePeriodForecast } from '@/hooks/usePeriodForecast';

const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const CONFIDENCE_TEXT = {
  low: 'Low confidence: log at least 3 periods for a range based on your own cycles.',
  medium: 'Based on your recent cycles.',
  high: 'Based on your last 6 cycles.',
} as const;

const PeriodForecastCard: React.FC = () => {
  const { forecast, loading } = usePeriodForecast();

  return (
    <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-3">
      <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">event_upcoming</span>
        Next period (estimated range)
      </h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !forecast ? (
        <p className="text-muted-foreground text-sm">Log your period start to get a prediction.</p>
      ) : (
        <>
          <p className="text-foreground text-2xl font-semibold">
            {fmt(forecast.earliest)} – {fmt(forecast.latest)}
          </p>
          {forecast.overdueDays > 0 && (
            <p className="text-sm text-orange-500">
              It is {forecast.overdueDays} {forecast.overdueDays === 1 ? 'day' : 'days'} past the end of this range. Late
              cycles are common with PMOS; consider a pregnancy test or talking to your provider if it keeps going.
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            {CONFIDENCE_TEXT[forecast.confidence]}
            {forecast.irregular && ' Your cycles vary by more than a week, so the range is wide.'}
          </p>
          {forecast.cycleLengths.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Recent cycle lengths: {forecast.cycleLengths.join(', ')} days
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default PeriodForecastCard;
