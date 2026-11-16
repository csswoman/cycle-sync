'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import type { OnboardingAnswers } from '@/features/setup/onboarding';
import { dashboardText, phaseKey } from '../dashboardText';

interface Props { phase: string; answers: OnboardingAnswers }

export const PhaseRecommendations: React.FC<Props> = ({ phase, answers }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const text = dashboardText[language === 'es' ? 'es' : 'en'];
    const copy = text.phases[phaseKey(phase)];
    const notes: string[] = [];
    if (answers.activity === 'low') notes.push(text.lowActivityNote);
    if (answers.goal === 'pmos') notes.push(text.pmosNote);

    const items = [
        { icon: 'fitness_center', title: copy.movement.title, desc: copy.movement.desc, cta: text.workoutCta, href: '/routines' },
        { icon: 'restaurant', title: copy.food.title, desc: copy.food.desc, cta: text.foodCta, href: '/nutrition' },
    ];

    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div>
                <h3 className="text-foreground text-lg font-semibold">{text.recommendTitle} · {copy.name}</h3>
                <p className="text-muted-foreground text-sm">{text.recommendSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                    <div key={item.href} className="bg-secondary/40 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-blossom">
                            <Icon name={item.icon} size={20} weight="duotone" />
                            <p className="text-foreground font-semibold text-sm">{item.title}</p>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{item.desc}</p>
                        <button onClick={() => router.push(item.href)} className="self-start text-sm font-bold text-primary flex items-center gap-1">
                            {item.cta}<Icon name="arrow_forward" size={14} />
                        </button>
                    </div>
                ))}
            </div>
            {notes.map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}
        </div>
    );
};
