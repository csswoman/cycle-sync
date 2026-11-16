'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

interface HealthSummary {
  connected: boolean;
  date: string;
  steps: number;
  distance_meters: number;
  active_calories: number;
  total_calories: number;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  sleep_duration_seconds: number;
  weight_kg: number | null;
  synced_at: string;
}

interface TokenInfo {
  configured: boolean;
  webhookUrl?: string;
  webhookUrlTemplate?: string;
}

const HealthConnectWidget: React.FC = () => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadToken = useCallback(async () => {
    try {
      const res = await fetch('/api/health/token');
      const data = await res.json();
      if (res.ok) {
        setTokenInfo({
          configured: !!data.configured,
          webhookUrl: data.webhookUrl,
          webhookUrlTemplate: data.webhookUrlTemplate,
        });
      }
    } catch {
      setTokenInfo(null);
    }
  }, []);

  const fetchSummary = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setSyncing(true);
    try {
      const res = await fetch('/api/health/summary', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.connected) {
        setSummary(data);
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      if (!opts?.silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadToken(), fetchSummary({ silent: true })]);
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadToken, fetchSummary]);

  const formatSleep = (seconds: number) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDistance = (meters: number) => {
    if (!meters) return '—';
    return meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  };

  const formatSyncTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">{t.fitbitLoading}</span>
      </div>
    );
  }

  if (!summary?.connected) {
    return (
      <div className="flex flex-col gap-3 py-1">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border/60">
          <div className="p-2 rounded-xl bg-card text-blossom shrink-0">
            <Icon name="watch" size={20} weight="duotone" />
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground min-w-0">
            <p className="font-semibold text-foreground text-xs sm:text-sm">{t.wearableSectionTitle}</p>
            <p className="leading-relaxed">{t.healthWebhookDescription}</p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blossom hover:underline pt-1"
            >
              <span>{t.settings}</span>
              <Icon name="arrow_forward" size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            {formatSyncTime(summary.synced_at)}
          </span>
        </div>
        <button
          onClick={() => void fetchSummary()}
          type="button"
          disabled={syncing}
          className="flex items-center gap-1 px-2.5 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          <Icon name="sync" size={14} className={syncing ? 'animate-spin' : ''} />
          {t.fitbitSync}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon="directions_walk"
          label={t.fitbitSteps}
          value={summary.steps ? summary.steps.toLocaleString() : '—'}
          color="text-blue-500"
        />
        <MetricCard
          icon="favorite"
          label={t.fitbitHeartRate}
          value={
            summary.resting_heart_rate
              ? `${summary.resting_heart_rate} bpm`
              : summary.avg_heart_rate
                ? `${summary.avg_heart_rate} bpm`
                : '—'
          }
          color="text-red-500"
        />
        <MetricCard
          icon="bedtime"
          label={t.fitbitSleep}
          value={formatSleep(summary.sleep_duration_seconds)}
          color="text-indigo-500"
        />
        <MetricCard
          icon="local_fire_department"
          label={t.fitbitCalories}
          value={
            summary.active_calories
              ? `${Math.round(summary.active_calories)} kcal`
              : summary.total_calories
                ? `${Math.round(summary.total_calories)} kcal`
                : '—'
          }
          color="text-orange-500"
        />
        <MetricCard
          icon="route"
          label={t.distanceLabel}
          value={formatDistance(summary.distance_meters)}
          color="text-teal-500"
        />
        {summary.weight_kg != null && summary.weight_kg > 0 && (
          <MetricCard
            icon="monitor_weight"
            label={t.weightLabel}
            value={`${summary.weight_kg.toFixed(1)} kg`}
            color="text-purple-500"
          />
        )}
      </div>
    </div>
  );
};

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={16} weight="duotone" className={color} />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export default HealthConnectWidget;
