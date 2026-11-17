'use client';
import React from 'react';
import { usePeriodForecast } from '@/hooks/usePeriodForecast';

type Lang = 'es' | 'en';

const T = {
  es: {
    title: 'Próxima regla (rango estimado)', loading: 'Cargando…', empty: 'Registra el inicio de tu regla para obtener una predicción.',
    overdue: (n: number, pmos: boolean) => `Han pasado ${n} ${n === 1 ? 'día' : 'días'} desde el final de este rango. ${pmos ? 'Los ciclos largos son comunes con PMOS; considera' : 'Si es posible un embarazo, considera'} una prueba de embarazo o habla con tu médico si sigue así.`,
    confidence: {
      low: 'Confianza baja: registra al menos 3 reglas para un rango basado en tus propios ciclos.',
      medium: 'Basado en tus ciclos recientes.',
      high: 'Basado en tus últimos 6 ciclos.',
    },
    irregular: ' Tus ciclos varían más de una semana, por eso el rango es amplio.',
    recent: (l: string) => `Duración de tus ciclos recientes: ${l} días`,
  },
  en: {
    title: 'Next period (estimated range)', loading: 'Loading…', empty: 'Log your period start to get a prediction.',
    overdue: (n: number, pmos: boolean) => `It is ${n} ${n === 1 ? 'day' : 'days'} past the end of this range. ${pmos ? 'Late cycles are common with PMOS; consider' : 'If pregnancy is possible, consider'} a pregnancy test or talking to your provider if it keeps going.`,
    confidence: {
      low: 'Low confidence: log at least 3 periods for a range based on your own cycles.',
      medium: 'Based on your recent cycles.',
      high: 'Based on your last 6 cycles.',
    },
    irregular: ' Your cycles vary by more than a week, so the range is wide.',
    recent: (l: string) => `Recent cycle lengths: ${l} days`,
  },
};

/** `pmos` picks the wording of the overdue note; the range itself is the same for everyone. */
const PeriodForecastCard: React.FC<{ lang?: Lang; pmos?: boolean }> = ({ lang = 'en', pmos = true }) => {
  const t = T[lang];
  const { forecast, loading } = usePeriodForecast();
  const fmt = (d: Date) => d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-3">
      <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">event_upcoming</span>
        {t.title}
      </h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">{t.loading}</p>
      ) : !forecast ? (
        <p className="text-muted-foreground text-sm">{t.empty}</p>
      ) : (
        <>
          <p className="text-foreground text-2xl font-semibold">{fmt(forecast.earliest)} – {fmt(forecast.latest)}</p>
          {forecast.overdueDays > 0 && <p className="text-sm text-sun-ink">{t.overdue(forecast.overdueDays, pmos)}</p>}
          <p className="text-muted-foreground text-sm">
            {t.confidence[forecast.confidence]}
            {forecast.irregular && t.irregular}
          </p>
          {forecast.cycleLengths.length > 0 && <p className="text-muted-foreground text-sm">{t.recent(forecast.cycleLengths.join(', '))}</p>}
        </>
      )}
    </section>
  );
};

export default PeriodForecastCard;
