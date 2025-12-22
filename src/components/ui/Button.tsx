import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: string;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-surface-hover",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        outline: "bg-transparent text-foreground border border-border hover:border-primary",
        gradient: "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:brightness-110 shadow-xl shadow-primary/10",
    };


    const sizes = {
        sm: "px-4 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
            {!isLoading && icon && iconPosition === 'left' && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
            {children}
            {!isLoading && icon && iconPosition === 'right' && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
        </button>
    );
};
