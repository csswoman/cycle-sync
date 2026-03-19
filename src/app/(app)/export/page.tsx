'use client';

import dynamic from 'next/dynamic';

const ExportReport = dynamic(() => import('@/features/export/ExportReport'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        <p className="text-muted-foreground text-sm">Loading export tools...</p>
      </div>
    </div>
  ),
});

export default function ExportPage() {
  return <ExportReport />;
}
