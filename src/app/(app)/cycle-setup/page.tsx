'use client';

import { useRouter } from 'next/navigation';
import CycleSetup from '@/features/setup/CycleSetup';
import { View } from '@/types';

export default function CycleSetupPage() {
  const router = useRouter();

  const handleNavigate = (view: View) => {
    const map: Partial<Record<View, string>> = {
      [View.DASHBOARD]: '/dashboard',
      [View.SETTINGS]: '/settings',
      [View.ARCHETYPE_SELECTION]: '/archetype',
    };
    const path = map[view];
    if (path) router.push(path);
  };

  return <CycleSetup onNavigate={handleNavigate} />;
}
