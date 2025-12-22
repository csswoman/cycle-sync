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
                <h2 className="text-white text-xl font-bold">Nourishment</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {meals.map((meal, index) => (
                    <div key={index} className="flex flex-col rounded-xl border border-border-dark bg-card-dark overflow-hidden hover:border-border-dark/80 transition-all group">
                        <div
                            className="h-48 w-full bg-cover bg-center relative"
                            style={{ backgroundImage: `url("${meal.imageUrl}")` }}
                        >
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-white text-xl font-bold shadow-black drop-shadow-md">{meal.title}</h3>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-4 h-full">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-0.5">verified</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium text-sm">{meal.focus}</span>
                                    <p className="text-[#ad93c8] text-sm leading-relaxed">{meal.description}</p>
                                </div>
                            </div>
                            <div className="mt-auto bg-[#1a1122] p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-gray-400">
                                    <span className="text-primary font-semibold">Why:</span> {meal.why}
                                </p>
                            </div>
                            <button className="text-sm font-medium text-white underline decoration-primary underline-offset-4 decoration-2 hover:text-primary transition-colors text-left mt-2">
                                {meal.linkText}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
