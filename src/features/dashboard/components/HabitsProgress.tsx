'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/useHabits';

const HABIT_ICONS: Record<string, string> = {
  water: 'water_drop',
  sleep: 'bedtime',
  mindfulness: 'self_improvement',
  custom: 'star',
};

const HABIT_COLORS: Record<string, string> = {
  water: 'text-blue-400',
  sleep: 'text-indigo-400',
  mindfulness: 'text-emerald-400',
  custom: 'text-amber-400',
};

export const HabitsProgress: React.FC = () => {
  const router = useRouter();
  const { habits, loading, getLogForHabit, dailyProgress } = useHabits();

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 animate-pulse h-32" />
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
        <h3 className="text-foreground text-base font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
          Daily Habits
        </h3>
        <button
          onClick={() => router.push('/habits')}
          className="text-primary text-xs font-bold hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          View All
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Overall Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${dailyProgress === 100 ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-foreground">{dailyProgress}%</span>
        </div>

        {/* Individual Habits */}
        <div className="flex flex-col gap-2">
          {habits.slice(0, 4).map((habit) => {
            const log = getLogForHabit(habit.id);
            const isComplete = log?.completed ?? false;
            const currentVal = log?.value ?? 0;
            const goal = habit.goal ?? 1;
            const icon = HABIT_ICONS[habit.type] || 'star';
            const color = HABIT_COLORS[habit.type] || 'text-primary';

            return (
              <div key={habit.id} className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[16px] ${isComplete ? 'text-green-500' : color}`}>
                  {isComplete ? 'check_circle' : icon}
                </span>
                <span className={`text-xs flex-1 ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'} font-medium`}>
                  {habit.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {currentVal}/{goal}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
