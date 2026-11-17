'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { Icon } from '@/components/ui/Icon';

type EntryType = 'steps' | 'sleep' | 'activity';

interface ManualEntry {
  id: string;
  metric: EntryType;
  local_date: string;
  value: number;
  details: { type?: string; kcal?: number } | null;
}

function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const inputClass =
  'h-10 px-3.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground/60 w-full min-w-0 transition-colors shadow-2xs';

interface Props {
  /** Opens the form on a given tab; change `n` to re-trigger. */
  request?: { type: EntryType; n: number } | null;
  /** Called after a save/delete so the parent can refresh the summary. */
  onChanged?: () => void;
}

const ManualHealthEntry: React.FC<Props> = ({ onChanged, request }) => {
  const { t } = useLanguage();
  const { hideNumbers } = useDisplayPrefs();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntryType>('steps');
  const [date, setDate] = useState(todayLocal);
  const [steps, setSteps] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityMinutes, setActivityMinutes] = useState('');
  const [startTime, setStartTime] = useState(nowTime);
  const [kcal, setKcal] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [entries, setEntries] = useState<ManualEntry[]>([]);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/health/manual?days=14', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setEntries(data.entries ?? []);
    } catch {
      /* list is optional */
    }
  }, []);

  useEffect(() => {
    if (request) {
      setType(request.type);
      setOpen(true);
    }
  }, [request]);

  useEffect(() => {
    if (open) void loadEntries();
  }, [open, loadEntries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      let body: Record<string, unknown>;
      if (type === 'steps') {
        body = { type, date, steps };
      } else if (type === 'sleep') {
        body = { type, date, hours: hours || 0, minutes: minutes || 0 };
      } else {
        body = {
          type,
          date,
          activity_type: activityType,
          minutes: activityMinutes,
          start: new Date(`${date}T${startTime || '12:00'}`).toISOString(),
          kcal: kcal || undefined,
        };
      }
      const res = await fetch('/api/health/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error');
      setMessage({ ok: true, text: t.manualHealthSaved });
      setSteps('');
      setHours('');
      setMinutes('');
      setActivityType('');
      setActivityMinutes('');
      setKcal('');
      await loadEntries();
      onChanged?.();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/health/manual?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      await loadEntries();
      onChanged?.();
    }
  };

  const describe = (en: ManualEntry) => {
    if (en.metric === 'steps') return `${t.manualHealthSteps}: ${Math.round(en.value).toLocaleString()}`;
    if (en.metric === 'sleep') {
      const h = Math.floor(en.value / 3600);
      const m = Math.round((en.value % 3600) / 60);
      return `${t.manualHealthSleep}: ${h}h ${m}m`;
    }
    const kc = !hideNumbers && en.details?.kcal ? ` · ${Math.round(en.details.kcal)} kcal` : '';
    return `${en.details?.type ?? t.manualHealthActivity}: ${Math.round(en.value)} min${kc}`;
  };

  const tabs: { id: EntryType; label: string }[] = [
    { id: 'steps', label: t.manualHealthSteps },
    { id: 'sleep', label: t.manualHealthSleep },
    { id: 'activity', label: t.manualHealthActivity },
  ];

  return (
    <div className="flex flex-col gap-3">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-all group"
        >
          <Icon name="edit_note" size={16} className="text-primary group-hover:scale-110 transition-transform" />
          <span>{t.manualHealthToggle}</span>
        </button>
      )}

      {open && (
        <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-secondary/35 border border-border/80 shadow-xs animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Icon name="edit_note" size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">{t.manualHealthTitle}</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              title="Cerrar"
              className="size-7 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            >
              <Icon name="close" size={15} />
            </button>
          </div>

          {/* Segmented Tabs */}
          <div className="flex p-1 bg-secondary/60 rounded-xl gap-1" role="tablist">
            {tabs.map((tab) => {
              const active = type === tab.id;
              const iconName = tab.id === 'steps' ? 'directions_walk' : tab.id === 'sleep' ? 'bedtime' : 'fitness_center';
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setType(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs transition-all ${
                    active
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  }`}
                >
                  <Icon name={iconName} size={15} weight={active ? 'fill' : 'regular'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
              {t.manualHealthDate}
              <input
                type="date"
                required
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>

            {type === 'steps' && (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
                {t.manualHealthSteps}
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={200000}
                    required
                    placeholder="Ej. 8000"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className={`${inputClass} pr-14`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    pasos
                  </span>
                </div>
              </label>
            )}

            {type === 'sleep' && (
              <>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthHours}
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={24}
                      placeholder="7"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      horas
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthMinutes}
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={59}
                      placeholder="30"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      min
                    </span>
                  </div>
                </label>
                <p className="col-span-2 text-xs text-muted-foreground">{t.manualHealthSleepNote}</p>
              </>
            )}

            {type === 'activity' && (
              <>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
                  {t.manualHealthActivityType}
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="Ej. Yoga, Caminata, Fuerza"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
                  {t.manualHealthMinutes}
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={1440}
                      required
                      placeholder="30"
                      value={activityMinutes}
                      onChange={(e) => setActivityMinutes(e.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      min
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
                  {t.manualHealthStart}
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass}
                  />
                </label>
                {!hideNumbers && (
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2 sm:col-span-1">
                    {t.manualHealthKcal}
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={20000}
                        placeholder="Ej. 180"
                        value={kcal}
                        onChange={(e) => setKcal(e.target.value)}
                        className={`${inputClass} pr-12`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        kcal
                      </span>
                    </div>
                  </label>
                )}
              </>
            )}

            <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Icon name="sync" size={14} className="animate-spin" />}
                  {t.manualHealthSave}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 h-9 rounded-full border border-border/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {message && (
                <span className={`text-xs font-medium flex items-center gap-1.5 ${message.ok ? 'text-leaf' : 'text-destructive'}`}>
                  <Icon name={message.ok ? 'check_circle' : 'warning'} size={15} weight="fill" />
                  {message.text}
                </span>
              )}
            </div>
          </form>

          {entries.length > 0 && (
            <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {t.manualHealthRecent}
              </p>
              <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {entries.map((en) => (
                  <li
                    key={en.id}
                    className="flex items-center justify-between gap-2 text-xs bg-card/80 border border-border/50 rounded-xl px-3 py-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground tabular-nums text-[11px] shrink-0">{en.local_date}</span>
                      <span className="font-medium text-foreground truncate">{describe(en)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(en.id)}
                      title={t.manualHealthDelete}
                      aria-label={t.manualHealthDelete}
                      className="size-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Icon name="delete" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualHealthEntry;
