'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import { toLocalISO, parseLocalDate } from '@/lib/medications/schedule';
import { isCheckDue, isScoffDue, scoreScoff, scoreWellbeing, SCOFF_CUTOFF, SCOFF_QUESTIONS, type ScoffAnswers, type ScoffKey, type WellbeingAnswers } from '@/lib/pmos/wellbeing';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';

type Lang = 'es' | 'en';
interface Row extends WellbeingAnswers { id: string; date: string; scoff?: number | null }
const SCOFF_SKIP_KEY = 'cycle_sync_scoff_skipped';

const T = {
  es: {
    title: 'Ánimo, ansiedad y sueño', sub: 'Un chequeo corto una vez al mes. Con PMOS la depresión, la ansiedad y la apnea del sueño son más frecuentes, y detectarlas a tiempo ayuda.',
    lead: 'En las últimas 2 semanas, ¿con qué frecuencia te ha pasado…?',
    q: {
      phq_interest: 'Poco interés o placer en hacer cosas',
      phq_mood: 'Sentirte decaída, deprimida o sin esperanza',
      gad_nervous: 'Sentirte nerviosa, ansiosa o con los nervios de punta',
      gad_worry: 'No poder dejar de preocuparte o controlar la preocupación',
    } as Record<string, string>,
    opts: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
    sleepLead: 'Sobre tu sueño',
    snoring: 'Ronco fuerte (me lo han dicho o me despierto por ello)', daytime_tiredness: 'Me siento cansada o con sueño durante el día aunque duerma', observed_apnea: 'Alguien me ha visto dejar de respirar mientras duermo',
    save: 'Guardar chequeo', saving: 'Guardando…', due: 'Te toca el chequeo de este mes', notDue: (d: string) => `Último chequeo: ${d}. El siguiente en unas semanas.`,
    again: 'Hacerlo de nuevo', history: 'Historial',
    okMood: 'Tus respuestas no muestran señales de alerta este mes. Sigue cuidándote.',
    moodFlag: 'Tus respuestas sobre el ánimo sugieren que vale la pena hablarlo con un profesional. No es un diagnóstico, pero mereces apoyo.',
    anxFlag: 'Tus respuestas sobre ansiedad sugieren que vale la pena hablarlo con un profesional. La terapia y otros tratamientos funcionan.',
    sleepFlag: 'Tienes varias señales de apnea del sueño. Coméntalo con tu médico: puede pedir un estudio del sueño. Tratarla mejora la energía y la glucosa.',
    crisis: 'Si tienes pensamientos de hacerte daño, busca ayuda ahora: en México, Línea de la Vida 800 911 2000 (24 h, gratis) o el 911.',
    error: 'No se pudo guardar. Si es la primera vez, falta aplicar la migración de la base de datos.',
    score: (p: number, g: number) => `Ánimo ${p}/6 · Ansiedad ${g}/6`,
    scoffTitle: 'Sobre tu relación con la comida', scoffIntro: 'Cinco preguntas opcionales que se repiten cada 3 meses. Con PMOS, la alimentación desordenada es más frecuente y conviene mirarla con calma.',
    scoffAnswer: 'Responder', scoffSkip: 'Saltar por ahora',
    scoffQ: {
      sick: '¿Te provocas el vómito porque te sientes mal por haber comido de más?',
      control: '¿Sientes que has perdido el control sobre cuánto comes?',
      weight: '¿Has perdido más de 6 kg en 3 meses?',
      fat: '¿Te ves gorda aunque otras personas digan que estás delgada?',
      food: '¿Dirías que la comida domina tu vida?',
    } as Record<ScoffKey, string>,
    scoffFlag: 'Algunas respuestas sugieren que puede ayudarte hablar de tu alimentación con una profesional. No es un diagnóstico y no hay prisa. Si quieres, puedes ocultar calorías, peso y medidas en la app.',
    scoffHide: 'Activar modo sin números', scoffHidden: 'Modo sin números activado.',
  },
  en: {
    title: 'Mood, anxiety and sleep', sub: 'A short monthly check. Depression, anxiety and sleep apnea are more common with PMOS, and catching them early helps.',
    lead: 'Over the last 2 weeks, how often have you been bothered by…',
    q: {
      phq_interest: 'Little interest or pleasure in doing things',
      phq_mood: 'Feeling down, depressed or hopeless',
      gad_nervous: 'Feeling nervous, anxious or on edge',
      gad_worry: 'Not being able to stop or control worrying',
    } as Record<string, string>,
    opts: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    sleepLead: 'About your sleep',
    snoring: 'I snore loudly (I have been told or it wakes me)', daytime_tiredness: 'I feel tired or sleepy during the day even after sleeping', observed_apnea: 'Someone has seen me stop breathing while asleep',
    save: 'Save check-in', saving: 'Saving…', due: "This month's check-in is due", notDue: (d: string) => `Last check-in: ${d}. The next one in a few weeks.`,
    again: 'Do it again', history: 'History',
    okMood: 'Your answers show no warning signs this month. Keep looking after yourself.',
    moodFlag: 'Your mood answers suggest it is worth talking to a professional. It is not a diagnosis, but you deserve support.',
    anxFlag: 'Your anxiety answers suggest it is worth talking to a professional. Therapy and other treatments work.',
    sleepFlag: 'You have several signs of sleep apnea. Tell your doctor: they can order a sleep study. Treating it improves energy and glucose.',
    crisis: 'If you have thoughts of harming yourself, get help now: call your local emergency number or a crisis line.',
    error: 'Could not save. If this is the first time, the database migration has not been applied yet.',
    score: (p: number, g: number) => `Mood ${p}/6 · Anxiety ${g}/6`,
    scoffTitle: 'About your relationship with food', scoffIntro: 'Five optional questions, repeated every 3 months. Disordered eating is more common with PMOS and is worth looking at calmly.',
    scoffAnswer: 'Answer', scoffSkip: 'Skip for now',
    scoffQ: {
      sick: 'Do you make yourself sick because you feel uncomfortably full?',
      control: 'Do you worry you have lost control over how much you eat?',
      weight: 'Have you recently lost more than 6 kg (14 lb) in a 3-month period?',
      fat: 'Do you believe yourself to be fat when others say you are too thin?',
      food: 'Would you say that food dominates your life?',
    } as Record<ScoffKey, string>,
    scoffFlag: 'Some answers suggest it may help to talk about your eating with a professional. This is not a diagnosis and there is no rush. If you like, you can hide calories, weight and measurements in the app.',
    scoffHide: 'Turn on no-numbers mode', scoffHidden: 'No-numbers mode is on.',
  },
};

