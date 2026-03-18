'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import Register from '@/features/auth/Register';

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <Register
      onRegister={() => router.push('/check-email')}
      onBackToLogin={() => router.push('/login')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
