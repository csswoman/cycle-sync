'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/useHabits';
import { Icon } from '@/components/ui/Icon';

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
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-border/60 flex justify-between items-center bg-card/60">
        <h3 className="text-foreground text-sm font-semibold flex items-center gap-2">
          <Icon name="check_circle" size={18} weight="duotone" className="text-blossom" />
          Daily Habits
        </h3>
        <button
          onClick={() => router.push('/habits')}
          className="text-blossom text-xs font-semibold hover:text-blossom/80 transition-colors flex items-center gap-1"
        >
          View All
          <Icon name="arrow_forward" size={14} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Overall Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${dailyProgress === 100 ? 'bg-leaf' : 'bg-blossom'}`}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">{dailyProgress}%</span>
        </div>

        {/* Individual Habits */}
        <div className="flex flex-col gap-2.5">
          {habits.slice(0, 4).map((habit) => {
            const log = getLogForHabit(habit.id);
            const isComplete = log?.completed ?? false;
            const currentVal = log?.value ?? 0;
            const goal = habit.goal ?? 1;
            const icon = HABIT_ICONS[habit.type] || 'star';
            const color = HABIT_COLORS[habit.type] || 'text-primary';

            return (
              <div key={habit.id} className="flex items-center gap-2.5 py-1">
                <Icon
                  name={isComplete ? 'check_circle' : icon}
                  size={18}
                  weight={isComplete ? 'fill' : 'duotone'}
                  className={isComplete ? 'text-leaf' : color}
                />
                <span className={`text-xs flex-1 ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'} font-medium`}>
                  {habit.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
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
