import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RoutineStreak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalCompleted: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
}

const BADGES: Badge[] = [
  { id: 'first-workout', name: 'First Step', description: 'Complete your first workout', icon: 'fitness_center', earnedAt: null },
  { id: 'streak-3', name: 'On Fire', description: '3-day workout streak', icon: 'local_fire_department', earnedAt: null },
  { id: 'streak-7', name: 'Unstoppable', description: '7-day workout streak', icon: 'bolt', earnedAt: null },
  { id: 'streak-14', name: 'Iron Will', description: '14-day workout streak', icon: 'shield', earnedAt: null },
  { id: 'streak-30', name: 'Legend', description: '30-day workout streak', icon: 'military_tech', earnedAt: null },
  { id: 'total-10', name: 'Dedicated', description: 'Complete 10 workouts', icon: 'star', earnedAt: null },
  { id: 'total-50', name: 'Warrior', description: 'Complete 50 workouts', icon: 'diamond', earnedAt: null },
];

interface RoutineState {
  streak: RoutineStreak;
  badges: Badge[];
  completeWorkout: () => void;
  newBadges: string[];
  clearNewBadges: () => void;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        totalCompleted: 0,
      },
      badges: BADGES,
      newBadges: [],

      completeWorkout: () => {
        const today = new Date().toISOString().split('T')[0];
        const { streak, badges } = get();

        if (streak.lastCompletedDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const isConsecutive = streak.lastCompletedDate === yesterdayStr;
        const newCurrent = isConsecutive ? streak.currentStreak + 1 : 1;
        const newTotal = streak.totalCompleted + 1;
        const newLongest = Math.max(streak.longestStreak, newCurrent);

        const newBadgeIds: string[] = [];
        const updatedBadges = badges.map((b) => {
          if (b.earnedAt) return b;
          let earned = false;
          if (b.id === 'first-workout' && newTotal >= 1) earned = true;
          if (b.id === 'streak-3' && newCurrent >= 3) earned = true;
          if (b.id === 'streak-7' && newCurrent >= 7) earned = true;
          if (b.id === 'streak-14' && newCurrent >= 14) earned = true;
          if (b.id === 'streak-30' && newCurrent >= 30) earned = true;
          if (b.id === 'total-10' && newTotal >= 10) earned = true;
          if (b.id === 'total-50' && newTotal >= 50) earned = true;
          if (earned) {
            newBadgeIds.push(b.id);
            return { ...b, earnedAt: today };
          }
          return b;
        });

        set({
          streak: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastCompletedDate: today,
            totalCompleted: newTotal,
          },
          badges: updatedBadges,
          newBadges: newBadgeIds,
        });
      },

      clearNewBadges: () => set({ newBadges: [] }),
    }),
    { name: 'cyclesync-routines' }
  )
);
