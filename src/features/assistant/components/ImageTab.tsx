import React from 'react';
import { Button } from '@/components/ui/Button';

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
        <div className="flex flex-col h-full gap-4 overflow-y-auto pb-4">
            <div className="bg-secondary/50 border-2 border-dashed border-border rounded-2xl p-4 text-center">

                {selectedImage ? (
                    <div className="relative inline-block max-w-full">
                        <img src={selectedImage} alt="Analysis" className="max-h-48 rounded-lg mx-auto" />
                        <button
                            onClick={() => onImageSelect({ target: { files: null } } as any)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ) : (
                    <label className="cursor-pointer">
                        <div className="py-8">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">add_a_photo</span>
                            <p className="text-sm text-muted-foreground">Click to upload image</p>
                        </div>

                        <input type="file" accept="image/*" className="hidden" onChange={onImageSelect} />
                    </label>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analysis Focus</label>
                <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g., 'What can you see in this meal? Any PCOS-friendly tips?'"
                    className="bg-secondary border-border rounded-xl text-foreground text-sm placeholder-muted-foreground focus:border-primary focus:ring-0 min-h-[80px]"
                />

                <Button
                    onClick={onAnalyzeImage}
                    disabled={isImageLoading || !selectedImage}
                    isLoading={isImageLoading}
                    variant="primary"
                    icon="analytics"
                    className="w-full"
                >
                    Analyze Image
                </Button>
            </div>

            {imageResult && (
                <div className="bg-secondary/50 rounded-xl p-4 border border-border animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-primary text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Analysis Result
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{imageResult}</p>
                </div>
            )}

        </div>
    );
};
