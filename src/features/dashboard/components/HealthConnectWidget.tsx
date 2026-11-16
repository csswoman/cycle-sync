'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import ManualHealthEntry from './ManualHealthEntry';

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

const HealthConnectWidget: React.FC = () => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [request, setRequest] = useState<{ type: EntryType; n: number } | null>(null);

  const fetchSummary = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setSyncing(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/health/summary?tz=${encodeURIComponent(tz)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      setSummary(res.ok && data?.connected ? data : null);
    } catch {
      setSummary(null);
    } finally {
      if (!opts?.silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary({ silent: true });
    fetch('/api/health/token')
      .then((r) => r.json())
      .then((d) => setTokenConfigured(!!d.configured))
      .catch(() => setTokenConfigured(null));

    const refresh = () => {
      if (document.visibilityState === 'visible') void fetchSummary({ silent: true });
    };
    const id = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [fetchSummary]);

  const formatSleep = (seconds: number) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

  const activityValue = () => {
    if (summary?.active_minutes) return `${summary.active_minutes} min`;
    if (summary?.active_calories) return `${Math.round(summary.active_calories)} kcal`;
    return '—';
  };

  const heartRate = summary?.resting_heart_rate ?? summary?.avg_heart_rate ?? null;
  const showSync = summary?.source === 'health_connect' && summary.synced_at;

  return (
    <section className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-foreground text-lg font-semibold">{t.bodyTodayTitle}</h2>
        <div className="flex items-center gap-2">
          {showSync && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
              <span className="size-2 rounded-full bg-green-500" />
              {new Date(summary!.synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => void fetchSummary()}
            type="button"
            disabled={syncing}
            aria-label={t.fitbitSync}
            className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <Icon name="sync" size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          icon="directions_walk"
          label={t.fitbitSteps}
          value={summary?.steps ? summary.steps.toLocaleString() : '—'}
          color="text-blue-500"
          addLabel={`${t.bodyAdd}: ${t.manualHealthSteps}`}
          onAdd={() => setRequest({ type: 'steps', n: Date.now() })}
        />
        <MetricCard
          icon="bedtime"
          label={t.fitbitSleep}
          value={summary ? formatSleep(summary.sleep_duration_seconds) : '—'}
          color="text-indigo-500"
          addLabel={`${t.bodyAdd}: ${t.manualHealthSleep}`}
          onAdd={() => setRequest({ type: 'sleep', n: Date.now() })}
        />
        <MetricCard
          icon="fitness_center"
          label={t.manualHealthActivity}
          value={activityValue()}
          color="text-pink-500"
          addLabel={`${t.bodyAdd}: ${t.manualHealthActivity}`}
          onAdd={() => setRequest({ type: 'activity', n: Date.now() })}
        />
      </div>

      {summary && (heartRate || summary.distance_meters > 0 || (summary.weight_kg ?? 0) > 0) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {heartRate ? (
            <span className="flex items-center gap-1">
              <Icon name="favorite" size={14} weight="duotone" className="text-red-500" />
              {t.fitbitHeartRate}: <b className="text-foreground tabular-nums">{heartRate} bpm</b>
            </span>
          ) : null}
          {summary.distance_meters > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="route" size={14} weight="duotone" className="text-teal-500" />
              {t.distanceLabel}: <b className="text-foreground tabular-nums">{formatDistance(summary.distance_meters)}</b>
            </span>
          )}
          {(summary.weight_kg ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="monitor_weight" size={14} weight="duotone" className="text-purple-500" />
              {t.weightLabel}: <b className="text-foreground tabular-nums">{summary.weight_kg!.toFixed(1)} kg</b>
            </span>
          )}
        </div>
      )}

      <ManualHealthEntry request={request} onChanged={() => void fetchSummary({ silent: true })} />

      {tokenConfigured === false && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blossom hover:underline self-start"
        >
          <Icon name="watch" size={14} />
          <span>{t.bodyConnectHint}</span>
          <Icon name="arrow_forward" size={13} />
        </Link>
      )}
    </section>
  );
};

function MetricCard({
  icon,
  label,
  value,
  color,
  addLabel,
  onAdd,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1.5 relative">
      <div className="flex items-center gap-1.5 pr-6">
        <Icon name={icon} size={16} weight="duotone" className={color} />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title={addLabel}
        className="absolute top-2 right-2 size-6 rounded-full bg-card text-primary text-base font-bold leading-none hover:bg-primary/10"
      >
        +
      </button>
    </div>
  );
}

export default HealthConnectWidget;
