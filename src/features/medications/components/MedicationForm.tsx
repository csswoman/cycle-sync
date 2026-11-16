'use client';
import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Medication, MedicationInput } from '@/hooks/useMedications';
import { INSTRUCTIONS, toLocalISO } from '@/lib/medications/schedule';

type Lang = 'es' | 'en';

/** Common PMOS treatments. Hints are general information only, never dosing advice. */
const PRESETS: { es: string; en: string; hintEs?: string; hintEn?: string }[] = [
  { es: 'Metformina', en: 'Metformin', hintEs: 'Suele indicarse con o después de una comida para reducir molestias digestivas.', hintEn: 'Usually prescribed with or after a meal to reduce stomach upset.' },
  { es: 'Mio-inositol', en: 'Myo-inositol' },
  { es: 'Anticonceptivo', en: 'Birth control', hintEs: 'Funciona mejor si lo tomas a la misma hora cada día.', hintEn: 'Works best taken at the same time every day.' },
  { es: 'Espironolactona', en: 'Spironolactone', hintEs: 'Tu médico puede pedirte análisis de potasio durante el tratamiento.', hintEn: 'Your doctor may check your potassium during treatment.' },
  { es: 'Vitamina D', en: 'Vitamin D', hintEs: 'Se absorbe mejor con una comida que contenga algo de grasa.', hintEn: 'Absorbs best with a meal that contains some fat.' },
  { es: 'Ácido fólico', en: 'Folic acid' },
  { es: 'Magnesio', en: 'Magnesium' },
  { es: 'Omega-3', en: 'Omega-3' },
];

// Monday-first display order; values follow Date.getDay() (0 = Sunday).
const WEEKDAYS: { value: number; es: string; en: string }[] = [
  { value: 1, es: 'L', en: 'M' }, { value: 2, es: 'M', en: 'T' }, { value: 3, es: 'X', en: 'W' },
  { value: 4, es: 'J', en: 'T' }, { value: 5, es: 'V', en: 'F' }, { value: 6, es: 'S', en: 'S' }, { value: 0, es: 'D', en: 'S' },
];

const T = {
  es: {
    titleNew: 'Nuevo medicamento', titleEdit: 'Editar medicamento', name: 'Nombre', namePh: 'Ej.: Metformina',
    dose: 'Dosis', dosePh: 'Ej.: 500 mg, 1 cápsula', doses: 'Tomas del día', instruction: 'Indicación',
    noInstruction: 'Sin indicación', addDose: 'Agregar otra toma', removeDose: 'Quitar toma',
    days: '¿Qué días?', everyDay: 'Todos los días', specificDays: 'Días específicos', start: 'Empecé el tratamiento el',
    notes: 'Indicación de tu médico', notesPh: 'Ej.: tomar después del almuerzo con un vaso de agua; no tomar junto con lácteos.',
    reminders: 'Recordarme con una notificación', save: 'Guardar', saving: 'Guardando…', cancel: 'Cancelar',
    errName: 'Escribe el nombre del medicamento.', errTimes: 'Cada toma necesita una hora distinta.', errDays: 'Elige al menos un día.',
    doctor: 'Sigue siempre la indicación de tu médico.',
    pack: 'Paquete con descanso', packActive: 'Días con pastilla', packBreak: 'Días de descanso',
    packStart: 'Día 1 del paquete actual', packHelp: 'En los días de descanso no se programan tomas ni recordatorios. Si tu paquete trae pastillas de placebo y te las tomas, usa 28 + 0.',
    stockTitle: 'Inventario (opcional)', stock: 'Unidades que te quedan', perDose: 'Unidades por toma', alertDays: 'Avisarme cuando queden (días)',
    stockHelp: 'Se descuenta sola cada vez que marcas una toma. Te avisamos para que pidas receta o compres a tiempo.',
    errPack: 'Revisa los días del paquete y su fecha de inicio.',
  },
  en: {
    titleNew: 'New medication', titleEdit: 'Edit medication', name: 'Name', namePh: 'e.g. Metformin',
    dose: 'Dose', dosePh: 'e.g. 500 mg, 1 capsule', doses: 'Daily intakes', instruction: 'Instruction',
    noInstruction: 'No instruction', addDose: 'Add another intake', removeDose: 'Remove intake',
    days: 'Which days?', everyDay: 'Every day', specificDays: 'Specific days', start: 'Treatment started on',
    notes: "Your doctor's instructions", notesPh: 'e.g. take after lunch with a glass of water; avoid taking with dairy.',
    reminders: 'Remind me with a notification', save: 'Save', saving: 'Saving…', cancel: 'Cancel',
    errName: 'Enter the medication name.', errTimes: 'Each intake needs a different time.', errDays: 'Pick at least one day.',
    doctor: "Always follow your doctor's instructions.",
    pack: 'Pill pack with break', packActive: 'Pill days', packBreak: 'Break days',
    packStart: 'Day 1 of the current pack', packHelp: 'No doses or reminders are scheduled on break days. If your pack has placebo pills you take, use 28 + 0.',
    stockTitle: 'Stock (optional)', stock: 'Units left', perDose: 'Units per dose', alertDays: 'Alert me when this many days remain',
    stockHelp: 'It goes down automatically each time you mark a dose. We warn you in time to get a refill.',
    errPack: 'Check the pack days and start date.',
  },
};

