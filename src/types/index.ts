export enum View {
  DASHBOARD = 'DASHBOARD',
  SMART_ASSISTANT = 'SMART_ASSISTANT',
  SETTINGS = 'SETTINGS',
  LOG = 'LOG',
  TRENDS = 'TRENDS',
  ARCHETYPE_SELECTION = 'ARCHETYPE_SELECTION',
  CYCLE_SETUP = 'CYCLE_SETUP',
  PCOS = 'PCOS',
  ROUTINES = 'ROUTINES',
  NUTRITION = 'NUTRITION',
  PERIOD_HISTORY = 'PERIOD_HISTORY',
  HABITS = 'HABITS'
}

export enum Mood {
  ROUGH = 'Rough',
  DOWN = 'Down',
  OKAY = 'Okay',
  GOOD = 'Good',
  GREAT = 'Great'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export enum AssistantTab {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

// ── Cycle ──────────────────────────────────

export enum CyclePhase {
  MENSTRUAL = 'Menstrual',
  FOLLICULAR = 'Follicular',
  OVULATION = 'Ovulation',
  LUTEAL = 'Luteal',
}

export interface Period {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
}

export interface CycleConfig {
  id: string;
  user_id: string;
  cycle_length: number;
  last_period_start: string | null;
  workout_prefs: string[];
  dietary_prefs: string[];
  archetype: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleInfo {
  phase: CyclePhase;
  cycleDay: number;
  daysUntilNextPeriod: number;
  cycleLength: number;
}

// ── Daily Log ──────────────────────────────

export type SleepQuality = 'Restless' | 'Light' | 'Solid' | 'Deep';

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  mood: string | null;
  energy_level: number | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  symptoms: string[];
  notes: string | null;
  created_at: string;
}

// ── PCOS ───────────────────────────────────

export interface PCOSSymptomEntry {
  id: string;
  user_id: string;
  date: string;
  acne: number;
  fatigue: number;
  hirsutism: number;
  hair_loss: number;
  mood_swings: number;
  bloating: number;
}

// ── Habits ─────────────────────────────────

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: 'water' | 'sleep' | 'mindfulness' | 'custom';
  goal: number | null;
  unit: string | null;
  active: boolean;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  value: number | null;
  completed: boolean;
}