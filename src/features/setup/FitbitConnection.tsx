'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { FitbitDailySummary } from '@/services/fitbitService';

interface FitbitStatus {
  connected: boolean;
  fitbitUserId: string | null;
}

const FitbitConnection: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<FitbitStatus>({ connected: false, fitbitUserId: null });
  const [summary, setSummary] = useState<FitbitDailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/fitbit/status');
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        await fetchSummary();
      }
    } catch {
      setStatus({ connected: false, fitbitUserId: null });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/fitbit/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Silently fail
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('fitbit') === 'connected') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkStatus]);

  const handleConnect = () => {
    window.location.href = '/api/auth/fitbit/authorize';
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/auth/fitbit/disconnect', { method: 'POST' });
      setStatus({ connected: false, fitbitUserId: null });
      setSummary(null);
    } catch {
      // Silently fail
    } finally {
      setDisconnecting(false);
    }
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">{t.fitbitLoading}</span>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t.fitbitDescription}</p>
        <button
          onClick={handleConnect}
          className="w-fit flex items-center gap-2 px-6 h-12 rounded-xl bg-[#00B0B9] text-white font-bold hover:bg-[#009AA3] transition-all"
        >
          <span className="material-symbols-outlined text-xl">watch</span>
          {t.fitbitConnect}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {t.fitbitConnected}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSummary}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {t.fitbitSync}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">link_off</span>
            {t.fitbitDisconnect}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon="directions_walk"
            label={t.fitbitSteps}
            value={summary.steps.toLocaleString()}
            color="text-blue-500"
          />
          <MetricCard
            icon="favorite"
            label={t.fitbitHeartRate}
            value={summary.restingHeartRate ? `${summary.restingHeartRate} bpm` : '—'}
            color="text-red-500"
          />
          <MetricCard
            icon="bedtime"
            label={t.fitbitSleep}
            value={summary.sleep ? formatMinutes(summary.sleep.minutesAsleep) : '—'}
            color="text-indigo-500"
          />
          <MetricCard
            icon="local_fire_department"
            label={t.fitbitCalories}
            value={summary.calories ? summary.calories.toLocaleString() : '—'}
            color="text-orange-500"
          />
        </div>
      )}

      {summary?.sleep && (
        <div className="bg-secondary/50 rounded-xl p-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            {t.fitbitSleepDetails}
          </h4>
          <div className="flex gap-4 text-sm">
            <SleepStage label="Deep" minutes={summary.sleep.deepMinutes} color="bg-indigo-500" />
            <SleepStage label="Light" minutes={summary.sleep.lightMinutes} color="bg-blue-400" />
            <SleepStage label="REM" minutes={summary.sleep.remMinutes} color="bg-purple-500" />
          </div>
        </div>
      )}
    </div>
  );
};

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-black text-foreground">{value}</span>
    </div>
  );
}

function SleepStage({ label, minutes, color }: { label: string; minutes: number; color: string }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${color}`} />
      <div>
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground ml-1">
          {h > 0 ? `${h}h ${m}m` : `${m}m`}
        </span>
      </div>
    </div>
  );
}

export default FitbitConnection;
