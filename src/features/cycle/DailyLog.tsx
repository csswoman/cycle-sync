import React, { useState } from 'react';
import { Mood } from '@/types';
import { MoodSelector } from './components/MoodSelector';
import { VitalsInputs } from './components/VitalsInputs';
import { SymptomGrid } from './components/SymptomGrid';

const DailyLog: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.GOOD);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>(['Mild Cramps']);

  const toggleSymptom = (symptom: string) => {
    if (activeSymptoms.includes(symptom)) {
      setActiveSymptoms(activeSymptoms.filter(s => s !== symptom));
    } else {
      setActiveSymptoms([...activeSymptoms, symptom]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 pb-24 h-full scrollbar-hide">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Daily Log</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              <p className="text-sm font-medium">Log your symptoms and mood for Day 14</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <MoodSelector selectedMood={selectedMood} onMoodSelect={setSelectedMood} />

            <VitalsInputs
              energyLevel={energyLevel}
              onEnergyLevelChange={setEnergyLevel}
              sleepHours={sleepHours}
              onSleepHoursChange={setSleepHours}
            />

            <SymptomGrid activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />

            <button className="hidden md:flex w-full bg-primary hover:bg-primary-hover text-primary-foreground text-lg font-bold py-4 rounded-xl items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(127,25,230,0.2)] hover:shadow-[0_0_30px_rgba(127,25,230,0.4)]">
              <span className="material-symbols-outlined">check_circle</span>
              Complete Check-in
            </button>
          </div>

          {/* Sidebar Context */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-secondary to-accent/20 border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-9xl text-foreground">water_drop</span>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-1 relative z-10">Cycle Phase</h3>
              <p className="text-primary font-bold text-2xl mb-4 relative z-10">Ovulation</p>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs text-muted-foreground">Day 14</span>
                <span className="text-xs text-foreground font-bold">Peak Fertility</span>
                <span className="text-xs text-muted-foreground">Day 28</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-gradient-to-r from-purple-900 via-primary to-purple-900 w-1/2 rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed relative z-10">
                Estrogen levels are at their peak. You might feel more energetic and social today. Great time for HIIT workouts.
              </p>
            </div>

            <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg text-primary">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h4 className="text-foreground font-bold">Daily Insight</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PCOS Tip: Since you're in the ovulation phase, consider adding more cruciferous vegetables (broccoli, kale) to lunch to help metabolize excess estrogen.
              </p>
              <button className="text-primary text-sm font-bold self-start hover:underline">Read more</button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur border-t border-border z-30">
        <button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-lg font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
          <span className="material-symbols-outlined">check_circle</span>
          Log Today
        </button>
      </div>
    </div>
  );
};

export default DailyLog;