interface Row { time: string; instruction: string }

interface Props {
  lang: Lang;
  initial?: Medication | null;
  onSave: (input: MedicationInput) => Promise<void>;
  onCancel: () => void;
}

const inputCls = 'w-full bg-secondary text-foreground rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-bold text-muted-foreground uppercase tracking-wide';

export const MedicationForm: React.FC<Props> = ({ lang, initial, onSave, onCancel }) => {
  const t = T[lang];
  const [name, setName] = useState(initial?.name ?? '');
  const [dose, setDose] = useState(initial?.dose ?? '');
  const [rows, setRows] = useState<Row[]>(
    initial?.times.length
      ? initial.times.map((time) => ({ time, instruction: initial.time_instructions?.[time] ?? '' }))
      : [{ time: '08:30', instruction: '' }],
  );
  const initialDays = initial?.days_of_week && initial.days_of_week.length > 0 ? initial.days_of_week : null;
  type Mode = 'daily' | 'days' | 'pack';
  const [mode, setMode] = useState<Mode>(initial?.pack_active_days ? 'pack' : initialDays ? 'days' : 'daily');
  const specific = mode === 'days';
  const [packActive, setPackActive] = useState(String(initial?.pack_active_days ?? 21));
  const [packBreak, setPackBreak] = useState(String(initial?.pack_break_days ?? 7));
  const [packStart, setPackStart] = useState(initial?.pack_start_date ?? toLocalISO(new Date()));
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : '');
  const [perDose, setPerDose] = useState(String(initial?.units_per_dose ?? 1));
  const [alertDays, setAlertDays] = useState(String(initial?.refill_alert_days ?? 7));
  const [days, setDays] = useState<number[]>(initialDays ?? [1, 2, 3, 4, 5, 6, 0]);
  const [startDate, setStartDate] = useState(initial?.start_date ?? (initial ? '' : toLocalISO(new Date())));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [reminders, setReminders] = useState(initial?.reminders ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const preset = PRESETS.find((p) => p.es.toLowerCase() === name.trim().toLowerCase() || p.en.toLowerCase() === name.trim().toLowerCase());
  const hint = preset ? (lang === 'es' ? preset.hintEs : preset.hintEn) : undefined;

  const updateRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const pickInstruction = (i: number, key: string) => {
    const suggested = INSTRUCTIONS.find((x) => x.key === key)?.time;
    // Picking "after lunch" also proposes a matching time; it stays editable.
    updateRow(i, suggested ? { instruction: key, time: suggested } : { instruction: key });
  };

  const submit = async () => {
    const times = rows.map((r) => r.time);
    if (!name.trim()) return setError(t.errName);
    if (times.some((x) => !x) || new Set(times).size !== times.length) return setError(t.errTimes);
    if (specific && days.length === 0) return setError(t.errDays);
    const active = Number(packActive), brk = Number(packBreak);
    if (mode === 'pack' && (!(active >= 1 && active <= 90) || !(brk >= 0 && brk <= 30) || !packStart)) return setError(t.errPack);
    const stockNum = stock.trim() === '' ? null : Number(stock.replace(',', '.'));
    const perDoseNum = Number(perDose.replace(',', '.')) > 0 ? Number(perDose.replace(',', '.')) : 1;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        dose: dose.trim(),
        times,
        reminders,
        notes: notes.trim(),
        days_of_week: specific ? days : null,
        time_instructions: Object.fromEntries(rows.filter((r) => r.instruction).map((r) => [r.time, r.instruction])),
        start_date: startDate || null,
        pack: mode === 'pack' ? { active, break: brk, start: packStart } : null,
        stock: stockNum != null && Number.isFinite(stockNum) && stockNum >= 0 ? stockNum : null,
        units_per_dose: perDoseNum,
        refill_alert_days: Math.min(60, Math.max(0, Math.round(Number(alertDays) || 0))),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-primary/30 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-foreground font-bold text-lg">{initial ? t.titleEdit : t.titleNew}</h2>
        <button onClick={onCancel} aria-label={t.cancel} className="p-2 -m-2 text-muted-foreground hover:text-foreground">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="med-name" className={labelCls}>{t.name}</label>
        {!initial && (
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const label = p[lang];
              const active = name === label;
              return (
                <button key={label} type="button" onClick={() => setName(label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border hover:border-primary/50'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
        <input id="med-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} className={inputCls} />
        {hint && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Icon name="info" size={14} className="mt-0.5 text-primary" />
            <span>{hint} {t.doctor}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="med-dose" className={labelCls}>{t.dose}</label>
        <input id="med-dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder={t.dosePh} className={inputCls} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelCls} mb-2`}>{t.doses}</legend>
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-secondary/40 rounded-xl p-2">
            <input type="time" value={r.time} aria-label={`${t.doses} ${i + 1}`}
              onChange={(e) => updateRow(i, { time: e.target.value })}
              className="bg-card text-foreground rounded-lg px-3 py-2 text-sm border border-border w-[7.5rem]" />
            <select value={r.instruction} aria-label={t.instruction}
              onChange={(e) => pickInstruction(i, e.target.value)}
              className="flex-1 min-w-0 bg-card text-foreground rounded-lg px-3 py-2 text-sm border border-border">
              <option value="">{t.noInstruction}</option>
              {INSTRUCTIONS.map((x) => <option key={x.key} value={x.key}>{x[lang]}</option>)}
            </select>
            {rows.length > 1 && (
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={t.removeDose}
                className="p-2 text-muted-foreground hover:text-destructive">
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, { time: '20:30', instruction: '' }])}
          className="self-start flex items-center gap-1 text-sm font-bold text-primary py-1">
          <Icon name="add" size={16} /> {t.addDose}
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={`${labelCls} mb-2`}>{t.days}</legend>
        <div className="flex flex-wrap self-start rounded-2xl bg-secondary p-1 gap-1">
          {([['daily', t.everyDay], ['days', t.specificDays], ['pack', t.pack]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${mode === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
        {mode === 'pack' && (
          <div className="flex flex-col gap-3 bg-secondary/40 rounded-xl p-3">
            <div className="flex flex-wrap gap-2">
              {[[21, 7], [24, 4], [28, 0]].map(([a, b]) => (
                <button key={`${a}-${b}`} type="button" onClick={() => { setPackActive(String(a)); setPackBreak(String(b)); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${Number(packActive) === a && Number(packBreak) === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}>
                  {a} + {b}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t.packActive}
                <input inputMode="numeric" value={packActive} onChange={(e) => setPackActive(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t.packBreak}
                <input inputMode="numeric" value={packBreak} onChange={(e) => setPackBreak(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground col-span-2 sm:col-span-1">{t.packStart}
                <input type="date" value={packStart} onChange={(e) => setPackStart(e.target.value)} className={inputCls} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{t.packHelp}</p>
          </div>
        )}
        {specific && (
          <div className="flex gap-1.5">
            {WEEKDAYS.map((d) => {
              const on = days.includes(d.value);
              return (
                <button key={d.value} type="button" aria-pressed={on}
                  onClick={() => setDays(on ? days.filter((x) => x !== d.value) : [...days, d.value])}
                  className={`size-10 rounded-full text-sm font-bold border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border'}`}>
                  {d[lang]}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="med-start" className="text-sm text-muted-foreground">{t.start}</label>
          <input id="med-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm border border-border" />
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="med-notes" className={`${labelCls} flex items-center gap-1.5`}>
          <Icon name="stethoscope" size={14} /> {t.notes}
        </label>
        <textarea id="med-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh} rows={3}
          className={`${inputCls} resize-y`} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelCls} mb-2`}>{t.stockTitle}</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t.stock}
            <input inputMode="decimal" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="30" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t.perDose}
            <input inputMode="decimal" value={perDose} onChange={(e) => setPerDose(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground col-span-2 sm:col-span-1">{t.alertDays}
            <input inputMode="numeric" value={alertDays} onChange={(e) => setAlertDays(e.target.value)} className={inputCls} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{t.stockHelp}</p>
      </fieldset>

      <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} className="size-4 accent-primary" />
        {t.reminders}
      </label>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={submit} disabled={saving}
          className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-bold text-sm disabled:opacity-60">
          {saving ? t.saving : t.save}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-3 rounded-full font-bold text-sm text-muted-foreground hover:text-foreground">
          {t.cancel}
        </button>
      </div>
    </div>
  );
};

export default MedicationForm;
