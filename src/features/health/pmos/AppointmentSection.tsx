'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useAppointments } from '@/hooks/useAppointments';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { bringList, daysUntil, lastPastAppointment, nextAppointment, type Appointment } from '@/lib/pmos/appointments';
import { screeningPlan, type ScreeningKey } from '@/lib/pmos/screening';
import { parseLocalDate, toLocalISO } from '@/lib/medications/schedule';
type Lang = 'es' | 'en';
const SCREEN_LABEL: Record<ScreeningKey, { es: string; en: string }> = {
  glucose: { es: 'Control de glucosa (HbA1c o glucosa en ayunas)', en: 'Glucose check (HbA1c or fasting glucose)' },
  lipids: { es: 'Perfil de lípidos', en: 'Lipid profile' },
  blood_pressure: { es: 'Presión arterial', en: 'Blood pressure' },
  vitamin_b12: { es: 'Vitamina B12 (por la metformina)', en: 'Vitamin B12 (because of metformin)' },
};
const T = {
  es: {
    next: 'Próxima cita', none: 'No tienes una cita agendada.', schedule: 'Agendar cita', edit: 'Editar', del: 'Eliminar', save: 'Guardar', cancel: 'Cancelar',
    date: 'Fecha', time: 'Hora', specialty: 'Especialidad', doctor: 'Médica o médico', place: 'Lugar', notes: 'Notas para la cita',
    today: 'Hoy', tomorrow: 'Mañana', inDays: (n: number) => `En ${n} días`,
    bring: 'Qué llevar', bringNone: 'No tienes chequeos vencidos ni preguntas pendientes.', screenings: 'Chequeos pendientes o vencidos',
    questions: 'Preguntas pendientes', report: 'Generar PDF para mi médico', openLabs: 'Registrar análisis',
    after: 'Después de la cita', afterPh: '¿Qué te dijeron? Cambios de tratamiento, análisis que pidieron…', nextDate: 'Fecha de la siguiente cita (opcional)',
    saveAfter: 'Guardar notas', error: 'No se pudo guardar. Revisa los datos.',
  },
  en: {
    next: 'Next appointment', none: 'You have no appointment scheduled.', schedule: 'Schedule appointment', edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel',
    date: 'Date', time: 'Time', specialty: 'Specialty', doctor: 'Doctor', place: 'Place', notes: 'Notes for the visit',
    today: 'Today', tomorrow: 'Tomorrow', inDays: (n: number) => `In ${n} days`,
    bring: 'What to bring', bringNone: 'No overdue check-ups or pending questions.', screenings: 'Pending or overdue check-ups',
    questions: 'Pending questions', report: 'Generate PDF for my doctor', openLabs: 'Log lab results',
    after: 'After the visit', afterPh: 'What did they say? Treatment changes, tests they ordered…', nextDate: 'Date of the next appointment (optional)',
    saveAfter: 'Save notes', error: 'Could not save. Check the data.',
  },
};
const inputCls = 'bg-secondary text-foreground min-h-10 rounded-xl px-3 py-2 text-sm border border-border min-w-0';
const Block: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-3">
    <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance flex items-center gap-2"><Icon name={icon} size={20} className="text-primary" /> {title}</h2>
    {children}
  </section>
);
const AppointmentForm: React.FC<{ lang: Lang; initial?: Appointment; onSave: (f: Partial<Appointment> & { date: string }) => Promise<boolean>; onCancel: () => void }> = ({ lang, initial, onSave, onCancel }) => {
  const t = T[lang];
  const [f, setF] = useState({ date: initial?.date ?? '', time: initial?.time ?? '', specialty: initial?.specialty ?? '', doctor: initial?.doctor ?? '', place: initial?.place ?? '', notes: initial?.notes ?? '' });
  const [error, setError] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="flex flex-col gap-2" onSubmit={async (e) => {
      e.preventDefault();
      if (!f.date) return;
      const ok = await onSave({ ...f, time: f.time || null });
      setError(!ok);
      if (ok) onCancel();
    }}>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.date}<input type="date" required value={f.date} onChange={set('date')} className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.time}<input type="time" value={f.time} onChange={set('time')} className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.specialty}<input value={f.specialty} maxLength={100} onChange={set('specialty')} className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.doctor}<input value={f.doctor} maxLength={150} onChange={set('doctor')} className={inputCls} /></label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.place}<input value={f.place} maxLength={200} onChange={set('place')} className={inputCls} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.notes}<textarea value={f.notes} maxLength={2000} rows={2} onChange={set('notes')} className={inputCls} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="bg-primary text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.save}</button>
        <button type="button" onClick={onCancel} className="min-h-11 px-6 rounded-full font-semibold text-sm border border-border text-foreground">{t.cancel}</button>
      </div>
    </form>
  );
};
export const AppointmentSection: React.FC<{
  lang: Lang;
  data: PMOSOverviewData | null;
  questions: { question: string; done: boolean }[];
  onOpenLabs?: () => void;
}> = ({ lang, data, questions, onOpenLabs }) => {
  const t = T[lang];
  const { items, available, save, remove } = useAppointments();
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [followUp, setFollowUp] = useState('');
  if (!available) return null;
  const today = data?.today ?? toLocalISO(new Date());
  const next = nextAppointment(items, today);
  const last = lastPastAppointment(items, today);
  const showAfter = last && daysUntil(last.date, today) >= -30 && !(next && next.date < today);
  const fmt = (iso: string) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const plan = data ? screeningPlan({
    labs: data.labs, fastingGlucoseDates: data.fastingGlucose.map((g) => g.date), bloodPressureDates: data.bloodPressureDates,
    onMetformin: data.medications.some((m) => m.active && /metformin/i.test(m.name)),
  }, data.today) : [];
  const bring = bringList(plan, questions);
  const count = next ? daysUntil(next.date, today) : 0;
  return (
    <>
      <Block icon="event" title={t.next}>
        {editing === 'new' || (next && editing === next.id) ? (
          <AppointmentForm lang={lang} initial={editing === 'new' ? undefined : next ?? undefined}
            onSave={(f) => save(f, editing === 'new' ? undefined : (editing as string))} onCancel={() => setEditing(null)} />
        ) : next ? (
          <div className="rounded-xl border border-border p-4 flex flex-col gap-1">
            <p className="text-sm font-semibold text-primary">{count === 0 ? t.today : count === 1 ? t.tomorrow : t.inDays(count)}</p>
            <p className="text-foreground font-semibold capitalize">{fmt(next.date)}{next.time ? ` · ${next.time}` : ''}</p>
            <p className="text-sm text-muted-foreground">{[next.specialty, next.doctor, next.place].filter(Boolean).join(' · ')}</p>
            {next.notes && <p className="text-sm text-foreground">{next.notes}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(next.id)} className="inline-flex items-center min-h-10 text-sm font-semibold text-primary">{t.edit}</button>
              <button onClick={() => remove(next.id)} className="inline-flex items-center min-h-10 text-sm font-semibold text-destructive">{t.del}</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t.none}</p>
            <button onClick={() => setEditing('new')} className="self-start bg-primary text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.schedule}</button>
          </>
        )}
      </Block>
      <Block icon="checklist" title={t.bring}>
        {bring.screenings.length === 0 && bring.questions.length === 0 && <p className="text-sm text-muted-foreground">{t.bringNone}</p>}
        {bring.screenings.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-muted-foreground">{t.screenings}</p>
            <ul className="list-disc pl-5 text-sm text-foreground">{bring.screenings.map((k) => <li key={k}>{SCREEN_LABEL[k][lang]}</li>)}</ul>
            {onOpenLabs && <button onClick={onOpenLabs} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-primary">{t.openLabs}</button>}
          </div>
        )}
        {bring.questions.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-muted-foreground">{t.questions} ({bring.questions.length})</p>
            <ul className="list-disc pl-5 text-sm text-foreground">{bring.questions.slice(0, 5).map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        )}
        <Link href="/export" className="self-start flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Icon name="download" size={16} /> {t.report}</Link>
      </Block>
      {showAfter && last && (
        <Block icon="edit_note" title={`${t.after} · ${fmt(last.date)}`}>
          <textarea value={summary[last.id] ?? last.summary ?? ''} onChange={(e) => setSummary({ ...summary, [last.id]: e.target.value })}
            placeholder={t.afterPh} maxLength={2000} rows={3} aria-label={t.after} className={inputCls} />
          <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">{t.nextDate}
            <input type="date" min={today} value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={`${inputCls} max-w-48`} />
          </label>
          <button onClick={async () => {
            await save({ ...last, summary: summary[last.id] ?? last.summary }, last.id);
            if (followUp) { await save({ date: followUp, specialty: last.specialty, doctor: last.doctor, place: last.place }); setFollowUp(''); }
          }} className="self-start bg-primary text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm">{t.saveAfter}</button>
        </Block>
      )}
    </>
  );
};
export default AppointmentSection;
