import React from 'react';
import { Button } from '@/components/ui/Button';

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
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-card to-secondary p-1">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 md:p-6 rounded-[10px] bg-card/30 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary hidden sm:block">
                        <span className="material-symbols-outlined">edit_note</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-foreground text-lg font-bold">{title}</p>
                        <p className="text-muted-foreground text-sm leading-normal max-w-lg">{description}</p>
                    </div>
                </div>
                <Button onClick={onAction} icon="add_circle" variant="primary">
                    {buttonText}
                </Button>
            </div>
        </div>

    );
};
