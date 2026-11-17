import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  deriveArchetype,
  loadOnboardingAnswers,
  saveOnboardingAnswers,
  type OnboardingAnswers,
} from '@/features/setup/onboarding';

interface ProfileState {
  answers: OnboardingAnswers;
  /** True once the local copy has been read (the remote one may still be on its way). */
  loaded: boolean;
  /** User whose remote answers were fetched; null for guests or before the first fetch. */
  fetchedFor: string | null;
  setAnswers: (answers: OnboardingAnswers) => void;
}

/**
 * Questionnaire answers shared by the whole app. The local copy is read once, then replaced by
 * `cycle_config.onboarding_answers` (fetched once per signed-in user), so every screen sees the
 * same profile without each one querying Supabase.
 */
export const useProfileStore = create<ProfileState>((set) => ({
  answers: {},
  loaded: false,
  fetchedFor: null,
  setAnswers: (answers) => set({ answers }),
}));

let inflight: Promise<void> | null = null;

/** Reads the local copy and, once per user, the remote one. Safe to call from many components. */
export function ensureProfileLoaded(): Promise<void> {
  if (!useProfileStore.getState().loaded) {
    useProfileStore.setState({ answers: loadOnboardingAnswers(), loaded: true });
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || useProfileStore.getState().fetchedFor === user.id) return;
      const { data, error } = await supabase
        .from('cycle_config')
        .select('onboarding_answers')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return;
      useProfileStore.setState({ fetchedFor: user.id });
      const remote = (data as { onboarding_answers?: OnboardingAnswers | null } | null)?.onboarding_answers;
      if (remote && typeof remote === 'object') {
        saveOnboardingAnswers(remote);
        useProfileStore.setState({ answers: remote });
      }
    } catch {
      // Offline or column missing: keep the local copy.
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Forget the fetched profile (e.g. on sign-out) so the next user starts clean. */
export function resetProfile(): void {
  useProfileStore.setState({ answers: {}, loaded: false, fetchedFor: null });
}

/**
 * Saves answers locally, in the store and in `cycle_config` (with the derived archetype).
 * Returns false when the remote save failed; the local copy is kept either way.
 */
export async function persistOnboardingAnswers(answers: OnboardingAnswers): Promise<boolean> {
  saveOnboardingAnswers(answers);
  useProfileStore.setState({ answers, loaded: true });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return true;
    const { error } = await supabase.from('cycle_config').upsert(
      { user_id: user.id, archetype: deriveArchetype(answers), onboarding_answers: answers, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    return !error;
  } catch {
    return false;
  }
}
