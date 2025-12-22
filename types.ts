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
  NUTRITION = 'NUTRITION'
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