import React from 'react';
import { Button as AstryxButton } from '@astryxdesign/core/Button';
import { Icon } from '@/components/ui/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

type AstryxButtonProps = React.ComponentProps<typeof AstryxButton>;

interface ButtonProps
    extends Omit<AstryxButtonProps, 'label' | 'variant' | 'size' | 'icon' | 'isDisabled' | 'isIconOnly'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon name. */
    icon?: string;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    /** Accessible name. Defaults to the text children; required for icon-only buttons. */
    label?: string;
}

// Astryx has no outline/gradient variants; map them to the closest ones.
const VARIANT_MAP: Record<ButtonVariant, AstryxButtonProps['variant']> = {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'ghost',
    outline: 'secondary',
    gradient: 'primary',
};

const ButtonIcon = ({ name }: { name: string }) => (
    <Icon name={name} size={18} weight="bold" />
);

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    disabled,
    label,
    ...props
}) => {
    const isIconOnly = !!icon && (children === undefined || children === null);
    const accessibleLabel = label ?? (typeof children === 'string' ? children : icon ?? '');

    return (
        <AstryxButton
            {...props}
            label={accessibleLabel}
            variant={VARIANT_MAP[variant]}
            size={size}
            isDisabled={disabled}
            isIconOnly={isIconOnly}
            icon={icon && iconPosition === 'left' ? <ButtonIcon name={icon} /> : undefined}
        >
            {isIconOnly ? undefined : (
                <>
                    {children}
                    {icon && iconPosition === 'right' && <ButtonIcon name={icon} />}
                </>
            )}
        </AstryxButton>
    );
};
