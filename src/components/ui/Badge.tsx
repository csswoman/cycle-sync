import React from 'react';
import { Badge as AstryxBadge } from '@astryxdesign/core/Badge';
import { Icon } from '@/components/ui/Icon';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
    /** Icon name. */
    icon?: string;
}

const VARIANT_MAP: Record<BadgeVariant, React.ComponentProps<typeof AstryxBadge>['variant']> = {
    primary: 'pink',
    secondary: 'neutral',
    success: 'success',
    warning: 'warning',
    danger: 'error',
    outline: 'neutral',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '', icon }) => {
    return (
        <AstryxBadge
            className={className}
            variant={VARIANT_MAP[variant]}
            label={children}
            icon={icon ? <Icon name={icon} size={14} weight="bold" /> : undefined}
        />
    );
};
