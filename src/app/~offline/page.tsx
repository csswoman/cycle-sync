'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="p-4 rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-primary text-5xl">wifi_off</span>
        </div>
        <h1 className="text-foreground text-2xl font-bold">You&apos;re Offline</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry — your logged data is
          saved locally and will sync when you&apos;re back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
