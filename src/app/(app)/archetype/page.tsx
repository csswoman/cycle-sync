'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArchetypeSelection from '@/features/setup/ArchetypeSelection';
import { loadOnboardingAnswers, pruneAnswers, type OnboardingAnswers } from '@/features/setup/onboarding';
import { persistOnboardingAnswers } from '@/stores/profileStore';

export default function ArchetypePage() {
  const router = useRouter();
  const [initialAnswers, setInitialAnswers] = useState<OnboardingAnswers | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInitialAnswers(loadOnboardingAnswers());
  }, []);

  const handleComplete = async (answers: OnboardingAnswers) => {
    setSaving(true);
    try {
      // Answers also live in localStorage, so a failed remote save is not fatal.
      const ok = await persistOnboardingAnswers({ ...pruneAnswers(answers), answeredAt: new Date().toISOString() });
      if (!ok) console.warn('onboarding answers not saved remotely');
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
