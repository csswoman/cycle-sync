import React from 'react';
import { Button } from '@/components/ui/Button';

interface SectionMovementProps {
    title: string;
    description: string;
    duration: string;
    intensity: string;
    imageUrl: string;
    whyItWorks: string;
}

export const SectionMovement: React.FC<SectionMovementProps> = ({
    title,
    description,
    duration,
    intensity,
    imageUrl,
    whyItWorks,
}) => {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-primary">self_improvement</span>
                <h2 className="text-white text-xl font-bold">Movement</h2>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border-dark bg-card-dark">
                <div className="flex flex-col lg:flex-row">
                    <div className="relative w-full lg:w-2/5 h-64 lg:h-auto overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-card-dark z-10 opacity-80"></div>
                        <div
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url("${imageUrl}")` }}
                        ></div>
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">{duration}</span>
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">{intensity}</span>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6 lg:p-8 gap-6 relative z-20">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-[#ad93c8] text-sm md:text-base leading-relaxed">{description}</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 relative">
                            <div className="absolute -top-3 left-4 px-2 bg-card-dark text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">science</span>
                                Why this works
                            </div>
                            <p className="text-sm text-gray-300 italic pt-1">"{whyItWorks}"</p>
                        </div>
                        <div className="flex items-center gap-4 mt-auto pt-2">
                            <Button icon="play_arrow" className="flex-1 md:flex-none">Start Session</Button>
                            <button className="p-3 rounded-lg border border-border-dark text-[#ad93c8] hover:text-white hover:bg-white/5 transition-colors" title="Swap Activity">
                                <span className="material-symbols-outlined">swap_horiz</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
