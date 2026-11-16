import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface Meal {
    title: string;
    imageUrl: string;
    focus: string;
    description: string;
    why: string;
    linkText: string;
}

interface SectionNourishmentProps {
    meals: Meal[];
}

export const SectionNourishment: React.FC<SectionNourishmentProps> = ({ meals }) => {
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
                <Icon name="restaurant" size={22} weight="duotone" className="text-primary" />
                <h2 className="text-foreground text-xl font-semibold tracking-tight">Nourishment</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {meals.map((meal, index) => (
                    <div key={index} className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all group shadow-sm">
                        <div
                            className="h-44 w-full bg-cover bg-center relative"
                            style={{ backgroundImage: `url("${meal.imageUrl}")` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-3 left-4 right-4">
                                <h3 className="text-white text-lg font-semibold leading-snug drop-shadow-sm">{meal.title}</h3>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 flex-1">
                            <div className="flex items-start gap-2.5">
                                <Icon name="verified" size={18} weight="duotone" className="text-blossom mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-foreground font-semibold text-xs sm:text-sm">{meal.focus}</span>
                                    <p className="text-muted-foreground text-xs leading-relaxed">{meal.description}</p>
                                </div>
                            </div>
                            <div className="mt-auto bg-card/60 p-3 rounded-2xl border border-border/60 text-xs">
                                <p className="text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground font-semibold">Why: </strong>{meal.why}
                                </p>
                            </div>
                            <button className="text-xs font-semibold text-blossom hover:text-blossom/80 transition-colors text-left flex items-center gap-1 pt-1">
                                <span>{meal.linkText}</span>
                                <Icon name="arrow_forward" size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
