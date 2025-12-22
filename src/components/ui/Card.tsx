import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = true }) => {
    const baseClasses = "rounded-xl p-5 border border-border bg-card text-foreground transition-all duration-300";
    const hoverClasses = hoverable ? "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5" : "";
    const cursorClasses = onClick ? "cursor-pointer" : "cursor-default";

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${hoverClasses} ${cursorClasses} ${className} group`}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode, icon?: string, title: string }> = ({ icon, title, children }) => {
    return (
        <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{title}</p>
            {icon && (
                <span className="material-symbols-outlined text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                    {icon}
                </span>
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

