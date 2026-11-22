'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { useGuest } from '@/hooks/useGuest';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';

interface HealthSummary {
  connected: boolean;
  date: string;
  steps: number;
  distance_meters: number;
  active_minutes?: number;
  active_calories: number;
  total_calories: number;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  sleep_duration_seconds: number;
  weight_kg: number | null;
  source?: string | null;
  synced_at: string;
}

type EntryType = 'steps' | 'sleep' | 'activity';

const REFRESH_MS = 5 * 60 * 1000;
const STEPS_GOAL = 8000;
const SLEEP_GOAL_H = 8;
const ACTIVITY_GOAL_MIN = 30;

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Turns what she typed into the body the manual-entry API expects, or null when it is not valid. */
function buildEntry(type: EntryType, raw: string): Record<string, unknown> | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const date = todayLocal();
  if (type === 'steps') {
    const n = Number(text.replace(/[.,\s]/g, ''));
    return Number.isInteger(n) && n > 0 && n <= 200000 ? { type, date, steps: n } : null;
  }
  if (type === 'activity') {
    const n = Math.round(Number(text.replace(/[^\d]/g, '')));
    return n > 0 && n <= 1440
      ? { type, date, activity_type: 'Actividad', minutes: n, start: new Date().toISOString() }
      : null;
  }
  // Sleep: "7:30", "7h 30", "7,5" (hours) or a plain number above 24 (minutes).
  let minutes: number;
  const hm = text.match(/^(\d{1,2})\s*(?:h|:)\s*(\d{1,2})?\s*(?:m|min)?$/);
  if (hm) minutes = Number(hm[1]) * 60 + Number(hm[2] ?? 0);
  else {
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    minutes = n > 24 ? n : n * 60;
  }
  minutes = Math.round(minutes);
  return minutes > 0 && minutes <= 24 * 60 ? { type, date, hours: Math.floor(minutes / 60), minutes: minutes % 60 } : null;
}

const COPY = {
  es: {
    steps: { unit: 'pasos', placeholder: '8000', hint: 'Pasos de hoy' },
    sleep: { unit: 'h', placeholder: '7:30', hint: 'Horas dormidas, ej. 7:30' },
    activity: { unit: 'min', placeholder: '30', hint: 'Minutos que sumas hoy' },
    saved: 'Guardado',
    invalid: 'Valor no válido',
    failed: 'No se pudo guardar',
    edit: 'Escribir',
    guestNote: 'Datos de ejemplo. Podrás registrar y editar los tuyos cuando crees una cuenta.',
    guestCta: 'Crear cuenta',
    loadError: 'No pudimos cargar tus datos de salud.',
    offline: 'Sin conexión. Tus datos de salud se cargarán al volver.',
    retry: 'Reintentar',
  },
  en: {
    steps: { unit: 'steps', placeholder: '8000', hint: "Today's steps" },
    sleep: { unit: 'h', placeholder: '7:30', hint: 'Hours slept, e.g. 7:30' },
    activity: { unit: 'min', placeholder: '30', hint: 'Minutes you add today' },
    saved: 'Saved',
    invalid: 'Invalid value',
    failed: 'Could not save',
    edit: 'Type',
    guestNote: 'Sample data. You can log and edit your own once you create an account.',
    guestCta: 'Create account',
    loadError: 'We could not load your health data.',
    offline: 'Offline. Your health data will load when you reconnect.',
    retry: 'Retry',
  },
};

/** `quiet`: renders as an open section (top rule, no card) for secondary placement. `bare`: no chrome at all, to sit inside another card or tab. */
/**
 * Bare-only slots for the dashboard: `footerAction` sits before the sync button, `footerStart` replaces
 * the connect hint, and `swap` is shown in place of the three tiles (e.g. the check-in).
 */
