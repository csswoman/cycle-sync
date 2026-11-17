'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
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
  const { t, language } = useLanguage();
  const { hideNumbers } = useDisplayPrefs();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [request, setRequest] = useState<{ type: EntryType; n: number } | null>(null);

  const fetchSummary = useCallback(async (opts?: { silent?: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (!session) return;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      void fetchSummary({ silent: true });
      fetch('/api/health/token')
        .then((r) => r.json())
        .then((d) => setTokenConfigured(!!d.configured))
        .catch(() => setTokenConfigured(null));
    }).catch(() => {});

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
    if (!hideNumbers && summary?.active_calories) return `${Math.round(summary.active_calories)} kcal`;
    return '—';
  };

  const heartRate = summary?.resting_heart_rate ?? summary?.avg_heart_rate ?? null;
  const showSync = summary?.source === 'health_connect' && summary.synced_at;

  const targetSteps = '8.000 pasos';
  const targetSleep = '8h recomendadas';
  const targetActivity = '30 min al día';

  return (
    <section className="bg-card rounded-3xl border border-border/80 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-leaf-soft text-leaf flex items-center justify-center shrink-0">
            <Icon name="favorite" size={17} weight="fill" />
          </div>
          <div>
            <h2 className="text-foreground text-base sm:text-lg font-semibold tracking-tight leading-tight">{t.bodyTodayTitle}</h2>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Biometría y actividad sincronizada' : 'Biometrics & activity synced'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSync && (
            <span className="flex items-center gap-1.5 text-xs text-leaf font-medium bg-leaf/10 px-2.5 py-1 rounded-full">
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
            className="flex items-center justify-center size-8 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <Icon name="sync" size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <MetricCard
          icon="directions_walk"
          label={t.fitbitSteps}
          value={summary?.steps ? summary.steps.toLocaleString() : '—'}
          targetHint={summary?.steps ? `${Math.round((summary.steps / 8000) * 100)}% de ${targetSteps}` : `Meta: ${targetSteps}`}
          accent={{ bg: 'bg-leaf-soft', text: 'text-leaf' }}
          addLabel={`${t.bodyAdd}: ${t.manualHealthSteps}`}
          onAdd={() => setRequest({ type: 'steps', n: Date.now() })}
        />
        <MetricCard
          icon="bedtime"
          label={t.fitbitSleep}
          value={summary ? formatSleep(summary.sleep_duration_seconds) : '—'}
          targetHint={summary?.sleep_duration_seconds ? targetSleep : `Objetivo: ${targetSleep}`}
          accent={{ bg: 'bg-blossom-soft', text: 'text-blossom' }}
          addLabel={`${t.bodyAdd}: ${t.manualHealthSleep}`}
          onAdd={() => setRequest({ type: 'sleep', n: Date.now() })}
        />
        <MetricCard
          icon="fitness_center"
          label={t.manualHealthActivity}
          value={activityValue()}
          targetHint={summary?.active_minutes ? `${summary.active_minutes}/30 min` : `Meta: ${targetActivity}`}
          accent={{ bg: 'bg-coral/10', text: 'text-coral' }}
          addLabel={`${t.bodyAdd}: ${t.manualHealthActivity}`}
          onAdd={() => setRequest({ type: 'activity', n: Date.now() })}
        />
      </div>

      {summary && (heartRate || summary.distance_meters > 0 || (!hideNumbers && (summary.weight_kg ?? 0) > 0)) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
          {heartRate ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-muted-foreground">
              <Icon name="favorite" size={13} weight="fill" className="text-blossom" />
              <span>{t.fitbitHeartRate}: <b className="text-foreground tabular-nums font-semibold">{heartRate} bpm</b></span>
            </span>
          ) : null}
          {summary.distance_meters > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-muted-foreground">
              <Icon name="route" size={13} weight="duotone" className="text-leaf" />
              <span>{t.distanceLabel}: <b className="text-foreground tabular-nums font-semibold">{formatDistance(summary.distance_meters)}</b></span>
            </span>
          )}
          {!hideNumbers && (summary.weight_kg ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-muted-foreground">
              <Icon name="monitor_weight" size={13} weight="duotone" className="text-peach" />
              <span>{t.weightLabel}: <b className="text-foreground tabular-nums font-semibold">{summary.weight_kg!.toFixed(1)} kg</b></span>
            </span>
          )}
        </div>
      )}

      <ManualHealthEntry request={request} onChanged={() => void fetchSummary({ silent: true })} />

      {tokenConfigured === false && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blossom hover:underline self-start pt-1"
        >
          <Icon name="watch" size={14} />
          <span>{t.bodyConnectHint}</span>
          <Icon name="arrow_forward" size={12} />
        </Link>
      )}
    </section>
  );
};

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  targetHint: string;
  accent: {
    bg: string;
    text: string;
  };
  addLabel: string;
  onAdd: () => void;
}

function MetricCard({
  icon,
  label,
  value,
  targetHint,
  accent,
  addLabel,
  onAdd,
}: MetricCardProps) {
  const hasValue = value !== '—';

  return (
    <div
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd();
        }
      }}
      className="group bg-secondary/40 hover:bg-secondary/65 border border-border/70 hover:border-primary/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs select-none"
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`size-8 rounded-xl ${accent.bg} ${accent.text} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
            <Icon name={icon} size={16} weight="duotone" />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          aria-label={addLabel}
          title={addLabel}
          className="size-7 rounded-full bg-card/90 border border-border/60 text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/10 text-xs font-bold flex items-center justify-center transition-all shrink-0 shadow-2xs"
        >
          <Icon name="add" size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 mt-0.5">
        <span className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums leading-tight ${hasValue ? 'text-foreground' : 'text-foreground/80'}`}>
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground/80 font-medium truncate">
          {targetHint}
        </span>
      </div>
    </div>
  );
}

export default HealthConnectWidget;
