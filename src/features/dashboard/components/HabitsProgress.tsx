'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/useHabits';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { summarizeWeek } from '@/lib/exercise/weeklyActivity';
import WeeklyGoalCard from '@/features/health/components/WeeklyGoalCard';
import { Icon } from '@/components/ui/Icon';
import { Stem, type StemHead } from '@/components/ui/Botanical';
import { useLanguage } from '@/i18n/LanguageContext';
import { useGuest } from '@/hooks/useGuest';
import type { Habit } from '@/types';

const HABIT_ICONS: Record<string, string> = {
  water: 'water_drop',
  sleep: 'bedtime',
  mindfulness: 'self_improvement',
  custom: 'star',
};

/** Fill color of each habit's segments (CSS variables from the palette). */
const HABIT_FILL: Record<string, string> = {
  water: 'var(--leaf-fresh)',
  sleep: 'var(--petal)',
  mindfulness: 'var(--coral)',
  custom: 'var(--sun)',
};

/** Icon tint per habit, matching the fill color. */
const HABIT_TINT: Record<string, string> = {
  water: 'text-leaf',
  sleep: 'text-blossom',
  mindfulness: 'text-coral',
  custom: 'text-sun',
};

/** Petal color of each habit's flower in the garden. */
const HABIT_PETAL: Record<string, string> = {
  water: 'var(--petal-light)',
  sleep: 'var(--petal)',
  mindfulness: 'var(--coral)',
  custom: 'var(--sun)',
};
const FLOWER_HEADS: StemHead[] = ['blossom', 'daisy', 'tulip'];

interface GardenItem {
  key: string;
  type: string;
  /** 0..1 share of today's goal. */
  ratio: number;
  complete: boolean;
}

/** One stem per habit: it grows with the habit's progress and opens into a flower once the goal is met. */
const HabitGarden: React.FC<{ items: GardenItem[] }> = ({ items }) => {
  // Without habits yet, show three young stems so the card still has a picture.
  const stems: GardenItem[] = items.length
    ? items
    : ['water', 'sleep', 'mindfulness'].map((type) => ({ key: type, type, ratio: 0, complete: false }));
  return (
    <div className="absolute right-3 bottom-3 top-3 flex items-end" aria-hidden="true">
      {stems.map((item, i) => (
        <Stem
          key={item.key}
          height={0.45 + 0.5 * Math.min(1, item.ratio)}
          bend={i % 2 ? 8 : -8}
          leaves={item.complete ? 4 : 3}
          head={item.complete ? FLOWER_HEADS[i % FLOWER_HEADS.length] : 'bud'}
          petal={item.complete ? (HABIT_PETAL[item.type] ?? 'var(--petal)') : 'var(--petal-light)'}
          delay={-i * 0.9}
          duration={5 + (i % 3)}
          className="h-full w-auto -mx-3 shrink-0"
        />
      ))}
    </div>
  );
};

/** Amount one segment represents. Habits without a step (custom) are a single check. */
const STEP: Record<string, number> = { water: 1, sleep: 1, mindfulness: 5 };
const MAX_SEGMENTS = 12;

