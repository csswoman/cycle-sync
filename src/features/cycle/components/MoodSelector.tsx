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
/** Mood picker. Renders a bare section: the daily log wraps its sections in a single card. */
export const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodSelect, lang = 'en' }) => {
    const moodOptions = [
        { type: Mood.ROUGH, icon: 'sentiment_very_dissatisfied' },
        { type: Mood.DOWN, icon: 'sentiment_dissatisfied' },
        { type: Mood.OKAY, icon: 'sentiment_neutral' },
        { type: Mood.GOOD, icon: 'sentiment_satisfied' },
        { type: Mood.GREAT, icon: 'sentiment_very_satisfied' },
    ];
    const title = lang === 'es' ? 'Ánimo y estado mental' : 'Mood & Mental State';
    return (
        <section className="flex flex-col gap-4" aria-labelledby="log-mood-title">
            <h2 id="log-mood-title" className="text-lg font-semibold text-foreground flex items-center gap-2 text-balance">
                <Icon name="mood" size={22} weight="duotone" className="text-primary" />
                {title}
            </h2>
            <div role="radiogroup" aria-labelledby="log-mood-title" className="grid grid-cols-5 gap-1 sm:gap-3">
                {moodOptions.map((option) => {
                    const active = selectedMood === option.type;
                    return (
                        <button
                            key={option.type}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onMoodSelect(option.type)}
                            className="flex flex-col items-center gap-2 group rounded-2xl py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            <span className={`size-12 sm:size-14 rounded-full flex items-center justify-center border-2 transition-colors
                ${active
                                    ? 'bg-primary border-primary shadow-[var(--shadow-med)]'
                                    : 'bg-secondary border-transparent group-hover:border-primary/50'}`}
                            >
                                <Icon
                                    name={option.icon}
                                    size={28}
                                    weight={active ? 'fill' : 'duotone'}
                                    className={active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                                />
                            </span>
                            <span className={`text-sm leading-tight text-center ${active ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                {lang === 'es' ? MOOD_ES[option.type] : option.type}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};