const HealthConnectWidget: React.FC<{ quiet?: boolean; bare?: boolean; footerAction?: React.ReactNode; footerStart?: React.ReactNode; swap?: React.ReactNode }> = ({ quiet = false, bare = false, footerAction, footerStart, swap }) => {
  const { t, language } = useLanguage();
  const { hideNumbers } = useDisplayPrefs();
  const { isGuest, promptSignup } = useGuest();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  /** Why the last load failed, so the widget can say so instead of showing empty metrics. */
  const [loadError, setLoadError] = useState<'offline' | 'failed' | null>(null);

  const fetchSummary = useCallback(async (opts?: { silent?: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (!session) return;
    if (!opts?.silent) setSyncing(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/health/summary?tz=${encodeURIComponent(tz)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      // 401/404 mean "not connected", which the empty metrics already show; other failures are worth saying.
      setLoadError(res.ok || res.status === 401 || res.status === 404 ? null : 'failed');
      setSummary(res.ok && data?.connected ? data : null);
    } catch {
      setLoadError(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'failed');
      setSummary(null);
    } finally {
      if (!opts?.silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      void fetchSummary({ silent: true });
      fetch('/api/health/token')
        .then((r) => r.json())
        .then((d) => setTokenConfigured(!!d.configured))
        .catch(() => setTokenConfigured(null));
    }).catch(() => { });

    const refresh = () => {
      if (document.visibilityState === 'visible') void fetchSummary({ silent: true });
    };
    const reconnect = () => void fetchSummary({ silent: true });
    const id = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', reconnect);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', reconnect);
    };
  }, [fetchSummary]);

  /** Saves a typed value for today. Returns an error message, or null when saved. */
  const saveEntry = useCallback(async (type: EntryType, raw: string): Promise<string | null> => {
    const copy = COPY[language === 'es' ? 'es' : 'en'];
    const body = buildEntry(type, raw);
    if (!body) return copy.invalid;
    try {
      const res = await fetch('/api/health/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ? `${copy.failed}: ${data.error}` : copy.failed;
      }
      await fetchSummary({ silent: true });
      return null;
    } catch (err) {
      return err instanceof Error ? `${copy.failed}: ${err.message}` : copy.failed;
    }
  }, [fetchSummary, language]);

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

  const es = language === 'es';
  const fmtNumber = (n: number) => n.toLocaleString(es ? 'es' : 'en');

  // Guests see fixed sample numbers; saving needs an account.
  const stepsToday = isGuest ? 6480 : summary?.steps || 0;
  const sleepSeconds = isGuest ? 7 * 3600 + 20 * 60 : summary?.sleep_duration_seconds || 0;
  const activityMinutes = isGuest ? 30 : summary?.active_minutes || 0;
  const activityKcal = !isGuest && !hideNumbers && !activityMinutes ? Math.round(summary?.active_calories || 0) : 0;

  const sleepParts: ValuePart[] = sleepSeconds
    ? [
        ...(sleepSeconds >= 3600 ? [{ n: String(Math.floor(sleepSeconds / 3600)), u: 'h' }] : []),
        { n: String(Math.floor((sleepSeconds % 3600) / 60)), u: 'min' },
      ]
    : [];

  const heartRate = summary?.resting_heart_rate ?? summary?.avg_heart_rate ?? null;
  const showSync = summary?.source === 'health_connect' && summary.synced_at;
  const guestCopy = COPY[es ? 'es' : 'en'];

  const goalLine = (progress: number | null, goal: string) =>
    progress === null ? (es ? `${isGuest ? '' : 'Toca para registrar hoy · '}Meta: ${goal}` : `${isGuest ? '' : 'Tap to log today · '}Goal: ${goal}`) : `${Math.round(progress * 100)} % ${es ? 'de' : 'of'} ${goal}`;

  return (
    <section
      className={
        bare
          ? 'flex flex-col gap-3'
          : quiet
          ? 'flex flex-col gap-5 pt-6 border-t border-border/60'
          : 'bg-card rounded-3xl border border-border/80 shadow-sm p-5 sm:p-6 flex flex-col gap-5'
      }
    >
      {/* Inside a tab the title is redundant, so the sync controls share the bottom row with the connect hint. */}
      <div className={`flex gap-3 justify-between ${bare ? 'order-last items-center -my-1' : 'items-start'}`}>
        {bare && (footerStart ?? (tokenConfigured === false ? (
          <Link href="/settings" title={t.bodyConnectHint} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blossom hover:underline min-h-9 min-w-0">
            <Icon name="watch" size={16} className="shrink-0" />
            <span className="truncate">{es ? 'Conecta tu reloj' : 'Connect your watch'}</span>
            <Icon name="arrow_forward" size={14} className="shrink-0" />
          </Link>
        ) : <span />))}
        <div className={`min-w-0 ${bare ? 'sr-only' : ''}`}>
          <h2 className="text-foreground text-lg sm:text-xl font-semibold tracking-tight leading-snug text-balance">{t.bodyTodayTitle}</h2>
          <p className="text-sm text-muted-foreground mt-0.5 text-pretty">
            {es ? 'Pasos, sueño y actividad de hoy' : "Today's steps, sleep and activity"}
          </p>
        </div>
        <div className={`flex items-center gap-2 shrink-0 ${bare ? 'ml-auto' : ''}`}>
          {bare && footerAction}
          {showSync && (
            <span className="flex items-center gap-1.5 text-xs text-leaf font-medium bg-leaf/10 px-2.5 py-1 rounded-full tabular-nums">
              <span className="size-1.5 rounded-full bg-leaf animate-pulse" />
              {new Date(summary!.synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => void fetchSummary()}
            type="button"
            disabled={syncing}
            aria-label={t.fitbitSync}
            title={t.fitbitSync}
            className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Icon name="sync" size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loadError && !isGuest && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
          <Icon name={loadError === 'offline' ? 'cloud_off' : 'error'} size={18} className="text-sun-ink shrink-0" />
          <p className="flex-1 min-w-0 text-pretty">{loadError === 'offline' ? guestCopy.offline : guestCopy.loadError}</p>
          {loadError === 'failed' && (
            <button
              type="button"
              onClick={() => void fetchSummary()}
              disabled={syncing}
              className="font-semibold text-blossom hover:underline min-h-10 cursor-pointer disabled:opacity-50"
            >
              {guestCopy.retry}
            </button>
          )}
        </div>
      )}

      {/* `swap` sits in the same grid cell as the tiles, so showing it never makes the card taller. */}
      <div className="grid">
      <div className={`col-start-1 row-start-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3 ${swap ? 'invisible' : ''}`} aria-hidden={swap ? true : undefined}>
        <MetricCard
          icon="directions_walk"
          label={t.fitbitSteps}
          parts={stepsToday ? [{ n: fmtNumber(stepsToday), u: es ? 'pasos' : 'steps' }] : []}
          progress={stepsToday ? stepsToday / STEPS_GOAL : null}
          goalText={goalLine(stepsToday ? stepsToday / STEPS_GOAL : null, `${fmtNumber(STEPS_GOAL)} ${es ? 'pasos' : 'steps'}`)}
          accent={{ text: 'text-leaf', fill: 'var(--leaf-fresh)' }}
          kind="steps"
          lang={es ? 'es' : 'en'}
          dense={bare}
          locked={isGuest}
          onLocked={promptSignup}
          onSave={(raw) => saveEntry('steps', raw)}
        />
        <MetricCard
          icon="bedtime"
          label={t.fitbitSleep}
          parts={sleepParts}
          progress={sleepSeconds ? sleepSeconds / (SLEEP_GOAL_H * 3600) : null}
          goalText={goalLine(sleepSeconds ? sleepSeconds / (SLEEP_GOAL_H * 3600) : null, `${SLEEP_GOAL_H} h`)}
          accent={{ text: 'text-blossom', fill: 'var(--petal)' }}
          kind="sleep"
          lang={es ? 'es' : 'en'}
          dense={bare}
          locked={isGuest}
          onLocked={promptSignup}
          onSave={(raw) => saveEntry('sleep', raw)}
        />
        <MetricCard
          icon="fitness_center"
          label={t.manualHealthActivity}
          parts={activityMinutes ? [{ n: String(activityMinutes), u: 'min' }] : activityKcal ? [{ n: String(activityKcal), u: 'kcal' }] : []}
          progress={activityMinutes ? activityMinutes / ACTIVITY_GOAL_MIN : null}
          goalText={goalLine(activityMinutes ? activityMinutes / ACTIVITY_GOAL_MIN : null, es ? `${ACTIVITY_GOAL_MIN} min al día` : `${ACTIVITY_GOAL_MIN} min a day`)}
          accent={{ text: 'text-coral', fill: 'var(--coral)' }}
          kind="activity"
          lang={es ? 'es' : 'en'}
          dense={bare}
          locked={isGuest}
          onLocked={promptSignup}
          onSave={(raw) => saveEntry('activity', raw)}
        />
      </div>
      {swap && <div className="col-start-1 row-start-1 min-w-0">{swap}</div>}
      </div>

      {summary && (heartRate || summary.distance_meters > 0 || (!hideNumbers && (summary.weight_kg ?? 0) > 0)) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {heartRate ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="favorite" size={16} className="text-blossom" />
              <span>{t.fitbitHeartRate} <b className="text-foreground tabular-nums font-semibold">{heartRate} bpm</b></span>
            </span>
          ) : null}
          {summary.distance_meters > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="route" size={16} className="text-leaf" />
              <span>{t.distanceLabel} <b className="text-foreground tabular-nums font-semibold">{formatDistance(summary.distance_meters)}</b></span>
            </span>
          )}
          {!hideNumbers && (summary.weight_kg ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="monitor_weight" size={16} className="text-peach" />
              <span>{t.weightLabel} <b className="text-foreground tabular-nums font-semibold">{summary.weight_kg!.toFixed(1)} kg</b></span>
            </span>
          )}
        </div>
      )}

      {isGuest && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <p className="text-pretty">{guestCopy.guestNote}</p>
          <button
            type="button"
            onClick={promptSignup}
            className="font-semibold text-blossom hover:underline min-h-10 cursor-pointer"
          >
            {guestCopy.guestCta}
          </button>
        </div>
      )}

      {!bare && tokenConfigured === false && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blossom hover:underline self-start min-h-10"
        >
          <Icon name="watch" size={16} />
          <span>{t.bodyConnectHint}</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      )}
    </section>
  );
};

