'use client';

import React, { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Habit } from '@/types';
import { PetalFall, TitleSprig } from '@/components/ui/Botanical';
import { Bloom } from '@/components/ui/Bloom';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { toPhaseKey, pendingPhaseHabits, PHASE_HABITS, normalize } from '@/lib/cycle/phaseSuggestions';

const ALL_PHASE_HABITS = Object.values(PHASE_HABITS).flat();
/** Icon for a habit added from a phase suggestion, matched by its name. */
const phaseHabitIcon = (name: string) =>
  ALL_PHASE_HABITS.find((s) => normalize(s.name.es) === normalize(name) || normalize(s.name.en) === normalize(name))?.icon;

const HABIT_ICONS: Record<string, string> = {
  water: 'water_drop',
  sleep: 'bedtime',
  mindfulness: 'self_improvement',
  custom: 'star',
};

const HABIT_COLORS: Record<string, string> = {
  water: 'text-leaf',
  sleep: 'text-blossom',
  mindfulness: 'text-coral',
  custom: 'text-sun-ink',
};

const HABIT_BG: Record<string, string> = {
  water: 'bg-leaf-fresh/15',
  sleep: 'bg-petal/15',
  mindfulness: 'bg-coral/10',
  custom: 'bg-sun/10',
};

const TEXT = {
  es: {
    title: 'Hábitos Diarios',
    subtitle: 'Construye rutinas saludables, un día a la vez.',
    addHabit: 'Añadir Hábito',
    todayProgress: 'Progreso de Hoy',
    allComplete: '¡Todos los hábitos completados! ¡Increíble trabajo!',
    greatProgress: '¡Gran progreso! ¡Sigue así!',
    startLogging: 'Comienza registrando tus hábitos de hoy',
    perfectDay: '¡Día Perfecto!',
    goalPrefix: 'Meta:',
    done: '¡Listo!',
    markDone: 'Completar',
    modalTitle: 'Añadir Hábito Personalizado',
    habitName: 'Nombre del Hábito',
    namePlaceholder: 'ej., Leer 30 minutos',
    dailyGoal: 'Meta Diaria',
    unit: 'Unidad',
    unitPlaceholder: 'ej., minutos, páginas, veces',
    cancel: 'Cancelar',
    phaseTitle: (p: string) => `Sugeridos para tu fase ${p}`,
    phaseSubtitle: 'Hábitos que encajan con lo que tu cuerpo vive en estos días. Añádelos y quítalos cuando cambie la fase.',
    phaseAdd: 'Añadir',
    phaseAllAdded: 'Ya tienes todos los hábitos sugeridos para esta fase.',
    phaseNames: { menstrual: 'menstrual', follicular: 'folicular', ovulation: 'ovulatoria', luteal: 'lútea' } as Record<string, string>,
    defaultUnits: 'veces',
    standardNames: {
      water: 'Agua',
      sleep: 'Sueño',
      mindfulness: 'Mindfulness',
    } as Record<string, string>,
    standardUnits: {
      glasses: 'vasos',
      hours: 'horas',
      minutes: 'minutos',
      times: 'veces',
    } as Record<string, string>,
  },
  en: {
    title: 'Daily Habits',
    subtitle: 'Build healthy routines, one day at a time.',
    addHabit: 'Add Habit',
    todayProgress: "Today's Progress",
    allComplete: 'All habits completed! Amazing work!',
    greatProgress: 'Great progress! Keep going!',
    startLogging: 'Start logging your habits for today',
    perfectDay: 'Perfect Day!',
    goalPrefix: 'Goal:',
    done: 'Done!',
    markDone: 'Mark Done',
    modalTitle: 'Add Custom Habit',
    habitName: 'Habit Name',
    namePlaceholder: 'e.g., Read for 30 minutes',
    dailyGoal: 'Daily Goal',
    unit: 'Unit',
    unitPlaceholder: 'e.g., minutes, pages',
    cancel: 'Cancel',
    phaseTitle: (p: string) => `Suggested for your ${p} phase`,
    phaseSubtitle: 'Habits that fit what your body is going through these days. Add them and drop them when the phase changes.',
    phaseAdd: 'Add',
    phaseAllAdded: 'You already have every habit suggested for this phase.',
    phaseNames: { menstrual: 'menstrual', follicular: 'follicular', ovulation: 'ovulatory', luteal: 'luteal' } as Record<string, string>,
    defaultUnits: 'times',
    standardNames: {
      water: 'Water',
      sleep: 'Sleep',
      mindfulness: 'Mindfulness',
    } as Record<string, string>,
    standardUnits: {
      glasses: 'glasses',
      hours: 'hours',
      minutes: 'minutes',
      times: 'times',
    } as Record<string, string>,
  },
};

