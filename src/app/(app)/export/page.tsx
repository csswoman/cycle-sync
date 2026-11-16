'use client';

import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';

const ExportReport = dynamic(() => import('@/features/export/ExportReport'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <Icon name="progress_activity" size={36} className="text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading export tools...</p>
      </div>
    </div>
  ),
});

export default function ExportPage() {
  return <ExportReport />;
}
