import React from 'react';
import { Mood } from '@/types';
import { Icon } from '@/components/ui/Icon';

interface MoodSelectorProps {
    selectedMood: Mood;
    onMoodSelect: (mood: Mood) => void;
    lang?: 'es' | 'en';
}

const MOOD_ES: Record<Mood, string> = {
    [Mood.ROUGH]: 'Muy mal', [Mood.DOWN]: 'Bajo', [Mood.OKAY]: 'Normal', [Mood.GOOD]: 'Bien', [Mood.GREAT]: 'Genial',
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodSelect, lang = 'en' }) => {
    const moodOptions = [
        { type: Mood.ROUGH, icon: 'sentiment_very_dissatisfied' },
        { type: Mood.DOWN, icon: 'sentiment_dissatisfied' },
        { type: Mood.OKAY, icon: 'sentiment_neutral' },
        { type: Mood.GOOD, icon: 'sentiment_satisfied' },
        { type: Mood.GREAT, icon: 'sentiment_very_satisfied' },
    ];

    return (
        <div className="bg-secondary/40 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Icon name="mood" size={22} weight="duotone" className="text-primary" />
                    {lang === 'es' ? 'Ánimo y estado mental' : 'Mood & Mental State'}
                </h3>
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-4">
                {moodOptions.map((option) => (
                    <button
                        key={option.type}
                        onClick={() => onMoodSelect(option.type)}
                        aria-pressed={selectedMood === option.type}
                        className="flex flex-col items-center gap-2 group focus:outline-none"
                    >
                        <div className={`size-12 md:size-14 rounded-full flex items-center justify-center border-2 transition-all
              ${selectedMood === option.type
                                ? 'bg-primary border-primary shadow-[0_0_15px_rgba(127,25,230,0.4)]'
                                : 'bg-secondary border-transparent group-hover:border-primary/50'}`}
                        >
                            <Icon
                                name={option.icon}
                                size={28}
                                weight={selectedMood === option.type ? 'fill' : 'duotone'}
                                className={selectedMood === option.type ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                            />
                        </div>
                        <span className={`text-xs font-medium ${selectedMood === option.type ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {lang === 'es' ? MOOD_ES[option.type] : option.type}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
