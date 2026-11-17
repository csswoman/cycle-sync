'use client';

import { useAppStore } from '@/stores/appStore';

/**
 * Guest mode: browsing without an account. Guests can look at content (recipes, exercises,
 * articles) but every action that saves data opens the sign-up prompt instead.
 */
export function useGuest() {
  const user = useAppStore((s) => s.user);
  const authReady = useAppStore((s) => s.authReady);
  const setSignupPromptOpen = useAppStore((s) => s.setSignupPromptOpen);
  return {
    isGuest: authReady && !user,
    promptSignup: () => setSignupPromptOpen(true),
  };
}