const EMPTY: WellbeingAnswers = { phq_interest: 0, phq_mood: 0, gad_nervous: 0, gad_worry: 0, snoring: false, daytime_tiredness: false, observed_apnea: false };
const Q_KEYS = ['phq_interest', 'phq_mood', 'gad_nervous', 'gad_worry'] as const;
const SLEEP_KEYS = ['snoring', 'daytime_tiredness', 'observed_apnea'] as const;

export const WellbeingCheck: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const today = toLocalISO(new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [answers, setAnswers] = useState<WellbeingAnswers>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const { hideNumbers, update: updateDisplayPrefs } = useDisplayPrefs();
  const [scoffMode, setScoffMode] = useState<'ask' | 'answering' | 'skipped'>('ask');
  const [scoffAnswers, setScoffAnswers] = useState<Partial<ScoffAnswers>>({});
  const [skippedOn, setSkippedOn] = useState<string | null>(null);
  useEffect(() => { try { setSkippedOn(localStorage.getItem(SCOFF_SKIP_KEY)); } catch { /* storage blocked */ } }, []);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error: err } = await supabase.from('wellbeing_checks').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(12);
    if (!err) setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const last = rows[0] ?? null;
  const due = isCheckDue(last?.date ?? null, today);
  const showForm = editing || due;
  const result = last ? scoreWellbeing(last) : null;
  const lastScoffRow = rows.find((x) => x.scoff != null) ?? null;
  const lastScoffSeen = [lastScoffRow?.date ?? null, skippedOn].filter((d): d is string => !!d).sort().at(-1) ?? null;
  const scoffDue = isScoffDue(lastScoffSeen, today);
  const scoffPositive = lastScoffRow != null && (lastScoffRow.scoff as number) >= SCOFF_CUTOFF;
  const skipScoff = () => {
    try { localStorage.setItem(SCOFF_SKIP_KEY, today); } catch { /* storage blocked */ }
    setSkippedOn(today); setScoffMode('skipped');
  };
  const fmt = (iso: string) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const save = async () => {
    setSaving(true); setError(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const { error: err } = await supabase.from('wellbeing_checks').insert({
      ...answers, user_id: session.user.id, date: today,
      ...(scoffMode === 'answering' ? { scoff: scoreScoff(scoffAnswers).score } : {}),
    });
    setSaving(false);
    if (err) { setError(true); return; }
    setEditing(false); setAnswers(EMPTY); setScoffAnswers({}); setScoffMode('ask');
    await load();
  };

  return (
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon name="favorite" size={20} />
        </div>
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">{t.title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t.sub}</p>
        </div>
      </div>

      {result && last && !showForm && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{t.notDue(fmt(last.date))}</p>
          {!result.moodFlag && !result.anxietyFlag && !result.sleepFlag && !scoffPositive && (
            <p className="text-sm text-foreground bg-leaf/10 border border-leaf/30 rounded-xl p-3">{t.okMood}</p>
          )}
          {result.moodFlag && <p className="text-sm text-foreground bg-sun/10 border border-sun/40 rounded-xl p-3">{t.moodFlag}</p>}
          {result.anxietyFlag && <p className="text-sm text-foreground bg-sun/10 border border-sun/40 rounded-xl p-3">{t.anxFlag}</p>}
          {result.sleepFlag && <p className="text-sm text-foreground bg-sage/10 border border-sage/30 rounded-xl p-3">{t.sleepFlag}</p>}
          {scoffPositive && (
            <div className="text-sm text-foreground bg-sage/10 border border-sage/30 rounded-xl p-3 flex flex-col gap-2">
              <p>{t.scoffFlag}</p>
              {hideNumbers
                ? <p className="text-sm text-muted-foreground">{t.scoffHidden}</p>
                : <button onClick={() => void updateDisplayPrefs({ hideNumbers: true })} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-primary hover:underline">{t.scoffHide}</button>}
            </div>
          )}
          <button onClick={() => setEditing(true)} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-primary hover:underline">{t.again}</button>
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-4">
          {due && <p className="text-sm font-semibold text-primary">{t.due}</p>}
          <p className="text-sm font-semibold text-foreground">{t.lead}</p>
          {Q_KEYS.map((k) => (
            <fieldset key={k} className="flex flex-col gap-2">
              <legend className="text-sm text-foreground mb-1.5">{t.q[k]}</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {t.opts.map((label, v) => (
                  <button key={v} type="button" aria-pressed={answers[k] === v} onClick={() => setAnswers({ ...answers, [k]: v })}
                    className={`min-h-10 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${answers[k] === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-foreground border-transparent hover:bg-secondary'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <p className="text-sm font-semibold text-foreground pt-1">{t.sleepLead}</p>
          {SLEEP_KEYS.map((k) => (
            <label key={k} className="flex items-center gap-3 min-h-10 text-sm text-foreground cursor-pointer">
              <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={answers[k]} onChange={(e) => setAnswers({ ...answers, [k]: e.target.checked })} />
              {t[k]}
            </label>
          ))}
          {scoffDue && scoffMode !== 'skipped' && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground">{t.scoffTitle}</p>
              {scoffMode === 'ask' ? (
                <>
                  <p className="text-sm text-muted-foreground">{t.scoffIntro}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setScoffMode('answering')} className="inline-flex items-center min-h-10 px-4 rounded-full text-sm font-semibold bg-secondary text-foreground hover:bg-secondary/70">{t.scoffAnswer}</button>
                    <button type="button" onClick={skipScoff} className="inline-flex items-center min-h-10 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground">{t.scoffSkip}</button>
                  </div>
                </>
              ) : (
                <>
                  {SCOFF_QUESTIONS.map((k) => (
                    <label key={k} className="flex items-center gap-3 min-h-10 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={scoffAnswers[k] === true} onChange={(e) => setScoffAnswers({ ...scoffAnswers, [k]: e.target.checked })} />
                      {t.scoffQ[k]}
                    </label>
                  ))}
                  <button type="button" onClick={skipScoff} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-muted-foreground hover:text-foreground">{t.scoffSkip}</button>
                </>
              )}
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
          <button onClick={save} disabled={saving} className="self-start bg-primary hover:bg-primary/90 text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm disabled:opacity-60">
            {saving ? t.saving : t.save}
          </button>
        </div>
      )}

      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" /> {t.crisis}
      </p>

      {rows.length > 1 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">{t.history}</summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {rows.map((r) => { const s = scoreWellbeing(r); return <li key={r.id}><strong className="text-foreground">{fmt(r.date)}</strong> · {t.score(s.phq2, s.gad2)}</li>; })}
          </ul>
        </details>
      )}
    </section>
  );
};

export default WellbeingCheck;
