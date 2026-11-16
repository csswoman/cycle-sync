import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
                <Icon name="self_improvement" size={22} weight="duotone" className="text-primary" />
                <h2 className="text-foreground text-xl font-semibold tracking-tight">Movement</h2>
            </div>
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-2/5 h-56 md:h-auto overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-card z-10 opacity-70"></div>
                        <div
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url("${imageUrl}")` }}
                        ></div>
                        <div className="absolute top-3 left-3 z-20 flex gap-2">
                            <span className="px-3 py-1 rounded-full bg-card/85 backdrop-blur-md text-foreground text-xs font-semibold border border-border/50 shadow-sm">{duration}</span>
                            <span className="px-3 py-1 rounded-full bg-card/85 backdrop-blur-md text-foreground text-xs font-semibold border border-border/50 shadow-sm">{intensity}</span>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6 sm:p-7 gap-4 relative z-20">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">{title}</h3>
                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{description}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-leaf-soft/40 border border-leaf-soft text-foreground text-xs sm:text-sm flex items-start gap-2.5">
                            <Icon name="science" size={18} weight="duotone" className="text-leaf shrink-0 mt-0.5" />
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground font-semibold">Why: </strong>
                                {whyItWorks}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <Button icon="play_arrow" className="flex-1 sm:flex-none">Start Session</Button>
                            <button className="size-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Swap Activity">
                                <Icon name="swap_horiz" size={20} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};
