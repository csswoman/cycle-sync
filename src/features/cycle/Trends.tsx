'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import type { DailyLog } from '@/types';

interface SymptomCount {
  name: string;
  count: number;
}

const Trends: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setLogs((data as DailyLog[]) ?? []);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const symptomCounts: SymptomCount[] = (() => {
    const map: Record<string, number> = {};
    logs.forEach((log) => {
      (log.symptoms ?? []).forEach((s) => {
        map[s] = (map[s] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const topSymptom = symptomCounts[0]?.name ?? 'None logged';
  const avgEnergy = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.energy_level ?? 0), 0) / logs.length).toFixed(1)
    : '--';

  const phase = cycleInfo?.phase ?? '...';
  const cycleDay = cycleInfo?.cycleDay ?? 0;
  const cycleLength = cycleInfo?.cycleLength ?? 28;
  const progressPct = cycleLength > 0 ? Math.round((cycleDay / cycleLength) * 100) : 0;

  const readinessLabel = Number(avgEnergy) >= 7 ? 'High Intensity' : Number(avgEnergy) >= 4 ? 'Moderate' : 'Low Intensity';
  const readinessTag = Number(avgEnergy) >= 7 ? 'Performance Ready' : Number(avgEnergy) >= 4 ? 'Balanced' : 'Recovery Focus';

  const symptomStyle = (idx: number) => {
    if (idx === 0) return 'px-4 py-2 rounded-lg bg-red-500/20 text-red-500 font-bold text-lg border border-red-500/20';
    if (idx === 1) return 'px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-base border border-orange-500/20';
    if (idx === 2) return 'px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-base border border-primary/20';
    return 'px-2 py-1 rounded-lg bg-secondary text-muted-foreground text-sm';
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-[1400px] mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">My Patterns</h1>
            <p className="text-muted-foreground text-base font-normal">
              {loading ? 'Loading data...' : `Analyzing ${logs.length} logged days`}
            </p>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">water_drop</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Current Phase</p>
              <div className="flex items-baseline gap-2">
                <p className="text-foreground text-2xl font-bold">{phase}</p>
                <span className="text-primary font-semibold text-lg">Day {cycleDay}</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">battery_charging_full</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Avg Energy (30d)</p>
              <p className="text-foreground text-2xl font-bold">{avgEnergy}/10 — {readinessLabel}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">{readinessTag}</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">medical_services</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Top Symptom</p>
              <p className="text-foreground text-2xl font-bold">{topSymptom}</p>
            </div>
            <div className="mt-4 flex gap-2">
              {symptomCounts.length > 0 && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {symptomCounts[0].count}x in 30 days
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart + Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-foreground text-lg font-bold">Cycle vs. Performance</h3>
                <p className="text-muted-foreground text-sm">Correlating energy levels with hormonal phases</p>
              </div>
            </div>
            {/* Energy bars from real data */}
            <div className="flex-1 w-full relative">
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground text-right pr-2">
                <span>10</span><span>5</span><span>0</span>
              </div>
              <div className="absolute left-10 right-0 top-2 bottom-8 flex items-end gap-[2px]">
                {logs.length > 0 ? logs.map((log, i) => {
                  const h = ((log.energy_level ?? 5) / 10) * 100;
                  return (
                    <div
                      key={log.id}
                      className="flex-1 bg-primary/40 hover:bg-primary/70 rounded-t transition-all"
                      style={{ height: `${h}%` }}
                      title={`${log.date}: Energy ${log.energy_level}/10`}
                    />
                  );
                }) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Log daily check-ins to see your energy chart
                  </div>
                )}
              </div>
              <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                {logs.length > 0 ? (
                  <>
                    <span>{logs[0]?.date?.slice(5)}</span>
                    <span>{logs[logs.length - 1]?.date?.slice(5)}</span>
                  </>
                ) : (
                  <span>No data yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl p-6 bg-primary text-primary-foreground shadow-lg flex flex-col justify-between min-h-[180px] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-primary-foreground/10">
                <span className="material-symbols-outlined text-[120px]">lightbulb</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="text-sm font-bold uppercase tracking-wide opacity-90 text-primary-foreground">Insight</span>
                </div>
                <h4 className="text-xl font-bold leading-snug mb-2">
                  {Number(avgEnergy) >= 7 ? 'High Energy Phase!' : Number(avgEnergy) >= 4 ? 'Steady Energy' : 'Recovery Mode'}
                </h4>
                <p className="opacity-90 text-sm leading-relaxed text-primary-foreground">
                  Your average energy over the last 30 days is <span className="font-bold">{avgEnergy}/10</span>.
                  {Number(avgEnergy) < 5 ? ' Consider prioritizing rest and anti-inflammatory nutrition.' : ' Great time to push your training goals.'}
                </p>
              </div>
            </div>

            <div className="flex-1 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col">
              <h3 className="text-foreground text-lg font-bold mb-4">Avg Sleep</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <span className="material-symbols-outlined">bedtime</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                  <p className="text-lg font-bold text-foreground">
                    {logs.length > 0
                      ? `${(logs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / logs.length).toFixed(1)}h`
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Symptom Cloud */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-foreground text-lg font-bold">Symptom Frequency</h3>
              <span className="text-xs text-muted-foreground">Last 30 Days</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {symptomCounts.length > 0 ? symptomCounts.map((s, i) => (
                <div key={s.name} className={symptomStyle(i)}>
                  {s.name} ({s.count})
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">No symptoms logged yet. Start daily check-ins to see patterns.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl p-6 bg-secondary border border-border/50 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full shrink-0">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground text-lg font-bold">Did you know?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {phase === 'Luteal'
                  ? 'In the Luteal phase, your body temperature rises and insulin sensitivity decreases. Focus on steady-state cardio and complex carbs to manage bloating and cravings.'
                  : phase === 'Menstrual'
                  ? 'During menstruation, iron levels drop. Include iron-rich foods like spinach, lentils, and lean red meat to maintain energy.'
                  : phase === 'Ovulation'
                  ? 'At ovulation, estrogen peaks and you may feel strongest. This is the best time for PRs and high-intensity training.'
                  : 'In the Follicular phase, rising estrogen improves recovery. Great time to increase training volume and try new exercises.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;
