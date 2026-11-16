'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';

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
  'h-10 px-3 rounded-xl bg-secondary border border-border text-sm text-foreground w-full min-w-0';

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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="self-start px-3 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
      >
        {t.manualHealthToggle}
      </button>

      {open && (
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
          <div className="flex gap-1.5" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={type === tab.id}
                onClick={() => setType(tab.id)}
                className={`px-3 h-8 rounded-lg text-xs font-bold transition-all ${
                  type === tab.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-2">
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
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={200000}
                  required
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            {type === 'sleep' && (
              <>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthHours}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={24}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthMinutes}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className={inputClass}
                  />
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
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthMinutes}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1440}
                    required
                    value={activityMinutes}
                    onChange={(e) => setActivityMinutes(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.manualHealthStart}
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass}
                  />
                </label>
                {!hideNumbers && <label className="flex flex-col gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider col-span-2">
                  {t.manualHealthKcal}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20000}
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                    className={inputClass}
                  />
                </label>}
              </>
            )}

            <div className="col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
              >
                {t.manualHealthSave}
              </button>
              {message && (
                <span className={`text-xs ${message.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </form>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t.manualHealthRecent}
            </p>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.manualHealthEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {entries.map((en) => (
                  <li
                    key={en.id}
                    className="flex items-center justify-between gap-2 text-xs bg-card rounded-lg px-3 py-2"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-muted-foreground tabular-nums">{en.local_date}</span> · {describe(en)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(en.id)}
                      className="shrink-0 text-destructive font-semibold hover:underline"
                    >
                      {t.manualHealthDelete}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualHealthEntry;
