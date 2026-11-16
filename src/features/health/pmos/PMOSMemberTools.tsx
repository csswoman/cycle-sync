'use client';
import React from 'react';
import { useAppStore } from '@/stores/appStore';
import PeriodForecastCard from './PeriodForecastCard';
import BodyMetricsSection from './BodyMetricsSection';
import LabResultsSection from './LabResultsSection';

/** Tracking tools that store personal health data, so they only render for signed-in users. */
const PMOSMemberTools: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const authReady = useAppStore((s) => s.authReady);
  const setSignupPromptOpen = useAppStore((s) => s.setSignupPromptOpen);

  if (!authReady) return null;

  if (!user) {
    return (
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            Track glucose, labs and your cycle range
          </h3>
          <p className="text-muted-foreground text-sm">
            Create a free account to log glucose, insulin, weight, waist and lab results, and to get a period prediction
            range based on your own cycles.
          </p>
        </div>
        <button
          onClick={() => setSignupPromptOpen(true)}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl"
        >
          Create account
        </button>
      </section>
    );
  }

  return (
    <>
      <PeriodForecastCard />
      <BodyMetricsSection />
      <LabResultsSection />
    </>
  );
};

export default PMOSMemberTools;
