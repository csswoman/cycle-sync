'use client';

import { useRouter } from 'next/navigation';
import Dashboard from '@/features/dashboard/Dashboard';
import { useAppStore } from '@/stores/appStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppStore();

  return (
    <Dashboard
      onNavigate={(view) => {
        const map: Record<string, string> = {
          LOG: '/log',
          TRENDS: '/trends',
          CYCLE_SETUP: '/cycle-setup',
          PCOS: '/pcos',
          ROUTINES: '/routines',
          NUTRITION: '/nutrition',
          PERIOD_HISTORY: '/period-history',
          SETTINGS: '/settings',
        };
        const path = map[view as unknown as string];
        if (path) router.push(path);
      }}
      userName={user?.user_metadata?.full_name}
    />
  );
}
