'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import ResetPassword from '@/features/auth/ResetPassword';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <ResetPassword
      onSuccess={() => router.push('/login')}
      onBackToLogin={() => router.push('/login')}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
    />
  );
}
