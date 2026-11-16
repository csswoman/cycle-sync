'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  loadOnboardingAnswers,
  saveOnboardingAnswers,
  type OnboardingAnswers,
} from '@/features/setup/onboarding';

/**
 * Questionnaire answers: the local copy is returned right away and replaced by
 * `cycle_config.onboarding_answers` once it arrives (and cached locally), so a new device
 * does not lose contraception and goal.
 */
export function useOnboardingAnswers(): OnboardingAnswers {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  useEffect(() => {
    let cancelled = false;
    setAnswers(loadOnboardingAnswers());
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { data, error } = await supabase
          .from('cycle_config')
          .select('onboarding_answers')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error || cancelled) return;
        const remote = (data as { onboarding_answers?: OnboardingAnswers | null } | null)?.onboarding_answers;
        if (remote && typeof remote === 'object') {
          saveOnboardingAnswers(remote);
          setAnswers(remote);
        }
      } catch {
        // Offline or column missing: keep the local copy.
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return answers;
}
