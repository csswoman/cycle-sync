'use client';

import { Icon } from '@/components/ui/Icon';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="p-4 rounded-full bg-primary/10">
          <Icon name="wifi_off" size={48} weight="duotone" className="text-primary" />
        </div>
        <h1 className="text-foreground text-2xl font-bold">Estás sin conexión</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Parece que perdiste tu conexión a internet. No te preocupes: tus registros se guardan
          de forma local en tu dispositivo y se sincronizarán en cuanto vuelvas a tener conexión.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
