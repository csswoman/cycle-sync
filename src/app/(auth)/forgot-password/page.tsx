'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import ForgotPassword from '@/features/auth/ForgotPassword';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <ForgotPassword
      onBackToLogin={() => router.push('/login')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
