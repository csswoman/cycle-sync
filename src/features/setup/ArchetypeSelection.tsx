import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ArchetypeSelectionProps {
  onComplete: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ArchetypeSelection: React.FC<ArchetypeSelectionProps> = ({ onComplete, isDarkMode, toggleDarkMode }) => {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full overflow-y-auto transition-colors duration-300">
      <header className="w-full border-b border-border bg-background z-10 sticky top-0">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_florist</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight">CycleSync</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[960px] mx-auto flex flex-col gap-8 md:gap-12 py-10 px-6">
        {/* PageHeading */}
        <div className="flex flex-col gap-4 text-center items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight max-w-2xl text-foreground">
            Welcome. Let's personalize your experience.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg font-normal leading-relaxed max-w-2xl">
            Select the profile that best matches your current health goals. All data is stored locally on your device for maximum privacy.
          </p>
        </div>


        {/* FeatureSection / Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          {/* Card 1: Performance Optimizer */}
          <label className={`group relative flex flex-col gap-4 rounded-xl border-2 ${selectedArchetype === 'performance' ? 'border-primary bg-card' : 'border-border bg-card/50'} p-6 md:p-8 cursor-pointer hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300`}>
            <input
              className="peer sr-only"
              name="archetype"
              type="radio"
              value="performance"
              checked={selectedArchetype === 'performance'}
              onChange={() => setSelectedArchetype('performance')}
            />
            {/* Checkmark indicator (visible when selected) */}
            <div className={`absolute top-4 right-4 text-primary transition-opacity ${selectedArchetype === 'performance' ? 'opacity-100' : 'opacity-0'}`}>
              <span className="material-symbols-outlined filled">check_circle</span>
            </div>
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[32px]">trending_up</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-foreground">Performance Optimizer</h3>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">For regular cycles</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Optimize athletic performance by training in sync with your follicular and luteal phases. Push harder when estrogen is high, and recover when progesterone peaks.
              </p>
            </div>
          </label>


          {/* Card 2: PCOS Manager */}
          <label className={`group relative flex flex-col gap-4 rounded-xl border-2 ${selectedArchetype === 'pcos' ? 'border-primary bg-card' : 'border-border bg-card/50'} p-6 md:p-8 cursor-pointer hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300`}>
            <input
              className="peer sr-only"
              name="archetype"
              type="radio"
              value="pcos"
              checked={selectedArchetype === 'pcos'}
              onChange={() => setSelectedArchetype('pcos')}
            />
            {/* Checkmark indicator */}
            <div className={`absolute top-4 right-4 text-primary transition-opacity ${selectedArchetype === 'pcos' ? 'opacity-100' : 'opacity-0'}`}>
              <span className="material-symbols-outlined filled">check_circle</span>
            </div>
            <div className="size-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[32px]">spa</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-foreground">PCOS Manager</h3>
              <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider">For symptom management</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                For women managing Polycystic Ovary Syndrome. Focus on hormonal balance, insulin sensitivity, and holistic symptom reduction through low-impact consistency.
              </p>
            </div>
          </label>

        </div>

        {/* SingleButton & Privacy Note */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <button
            onClick={onComplete}
            disabled={!selectedArchetype}
            className="w-full max-w-[480px] h-14 flex items-center justify-center rounded-xl bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start My Journey
          </button>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Your data is encrypted and stored locally.</span>
            </div>
            <a className="text-muted-foreground text-sm font-normal underline hover:text-primary transition-colors" href="#">
              Not sure which one to pick? Learn more here.
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ArchetypeSelection;