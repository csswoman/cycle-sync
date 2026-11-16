import React from 'react';
import { Button } from '@/components/ui/Button';
import { Flower } from '@/components/ui/Flower';
import { Icon } from '@/components/ui/Icon';

interface DailyActionPanelProps {
    title: string;
    description: string;
    buttonText: string;
    onAction: () => void;
}

export const DailyActionPanel: React.FC<DailyActionPanelProps> = ({
    title,
    description,
    buttonText,
    onAction,
}) => {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-blossom-soft/40 shadow-sm p-6 sm:p-7">
            <Flower
                petal="var(--blossom-soft)"
                center="var(--leaf-soft)"
                petals={8}
                rotate={10}
                className="absolute -bottom-10 -right-6 size-36 opacity-70 pointer-events-none"
            />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-blossom-soft text-blossom flex-shrink-0 mt-0.5 sm:mt-0">
                        <Icon name="edit_note" size={24} weight="duotone" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-foreground text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-lg">{description}</p>
                    </div>
                </div>
                <Button onClick={onAction} icon="add_circle" variant="primary" size="md" className="w-full sm:w-auto flex-shrink-0">
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};
