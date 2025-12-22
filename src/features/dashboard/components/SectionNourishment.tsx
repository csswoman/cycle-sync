import React from 'react';

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
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2 mt-4">
                <span className="material-symbols-outlined text-primary">nutrition</span>
                <h2 className="text-foreground text-xl font-bold">Nourishment</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {meals.map((meal, index) => (
                    <div key={index} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all group shadow-sm">
                        <div
                            className="h-48 w-full bg-cover bg-center relative"
                            style={{ backgroundImage: `url("${meal.imageUrl}")` }}
                        >
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-primary-foreground text-xl font-bold shadow-black drop-shadow-md">{meal.title}</h3>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-4 h-full">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-0.5">verified</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-foreground font-bold text-sm">{meal.focus}</span>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{meal.description}</p>
                                </div>
                            </div>
                            <div className="mt-auto bg-secondary p-4 rounded-xl border border-border/50">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <span className="text-primary font-bold">Why:</span> {meal.why}
                                </p>
                            </div>
                            <button className="text-sm font-semibold text-foreground underline decoration-primary underline-offset-4 decoration-2 hover:text-primary transition-colors text-left mt-2">
                                {meal.linkText}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
};