const COPY = {
  es: {
    title: 'Hábitos de hoy',
    all: 'Ver todo',
    count: (done: number, total: number) => `${done} de ${total} completos`,
    empty: 'Aún sin hábitos',
    emptyTitle: 'Agrega tus hábitos',
    emptyBody: 'Agua, sueño o mindfulness: elige los que quieras seguir.',
    guestTitle: 'Sigue tus hábitos',
    guestBody: 'Crea una cuenta para llevar agua, sueño y mindfulness día a día.',
    week: 'Esta semana',
    weekLink: 'Rutinas',
    names: { water: 'Agua', sleep: 'Sueño', mindfulness: 'Mindfulness' } as Record<string, string>,
    units: { glasses: 'vasos', hours: 'h', minutes: 'min' } as Record<string, string>,
    reach: (name: string, n: number, unit: string) => `${name}: llegar a ${n} ${unit}`.trim(),
    clear: (name: string) => `${name}: quitar un tramo`,
    toggle: (name: string) => `Marcar ${name} como hecho`,
    untoggle: (name: string) => `Desmarcar ${name}`,
  },
  en: {
    title: "Today's habits",
    all: 'View all',
    count: (done: number, total: number) => `${done} of ${total} done`,
    empty: 'No habits yet',
    emptyTitle: 'Add your habits',
    emptyBody: 'Water, sleep or mindfulness: pick what you want to track.',
    guestTitle: 'Track your habits',
    guestBody: 'Create an account to log water, sleep and mindfulness every day.',
    week: 'This week',
    weekLink: 'Routines',
    names: { water: 'Water', sleep: 'Sleep', mindfulness: 'Mindfulness' } as Record<string, string>,
    units: { glasses: 'glasses', hours: 'h', minutes: 'min' } as Record<string, string>,
    reach: (name: string, n: number, unit: string) => `${name}: reach ${n} ${unit}`.trim(),
    clear: (name: string) => `${name}: remove one segment`,
    toggle: (name: string) => `Mark ${name} as done`,
    untoggle: (name: string) => `Unmark ${name}`,
  },
};

/** How many units each tappable segment stands for, so long goals still fit in a row. */
function segmentSize(habit: Habit, step: number): number {
  const goal = habit.goal ?? 1;
  return step * Math.max(1, Math.ceil(goal / step / MAX_SEGMENTS));
}

