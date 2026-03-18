import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AppState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  isAssistantOpen: boolean;
  toggleAssistant: () => void;
  setAssistantOpen: (open: boolean) => void;

  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

  isAssistantOpen: false,
  toggleAssistant: () => set((s) => ({ isAssistantOpen: !s.isAssistantOpen })),
  setAssistantOpen: (open) => set({ isAssistantOpen: open }),

  user: null,
  setUser: (user) => set({ user }),
}));
