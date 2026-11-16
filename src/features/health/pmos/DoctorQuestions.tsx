'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';

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
    ph: 'Escribe una pregunta…', add: 'Agregar', ideas: 'Ideas', pending: 'Pendientes', done: 'Ya respondidas',
    answerPh: '¿Qué te respondió?', markDone: 'Respondida', reopen: 'Reabrir', del: 'Eliminar', none: 'Aún no tienes preguntas.',
    report: 'Generar reporte para mi médico', error: 'No se pudo guardar. Falta aplicar la migración de la base de datos.',
  },
  en: {
    title: 'Prepare my next appointment', sub: 'Write down questions as they come up during the month. They are included in your PDF report.',
    ph: 'Write a question…', add: 'Add', ideas: 'Ideas', pending: 'Pending', done: 'Answered',
    answerPh: 'What did they say?', markDone: 'Answered', reopen: 'Reopen', del: 'Delete', none: 'No questions yet.',
    report: 'Generate report for my doctor', error: 'Could not save. The database migration has not been applied yet.',
  },
};

export const DoctorQuestions: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
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
    const { error: err } = await supabase.from('doctor_questions').insert({ user_id: session.user.id, question: question.slice(0, 500) });
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
  const unused = SUGGESTIONS[lang].filter((s) => !items.some((i) => i.question === s));

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon name="stethoscope" size={20} />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-bold">{t.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.sub}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add(text); }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t.ph} aria-label={t.ph}
          className="flex-1 min-w-0 bg-secondary text-foreground rounded-full px-4 py-2.5 text-sm border border-border" />
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm">{t.add}</button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}

      {unused.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.ideas}</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((s) => (
              <button key={s} onClick={() => add(s)} className="text-left px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary/50">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.pending} ({pending.length})</p>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
        {pending.map((q) => (
          <div key={q.id} className="rounded-xl border border-border p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground font-semibold">{q.question}</p>
              <button onClick={() => remove(q.id)} aria-label={t.del} className="p-1 text-muted-foreground hover:text-destructive shrink-0"><Icon name="close" size={16} /></button>
            </div>
            <div className="flex gap-2">
              <input value={answers[q.id] ?? q.answer ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={t.answerPh}
                className="flex-1 min-w-0 bg-secondary/50 text-foreground rounded-lg px-3 py-1.5 text-xs border border-border" />
              <button onClick={() => update(q.id, { done: true, answer: (answers[q.id] ?? q.answer ?? '').trim() || null })}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/50 text-emerald-700 dark:text-emerald-400 shrink-0">✓ {t.markDone}</button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.done} ({done.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {done.map((q) => (
              <li key={q.id} className="text-sm flex items-start justify-between gap-2">
                <span><span className="text-muted-foreground line-through">{q.question}</span>{q.answer && <span className="block text-foreground text-xs mt-0.5">→ {q.answer}</span>}</span>
                <button onClick={() => update(q.id, { done: false })} className="text-xs font-bold text-primary shrink-0">{t.reopen}</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Link href="/export" className="self-start flex items-center gap-2 text-sm font-bold text-primary hover:underline">
        <Icon name="download" size={16} /> {t.report}
      </Link>
    </section>
  );
};

export default DoctorQuestions;
