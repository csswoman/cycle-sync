'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import Login from '@/features/auth/Login';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <Login
      onLogin={() => router.push('/dashboard')}
      onSignUp={() => router.push('/register')}
      onUnconfirmedEmail={() => router.push('/check-email')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
