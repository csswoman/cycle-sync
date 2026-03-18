'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import ArchetypeSelection from '@/features/setup/ArchetypeSelection';

export default function ArchetypePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <ArchetypeSelection
      onComplete={() => router.push('/cycle-setup')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
