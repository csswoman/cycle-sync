'use client';

import React, { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import type { Habit } from '@/types';

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

const HABIT_BG: Record<string, string> = {
  water: 'bg-blue-400/10',
  sleep: 'bg-indigo-400/10',
  mindfulness: 'bg-emerald-400/10',
  custom: 'bg-amber-400/10',
};

const Habits: React.FC = () => {
  const { habits, loading, logHabit, addCustomHabit, getLogForHabit, dailyProgress, getStreak } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('1');
  const [newUnit, setNewUnit] = useState('times');

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
    await addCustomHabit(newName.trim(), Number(newGoal) || 1, newUnit.trim() || 'times');
    setNewName('');
    setNewGoal('1');
    setNewUnit('times');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Daily Habits
            </h1>
            <p className="text-muted-foreground text-base">
              Build healthy routines, one day at a time.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Habit
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
              <span className="text-foreground text-xl font-black">{dailyProgress}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-foreground text-lg font-bold">Today&apos;s Progress</h3>
            <p className="text-muted-foreground text-sm">
              {dailyProgress === 100
                ? 'All habits completed! Amazing work!'
                : dailyProgress >= 50
                ? 'Great progress! Keep going!'
                : 'Start logging your habits for today'}
            </p>
            {dailyProgress === 100 && (
              <div className="flex items-center gap-1 mt-1 text-yellow-400">
                <span className="material-symbols-outlined text-sm">star</span>
                <span className="text-xs font-bold">Perfect Day!</span>
              </div>
            )}
          </div>
        </div>

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
              const icon = HABIT_ICONS[habit.type] || 'star';
              const color = HABIT_COLORS[habit.type] || 'text-primary';
              const bg = HABIT_BG[habit.type] || 'bg-primary/10';

              return (
                <div
                  key={habit.id}
                  className={`bg-card rounded-xl border transition-all p-5 flex flex-col gap-4 ${
                    isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${bg}`}>
                        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                      </div>
                      <div>
                        <h4 className="text-foreground font-bold text-sm">{habit.name}</h4>
                        <p className="text-muted-foreground text-xs">
                          Goal: {goal} {habit.unit}
                        </p>
                      </div>
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        <span className="text-xs font-bold">{streak}d</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
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
                          ? 'bg-green-500 text-white'
                          : 'bg-secondary hover:bg-accent text-muted-foreground border border-border'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isComplete ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {isComplete ? 'Done!' : 'Mark Done'}
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
                Add Custom Habit
              </h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Habit Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Read for 30 minutes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Daily Goal</label>
                    <input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                    <input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., minutes, pages"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newName.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Add Habit
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
