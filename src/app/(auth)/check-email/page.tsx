'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import CheckEmail from '@/features/auth/CheckEmail';

export default function CheckEmailPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <CheckEmail
      onBackToLogin={() => router.push('/login')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
