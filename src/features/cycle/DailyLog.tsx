import React, { useState } from 'react';
import { Mood } from '@/types';

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

  const symptoms = ['Mild Cramps', 'Bloating', 'Headache', 'Acne Flare', 'High Libido', 'Sugar Cravings', 'Back Pain'];

  const moodOptions = [
    { type: Mood.ROUGH, icon: 'sentiment_very_dissatisfied' },
    { type: Mood.DOWN, icon: 'sentiment_dissatisfied' },
    { type: Mood.OKAY, icon: 'sentiment_neutral' },
    { type: Mood.GOOD, icon: 'sentiment_satisfied' },
    { type: Mood.GREAT, icon: 'sentiment_very_satisfied' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background-dark p-6 md:p-10 pb-24 h-full scrollbar-hide">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* HEADING SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Daily Log</h1>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              <p className="text-sm font-medium">Log your symptoms and mood for Day 14</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: MAIN INPUTS */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* 1. MENTAL STATE CARD */}
            <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">mood</span>
                  Mood & Mental State
                </h3>
              </div>
              <div className="grid grid-cols-5 gap-2 md:gap-4">
                {moodOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedMood(option.type)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div className={`size-12 md:size-14 rounded-full flex items-center justify-center border-2 transition-all
                      ${selectedMood === option.type
                        ? 'bg-primary border-primary shadow-[0_0_15px_rgba(127,25,230,0.4)]'
                        : 'bg-surface-dark border-transparent group-hover:border-primary/50'}`}
                    >
                      <span className={`material-symbols-outlined text-3xl ${selectedMood === option.type ? 'text-white' : 'text-text-secondary group-hover:text-white'}`}>
                        {option.icon}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${selectedMood === option.type ? 'text-white font-bold' : 'text-text-secondary group-hover:text-white'}`}>
                      {option.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. VITALS & PHYSICAL CARD */}
            <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 hover:border-primary/50 transition-colors flex flex-col md:flex-row gap-8">
              {/* Energy Slider */}
              <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    Energy
                  </h3>
                  <span className="text-primary font-bold text-lg">{energyLevel}/10</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <input
                    className="w-full h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer z-10"
                    max="10"
                    min="1"
                    type="range"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-l-lg pointer-events-none" style={{ width: `${energyLevel * 10}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-text-secondary font-medium px-1">
                  <span>Exhausted</span>
                  <span>Energized</span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px bg-surface-dark hidden md:block"></div>

              {/* Sleep Input */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">bedtime</span>
                  Sleep Quality
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSleepHours(Math.max(0, sleepHours - 0.5))}
                    className="size-10 rounded-lg bg-surface-dark hover:bg-surface-dark-hover flex items-center justify-center text-white transition-colors">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="flex-1 text-center bg-surface-dark/50 rounded-lg py-2 border border-surface-dark">
                    <span className="text-2xl font-bold text-white">{sleepHours}</span>
                    <span className="text-xs text-text-secondary ml-1">hrs</span>
                  </div>
                  <button
                    onClick={() => setSleepHours(sleepHours + 0.5)}
                    className="size-10 rounded-lg bg-surface-dark hover:bg-surface-dark-hover flex items-center justify-center text-white transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  {['Restless', 'Solid', 'Deep'].map((quality) => (
                    <button key={quality} className={`flex-1 py-1.5 rounded text-xs transition-colors
                      ${quality === 'Solid' ? 'bg-primary/20 text-white border border-primary/50' : 'bg-surface-dark text-text-secondary hover:bg-primary/20 hover:text-white'}`}>
                      {quality}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. SYMPTOMS QUICK SELECT */}
            <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 hover:border-primary/50 transition-colors">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">stethoscope</span>
                Symptom Quick-Log
              </h3>
              <div className="flex flex-wrap gap-3">
                {symptoms.map(symptom => {
                  const isActive = activeSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                        ${isActive
                          ? 'bg-primary text-white border-primary shadow-[0_4px_10px_rgba(127,25,230,0.3)]'
                          : 'bg-surface-dark text-text-secondary border-transparent hover:bg-surface-dark-hover hover:text-white'}`}
                    >
                      {isActive && <span className="material-symbols-outlined text-[18px]">check</span>}
                      {symptom}
                    </button>
                  );
                })}
                <button className="px-4 py-2 rounded-full border border-surface-dark border-dashed text-text-secondary text-sm font-medium hover:text-white hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-1 pl-3">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Other
                </button>
              </div>
            </div>

            {/* Submit Button Desktop */}
            <button className="hidden md:flex w-full bg-primary hover:bg-primary-hover text-white text-lg font-bold py-4 rounded-xl items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(127,25,230,0.2)] hover:shadow-[0_0_30px_rgba(127,25,230,0.4)]">
              <span className="material-symbols-outlined">check_circle</span>
              Complete Check-in
            </button>
          </div>

          {/* RIGHT COLUMN: CONTEXT & TIPS */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Cycle Visualization Card */}
            <div className="bg-gradient-to-br from-surface-dark to-[#2a1b38] border border-surface-dark rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-9xl text-white">water_drop</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1 relative z-10">Cycle Phase</h3>
              <p className="text-primary font-bold text-2xl mb-4 relative z-10">Ovulation</p>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs text-text-secondary">Day 14</span>
                <span className="text-xs text-white font-bold">Peak Fertility</span>
                <span className="text-xs text-text-secondary">Day 28</span>
              </div>
              <div className="w-full h-3 bg-surface-dark rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-gradient-to-r from-purple-900 via-primary to-purple-900 w-1/2 rounded-full"></div>
              </div>
              <p className="text-xs text-text-secondary mt-4 leading-relaxed relative z-10">
                Estrogen levels are at their peak. You might feel more energetic and social today. Great time for HIIT workouts.
              </p>
            </div>

            {/* Daily Tip Card */}
            <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg text-primary">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h4 className="text-white font-bold">Daily Insight</h4>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                PCOS Tip: Since you're in the ovulation phase, consider adding more cruciferous vegetables (broccoli, kale) to lunch to help metabolize excess estrogen.
              </p>
              <button className="text-primary text-sm font-bold self-start hover:underline">Read more</button>
            </div>

            {/* Previous Data Mini-View */}
            <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6">
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider text-text-secondary">Yesterday's Log</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Mood</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-yellow-400">sentiment_satisfied</span> Good
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Energy</span>
                  <div className="w-24 h-2 bg-surface-dark rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[60%]"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Symptoms</span>
                  <span className="text-white bg-surface-dark px-2 py-0.5 rounded text-xs">Bloating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FOOTER BUTTON */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-background-dark/95 backdrop-blur border-t border-surface-dark z-30">
        <button className="w-full bg-primary hover:bg-primary-hover text-white text-lg font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
          <span className="material-symbols-outlined">check_circle</span>
          Log Today
        </button>
      </div>
    </div>
  );
};

export default DailyLog;