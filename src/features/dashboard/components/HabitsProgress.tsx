'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHabits } from '@/hooks/useHabits';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { summarizeWeek, isStrengthLog, weekStartOf, STRENGTH_DAYS_GOAL, WEEKLY_MINUTES_GOAL } from '@/lib/exercise/weeklyActivity';
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
    <div className={`absolute right-3 bottom-3 flex items-end ${items.length ? "hidden" : "h-40"}`} aria-hidden="true">
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
    strength: 'fuerza',
    weekLink: 'Rutinas',
    summary: 'Completados hoy',
    habitsWord: 'hábitos',
    goalPct: (n: number) => `${n} % de la meta`,
    done: 'Hecho',
    pendingLabel: 'Pendiente',
    oncePerDay: 'Una vez al día',
    weekMinutes: 'Minutos activos',
    weekStrength: 'Días de fuerza',
    weekDaily: 'Actividad por día',
    cardio: 'Actividad',
    strengthLegend: 'Fuerza',
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
    strength: 'strength',
    weekLink: 'Routines',
    summary: 'Done today',
    habitsWord: 'habits',
    goalPct: (n: number) => `${n} % of goal`,
    done: 'Done',
    pendingLabel: 'Pending',
    oncePerDay: 'Once a day',
    weekMinutes: 'Active minutes',
    weekStrength: 'Strength days',
    weekDaily: 'Activity by day',
    cardio: 'Activity',
    strengthLegend: 'Strength',
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

  const setValue = (habit: Habit, value: number) => {
    const goal = habit.goal ?? 1;
    logHabit(habit.id, value, value >= goal);
  };

  if (loading) {
    return <div className={`animate-pulse h-32 ${embedded ? 'rounded-2xl bg-secondary/40' : 'bg-card rounded-3xl border border-border p-5'}`} />;
  }

  const visible = habits.slice(0, 5);
  const doneCount = visible.filter((h) => getLogForHabit(h.id)?.completed).length;

  if (visible.length === 0) {
    return (
      <div className={embedded ? 'flex flex-col gap-3 lg:h-full' : 'bg-card rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex flex-col gap-4'}>
        <div className="relative rounded-2xl bg-leaf-soft/70 overflow-hidden min-h-20 flex-1 p-4 pb-5 flex flex-col justify-between gap-2">
          <div className="relative z-10 flex flex-col pr-24">
            <h3 className="text-foreground text-base font-semibold tracking-tight leading-snug text-balance">{isGuest ? copy.guestTitle : copy.title}</h3>
            <p className="text-sm text-foreground/80 text-pretty max-w-[16rem]">{isGuest ? copy.guestBody : copy.emptyBody}</p>
          </div>
          <button
            type="button"
            onClick={() => (isGuest ? promptSignup() : router.push('/habits'))}
            className="relative z-10 self-start -mx-1 px-3 min-h-10 rounded-lg text-blossom text-sm font-semibold hover:bg-card/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {isGuest ? (language === 'es' ? 'Crear cuenta' : 'Create account') : copy.all}
            <Icon name="arrow_forward" size={14} />
          </button>
          <HabitGarden items={[]} />
          <span aria-hidden className="absolute bottom-0 inset-x-0 h-1.5 bg-leaf/25" />
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'flex flex-col gap-3' : 'bg-card rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex flex-col gap-4'}>
      <h3 className="sr-only">{copy.title}</h3>

      {/* Summary strip: overall ring, done count and the link to the full habits page. */}
      <div className="rounded-2xl bg-leaf-soft/60 border border-leaf/15 px-3 py-2 flex items-center gap-3">
        <ProgressRing value={dailyProgress / 100} size={44} color="var(--leaf)">
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {dailyProgress}<span className="text-[0.65rem] font-medium text-foreground/60">%</span>
          </span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/70">{copy.summary}</p>
          <p className="flex items-baseline gap-1 leading-tight">
            <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">{doneCount}</span>
            <span className="text-sm font-medium text-foreground/60 tabular-nums">/ {visible.length} {copy.habitsWord}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/habits')}
          className="px-3 min-h-10 rounded-lg text-blossom text-sm font-semibold hover:bg-card/60 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          {copy.all}
          <Icon name="arrow_forward" size={14} />
        </button>
      </div>

      {/* One stat tile per habit; the segments are tappable to log progress. */}
      <ul className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-3">
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
          const pct = Math.min(100, Math.round((current / goal) * 100));

          return (
            <li
              key={habit.id}
              className="rounded-2xl border border-border/70 px-3 py-2.5 flex flex-col gap-2 transition-colors duration-300"
              style={{ background: `color-mix(in srgb, ${fill} ${isComplete ? 22 : 10}%, transparent)` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  name={HABIT_ICONS[habit.type] ?? 'star'}
                  size={20}
                  className={`shrink-0 ${HABIT_TINT[habit.type] ?? 'text-muted-foreground'}`}
                />
                <span className="text-sm font-medium text-foreground/80 truncate flex-1">{name}</span>
                {isComplete && <Icon name="check_circle" size={18} weight="fill" className="text-leaf shrink-0" />}
              </div>

              {step ? (
                <>
                  <p className="flex items-baseline gap-1 leading-none">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{current}</span>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">/ {goal} {unit}</span>
                  </p>
                  <div role="group" aria-label={name} className="flex gap-1 min-w-0 -my-1.5">
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
                          className="group flex-1 min-w-0 h-6 flex items-center cursor-pointer active:scale-95 transition-transform duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                        >
                          <span
                            aria-hidden
                            className={`block w-full h-2 rounded-full transition-[background-color,transform] duration-300 ease-out group-hover:scale-y-125 ${on ? '' : 'bg-card/90 group-hover:bg-card'}`}
                            style={on ? { background: fill } : undefined}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">{copy.goalPct(pct)}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xl font-semibold tracking-tight leading-none ${isComplete ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                      {isComplete ? copy.done : copy.pendingLabel}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isComplete}
                      aria-label={isComplete ? copy.untoggle(name) : copy.toggle(name)}
                      onClick={() => logHabit(habit.id, isComplete ? 0 : goal, !isComplete)}
                      className={`relative h-7 w-12 rounded-full shrink-0 cursor-pointer transition-colors duration-300 ${isComplete ? '' : 'bg-card/90'}`}
                      style={isComplete ? { background: fill } : undefined}
                    >
                      <span
                        aria-hidden
                        className={`absolute top-1 left-1 size-5 rounded-full bg-card shadow-sm transition-transform duration-300 ease-out ${isComplete ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{copy.oncePerDay}</p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/** Circular gauge for a 0..1 share, with whatever label is passed in its center. */
const ProgressRing: React.FC<{ value: number; size?: number; color: string; children?: React.ReactNode }> = ({ value, size = 56, color, children }) => {
  const r = 15;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="4" className="stroke-card" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeOpacity={v > 0 ? 1 : 0}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
};
/** Minutes that fill a day's column completely; longer sessions are capped so one big day does not flatten the rest. */
const DAY_MAX_MIN = 60;
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Monday to Sunday of the current week with that day's logged minutes and whether it had strength work. */
function weekDays(logs: ReturnType<typeof useWorkoutLogs>['logs'], lang: string) {
  const [y, m, d] = weekStartOf(new Date()).split('-').map(Number);
  const todayKey = `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}-${pad2(new Date().getDate())}`;
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(y, m - 1, d + i);
    const key = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
    const own = logs.filter((l) => l.date === key);
    return {
      key,
      label: new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(day),
      minutes: own.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0),
      strength: own.some(isStrengthLog),
      active: own.length > 0,
      today: key === todayKey,
    };
  });
}
/** KPI tile for a weekly goal: big number, goal and a thin bar. */
const WeekKpi: React.FC<{ icon: string; tint: string; label: string; value: number; goal: number; unit?: string; done: boolean; fill: string }> = ({ icon, tint, label, value, goal, unit, done, fill }) => {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-start sm:items-center gap-2 min-w-0">
        <Icon name={icon} size={20} className={`${tint} shrink-0`} />
        <span className="text-sm font-medium text-foreground/80 leading-tight sm:truncate flex-1">{label}</span>
        {done && <Icon name="check_circle" size={18} weight="fill" className="text-leaf shrink-0" />}
      </div>
      <p className="flex items-baseline gap-1 leading-none">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</span>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">/ {goal}{unit ? ` ${unit}` : ''}</span>
      </p>
      <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
};

/** Weekly activity: the two weekly goals as KPI tiles, then a Monday-to-Sunday chart of what was logged. */
export const WeekActivity: React.FC = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = COPY[language === 'es' ? 'es' : 'en'];
  const workoutLogs = useWorkoutLogs();
  const week = useMemo(() => summarizeWeek(workoutLogs.logs), [workoutLogs.logs]);
  const days = useMemo(() => weekDays(workoutLogs.logs, language === 'es' ? 'es' : 'en'), [workoutLogs.logs, language]);
  return (
    <div className="flex flex-col gap-3 h-full">
      <h4 className="sr-only">{copy.week}</h4>
      {workoutLogs.loading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="h-[5.5rem] rounded-2xl bg-secondary/50 animate-pulse" />
          <div className="h-[5.5rem] rounded-2xl bg-secondary/50 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <WeekKpi icon="schedule" tint="text-leaf" label={copy.weekMinutes} value={week.minutes} goal={WEEKLY_MINUTES_GOAL} unit="min" done={week.minutesGoalMet} fill="var(--leaf-fresh)" />
          <WeekKpi icon="fitness_center" tint="text-leaf" label={copy.weekStrength} value={week.strengthDays} goal={STRENGTH_DAYS_GOAL} done={week.strengthGoalMet} fill="var(--leaf)" />
        </div>
      )}

      <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2.5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap -my-1">
          <span className="text-sm font-medium text-foreground/80">{copy.weekDaily}</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-1">
            <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm bg-[var(--leaf-fresh)]" />{copy.cardio}</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm bg-leaf" />{copy.strengthLegend}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/routines')}
            className="-mr-2 px-2 text-blossom text-sm font-semibold hover:text-blossom/80 transition-colors flex items-center gap-1 min-h-9 cursor-pointer"
          >
            {copy.weekLink}
            <Icon name="arrow_forward" size={14} />
          </button>
        </div>
        <ol className="grid grid-cols-7 gap-2 flex-1 min-h-16" aria-label={copy.week}>
          {days.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1.5 min-h-0">
              <div className="flex-1 w-full flex items-end justify-center min-h-10">
                <div
                  className={`w-full max-w-8 rounded-md transition-[height] duration-500 ease-out ${d.strength ? 'bg-leaf' : 'bg-[var(--leaf-fresh)]'}`}
                  style={{ height: d.active ? `${Math.max(12, Math.min(100, (d.minutes / DAY_MAX_MIN) * 100))}%` : '4px', opacity: d.active ? 1 : 0.25 }}
                  role="img"
                  aria-label={`${d.label}: ${d.minutes} min${d.strength ? ` · ${copy.strength}` : ''}`}
                />
              </div>
              <span className={`text-xs font-semibold uppercase ${d.today ? 'text-blossom' : 'text-muted-foreground'}`}>{d.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
