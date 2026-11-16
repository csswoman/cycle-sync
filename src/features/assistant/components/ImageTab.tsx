import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface ImageTabProps {
  selectedImage: string | null;
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
  imageResult: string;
  isImageLoading: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeImage: () => void;
}

export const ImageTab: React.FC<ImageTabProps> = ({
  selectedImage,
  imagePrompt,
  setImagePrompt,
  imageResult,
  isImageLoading,
  onImageSelect,
  onAnalyzeImage,
}) => {
  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-2 scrollbar-hide">
      <div className="bg-secondary/40 border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-4 text-center">
        {selectedImage ? (
          <div className="relative inline-block max-w-full">
            <img
              src={selectedImage}
              alt="Analysis"
              className="max-h-44 rounded-xl mx-auto object-cover border border-border shadow-xs"
            />
            <button
              onClick={() => onImageSelect({ target: { files: null } } as any)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:scale-105 transition-transform"
              aria-label="Eliminar imagen"
            >
              <Icon name="close" size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="py-6 flex flex-col items-center">
              <div className="size-12 rounded-2xl bg-secondary/80 border border-border/70 flex items-center justify-center text-primary mb-2 shadow-2xs">
                <Icon name="add_a_photo" size={24} weight="duotone" />
              </div>
              <p className="text-xs font-semibold text-foreground">Seleccionar imagen</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Comida, suplementos o etiquetas</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onImageSelect} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Pregunta o enfoque
        </label>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="ej., ¿Es recomendable este plato para mi fase folicular?"
          className="bg-secondary/50 border border-border/70 rounded-xl text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 p-3 min-h-[72px] resize-none"
        />

        <Button
          onClick={onAnalyzeImage}
          disabled={isImageLoading || !selectedImage}
          isLoading={isImageLoading}
          variant="primary"
          icon="analytics"
          className="w-full mt-1"
        >
          Analizar Imagen
        </Button>
      </div>

      {imageResult && (
        <div className="bg-secondary/50 rounded-2xl p-3.5 border border-border/70 animate-in fade-in slide-in-from-bottom-2 shadow-2xs">
          <h4 className="text-primary text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Icon name="sparkle" size={15} weight="duotone" />
            Resultado del Análisis
          </h4>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {imageResult}
          </p>
        </div>
      )}
    </div>
  );
};
