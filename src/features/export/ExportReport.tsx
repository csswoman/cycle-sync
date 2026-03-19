'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import type { DailyLog, PCOSSymptomEntry, Habit, HabitLog } from '@/types';

export default function ExportReport() {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    dailyLogCount: 0,
    pcosEntryCount: 0,
    habitCount: 0,
  });

  const [reportData, setReportData] = useState<{
    userName: string;
    cycleLength: number;
    lastPeriodStart: string | null;
    dailyLogs: DailyLog[];
    pcosEntries: PCOSSymptomEntry[];
    habits: Habit[];
    habitLogs: HabitLog[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekStr = sevenDaysAgo.toISOString().split('T')[0];

      const [configRes, logsRes, pcosRes, habitsRes, habitLogsRes] = await Promise.all([
        supabase.from('cycle_config').select('*').eq('user_id', user.id).single(),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', dateStr).order('date'),
        supabase.from('pcos_symptoms').select('*').eq('user_id', user.id).gte('date', dateStr).order('date'),
        supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', weekStr),
      ]);

      const dailyLogs = (logsRes.data as DailyLog[]) ?? [];
      const pcosEntries = (pcosRes.data as PCOSSymptomEntry[]) ?? [];
      const habits = (habitsRes.data as Habit[]) ?? [];
      const habitLogs = (habitLogsRes.data as HabitLog[]) ?? [];

      setStats({
        dailyLogCount: dailyLogs.length,
        pcosEntryCount: pcosEntries.length,
        habitCount: habits.length,
      });

      setReportData({
        userName: user.user_metadata?.full_name || user.email || 'Patient',
        cycleLength: configRes.data?.cycle_length ?? 28,
        lastPeriodStart: configRes.data?.last_period_start ?? null,
        dailyLogs,
        pcosEntries,
        habits,
        habitLogs,
      });

      setLoading(false);
    }
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      const [{ generateMedicalReport }, { default: jsPDF }] = await Promise.all([
        import('@/services/medicalReportService'),
        import('jspdf'),
      ]);
      generateMedicalReport(
        {
          ...reportData,
          cycleInfo: cycleInfo ?? null,
          generatedAt: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        jsPDF,
      );
    } finally {
      setGenerating(false);
    }
  };

  const isLoading = loading || cycleLoading;

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-[800px] mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
            Medical Report
          </h1>
          <p className="text-muted-foreground text-base">
            Generate a comprehensive PDF report to share with your healthcare provider.
          </p>
        </div>

        {/* Preview Card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">description</span>
              <div>
                <h2 className="text-lg font-bold">CycleSync Health Report</h2>
                <p className="text-sm opacity-90">Comprehensive cycle & wellness data</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <h3 className="text-foreground font-bold text-sm uppercase tracking-wider">
              Report Contents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <span className="material-symbols-outlined text-blue-500">calendar_today</span>
                </div>
                <div>
                  <p className="text-foreground font-bold text-lg">
                    {isLoading ? '...' : stats.dailyLogCount}
                  </p>
                  <p className="text-muted-foreground text-xs">Daily Logs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <span className="material-symbols-outlined text-purple-500">medical_services</span>
                </div>
                <div>
                  <p className="text-foreground font-bold text-lg">
                    {isLoading ? '...' : stats.pcosEntryCount}
                  </p>
                  <p className="text-muted-foreground text-xs">PCOS Entries</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                </div>
                <div>
                  <p className="text-foreground font-bold text-lg">
                    {isLoading ? '...' : stats.habitCount}
                  </p>
                  <p className="text-muted-foreground text-xs">Active Habits</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-foreground font-bold text-sm uppercase tracking-wider">
                Included Sections
              </h3>
              {[
                { icon: 'water_drop', label: 'Cycle phase, day, and length overview', color: 'text-primary' },
                { icon: 'monitoring', label: 'Energy, sleep, and mood trends (30 days)', color: 'text-blue-500' },
                { icon: 'medical_services', label: 'PCOS symptom severity with clinical alerts', color: 'text-red-500' },
                { icon: 'bar_chart', label: 'Top symptom frequency analysis', color: 'text-orange-500' },
                { icon: 'check_circle', label: 'Habit completion rates (7 days)', color: 'text-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                  <span className="text-foreground text-sm">{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || generating || !reportData}
              className="mt-4 w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-xl px-6 py-4 font-bold text-base hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {generating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">download</span>
                  Download PDF Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
          <span className="material-symbols-outlined text-muted-foreground text-[20px] mt-0.5">info</span>
          <p className="text-muted-foreground text-xs leading-relaxed">
            This report is generated from your self-reported data and is intended to assist healthcare
            providers during consultations. It does not constitute medical advice or diagnosis.
            Always consult a qualified healthcare professional for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
