import React from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
    selectedMood: Mood;
    onMoodSelect: (mood: Mood) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodSelect }) => {
    const moodOptions = [
        { type: Mood.ROUGH, icon: 'sentiment_very_dissatisfied' },
        { type: Mood.DOWN, icon: 'sentiment_dissatisfied' },
        { type: Mood.OKAY, icon: 'sentiment_neutral' },
        { type: Mood.GOOD, icon: 'sentiment_satisfied' },
        { type: Mood.GREAT, icon: 'sentiment_very_satisfied' },
    ];

    return (
        <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">mood</span>
                    Mood & Mental State
                </h3>
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-4">
                {moodOptions.map((option) => (
                    <button
                        key={option.type}
                        onClick={() => onMoodSelect(option.type)}
                        className="flex flex-col items-center gap-2 group focus:outline-none"
                    >
                        <div className={`size-12 md:size-14 rounded-full flex items-center justify-center border-2 transition-all
              ${selectedMood === option.type
                                ? 'bg-primary border-primary shadow-[0_0_15px_rgba(127,25,230,0.4)]'
                                : 'bg-surface-dark border-transparent group-hover:border-primary/50'}`}
                        >
                            <span className={`material-symbols-outlined text-3xl ${selectedMood === option.type ? 'text-white' : 'text-text-secondary group-hover:text-white'}`}>
                                {option.icon}
                            </span>
                        </div>
                        <span className={`text-xs font-medium ${selectedMood === option.type ? 'text-white font-bold' : 'text-text-secondary group-hover:text-white'}`}>
                            {option.type}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