/** `embedded`: drops the card chrome so it can sit inside TodayRhythm. */
export const HabitsProgress: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const router = useRouter();
  const { language } = useLanguage();
  const { isGuest, promptSignup } = useGuest();
  const copy = COPY[language === 'es' ? 'es' : 'en'];
  const { habits, loading, getLogForHabit, dailyProgress, logHabit } = useHabits();
  const workoutLogs = useWorkoutLogs();
  const week = useMemo(() => summarizeWeek(workoutLogs.logs), [workoutLogs.logs]);

  const setValue = (habit: Habit, value: number) => {
    const goal = habit.goal ?? 1;
    logHabit(habit.id, value, value >= goal);
  };

  if (loading) {
    return <div className={`animate-pulse h-32 ${embedded ? 'rounded-2xl bg-secondary/40' : 'bg-card rounded-3xl border border-border p-5'}`} />;
  }

  const visible = habits.slice(0, 5);
  const doneCount = visible.filter((h) => getLogForHabit(h.id)?.completed).length;

  return (
    <div className={embedded ? 'flex flex-col gap-4' : 'bg-card rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex flex-col gap-4'}>
      <div className="relative rounded-2xl bg-leaf-soft/70 overflow-hidden min-h-28 p-4 flex flex-col justify-between gap-2">
        <div className="relative z-10 flex flex-col">
          <h3 className="text-foreground text-lg font-semibold tracking-tight leading-snug text-balance">{copy.title}</h3>
          <p className="text-sm text-foreground/70 tabular-nums">
            {visible.length ? copy.count(doneCount, visible.length) : copy.empty}
          </p>
        </div>
        <div className="relative z-10 flex items-end gap-3">
          <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground leading-none">
            {dailyProgress}<span className="text-sm font-medium text-foreground/70">%</span>
          </span>
          <button
            type="button"
            onClick={() => router.push('/habits')}
            className="-mb-2 px-2 min-h-10 text-blossom text-sm font-semibold hover:text-blossom/80 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copy.all}
            <Icon name="arrow_forward" size={14} />
          </button>
        </div>
        <HabitGarden
          items={visible.map((h) => {
            const log = getLogForHabit(h.id);
            return {
              key: h.id,
              type: h.type,
              ratio: (log?.value ?? 0) / (h.goal ?? 1),
              complete: log?.completed ?? false,
            };
          })}
        />
        <span aria-hidden className="absolute bottom-0 inset-x-0 h-1.5 bg-leaf/25" />
      </div>

      {visible.length === 0 ? (
        <button
          type="button"
          onClick={() => (isGuest ? promptSignup() : router.push('/habits'))}
          className="rounded-2xl bg-secondary/50 hover:bg-secondary/80 transition-colors p-4 text-left min-h-12 cursor-pointer"
        >
          <span className="block text-sm font-medium text-foreground">{isGuest ? copy.guestTitle : copy.emptyTitle}</span>
          <span className="block text-sm text-muted-foreground text-pretty">{isGuest ? copy.guestBody : copy.emptyBody}</span>
        </button>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((habit) => {
            const log = getLogForHabit(habit.id);
            const isComplete = log?.completed ?? false;
            const current = log?.value ?? 0;
            const goal = habit.goal ?? 1;
            const step = STEP[habit.type];
            const name = copy.names[habit.type] ?? habit.name;
            const unit = habit.unit ? (copy.units[habit.unit] ?? habit.unit) : '';
            const fill = HABIT_FILL[habit.type] ?? 'var(--primary)';
            const size = step ? segmentSize(habit, step) : 0;
            const segments = step ? Math.ceil(goal / size) : 0;
            const filled = step ? Math.min(segments, Math.floor(current / size)) : 0;

            return (
              <li
                key={habit.id}
                className="rounded-2xl p-3.5 flex flex-col gap-2 transition-colors duration-300"
                style={{ background: `color-mix(in srgb, ${fill} ${isComplete ? 26 : 14}%, transparent)` }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={isComplete ? 'check_circle' : (HABIT_ICONS[habit.type] ?? 'star')}
                    size={22}
                    weight={isComplete ? 'fill' : 'regular'}
                    className={`shrink-0 ${isComplete ? 'text-leaf' : (HABIT_TINT[habit.type] ?? 'text-muted-foreground')}`}
                  />
                  <span className="text-base font-medium text-foreground truncate flex-1">{name}</span>
                  {step ? (
                    <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                      <span className="font-semibold text-foreground">{current}</span>
                      {' / '}{goal} {unit}
                    </span>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isComplete}
                      aria-label={isComplete ? copy.untoggle(name) : copy.toggle(name)}
                      onClick={() => logHabit(habit.id, isComplete ? 0 : goal, !isComplete)}
                      className={`relative h-7 w-12 rounded-full shrink-0 cursor-pointer transition-colors duration-300 ${isComplete ? '' : 'bg-card/80'}`}
                      style={isComplete ? { background: fill } : undefined}
                    >
                      <span
                        aria-hidden
                        className={`absolute top-1 left-1 size-5 rounded-full bg-card shadow-sm transition-transform duration-300 ease-out ${isComplete ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {step ? (
                  <div role="group" aria-label={name} className="flex gap-1">
                    {Array.from({ length: segments }, (_, i) => {
                      const target = (i + 1) * size;
                      const on = i < filled;
                      // Tapping the last filled segment takes it back, so a mistaken tap is easy to undo.
                      const undo = on && i === filled - 1 && current === target;
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={on}
                          aria-label={undo ? copy.clear(name) : copy.reach(name, target, unit)}
                          onClick={() => setValue(habit, undo ? target - size : target)}
                          className="group flex-1 min-w-0 h-8 flex items-center cursor-pointer active:scale-95 transition-transform duration-150 rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                        >
                          <span
                            aria-hidden
                            className={`block w-full h-3 rounded-full transition-[background-color,transform] duration-300 ease-out group-hover:scale-y-110 ${on ? '' : 'bg-card/80 group-hover:bg-card'}`}
                            style={on ? { background: fill } : undefined}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-2xl bg-secondary/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold tracking-tight text-foreground">{copy.week}</h4>
          <button
            type="button"
            onClick={() => router.push('/routines')}
            className="-mr-2 px-2 text-blossom text-sm font-semibold hover:text-blossom/80 transition-colors flex items-center gap-1 min-h-10 cursor-pointer"
          >
            {copy.weekLink}
            <Icon name="arrow_forward" size={14} />
          </button>
        </div>
        <WeeklyGoalCard compact week={week} loading={workoutLogs.loading} />
      </div>
    </div>
  );
};
