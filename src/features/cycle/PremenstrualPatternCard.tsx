'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { addDays, toISODate } from '@/lib/cycle/cycleEngine';
import { LOW_MOOD_KEY, PREMENSTRUAL_DAYS, premenstrualPattern, type SymptomDay } from '@/lib/cycle/premenstrual';
import { SYMPTOMS } from './components/SymptomGrid';

const COPY = {
  es: {
    title: 'Tu patrón premenstrual',
    body: (n: number) => `Esto se repitió en los ${PREMENSTRUAL_DAYS} días antes de tu regla en ${n} ciclos:`,
    cycles: (n: number, total: number) => `${n} de ${total}`,
    none: 'Todavía no vemos un patrón que se repita antes de tu regla.',
    needData: `Registra cómo te sientes en los ${PREMENSTRUAL_DAYS} días antes de tu regla y aquí verás qué se repite cada ciclo.`,
    tip: 'Saber qué esperar ayuda a planear: más descanso, comidas con proteína y menos compromisos esos días. Si el ánimo bajo te impide hacer tu vida, coméntalo: puede ser trastorno disfórico premenstrual y tiene tratamiento.',
    lowMood: 'Ánimo bajo',
  },
  en: {
    title: 'Your premenstrual pattern',
    body: (n: number) => `These repeated in the ${PREMENSTRUAL_DAYS} days before your period across ${n} cycles:`,
    cycles: (n: number, total: number) => `${n} of ${total}`,
    none: 'No pattern repeats before your period yet.',
    needData: `Log how you feel in the ${PREMENSTRUAL_DAYS} days before your period and you will see what repeats each cycle.`,
    tip: 'Knowing what to expect helps you plan: more rest, protein-rich meals and fewer commitments those days. If low mood gets in the way of your life, mention it: it can be premenstrual dysphoric disorder and it is treatable.',
    lowMood: 'Low mood',
  },
};

/** Symptoms that repeat before the period, for every profile. Reads the daily log of the last ~4 cycles. */
const PremenstrualPatternCard: React.FC<{ periodStarts: string[]; lang: 'es' | 'en' }> = ({ periodStarts, lang }) => {
  const c = COPY[lang];
  const [logs, setLogs] = useState<SymptomDay[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setLogs([]); return; }
      const { data } = await supabase
        .from('daily_logs')
        .select('date, symptoms, mood')
        .eq('user_id', uid)
        .gte('date', toISODate(addDays(new Date(), -130)));
      if (!cancelled) setLogs((data as SymptomDay[] | null) ?? []);
    })().catch(() => { if (!cancelled) setLogs([]); });
    return () => { cancelled = true; };
  }, []);

  const pattern = useMemo(() => (logs ? premenstrualPattern(logs, periodStarts) : null), [logs, periodStarts]);
  if (!pattern) return null;
  const label = (key: string) => key === LOW_MOOD_KEY ? c.lowMood : lang === 'es' ? SYMPTOMS.find((s) => s.key === key)?.es ?? key : key;

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-3">
      <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">psychiatry</span>
        {c.title}
      </h3>
      {pattern.cyclesChecked < 2 ? (
        <p className="text-sm text-muted-foreground">{c.needData}</p>
      ) : pattern.symptoms.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.none}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{c.body(pattern.cyclesChecked)}</p>
          <ul className="flex flex-wrap gap-2">
            {pattern.symptoms.map((s) => (
              <li key={s.key} className="text-sm font-semibold px-3 py-1.5 rounded-full bg-blossom-soft text-foreground">
                {label(s.key)} <span className="text-muted-foreground font-medium">· {c.cycles(s.cycles, pattern.cyclesChecked)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.tip}</p>
        </>
      )}
    </section>
  );
};

export default PremenstrualPatternCard;
