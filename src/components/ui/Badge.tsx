import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
    icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '', icon }) => {
    const variants = {
        primary: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-surface-dark text-text-secondary border-surface-dark",
        success: "bg-green-500/10 text-green-500 border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        danger: "bg-red-500/10 text-red-500 border-red-500/20",
        outline: "bg-transparent text-text-secondary border-surface-dark",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${variants[variant]} ${className}`}>
            {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
            {children}
        </span>
    );
};
