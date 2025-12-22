import React from 'react';
import { Button } from '@/components/ui/Button';

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
        <div className="flex flex-col h-full gap-4 overflow-y-auto pb-4">
            <div className="bg-secondary/50 border-2 border-dashed border-border rounded-2xl p-4 text-center">

                {selectedVideo ? (
                    <div className="relative inline-block max-w-full">
                        <div className="bg-secondary/40 rounded-lg p-8 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary">videocam</span>
                            <p className="ml-2 text-sm text-foreground font-medium">Video Ready</p>
                        </div>
                        <button
                            onClick={() => onVideoSelect({ target: { files: null } } as any)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ) : (
                    <label className="cursor-pointer">
                        <div className="py-8">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">upload_file</span>
                            <p className="text-sm text-muted-foreground">Click to upload video</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Short clips work best for quick analysis</p>
                        </div>

                        <input type="file" accept="video/*" className="hidden" onChange={onVideoSelect} />
                    </label>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analysis Request</label>
                <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g., 'Analyze my exercise form' or 'Summarize key points'"
                    className="bg-secondary border-border rounded-xl text-foreground text-sm placeholder-muted-foreground focus:border-primary focus:ring-0 min-h-[80px]"
                />

                <Button
                    onClick={onAnalyzeVideo}
                    disabled={isVideoLoading || !selectedVideo}
                    isLoading={isVideoLoading}
                    variant="primary"
                    icon="movie"
                    className="w-full"
                >
                    Analyze Video
                </Button>
            </div>

            {videoResult && (
                <div className="bg-secondary/50 rounded-xl p-4 border border-border animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-primary text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        AI Insights
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{videoResult}</p>
                </div>
            )}

        </div>
    );
};
