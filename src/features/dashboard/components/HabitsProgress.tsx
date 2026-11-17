'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/useHabits';
import { Icon } from '@/components/ui/Icon';
import { Bloom } from '@/components/ui/Bloom';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Habit } from '@/types';

const HABIT_ICONS: Record<string, string> = {
  water: 'water_drop',
  sleep: 'bedtime',
  mindfulness: 'self_improvement',
  custom: 'star',
};

const HABIT_COLORS: Record<string, string> = {
  water: 'text-sage',
  sleep: 'text-blossom',
  mindfulness: 'text-leaf',
  custom: 'text-sun',
};

/** Amount added per tap in the quick view. Custom habits are toggled instead. */
const STEP: Record<string, number> = { water: 1, sleep: 1, mindfulness: 5 };

const COPY = {
  es: {
    title: 'Hábitos de hoy',
    all: 'Ver todo',
    names: { water: 'Agua', sleep: 'Sueño', mindfulness: 'Mindfulness' } as Record<string, string>,
    units: { glasses: 'vasos', hours: 'h', minutes: 'min' } as Record<string, string>,
    add: 'Sumar',
    toggle: 'Marcar',
  },
  en: {
    title: "Today's habits",
    all: 'View all',
    names: { water: 'Water', sleep: 'Sleep', mindfulness: 'Mindfulness' } as Record<string, string>,
    units: { glasses: 'glasses', hours: 'h', minutes: 'min' } as Record<string, string>,
    add: 'Add',
    toggle: 'Mark',
  },
};

export const HabitsProgress: React.FC = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = COPY[language === 'es' ? 'es' : 'en'];
  const { habits, loading, getLogForHabit, dailyProgress, logHabit } = useHabits();

  const quickLog = (habit: Habit) => {
    const log = getLogForHabit(habit.id);
    const goal = habit.goal ?? 1;
    const step = STEP[habit.type];
    if (!step) {
      const completed = !log?.completed;
      logHabit(habit.id, completed ? goal : 0, completed);
      return;
    }
    const next = (log?.value ?? 0) + step;
    logHabit(habit.id, next, next >= goal);
  };

  const quickDecrement = (habit: Habit) => {
    const log = getLogForHabit(habit.id);
    const goal = habit.goal ?? 1;
    const step = STEP[habit.type];
    if (!step) {
      logHabit(habit.id, 0, false);
      return;
    }
    const current = log?.value ?? 0;
    const next = Math.max(0, current - step);
    logHabit(habit.id, next, next >= goal);
  };

  if (loading) {
    return <div className="bg-card rounded-3xl border border-border p-5 animate-pulse h-32" />;
  }

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-border/60 flex justify-between items-center gap-2 bg-card/60">
        <h3 className="text-foreground text-sm font-semibold flex items-center gap-1.5 sm:gap-2 truncate">
          {/* The plant grows as today's habits get done. */}
          <Bloom
            growth={0.08 + (dailyProgress / 100) * 0.92}
            tone={dailyProgress >= 100 ? 'ovulation' : 'follicular'}
            className="h-8 sm:h-9 w-auto -my-2 shrink-0"
          />
          <span className="truncate">{copy.title}</span>
          <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0">{dailyProgress}%</span>
        </h3>
        <button
          onClick={() => router.push('/habits')}
          className="text-blossom text-xs font-semibold hover:text-blossom/80 transition-colors flex items-center gap-1 shrink-0"
        >
          {copy.all}
          <Icon name="arrow_forward" size={14} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {habits.slice(0, 5).map((habit) => {
          const log = getLogForHabit(habit.id);
          const isComplete = log?.completed ?? false;
          const currentVal = log?.value ?? 0;
          const goal = habit.goal ?? 1;
          const pct = Math.min(Math.round((currentVal / goal) * 100), 100);
          const icon = HABIT_ICONS[habit.type] || 'star';
          const color = HABIT_COLORS[habit.type] || 'text-primary';
          const step = STEP[habit.type];
          const unit = habit.unit ? (copy.units[habit.unit] ?? habit.unit) : '';
          return (
            <div key={habit.id} className="flex items-center gap-3">
              <Icon
                name={isComplete ? 'check_circle' : icon}
                size={20}
                weight={isComplete ? 'fill' : 'duotone'}
                className={isComplete ? 'text-leaf' : color}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs font-medium text-foreground truncate">
                    {copy.names[habit.type] ?? habit.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {currentVal}/{goal} {unit}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-leafy' : 'bg-garden'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {step && currentVal > 0 && (
                  <button
                    type="button"
                    onClick={() => quickDecrement(habit)}
                    aria-label={`-${step} ${copy.names[habit.type] ?? habit.name}`}
                    title={`-${step}`}
                    className="size-7 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-bold flex items-center justify-center transition-colors"
                  >
                    -{step}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => quickLog(habit)}
                  aria-label={`${step ? copy.add : copy.toggle} ${copy.names[habit.type] ?? habit.name}`}
                  title={step ? `+${step}` : copy.toggle}
                  className="h-7 min-w-7 px-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-0.5 transition-colors"
                >
                  {step ? <>+{step}</> : <Icon name="check_circle" size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
