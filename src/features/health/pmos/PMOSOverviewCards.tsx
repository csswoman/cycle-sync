'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { buildInsights, type InsightTone } from '@/lib/pmos/insights';
import { ovulationHistory, periodGap, type OvulationStatus } from '@/lib/pmos/cycleStatus';
import { screeningPlan, type ScreeningKey } from '@/lib/pmos/screening';
import { medicationStart, parseLocalDate } from '@/lib/medications/schedule';

type Lang = 'es' | 'en';
const fmt = (iso: string, lang: Lang) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const Card: React.FC<{ icon: string; title: string; subtitle?: string; children: React.ReactNode }> = ({ icon, title, subtitle, children }) => (
  <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Icon name={icon} size={20} />
      </div>
      <div>
        <h3 className="text-foreground text-lg font-bold">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const TONE: Record<InsightTone, string> = {
  positive: 'border-emerald-500/30 bg-emerald-500/5',
  neutral: 'border-border bg-secondary/30',
  attention: 'border-amber-500/40 bg-amber-500/10',
};

/* ---------------- 1. What is working ---------------- */

export const InsightsCard: React.FC<{ lang: Lang; data: PMOSOverviewData }> = ({ lang, data }) => {
  const insights = useMemo(() => buildInsights({
    today: data.today,
    periodStarts: data.periodStarts,
    medications: data.medications.map((m) => ({ ...m, start: medicationStart(m) })),
    medLogs: data.medLogs,
    symptomTotals: data.symptomTotals,
    fastingGlucose: data.fastingGlucose,
    dailyLogs: data.dailyLogs,
  }), [data]);

  return (
    <Card icon="insights" title={lang === 'es' ? '¿Mi tratamiento está funcionando?' : 'Is my treatment working?'}
      subtitle={lang === 'es' ? 'Relacionamos lo que ya registras: tratamiento, ciclos, glucosa, síntomas y sueño.' : 'Links between what you already log: treatment, cycles, glucose, symptoms and sleep.'}>
      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-secondary/30 rounded-xl p-4">
          {lang === 'es'
            ? 'Aún no hay suficientes datos. Con al menos 3 ciclos, unas lecturas de glucosa en ayunas y unas semanas de registro diario (sueño, síntomas y tomas) empezarás a ver aquí cómo se relacionan.'
            : 'Not enough data yet. With at least 3 cycles, a few fasting glucose readings and a few weeks of daily logs (sleep, symptoms and doses) you will start seeing links here.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {insights.map((i) => (
            <li key={i.id} className={`flex gap-3 rounded-xl border p-3.5 ${TONE[i.tone]}`}>
              <Icon name={i.icon} size={18} className={`mt-0.5 shrink-0 ${i.tone === 'positive' ? 'text-emerald-600' : i.tone === 'attention' ? 'text-amber-600' : 'text-primary'}`} />
              <p className="text-sm text-foreground leading-relaxed">{i[lang]}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {lang === 'es'
          ? 'Son observaciones de tus propios datos, no prueban causa y efecto. Llévalas a tu consulta para decidir los siguientes pasos con tu médico.'
          : 'These are observations from your own data and do not prove cause and effect. Bring them to your appointment to decide next steps together.'}
      </p>
    </Card>
  );
};

/* ---------------- 4. Cycle status and ovulation ---------------- */

const OV_STYLE: Record<OvulationStatus, { cls: string; es: string; en: string }> = {
  confirmed: { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', es: 'Ovulación confirmada', en: 'Ovulation confirmed' },
  possible: { cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-400', es: 'Posible (LH positiva)', en: 'Possible (positive LH)' },
  not_detected: { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', es: 'Sin ovulación detectada', en: 'No ovulation detected' },
  in_progress: { cls: 'bg-secondary text-muted-foreground', es: 'En curso', en: 'In progress' },
  no_data: { cls: 'bg-secondary text-muted-foreground', es: 'Sin datos', en: 'No data' },
};

export const CycleStatusCard: React.FC<{ lang: Lang; data: PMOSOverviewData }> = ({ lang, data }) => {
  const gap = periodGap(data.periodStarts, data.today);
  const history = useMemo(() => ovulationHistory(data.periodStarts, data.signs, data.today), [data]);
  const es = lang === 'es';
  const confirmed = history.filter((h) => h.end && h.status === 'confirmed').length;
  const finished = history.filter((h) => h.end && h.status !== 'no_data').length;

  const gapText = !gap ? null : {
    ok: es ? 'Dentro de lo esperado para un ciclo.' : 'Within a typical cycle.',
    long: es ? 'Tu ciclo ya es más largo de 35 días. Es común con PMOS; si buscas embarazo o no es tu patrón habitual, coméntalo.' : 'Your cycle is now longer than 35 days. Common with PMOS; mention it if you are trying to conceive or it is unusual for you.',
    very_long: es ? 'Más de 60 días sin regla. Considera una prueba de embarazo si aplica y anota cualquier manchado.' : 'More than 60 days without a period. Consider a pregnancy test if it applies and log any spotting.',
    alert: es
      ? 'Más de 90 días sin regla. Con PMOS, pasar mucho tiempo sin sangrar puede engrosar el endometrio. Pide una consulta: tu médico puede indicarte cómo provocar una regla o proteger el endometrio.'
      : 'More than 90 days without a period. With PMOS, long gaps without bleeding can thicken the uterine lining. Book an appointment: your doctor can induce a bleed or protect the lining.',
  }[gap.level];

  const tone = gap?.level === 'alert' ? 'border-destructive/40 bg-destructive/10' : gap?.level === 'very_long' ? 'border-amber-500/40 bg-amber-500/10' : 'border-border bg-secondary/30';

  return (
    <Card icon="calendar_month" title={es ? 'Tu ciclo y la ovulación' : 'Your cycle and ovulation'}>
      {!gap ? (
        <p className="text-sm text-muted-foreground">{es ? 'Registra el inicio de tu regla para ver cuántos días llevas.' : 'Log your period start to see how many days it has been.'}</p>
      ) : (
        <div className={`rounded-xl border p-4 flex items-start gap-4 ${tone}`}>
          <div className="text-center shrink-0">
            <p className="text-3xl font-black text-foreground tabular-nums leading-none">{gap.days}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{es ? 'días' : 'days'}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-foreground">{es ? `desde tu última regla (${fmt(gap.lastStart, lang)})` : `since your last period (${fmt(gap.lastStart, lang)})`}</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{gapText}</p>
            {data.hormonal && (
              <p className="text-xs text-muted-foreground">{es ? 'Con anticonceptivo hormonal, el sangrado de la semana de descanso no es una regla natural.' : 'On hormonal contraception, the break-week bleed is not a natural period.'}</p>
            )}
          </div>
        </div>
      )}

      {!data.hormonal && history.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-bold text-foreground">{es ? 'Ovulación por ciclo' : 'Ovulation per cycle'}</h4>
            {finished > 0 && <span className="text-xs text-muted-foreground">{es ? `${confirmed} de ${finished} ciclos con ovulación confirmada` : `${confirmed} of ${finished} cycles with confirmed ovulation`}</span>}
          </div>
          <ul className="flex flex-col divide-y divide-border/60">
            {history.map((h) => (
              <li key={h.start} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-foreground">
                  {fmt(h.start, lang)}
                  <span className="text-muted-foreground"> · {h.length ? `${h.length} ${es ? 'días' : 'days'}` : es ? 'ciclo actual' : 'current cycle'}</span>
                </span>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${OV_STYLE[h.status].cls}`}>
                  {OV_STYLE[h.status][lang]}{h.ovulationDate ? ` · ${parseLocalDate(h.ovulationDate).toLocaleDateString(es ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short' })}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {es
              ? 'Se confirma con una subida sostenida de temperatura basal. Una LH positiva sola no confirma la ovulación con PMOS. Registra ambas en '
              : 'Confirmed by a sustained basal temperature rise. A positive LH alone does not confirm ovulation with PMOS. Log both in '}
            <Link href="/log?tab=body" className="font-bold text-primary hover:underline">{es ? 'Cuerpo y fertilidad' : 'Body & fertility'}</Link>.
          </p>
        </div>
      )}
    </Card>
  );
};

/* ---------------- 3. Periodic check-ups ---------------- */

const SCREEN_TEXT: Record<ScreeningKey, { es: string; en: string; whyEs: string; whyEn: string }> = {
  glucose: { es: 'Glucosa o HbA1c', en: 'Glucose or HbA1c',
    whyEs: 'Cada 1–3 años según tu riesgo (curva de tolerancia si buscas embarazo).', whyEn: 'Every 1–3 years depending on risk (glucose tolerance test if planning pregnancy).' },
  lipids: { es: 'Perfil de lípidos', en: 'Lipid profile',
    whyEs: 'Al diagnóstico y después según tu riesgo cardiovascular.', whyEn: 'At diagnosis and then according to cardiovascular risk.' },
  blood_pressure: { es: 'Presión arterial', en: 'Blood pressure',
    whyEs: 'Al menos una vez al año.', whyEn: 'At least once a year.' },
  vitamin_b12: { es: 'Vitamina B12', en: 'Vitamin B12',
    whyEs: 'Porque tomas metformina, que puede bajarla con el tiempo.', whyEn: 'Because you take metformin, which can lower it over time.' },
};

export const ScreeningCard: React.FC<{ lang: Lang; data: PMOSOverviewData; onOpenLabs: () => void }> = ({ lang, data, onOpenLabs }) => {
  const es = lang === 'es';
  const plan = screeningPlan({
    labs: data.labs,
    fastingGlucoseDates: data.fastingGlucose.map((g) => g.date),
    bloodPressureDates: data.bloodPressureDates,
    onMetformin: data.medications.some((m) => m.active && /metformin/i.test(m.name)),
  }, data.today);

  return (
    <Card icon="biotech" title={es ? 'Chequeos recomendados' : 'Recommended check-ups'}
      subtitle={es ? 'Según la guía internacional de PMOS (2023). Tu médico ajusta la frecuencia.' : 'Based on the 2023 international PMOS guideline. Your doctor sets the frequency.'}>
      <ul className="flex flex-col gap-2">
        {plan.map((p) => {
          const txt = SCREEN_TEXT[p.key];
          const badge = p.status === 'ok'
            ? { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', label: es ? `Al día · próximo ${fmt(p.due!, lang)}` : `Up to date · next ${fmt(p.due!, lang)}` }
            : p.status === 'due'
              ? { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', label: es ? `Toca revisar (último ${fmt(p.last!, lang)})` : `Due (last ${fmt(p.last!, lang)})` }
              : { cls: 'bg-secondary text-muted-foreground', label: es ? 'Sin registro' : 'Not logged' };
          return (
            <li key={p.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-bold text-foreground">{txt[lang]}</p>
                <p className="text-xs text-muted-foreground">{es ? txt.whyEs : txt.whyEn}</p>
              </div>
              <span className={`self-start sm:self-center shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${badge.cls}`}>{badge.label}</span>
            </li>
          );
        })}
      </ul>
      <button onClick={onOpenLabs} className="self-start text-sm font-bold text-primary hover:underline">
        {es ? 'Registrar un resultado →' : 'Log a result →'}
      </button>
    </Card>
  );
};
