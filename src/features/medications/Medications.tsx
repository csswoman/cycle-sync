'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { TitleSprig } from '@/components/ui/Botanical';
import { useMedications, type Medication } from '@/hooks/useMedications';
import { requestMedicationNotifications } from '@/hooks/useMedicationReminders';
import { useLanguage } from '@/i18n/LanguageContext';
import { daysOfStockLeft, doseStatus, instructionLabel, packPosition, parseLocalDate, type DoseStatus } from '@/lib/medications/schedule';
import MedicationForm from './components/MedicationForm';
import MedicationCalendar from './components/MedicationCalendar';
import MedicationCareTips from './components/MedicationCareTips';
import SideEffectsLog from './components/SideEffectsLog';

export interface MedicationSummary { taken: number; total: number }

interface MedicationsProps {
  /** Render without the page wrapper and title (used inside the daily log). */
  embedded?: boolean;
  onSummary?: (summary: MedicationSummary) => void;
}

type Lang = 'es' | 'en';

const T = {
  es: {
    pageTitle: 'Medicación', pageSub: 'Tus tomas del día, recordatorios e historial.',
    today: 'Hoy', progress: (a: number, b: number) => `${a} de ${b} tomas`, allDone: '¡Listo! Tomaste todo lo de hoy.',
    noneToday: 'Hoy no tienes tomas programadas.', empty: 'Aún no registras medicamentos o suplementos.',
    emptySub: 'Agrégalos con la hora y la indicación de tu médico (por ejemplo, “después del almuerzo”) y te recordamos cada toma.',
    add: 'Agregar medicamento', mine: 'Mis medicamentos', edit: 'Editar', remove: 'Eliminar',
    confirmRemove: '¿Eliminar este medicamento? Tu historial se conserva.', yes: 'Sí, eliminar', no: 'Cancelar',
    everyDay: 'Todos los días', since: (d: string) => `Desde ${d}`, doctor: 'Indicación médica',
    take: 'Tomar', taken: 'Tomada', undo: 'Deshacer', takenAt: (h: string) => `Tomada a las ${h}`,
    status: { upcoming: 'Más tarde', due: 'Es hora', late: 'Atrasada', missed: 'No tomada', taken: 'Tomada' } as Record<DoseStatus, string>,
    notifBlocked: 'Las notificaciones están bloqueadas en tu navegador, así que no verás recordatorios.',
    notifEnable: 'Activar notificaciones', notifOff: 'Recordatorio desactivado',
    disclaimer: 'Esto es un recordatorio, no una indicación médica. No cambies la dosis ni el horario sin hablar con tu médico. Si se te olvida una toma, sigue lo que te indicó; no tomes doble dosis por tu cuenta.',
    loading: 'Cargando…',
    packDay: (d: number, n: number) => `Paquete: día ${d} de ${n}`,
    packBreak: (n: number) => `Descanso · nuevo paquete en ${n} ${n === 1 ? 'día' : 'días'}`,
    stockLeft: (u: number, d: number | null) => `Quedan ${u}${d != null ? ` · para ${d} ${d === 1 ? 'día' : 'días'}` : ''}`,
  },
  en: {
    pageTitle: 'Medication', pageSub: "Today's doses, reminders and history.",
    today: 'Today', progress: (a: number, b: number) => `${a} of ${b} doses`, allDone: "Done! You've taken everything for today.",
    noneToday: 'No doses scheduled for today.', empty: "You haven't added any medications or supplements yet.",
    emptySub: 'Add them with the time and your doctor’s instructions (e.g. “after lunch”) and we will remind you of each dose.',
    add: 'Add medication', mine: 'My medications', edit: 'Edit', remove: 'Remove',
    confirmRemove: 'Remove this medication? Your history is kept.', yes: 'Yes, remove', no: 'Cancel',
    everyDay: 'Every day', since: (d: string) => `Since ${d}`, doctor: "Doctor's instructions",
    take: 'Take', taken: 'Taken', undo: 'Undo', takenAt: (h: string) => `Taken at ${h}`,
    status: { upcoming: 'Later', due: "It's time", late: 'Late', missed: 'Missed', taken: 'Taken' } as Record<DoseStatus, string>,
    notifBlocked: 'Notifications are blocked in your browser settings, so reminders will not appear.',
    notifEnable: 'Enable notifications', notifOff: 'Reminder off',
    disclaimer: "This is a reminder, not medical advice. Don't change your dose or schedule without talking to your doctor. If you miss a dose, follow their instructions; don't double up on your own.",
    loading: 'Loading…',
    packDay: (d: number, n: number) => `Pack: day ${d} of ${n}`,
    packBreak: (n: number) => `Break · next pack in ${n} ${n === 1 ? 'day' : 'days'}`,
    stockLeft: (u: number, d: number | null) => `${u} left${d != null ? ` · ${d} ${d === 1 ? 'day' : 'days'}` : ''}`,
  },
};