const Habits: React.FC = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const tx = TEXT[isEs ? 'es' : 'en'];
  const { habits, loading, logHabit, addCustomHabit, getLogForHabit, dailyProgress, getStreak } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('1');
  const [newUnit, setNewUnit] = useState(tx.defaultUnits);
  const { cycleInfo } = useCycleInfo();
  const lang = isEs ? 'es' : 'en';
  const phaseKey = cycleInfo && !cycleInfo.paused ? toPhaseKey(cycleInfo.phase) : null;
  const phaseSuggestions = phaseKey ? pendingPhaseHabits(phaseKey, habits.map((h) => h.name)) : [];
  const [adding, setAdding] = useState<string | null>(null);

  const handleIncrement = (habit: Habit) => {
    const log = getLogForHabit(habit.id);
    const currentVal = log?.value ?? 0;
    const newVal = currentVal + 1;
    const completed = habit.goal ? newVal >= habit.goal : true;
    logHabit(habit.id, newVal, completed);
  };

  const handleDecrement = (habit: Habit) => {
    const log = getLogForHabit(habit.id);
    const currentVal = log?.value ?? 0;
    if (currentVal <= 0) return;
    const newVal = currentVal - 1;
    const completed = habit.goal ? newVal >= habit.goal : false;
    logHabit(habit.id, newVal, completed);
  };

  const handleToggle = (habit: Habit) => {
    const log = getLogForHabit(habit.id);
    const completed = !log?.completed;
    logHabit(habit.id, completed ? (habit.goal ?? 1) : 0, completed);
  };

  const handleAddHabit = async () => {
    if (!newName.trim()) return;
    await addCustomHabit(newName.trim(), Number(newGoal) || 1, newUnit.trim() || tx.defaultUnits);
    setNewName('');
    setNewGoal('1');
    setNewUnit(tx.defaultUnits);
    setShowAddModal(false);
  };

  const habitDisplayName = (habit: Habit) => {
    return tx.standardNames[habit.type] || habit.name;
  };

  const habitDisplayUnit = (habit: Habit) => {
    return tx.standardUnits[habit.unit] || habit.unit;
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl garden-wash wash-leaf border border-border/80 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Petals celebrate once every habit of the day is done. */}
          {dailyProgress >= 100 && <PetalFall count={8} className="absolute inset-0 h-full w-full" />}
          <Bloom
            growth={0.08 + (dailyProgress / 100) * 0.92}
            tone={dailyProgress >= 100 ? 'ovulation' : 'follicular'}
            className="absolute bottom-0 right-4 md:right-48 h-28 sm:h-36 w-auto opacity-90"
          />
          <div className="relative flex flex-col gap-2 pr-20 md:pr-0">
            <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              <TitleSprig bud={null} />{tx.title}
            </h1>
            <p className="text-muted-foreground text-base">
              {tx.subtitle}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="cta-bloom self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {tx.addHabit}
          </button>
        </div>

        {/* Daily Progress Ring */}
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-primary"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - dailyProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-foreground text-xl font-bold tabular-nums">{dailyProgress}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-foreground text-lg font-bold">{tx.todayProgress}</h3>
            <p className="text-muted-foreground text-sm">
              {dailyProgress === 100
                ? tx.allComplete
                : dailyProgress >= 50
                ? tx.greatProgress
                : tx.startLogging}
            </p>
            {dailyProgress === 100 && (
              <div className="flex items-center gap-1 mt-1 text-sun-ink">
                <span className="material-symbols-outlined text-sm">star</span>
                <span className="text-xs font-bold">{tx.perfectDay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Phase suggestions */}
        {phaseKey && !loading && (
          <section data-phase={phaseKey} className="bg-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-phase">auto_awesome</span>
                {tx.phaseTitle(tx.phaseNames[phaseKey])}
              </h3>
              <p className="text-muted-foreground text-sm">{tx.phaseSubtitle}</p>
            </div>
            {phaseSuggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tx.phaseAllAdded}</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {phaseSuggestions.map((s) => (
                  <li key={s.id} className="rounded-xl bg-phase-soft/60 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-phase">{s.icon}</span>
                      <p className="text-foreground font-semibold text-sm">{s.name[lang]}</p>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed flex-1">{s.why[lang]}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{tx.goalPrefix} {s.goal} {s.unit[lang]}</span>
                      <button
                        type="button"
                        disabled={adding === s.id}
                        onClick={async () => {
                          setAdding(s.id);
                          try { await addCustomHabit(s.name[lang], s.goal, s.unit[lang]); } finally { setAdding(null); }
                        }}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>{tx.phaseAdd}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Habit Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map((habit) => {
              const log = getLogForHabit(habit.id);
              const currentVal = log?.value ?? 0;
              const goal = habit.goal ?? 1;
              const pct = Math.min(Math.round((currentVal / goal) * 100), 100);
              const isComplete = log?.completed ?? false;
              const streak = getStreak(habit.id);
              const icon = (habit.type === 'custom' && phaseHabitIcon(habit.name)) || HABIT_ICONS[habit.type] || 'star';
              const color = HABIT_COLORS[habit.type] || 'text-primary';
              const bg = HABIT_BG[habit.type] || 'bg-primary/10';

              return (
                <div
                  key={habit.id}
                  className={`bg-card rounded-xl border transition-all p-5 flex flex-col gap-4 ${
                    isComplete ? 'border-leaf/30 bg-leaf/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${bg}`}>
                        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                      </div>
                      <div>
                        <h4 className="text-foreground font-bold text-sm">{habitDisplayName(habit)}</h4>
                        <p className="text-muted-foreground text-xs">
                          {tx.goalPrefix} {goal} {habitDisplayUnit(habit)}
                        </p>
                      </div>
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-coral/10 text-sun-ink">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        <span className="text-xs font-bold">{streak}d</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? 'bg-leaf' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-16 text-right">
                      {currentVal}/{goal}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(habit)}
                        className="w-9 h-9 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors border border-border"
                      >
                        <span className="material-symbols-outlined text-[18px] text-foreground">remove</span>
                      </button>
                      <span className="text-foreground font-bold text-lg w-10 text-center">{currentVal}</span>
                      <button
                        onClick={() => handleIncrement(habit)}
                        className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors border border-primary/20"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">add</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggle(habit)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        isComplete
                          ? 'bg-leaf text-card'
                          : 'bg-secondary hover:bg-accent text-muted-foreground border border-border'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isComplete ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {isComplete ? tx.done : tx.markDone}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Habit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-foreground text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                {tx.modalTitle}
              </h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{tx.habitName}</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={tx.namePlaceholder}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{tx.dailyGoal}</label>
                    <input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{tx.unit}</label>
                    <input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={tx.unitPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors"
                >
                  {tx.cancel}
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newName.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {tx.addHabit}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Habits;
