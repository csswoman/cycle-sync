import React from 'react';
import { Card as AstryxCard } from '@astryxdesign/core/Card';
import { Icon } from '@/components/ui/Icon';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = true }) => {
    const hoverClasses = hoverable ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blossom/10" : "";
    const cursorClasses = onClick ? "cursor-pointer" : "cursor-default";

    return (
        <AstryxCard
            onClick={onClick}
            className={`relative overflow-hidden ${hoverClasses} ${cursorClasses} ${className} group`}
        >
            {children}
        </AstryxCard>
    );
};

export const CardHeader: React.FC<{ children?: React.ReactNode, icon?: string, title: string }> = ({ icon, title, children }) => {
    return (
        <div className="flex items-center justify-between mb-2">
            <p className="relative text-foreground text-sm font-semibold">{title}</p>
            {icon && (
                <Icon
                    name={icon}
                    size={18}
                    weight="duotone"
                    className="text-primary opacity-60 group-hover:opacity-100 transition-opacity"
                />
            )}
            {children}
        </div>
    );
};

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="flex flex-col gap-1">{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
    return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>;
};

