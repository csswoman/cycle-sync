'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { useAppointments } from '@/hooks/useAppointments';
import { nextAppointment } from '@/lib/pmos/appointments';
import { toLocalISO } from '@/lib/medications/schedule';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { insightsFromOverview } from '@/lib/pmos/overviewInsights';
import { suggestQuestions } from '@/lib/pmos/suggestedQuestions';
import AppointmentSection from './AppointmentSection';

type Lang = 'es' | 'en';
export interface DoctorQuestion { id: string; question: string; answer: string | null; done: boolean; created_at: string }

const SUGGESTIONS = {
  es: [
    '¿Mis análisis muestran resistencia a la insulina?',
    '¿Cada cuánto debo revisar glucosa, lípidos y presión?',
    '¿Necesito algo para proteger el endometrio si paso meses sin regla?',
    '¿Debería revisar mi vitamina B12 por la metformina?',
    '¿Qué opciones tengo para el acné o el vello además de lo que tomo?',
  ],
  en: [
    'Do my labs show insulin resistance?',
    'How often should I check glucose, lipids and blood pressure?',
    'Do I need anything to protect my uterine lining if I go months without a period?',
    'Should I check my vitamin B12 because of metformin?',
    'What options do I have for acne or hair growth besides what I take?',
  ],
};

const T = {
  es: {
    title: 'Preparar mi próxima cita', sub: 'Anota tus dudas cuando surjan durante el mes. Se incluyen en tu reporte PDF.',
    ph: 'Escribe una pregunta…', add: 'Agregar', ideas: 'Ideas', fromData: 'Según tus datos', pending: 'Pendientes', done: 'Ya respondidas',
    answerPh: '¿Qué te respondió?', markDone: 'Respondida', reopen: 'Reabrir', del: 'Eliminar', none: 'Aún no tienes preguntas.',
    report: 'Generar reporte para mi médico', error: 'No se pudo guardar. Falta aplicar la migración de la base de datos.',
  },
  en: {
    title: 'Prepare my next appointment', sub: 'Write down questions as they come up during the month. They are included in your PDF report.',
    ph: 'Write a question…', add: 'Add', ideas: 'Ideas', fromData: 'Based on your data', pending: 'Pending', done: 'Answered',
    answerPh: 'What did they say?', markDone: 'Answered', reopen: 'Reopen', del: 'Delete', none: 'No questions yet.',
    report: 'Generate report for my doctor', error: 'Could not save. The database migration has not been applied yet.',
  },
};

export const DoctorQuestions: React.FC<{ lang: Lang; data?: PMOSOverviewData | null; onOpenLabs?: () => void }> = ({ lang, data = null, onOpenLabs }) => {
  const t = T[lang];
  const { items: appointments } = useAppointments();
  const upcoming = nextAppointment(appointments, data?.today ?? toLocalISO(new Date()));
  const [items, setItems] = useState<DoctorQuestion[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error: err } = await supabase.from('doctor_questions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });
    if (!err) setItems((data as DoctorQuestion[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (q: string) => {
    const question = q.trim();
    if (!question) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const row: Record<string, unknown> = { user_id: session.user.id, question: question.slice(0, 500) };
    let { error: err } = await supabase.from('doctor_questions').insert(upcoming ? { ...row, appointment_id: upcoming.id } : row);
    // The appointment_id column arrives with the phase 7 migration; fall back to the old shape.
    if (err && upcoming) ({ error: err } = await supabase.from('doctor_questions').insert(row));
    setError(!!err);
    if (!err) { setText(''); await load(); }
  };

  const update = async (id: string, patch: Partial<DoctorQuestion>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await supabase.from('doctor_questions').update(patch).eq('id', id);
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('doctor_questions').delete().eq('id', id);
  };

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const { hideNumbers } = useDisplayPrefs();
  const fromData = (data ? suggestQuestions(data, insightsFromOverview(data, hideNumbers)) : [])
    .map((q) => q[lang]).filter((s) => !items.some((i) => i.question === s));
  const unused = SUGGESTIONS[lang].filter((s) => !items.some((i) => i.question === s));

  return (
    <div className="flex flex-col gap-6">
    <AppointmentSection lang={lang} data={data} questions={items} onOpenLabs={onOpenLabs} />
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon name="stethoscope" size={20} />
        </div>
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">{t.title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t.sub}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add(text); }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t.ph} aria-label={t.ph}
          className="flex-1 min-w-0 bg-secondary text-foreground rounded-full px-4 min-h-11 text-sm border border-border" />
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.add}</button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}

      {fromData.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{t.fromData}</p>
          <div className="flex flex-col gap-2">
            {fromData.map((s) => (
              <button key={s} onClick={() => add(s)} className="text-left flex items-center gap-2 min-h-10 px-3 py-2 rounded-xl text-sm font-semibold bg-primary/5 text-foreground border border-primary/30 hover:border-primary/60">
                <Icon name="add" size={16} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {unused.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{t.ideas}</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((s) => (
              <button key={s} onClick={() => add(s)} className="text-left inline-flex items-center min-h-10 px-4 rounded-full text-sm font-semibold bg-secondary text-foreground border border-border hover:border-primary/50">
                <Icon name="add" size={16} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{t.pending} ({pending.length})</p>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
        {pending.map((q) => (
          <div key={q.id} className="rounded-xl border border-border p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground font-semibold">{q.question}</p>
              <button onClick={() => remove(q.id)} aria-label={t.del} className="size-10 -mt-1.5 -mr-1.5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary shrink-0"><Icon name="close" size={16} /></button>
            </div>
            <div className="flex gap-2">
              <input value={answers[q.id] ?? q.answer ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={t.answerPh}
                className="flex-1 min-w-0 bg-secondary/50 text-foreground min-h-10 rounded-xl px-3 py-1.5 text-sm border border-border" />
              <button onClick={() => update(q.id, { done: true, answer: (answers[q.id] ?? q.answer ?? '').trim() || null })}
                className="inline-flex items-center min-h-10 text-sm font-semibold px-4 rounded-full border border-leaf/50 text-leaf shrink-0"><Icon name="check" size={16} /> {t.markDone}</button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">{t.done} ({done.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {done.map((q) => (
              <li key={q.id} className="text-sm flex items-start justify-between gap-2">
                <span><span className="text-muted-foreground line-through">{q.question}</span>{q.answer && <span className="block text-foreground text-sm mt-0.5">{q.answer}</span>}</span>
                <button onClick={() => update(q.id, { done: false })} className="inline-flex items-center min-h-10 text-sm font-semibold text-primary shrink-0">{t.reopen}</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Link href="/export" className="self-start inline-flex items-center gap-2 min-h-10 text-sm font-semibold text-primary hover:underline">
        <Icon name="download" size={16} /> {t.report}
      </Link>
    </section>
    </div>
  );
};

export default DoctorQuestions;
