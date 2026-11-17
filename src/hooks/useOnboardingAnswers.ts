'use client';
import { useEffect } from 'react';
import { cycleProfile, showsPmosTools, type CycleProfile, type OnboardingAnswers } from '@/features/setup/onboarding';
import { ensureProfileLoaded, useProfileStore } from '@/stores/profileStore';

/**
 * Questionnaire answers from the shared profile store: the local copy right away, replaced by
 * `cycle_config.onboarding_answers` once it arrives. Loaded once for the whole app.
 */
export function useOnboardingAnswers(): OnboardingAnswers {
  const answers = useProfileStore((s) => s.answers);
  useEffect(() => { void ensureProfileLoaded(); }, []);
  return answers;
}

/** True once the local copy of the answers has been read, to avoid showing then hiding things. */
export function useProfileLoaded(): boolean {
  const loaded = useProfileStore((s) => s.loaded);
  useEffect(() => { void ensureProfileLoaded(); }, []);
  return loaded;
}

export function useCycleProfile(): CycleProfile {
  return cycleProfile(useOnboardingAnswers());
}

/** Whether PMOS-specific sections should be shown to this user (see `showsPmosTools`). */
export function usePmosToolsVisible(): boolean {
  return showsPmosTools(useOnboardingAnswers());
}