const STATUS_STYLE: Record<DoseStatus, string> = {
  taken: 'bg-leaf/10 text-leaf',
  due: 'bg-primary/10 text-primary',
  late: 'bg-sun/15 text-sun-ink',
  missed: 'bg-destructive/10 text-destructive',
  upcoming: 'bg-secondary text-muted-foreground',
};

const DAY_NAMES: Record<Lang, string[]> = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

function daysLabel(days: number[] | null | undefined, lang: Lang, everyDay: string) {
  if (!days || days.length === 0 || days.length === 7) return everyDay;
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAY_NAMES[lang][d]).join(', ');
}

const locale = (lang: Lang) => (lang === 'es' ? 'es-MX' : 'en-US');

const Medications: React.FC<MedicationsProps> = ({ embedded = false, onSummary }) => {
  const { language } = useLanguage();
  const lang: Lang = language === 'es' ? 'es' : 'en';
  const t = T[lang];
  const {
    medications, logs, todayDoses, loading, today, view, showMonth, saveMedication, removeMedication, refill, isTaken, takenAt, setTaken,
  } = useMedications();
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [perm, setPerm] = useState<string>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  // Re-evaluate "due"/"late" labels every minute.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const takenCount = todayDoses.filter((d) => isTaken(d.med.id, d.time)).length;
  useEffect(() => {
    onSummary?.({ taken: takenCount, total: todayDoses.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takenCount, todayDoses.length]);

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
  const todayLabel = parseLocalDate(today).toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long' });

  const handleSave = async (input: Parameters<typeof saveMedication>[0]) => {
    if (input.reminders) setPerm(await requestMedicationNotifications());
    await saveMedication(input, editing && editing !== 'new' ? editing.id : undefined);
    setEditing(null);
  };

  const pct = todayDoses.length ? Math.round((takenCount / todayDoses.length) * 100) : 0;

  const content = (
    <>
      {!embedded && (
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-balance"><TitleSprig bud="var(--peach)" />{t.pageTitle}</h1>
          <p className="text-muted-foreground text-base">{t.pageSub}</p>
        </div>
      )}

      {perm === 'denied' && medications.some((m) => m.reminders) && (
        <p className="flex items-start gap-2 text-sm text-sun-ink bg-sun/10 rounded-2xl px-4 py-3">
          <Icon name="warning" size={18} className="mt-0.5" /> {t.notifBlocked}
        </p>
      )}
      {perm === 'default' && medications.some((m) => m.reminders) && (
        <button onClick={async () => setPerm(await requestMedicationNotifications())}
          className="self-start flex items-center gap-2 min-h-10 text-sm font-semibold text-primary bg-primary/10 rounded-full px-5">
          <Icon name="mark_email_unread" size={16} /> {t.notifEnable}
        </button>
      )}

      {loading && <p className="text-muted-foreground text-sm">{t.loading}</p>}

      {!loading && medications.length > 0 && (
        <MedicationCareTips lang={lang} medications={medications} today={today} onRefill={refill}
          takenToday={(id) => todayDoses.filter((d) => d.med.id === id && isTaken(id, d.time)).length} />
      )}

      {!loading && medications.length > 0 && <SideEffectsLog lang={lang} medications={medications} />}

      {!loading && medications.length === 0 && editing === null && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-6 sm:p-8 flex flex-col items-center text-center gap-3">
          <div className="size-14 rounded-full bg-blossom-soft text-primary flex items-center justify-center">
            <Icon name="medication" size={28} />
          </div>
          <p className="text-foreground font-bold">{t.empty}</p>
          <p className="text-sm text-muted-foreground max-w-md">{t.emptySub}</p>
          <button onClick={() => setEditing('new')}
            className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2">
            <Icon name="add" size={18} /> {t.add}
          </button>
        </div>
      )}

      {editing !== null && (
        <MedicationForm key={editing === 'new' ? 'new' : editing.id} lang={lang} initial={editing === 'new' ? null : editing}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}

      {!loading && medications.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Today */}
            <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-4" aria-labelledby="med-today-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 id="med-today-title" className="text-foreground font-semibold text-xl">{t.today}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{todayLabel}</p>
                </div>
                {todayDoses.length > 0 && (
                  <p className="text-sm font-semibold text-foreground tabular-nums">{t.progress(takenCount, todayDoses.length)}</p>
                )}
              </div>
              {todayDoses.length > 0 && (
                <div className="h-2 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-bloom rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
              {todayDoses.length === 0 && <p className="text-sm text-muted-foreground">{t.noneToday}</p>}
              {todayDoses.length > 0 && takenCount === todayDoses.length && (
                <p className="flex items-center gap-2 text-sm font-semibold text-leaf">
                  <Icon name="check_circle" size={18} weight="fill" /> {t.allDone}
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {todayDoses.map(({ med, time }) => {
                  const taken = isTaken(med.id, time);
                  const status = doseStatus(taken, today, time, now);
                  const at = takenAt(med.id, time);
                  const instruction = instructionLabel(med.time_instructions?.[time], lang);
                  return (
                    <li key={`${med.id}-${time}`}
                      className={`rounded-2xl border p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-3 sm:gap-4 transition-colors ${taken ? 'border-leaf/30 bg-leaf/5' : status === 'due' || status === 'late' ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                      <div className="w-14 shrink-0 text-center">
                        <p className={`text-xl font-semibold tabular-nums ${taken ? 'text-muted-foreground line-through decoration-1' : 'text-foreground'}`}>{time}</p>
                      </div>
                      <div className="flex-1 min-w-[10rem] flex flex-col gap-1.5">
                        <p className="font-semibold text-foreground leading-tight">
                          {med.name}{med.dose && <span className="font-normal text-muted-foreground"> · {med.dose}</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {instruction && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-secondary rounded-full px-2.5 py-1">
                              <Icon name="restaurant" size={12} /> {instruction}
                            </span>
                          )}
                          <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLE[status]}`}>
                            {taken && at ? t.takenAt(fmtTime(at)) : t.status[status]}
                          </span>
                        </div>
                        {med.notes && <p className="text-sm text-muted-foreground line-clamp-2">{med.notes}</p>}
                      </div>
                      <button onClick={() => setTaken(med.id, time, !taken)} aria-pressed={taken}
                        aria-label={`${taken ? t.undo : t.take} ${med.name} ${time}`}
                        className={`shrink-0 w-full sm:w-auto sm:min-w-[6.5rem] min-h-11 flex items-center justify-center gap-1.5 px-4 rounded-full text-sm font-semibold border transition-colors ${taken ? 'bg-leaf text-card border-leaf' : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'}`}>
                        <Icon name={taken ? 'check' : 'medication'} size={16} weight="bold" />
                        {taken ? t.taken : t.take}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* My medications */}
            <section className="flex flex-col gap-3" aria-labelledby="med-list-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="med-list-title" className="text-foreground font-semibold text-xl">{t.mine}</h2>
                {editing === null && (
                  <button onClick={() => setEditing('new')} className="flex items-center gap-1 min-h-10 text-sm font-semibold text-primary px-4 rounded-full hover:bg-primary/10">
                    <Icon name="add" size={16} /> {t.add}
                  </button>
                )}
              </div>
              {medications.map((med) => (
                <article key={med.id} className="bg-card rounded-3xl border border-border p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-foreground text-lg font-semibold">{med.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {[med.dose, daysLabel(med.days_of_week, lang, t.everyDay)].filter(Boolean).join(' · ')}
                        {med.start_date && ` · ${t.since(parseLocalDate(med.start_date).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short' }))}`}
                      </p>
                    </div>
                    <div className="flex shrink-0">
                      <button onClick={() => { setConfirmId(null); setEditing(med); }} aria-label={`${t.edit} ${med.name}`}
                        className="size-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary">
                        <Icon name="edit_note" size={20} />
                      </button>
                      <button onClick={() => setConfirmId(med.id)} aria-label={`${t.remove} ${med.name}`}
                        className="size-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Icon name="delete" size={20} />
                      </button>
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {med.times.map((time) => {
                      const instruction = instructionLabel(med.time_instructions?.[time], lang);
                      return (
                        <li key={time} className="flex items-center gap-1.5 text-sm bg-secondary rounded-full px-3 py-1.5">
                          <Icon name="schedule" size={14} className="text-primary" />
                          <span className="font-bold tabular-nums text-foreground">{time}</span>
                          {instruction && <span className="text-muted-foreground">· {instruction}</span>}
                        </li>
                      );
                    })}
                    {(() => {
                      const pack = packPosition(med, today);
                      if (!pack) return null;
                      return (
                        <li className={`text-sm font-semibold self-center rounded-full px-3 py-1 ${pack.onBreak ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          {pack.onBreak ? t.packBreak(pack.daysToNextPack) : t.packDay(pack.day, pack.length)}
                        </li>
                      );
                    })()}
                    {med.stock != null && (
                      <li className="text-sm text-muted-foreground self-center">
                        {t.stockLeft(Number(med.stock), daysOfStockLeft(med, today, todayDoses.filter((d) => d.med.id === med.id && isTaken(med.id, d.time)).length))}
                      </li>
                    )}
                    {!med.reminders && (
                      <li className="text-sm text-muted-foreground self-center">{t.notifOff}</li>
                    )}
                  </ul>
                  {med.notes && (
                    <div className="flex gap-2 bg-blossom-soft/50 rounded-2xl px-4 py-3">
                      <Icon name="stethoscope" size={16} className="text-primary mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{t.doctor}</p>
                        <p className="text-sm text-foreground/90 whitespace-pre-line break-words">{med.notes}</p>
                      </div>
                    </div>
                  )}
                  {confirmId === med.id && (
                    <div role="alertdialog" className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                      <p className="text-sm text-foreground flex-1 min-w-[12rem]">{t.confirmRemove}</p>
                      <button onClick={async () => { await removeMedication(med.id); setConfirmId(null); }}
                        className="min-h-10 text-sm font-semibold text-destructive-foreground bg-destructive px-5 rounded-full">{t.yes}</button>
                      <button onClick={() => setConfirmId(null)} className="min-h-10 text-sm font-semibold text-muted-foreground px-4 rounded-full hover:bg-secondary">{t.no}</button>
                    </div>
                  )}
                </article>
              ))}
            </section>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-4">
            <MedicationCalendar lang={lang} medications={medications} logs={logs} today={today} view={view}
              onMonth={showMonth} onToggle={(id, time, taken, date) => setTaken(id, time, taken, date)} />
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed max-w-[75ch]">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" /> {t.disclaimer}
      </p>
    </>
  );

  if (embedded) return <div className="flex flex-col gap-6">{content}</div>;
  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 pb-32">
        {content}
      </div>
    </div>
  );
};

export default Medications;