interface ValuePart {
  n: string;
  u: string;
}

interface MetricCardProps {
  icon: string;
  label: string;
  /** Value split into number + unit so the unit can sit smaller next to it. Empty = no data yet. */
  parts: ValuePart[];
  /** Fraction of the daily goal (0 to 1+), or null without data. */
  progress: number | null;
  goalText: string;
  accent: { text: string; fill: string };
  kind: EntryType;
  lang: 'es' | 'en';
  /** Tighter padding and a smaller value, for the dashboard tab. */
  dense?: boolean;
  /** Saves what was typed; resolves to an error message or null. */
  onSave: (raw: string) => Promise<string | null>;
  /** Guests see sample values and cannot edit: tapping asks them to sign up. */
  locked?: boolean;
  onLocked?: () => void;
}

function MetricCard({ icon, label, parts, progress, goalText, accent, kind, lang, onSave, locked, onLocked, dense }: MetricCardProps) {
  const copy = COPY[lang];
  const field = copy[kind];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!status?.ok) return;
    const id = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(id);
  }, [status]);

  const start = () => {
    if (locked) return onLocked?.();
    if (editing) return;
    done.current = false;
    setDraft('');
    setStatus(null);
    setEditing(true);
  };

  const cancel = () => {
    done.current = true;
    setEditing(false);
    setStatus(null);
  };

  const commit = async () => {
    if (done.current) return;
    if (!draft.trim()) return cancel();
    done.current = true;
    setSaving(true);
    const error = await onSave(draft);
    setSaving(false);
    if (error) {
      // Keep the draft open so she can fix it.
      done.current = false;
      setStatus({ ok: false, text: error });
      inputRef.current?.focus();
      return;
    }
    setEditing(false);
    setStatus({ ok: true, text: copy.saved });
  };

  const pct = progress === null ? 0 : Math.min(100, Math.round(progress * 100));

  return (
    <div
      onClick={start}
      role={editing ? undefined : 'button'}
      tabIndex={editing ? undefined : 0}
      aria-label={editing ? undefined : `${copy.edit}: ${label}`}
      onKeyDown={(e) => {
        if (!editing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          start();
        }
      }}
      className={
        `group rounded-2xl border flex flex-col transition-colors duration-200 ${dense ? 'px-3.5 py-3 gap-2.5' : 'p-3 gap-2.5'} ` +
        (editing
          ? 'border-primary/60 bg-card'
          : 'border-border/70 bg-secondary/40 hover:bg-secondary/60 hover:border-border select-none ' + (locked ? 'cursor-pointer' : 'cursor-text'))
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon name={icon} size={20} weight="regular" className={`${accent.text} shrink-0`} />
        <span className="text-sm font-medium text-foreground/80 truncate flex-1">{label}</span>
        {!editing && !locked && (
          <Icon name="edit" size={16} className="text-muted-foreground/40 group-hover:text-foreground/70 transition-colors shrink-0" />
        )}
      </div>

      {/* Value, bar and goal stacked. */}
      <div className="flex flex-col gap-2.5">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void commit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-baseline gap-2 border-b-2 border-primary/50 focus-within:border-primary transition-colors"
          >
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode={kind === 'sleep' ? 'text' : 'numeric'}
              enterKeyHint="done"
              aria-label={`${label}: ${field.hint}`}
              placeholder={field.placeholder}
              value={draft}
              disabled={saving}
              onChange={(e) => {
                setDraft(e.target.value);
                if (status) setStatus(null);
              }}
              onBlur={() => void commit()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              className={`w-full min-w-0 bg-transparent outline-none text-3xl font-semibold tracking-tight tabular-nums leading-none text-foreground placeholder:text-muted-foreground/40 disabled:opacity-60`}
            />
            <span className="text-sm font-medium text-muted-foreground shrink-0">{saving ? '…' : field.unit}</span>
          </form>
        ) : parts.length ? (
          <p className="flex items-baseline flex-wrap gap-x-1 text-foreground leading-none">
            {parts.map((part, i) => (
              <React.Fragment key={part.u}>
                <span className={`text-3xl font-semibold tracking-tight tabular-nums ${i ? 'ml-1.5' : ''}`}>{part.n}</span>
                <span className="text-sm font-medium text-muted-foreground">{part.u}</span>
              </React.Fragment>
            ))}
          </p>
        ) : (
          <p className={`text-3xl font-semibold tracking-tight leading-none text-muted-foreground/50`} aria-label={lang === 'es' ? 'Sin datos' : 'No data'}>
            —
          </p>
        )}

        <div
          role={progress === null ? undefined : 'progressbar'}
          aria-label={label}
          aria-valuenow={progress === null ? undefined : pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 rounded-full bg-secondary overflow-hidden"
        >
          <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: accent.fill }} />
        </div>

        <p
          role={status ? 'status' : undefined}
          className={`text-sm tabular-nums ${
            status ? (status.ok ? 'text-leaf font-medium' : 'text-destructive font-medium break-words') : 'text-muted-foreground'
          }`}
        >
          {status ? status.text : editing ? field.hint : goalText}
        </p>
      </div>
    </div>
  );
}

export default HealthConnectWidget;
