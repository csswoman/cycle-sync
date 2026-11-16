import React, { useId } from 'react';

interface FlowerProps {
    /** Petal fill, any CSS color (e.g. 'var(--blossom-soft)'). */
    petal: string;
    /** Center fill. */
    center: string;
    /** Outline color; defaults to a darker mix of the petal color. */
    outline?: string;
    petals?: number;
    /** Rotation in degrees, so repeated flowers don't look stamped. */
    rotate?: number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Decorative hand-drawn-looking flower. A turbulence displacement filter
 * wobbles the shapes so they read as crayon/marker doodles.
 */
export const Flower: React.FC<FlowerProps> = ({
    petal,
    center,
    outline,
    petals = 6,
    rotate = 0,
    className = '',
    style,
}) => {
    const id = `flower-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const stroke = outline ?? `color-mix(in srgb, ${petal} 55%, #5a2a1a)`;
    const step = 360 / petals;

    return (
        <svg
            viewBox="0 0 100 100"
            className={`pointer-events-none select-none ${className}`}
            style={style}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={petals + rotate} />
                    <feDisplacementMap in="SourceGraphic" scale="5" />
                </filter>
            </defs>
            <g filter={`url(#${id})`} transform={`rotate(${rotate} 50 50)`}>
                {Array.from({ length: petals }, (_, i) => (
                    <g key={i} transform={`rotate(${i * step} 50 50)`}>
                        <ellipse
                            cx="50"
                            cy="26"
                            rx="14"
                            ry="22"
                            fill={petal}
                            stroke={stroke}
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                        <path d="M50 12 Q46 26 50 40" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
                    </g>
                ))}
                <circle cx="50" cy="50" r="13" fill={center} stroke={`color-mix(in srgb, ${center} 60%, #3a2a10)`} strokeWidth="2" />
            </g>
        </svg>
    );
};
