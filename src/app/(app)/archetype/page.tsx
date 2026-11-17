'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ArchetypeSelection from '@/features/setup/ArchetypeSelection';
import {
  deriveArchetype, loadOnboardingAnswers, saveOnboardingAnswers, type OnboardingAnswers,
} from '@/features/setup/onboarding';

export default function ArchetypePage() {
  const router = useRouter();
  const [initialAnswers, setInitialAnswers] = useState<OnboardingAnswers | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInitialAnswers(loadOnboardingAnswers());
  }, []);

  const handleComplete = async (answers: OnboardingAnswers) => {
    setSaving(true);
    saveOnboardingAnswers(answers);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const now = new Date().toISOString();
        await supabase.from('cycle_config').upsert(
          { user_id: user.id, archetype: deriveArchetype(answers), updated_at: now },
          { onConflict: 'user_id' },
        );
        // Needs the onboarding_answers column (migration 20260501000000); answers also live in localStorage.
        const { error } = await supabase.from('cycle_config').update({ onboarding_answers: answers }).eq('user_id', user.id);
        if (error) console.warn('onboarding_answers not saved remotely:', error.message);
      }
    } catch (err) {
      console.error('Error saving archetype:', err);
    } finally {
      setSaving(false);
    }
    router.push('/cycle-setup');
  };

  if (!initialAnswers) return null;
  return (
    <ArchetypeSelection
      onComplete={handleComplete}
      initialAnswers={initialAnswers}
      saving={saving}
    />
  );
}
