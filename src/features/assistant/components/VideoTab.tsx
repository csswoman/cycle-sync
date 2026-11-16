import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface VideoTabProps {
  selectedVideo: string | null;
  videoPrompt: string;
  setVideoPrompt: (prompt: string) => void;
  videoResult: string;
  isVideoLoading: boolean;
  onVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeVideo: () => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  selectedVideo,
  videoPrompt,
  setVideoPrompt,
  videoResult,
  isVideoLoading,
  onVideoSelect,
  onAnalyzeVideo,
}) => {
  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-2 scrollbar-hide">
      <div className="bg-secondary/40 border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-4 text-center">
        {selectedVideo ? (
          <div className="relative inline-block max-w-full">
            <div className="bg-secondary/60 rounded-xl p-6 flex items-center justify-center gap-2 border border-border">
              <Icon name="videocam" size={28} weight="duotone" className="text-primary" />
              <p className="text-xs font-semibold text-foreground">Video cargado y listo</p>
            </div>
            <button
              onClick={() => onVideoSelect({ target: { files: null } } as any)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:scale-105 transition-transform"
              aria-label="Eliminar video"
            >
              <Icon name="close" size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="py-6 flex flex-col items-center">
              <div className="size-12 rounded-2xl bg-secondary/80 border border-border/70 flex items-center justify-center text-primary mb-2 shadow-2xs">
                <Icon name="upload_file" size={24} weight="duotone" />
              </div>
              <p className="text-xs font-semibold text-foreground">Seleccionar video</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Clips cortos de ejercicio o postura (&lt;10MB)</p>
            </div>
            <input type="file" accept="video/*" className="hidden" onChange={onVideoSelect} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Pregunta o solicitud
        </label>
        <textarea
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          placeholder="ej., 'Revisa mi postura en este ejercicio y dame sugerencias'"
          className="bg-secondary/50 border border-border/70 rounded-xl text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 p-3 min-h-[72px] resize-none"
        />

        <Button
          onClick={onAnalyzeVideo}
          disabled={isVideoLoading || !selectedVideo}
          isLoading={isVideoLoading}
          variant="primary"
          icon="movie"
          className="w-full mt-1"
        >
          Analizar Video
        </Button>
      </div>

      {videoResult && (
        <div className="bg-secondary/50 rounded-2xl p-3.5 border border-border/70 animate-in fade-in slide-in-from-bottom-2 shadow-2xs">
          <h4 className="text-primary text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Icon name="sparkle" size={15} weight="duotone" />
            Perspectivas de IA
          </h4>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {videoResult}
          </p>
        </div>
      )}
    </div>
  );
};
