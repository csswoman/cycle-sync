import React from 'react';

interface StepPreferencesProps {
    selectedTraining: string[];
    selectedFood: string[];
    onToggleTraining: (id: string) => void;
    onToggleFood: (id: string) => void;
}

export const StepPreferences: React.FC<StepPreferencesProps> = ({
    selectedTraining,
    selectedFood,
    onToggleTraining,
    onToggleFood,
}) => {
    const trainingOptions = [
        { id: 'yoga', name: 'Yoga & Pilates', img: 'https://images.unsplash.com/photo-1544367563-12123d8959bd?auto=format&fit=crop&q=80&w=400' },
        { id: 'strength', name: 'Strength', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400' },
        { id: 'hiit', name: 'HIIT', img: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=400' },
        { id: 'run', name: 'Running', img: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&q=80&w=400' }
    ];

    const foodOptions = [
        { id: 'balanced', name: 'Balanced', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400' },
        { id: 'veg', name: 'Vegetarian', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400' },
        { id: 'keto', name: 'Keto / Low Carb', img: 'https://images.unsplash.com/photo-1547496502-ffa76f30d088?auto=format&fit=crop&q=80&w=400' },
        { id: 'paleo', name: 'Paleo', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400' }
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">Customize your experience</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">Tell us about your preferences so we can tailor recommendations.</p>
            </div>


            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Preferred Training Styles</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {trainingOptions.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onToggleTraining(item.id)}
                            className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group border-2 transition-all ${selectedTraining.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                        >
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className={`absolute inset-0 bg-black/40 flex items-end p-3 transition-colors ${selectedTraining.includes(item.id) ? 'bg-primary/20' : ''}`}>
                                <span className="text-white font-bold text-sm">{item.name}</span>
                            </div>
                            {selectedTraining.includes(item.id) && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Dietary Focus</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {foodOptions.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onToggleFood(item.id)}
                            className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group border-2 transition-all ${selectedFood.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                        >
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className={`absolute inset-0 bg-black/40 flex items-end p-3 transition-colors ${selectedFood.includes(item.id) ? 'bg-primary/20' : ''}`}>
                                <span className="text-white font-bold text-sm">{item.name}</span>
                            </div>
                            {selectedFood.includes(item.id) && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
