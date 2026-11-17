import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { onboardingText } from '@/i18n/onboardingText';
import { Icon } from '@/components/ui/Icon';

interface StepPreferencesProps {
    selectedTraining: string[];
    selectedFood: string[];
    onToggleTraining: (id: string) => void;
    onToggleFood: (id: string) => void;
}

interface Option {
    id: string;
    name: string;
    hint?: string;
    img: string;
    /** Shown on the illustrated fallback if the image fails to load. */
    icon: string;
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=400`;

/** Image tile that falls back to a botanical pattern with an icon instead of a broken image. */
const OptionTile: React.FC<{
    option: Option;
    selected: boolean;
    onToggle: () => void;
    /** stack: photo on top (short labels). row: photo left, text right (labels with a hint). */
    layout?: 'stack' | 'row';
}> = ({ option, selected, onToggle, layout = 'stack' }) => {
    const [failed, setFailed] = useState(false);
    const row = layout === 'row';
    return (
        // Text sits on its own surface, never over the photo, so it is always readable.
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            className={`relative flex ${row ? 'flex-row items-stretch' : 'flex-col'} h-full rounded-2xl overflow-hidden text-left group border-2 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blossom ${
                selected
                    ? 'garden-wash border-blossom shadow-lg shadow-blossom/20'
                    : 'bg-card border-border/70 hover:border-leaf/60 hover:shadow-lg hover:shadow-leaf/15'
            }`}
        >
            <span className={`relative block overflow-hidden ${row ? 'w-24 sm:w-28 shrink-0 min-h-24 sm:min-h-28' : 'aspect-[4/3] w-full'}`}>
                {failed ? (
                    <span className="absolute inset-0 garden-wash wash-leaf pattern-leaves flex items-center justify-center">
                        <span className="size-14 rounded-full bg-leaf-soft text-leaf flex items-center justify-center">
                            <Icon name={option.icon} size={28} weight="duotone" />
                        </span>
                    </span>
                ) : (
                    <img
                        src={option.img}
                        alt=""
                        loading="lazy"
                        onError={() => setFailed(true)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                )}
                {/* Garden tint: fades in on hover and stays while selected. */}
                <span
                    className={`absolute inset-0 bg-garden mix-blend-soft-light transition-opacity duration-300 ${
                        selected ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'
                    }`}
                />
                <span
                    className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blossom/35 to-transparent transition-opacity duration-300 ${
                        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                />
            </span>
            <span
                className={`absolute top-2 right-2 z-10 size-7 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                    selected
                        ? 'bg-bloom text-primary-foreground scale-100'
                        : `${row ? 'bg-leaf-soft' : 'bg-card/90'} text-leaf scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100`
                }`}
            >
                <Icon name={selected ? 'check' : 'add'} size={16} weight="bold" />
            </span>
            <span className={`flex flex-col gap-1 flex-1 min-w-0 ${row ? 'justify-center py-3 pl-3.5 pr-10' : 'p-3 sm:p-3.5'}`}>
                <span className={`font-bold text-sm leading-tight transition-colors ${selected ? 'text-blossom' : 'text-foreground group-hover:text-leaf'}`}>
                    {option.name}
                </span>
                {option.hint && <span className="text-xs text-muted-foreground leading-snug">{option.hint}</span>}
            </span>
        </button>
    );
};

export const StepPreferences: React.FC<StepPreferencesProps> = ({
    selectedTraining,
    selectedFood,
    onToggleTraining,
    onToggleFood,
}) => {
    const { language } = useLanguage();
    const text = onboardingText[language].setup.prefs;

    const trainingOptions: Option[] = [
        { id: 'yoga', name: text.trainingOptions.yoga, img: '/yoga.png', icon: 'self_improvement' },
        { id: 'strength', name: text.trainingOptions.strength, img: unsplash('photo-1517836357463-d25dfeac3438'), icon: 'fitness_center' },
        { id: 'hiit', name: text.trainingOptions.hiit, img: unsplash('photo-1601422407692-ec4eeec1d9b3'), icon: 'bolt' },
        { id: 'run', name: text.trainingOptions.run, img: unsplash('photo-1502904550040-7534597429ae'), icon: 'trending_up' },
    ];

    const foodOptions: Option[] = [
        { id: 'balanced', name: text.foodOptions.balanced, hint: text.foodHints.balanced, img: unsplash('photo-1547592180-85f173990554'), icon: 'restaurant' },
        { id: 'veg', name: text.foodOptions.veg, hint: text.foodHints.veg, img: unsplash('photo-1512621776951-a57141f2eefd'), icon: 'plant' },
        { id: 'keto', name: text.foodOptions.keto, hint: text.foodHints.keto, img: '/recipes/arroz-de-coliflor-con-pollo-salteado.webp', icon: 'nutrition' },
        { id: 'paleo', name: text.foodOptions.paleo, hint: text.foodHints.paleo, img: unsplash('photo-1490645935967-10de6ba17061'), icon: 'restaurant' },
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-foreground">{text.title}</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">{text.subtitle}</p>
            </div>

            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">{text.training}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {trainingOptions.map((item) => (
                        <OptionTile
                            key={item.id}
                            option={item}
                            selected={selectedTraining.includes(item.id)}
                            onToggle={() => onToggleTraining(item.id)}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">{text.food}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {foodOptions.map((item) => (
                        <OptionTile
                            key={item.id}
                            layout="row"
                            option={item}
                            selected={selectedFood.includes(item.id)}
                            onToggle={() => onToggleFood(item.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
