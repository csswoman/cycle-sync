'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import type { Medication } from '@/hooks/useMedications';
import { daysOfStockLeft, medicationStart, parseLocalDate, toLocalISO } from '@/lib/medications/schedule';

type Lang = 'es' | 'en';

const T = {
  es: {
    refillTitle: (name: string) => `Se está acabando ${name}`,
    refillBody: (units: number, days: number) => days === 0
      ? `Te quedan ${units} unidades y no alcanzan para hoy.`
      : `Te quedan ${units} unidades, suficientes para ${days} ${days === 1 ? 'día' : 'días'}. Pide tu receta o compra a tiempo.`,
    refillAdd: 'Ya compré', refillUnits: 'Unidades nuevas', refillSave: 'Sumar',
    metTitle: 'Primeras semanas con metformina',
    metBody: 'Las náuseas, la diarrea o el malestar estomacal son comunes al empezar y suelen mejorar en unas semanas. Tomarla con comida ayuda. Si son fuertes o no mejoran, coméntalo con tu médico: a veces se ajusta la dosis o se cambia a liberación prolongada.',
    metLog: 'Registrar molestias de hoy',
    b12Title: 'Pregunta por tu vitamina B12',
    b12Body: 'Tomar metformina por mucho tiempo puede bajar la vitamina B12. Las guías sugieren revisarla periódicamente; no hay un resultado de B12 en el último año en tu registro.',
    b12Add: 'Agregar resultado',
  },
  en: {
    refillTitle: (name: string) => `${name} is running low`,
    refillBody: (units: number, days: number) => days === 0
      ? `You have ${units} units left, not enough for today.`
      : `You have ${units} units left, enough for ${days} ${days === 1 ? 'day' : 'days'}. Get your refill in time.`,
    refillAdd: 'I refilled', refillUnits: 'New units', refillSave: 'Add',
    metTitle: 'First weeks on metformin',
    metBody: 'Nausea, diarrhoea or stomach upset are common at the start and usually improve within a few weeks. Taking it with food helps. If it is strong or does not improve, tell your doctor: the dose can be adjusted or switched to extended release.',
    metLog: "Log today's symptoms",
    b12Title: 'Ask about your vitamin B12',
    b12Body: 'Long-term metformin can lower vitamin B12. Guidelines suggest checking it periodically; there is no B12 result from the last year in your log.',
    b12Add: 'Add a result',
  },
};

const METFORMIN = /metformin/i;
const EARLY_WEEKS = 8;
const B12_AFTER_MONTHS = 6;

interface Props {
  lang: Lang;
  medications: Medication[];
  today: string;
  takenToday: (medId: string) => number;
  onRefill: (id: string, units: number) => Promise<void>;
}

const Card: React.FC<{ tone: 'warn' | 'info'; icon: string; title: string; children: React.ReactNode }> = ({ tone, icon, title, children }) => (
  <div className={`rounded-2xl border p-4 flex gap-3 ${tone === 'warn' ? 'border-sun/40 bg-sun/10' : 'border-primary/30 bg-primary/5'}`}>
    <Icon name={icon} size={22} className={tone === 'warn' ? 'text-sun-ink mt-0.5' : 'text-primary mt-0.5'} />
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <p className="font-bold text-foreground">{title}</p>
      {children}
    </div>
  </div>
);

export const MedicationCareTips: React.FC<Props> = ({ lang, medications, today, takenToday, onRefill }) => {
  const t = T[lang];
  const [refillFor, setRefillFor] = useState<string | null>(null);
  const [units, setUnits] = useState('');
  const [hasRecentB12, setHasRecentB12] = useState<boolean | null>(null);

  const metformin = medications.find((m) => METFORMIN.test(m.name));
  const metStart = metformin ? medicationStart(metformin) : null;
  const weeksOn = metStart ? Math.floor((parseLocalDate(today).getTime() - parseLocalDate(metStart).getTime()) / (7 * 86_400_000)) : null;

  useEffect(() => {
    if (!metformin) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const { data, error } = await supabase.from('lab_results').select('id').eq('user_id', session.user.id)
        .eq('marker', 'vitamin_b12').gte('date', toLocalISO(yearAgo)).limit(1);
      setHasRecentB12(error ? null : (data?.length ?? 0) > 0);
    })();
  }, [metformin?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lowStock = medications.flatMap((m) => {
    const days = daysOfStockLeft(m, today, takenToday(m.id));
    return days != null && days <= (m.refill_alert_days ?? 7) ? [{ med: m, days }] : [];
  });

  const cards: React.ReactNode[] = [];

  for (const { med, days } of lowStock) {
    cards.push(
      <Card key={`refill-${med.id}`} tone="warn" icon="warning" title={t.refillTitle(med.name)}>
        <p className="text-sm text-foreground/90">{t.refillBody(Number(med.stock), days)}</p>
        {refillFor === med.id ? (
          <form className="flex flex-wrap items-center gap-2" onSubmit={async (e) => {
            e.preventDefault();
            await onRefill(med.id, Number(units.replace(',', '.')));
            setRefillFor(null); setUnits('');
          }}>
            <input autoFocus inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} aria-label={t.refillUnits} placeholder={t.refillUnits}
              className="w-32 bg-card text-foreground rounded-full px-4 py-2 text-sm border border-border" />
            <button type="submit" className="px-4 py-2 rounded-full text-sm font-bold bg-primary text-primary-foreground">{t.refillSave}</button>
          </form>
        ) : (
          <button onClick={() => setRefillFor(med.id)} className="self-start px-4 py-2 rounded-full text-sm font-bold border border-sun/50 text-foreground hover:bg-sun/10">
            {t.refillAdd}
          </button>
        )}
      </Card>,
    );
  }

  if (metformin && weeksOn != null && weeksOn < EARLY_WEEKS) {
    cards.push(
      <Card key="met-early" tone="info" icon="info" title={t.metTitle}>
        <p className="text-sm text-foreground/90">{t.metBody}</p>
        <Link href="/log?tab=today" className="self-start text-sm font-bold text-primary hover:underline">{t.metLog} →</Link>
      </Card>,
    );
  }

  if (metformin && weeksOn != null && weeksOn >= B12_AFTER_MONTHS * 4 && hasRecentB12 === false) {
    cards.push(
      <Card key="met-b12" tone="info" icon="biotech" title={t.b12Title}>
        <p className="text-sm text-foreground/90">{t.b12Body}</p>
        <Link href="/pmos?tab=labs" className="self-start text-sm font-bold text-primary hover:underline">{t.b12Add} →</Link>
      </Card>,
    );
  }

  if (cards.length === 0) return null;
  return <div className="flex flex-col gap-3">{cards}</div>;
};

export default MedicationCareTips;
