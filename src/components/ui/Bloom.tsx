import React, { useId } from 'react';
import type { BloomTone } from '@/lib/cycle/bloom';

interface BloomProps {
    /** 0 = seed, ~0.3 = sprout with leaves, ~0.5 = closed bud, 1 = fully open flower. */
    growth: number;
    /** Palette: deep rose bud, fresh spring, vivid bloom or warm ripening. */
    tone?: BloomTone;
    className?: string;
    style?: React.CSSProperties;
}

const PALETTES: Record<BloomTone, { petal: string; light: string; center: string }> = {
    menstrual: { petal: 'var(--bud)', light: 'var(--blossom-soft)', center: 'var(--blush)' },
    follicular: { petal: 'var(--petal)', light: 'var(--blush)', center: 'var(--sun)' },
    ovulation: { petal: 'var(--blossom)', light: 'var(--petal)', center: 'var(--sun)' },
    luteal: { petal: 'var(--coral)', light: 'var(--peach)', center: 'var(--sun)' },
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) ** 2;

const PETALS = 6;
const LEAF = 'M0 0 C 7 -9, 21 -11, 30 -2 C 21 5, 8 5, 0 0 Z';
const BASE_Y = 148;

/**
 * Decorative plant that grows with `growth`: seed → sprout → leaves → bud → open flower.
 * Used to show the cycle (and daily progress) as something that blooms over time.
 */
export const Bloom: React.FC<BloomProps> = ({ growth, tone = 'follicular', className = '', style }) => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const g = clamp(growth);
    const colors = PALETTES[tone];

    const stemH = g < 0.06 ? 0 : lerp(8, 92, easeOut(clamp((g - 0.05) / 0.6)));
    const topY = BASE_Y - stemH;
    const leaf1 = easeOut(clamp((g - 0.14) / 0.24));
    const leaf2 = easeOut(clamp((g - 0.28) / 0.24));
    const bud = easeOut(clamp((g - 0.36) / 0.16));
    const open = easeOut(clamp((g - 0.52) / 0.48));
    const seed = 1 - clamp((g - 0.12) / 0.15);

    const spread = lerp(9, 360 / PETALS, open);
    const petalL = lerp(10, 19, open);
    const petalW = lerp(5, 9, open);
    const petals = Array.from({ length: PETALS }, (_, i) => (i - (PETALS - 1) / 2) * spread)
        // Outer petals first so the middle ones overlap them while it is still a bud.
        .sort((a, b) => Math.abs(b) - Math.abs(a));

    return (
        <svg
            viewBox="0 0 120 160"
            className={`pointer-events-none select-none ${className}`}
            style={style}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <filter id={`${uid}-ink`} x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" />
                    <feDisplacementMap in="SourceGraphic" scale="2.5" />
                </filter>
                <linearGradient id={`${uid}-petal`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={colors.petal} />
                    <stop offset="100%" stopColor={colors.light} />
                </linearGradient>
                <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--leaf)" />
                    <stop offset="100%" stopColor="var(--leaf-fresh)" />
                </linearGradient>
                <radialGradient id={`${uid}-glow`}>
                    <stop offset="0%" stopColor={colors.light} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={colors.light} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Soft halo behind the open flower. */}
            {open > 0 && <circle cx="60" cy={topY} r={lerp(10, 40, open)} fill={`url(#${uid}-glow)`} opacity={open * 0.8} />}

            <ellipse cx="60" cy={BASE_Y + 3} rx="30" ry="5" fill="var(--leaf-soft)" />

            <g filter={`url(#${uid}-ink)`} className="bloom-sway">
                {seed > 0 && (
                    <ellipse cx="60" cy={BASE_Y - 1} rx="6" ry="4.5" fill="var(--peach)" stroke="var(--coral)" strokeWidth="1.5" opacity={seed} />
                )}

                {stemH > 0 && (
                    <path
                        d={`M60 ${BASE_Y} Q ${60 + stemH * 0.08} ${BASE_Y - stemH / 2} 60 ${topY}`}
                        fill="none"
                        stroke="var(--leaf)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                )}

                {leaf1 > 0 && (
                    <g transform={`translate(60 ${BASE_Y - stemH * 0.32}) rotate(-25) scale(${-leaf1} ${leaf1})`}>
                        <path d={LEAF} fill={`url(#${uid}-leaf)`} stroke="var(--leaf)" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M2 0 Q 15 -3 27 -2" fill="none" stroke="var(--leaf-soft)" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                )}
                {leaf2 > 0 && (
                    <g transform={`translate(${60 + stemH * 0.04} ${BASE_Y - stemH * 0.58}) rotate(-20) scale(${leaf2 * 0.85})`}>
                        <path d={LEAF} fill={`url(#${uid}-leaf)`} stroke="var(--leaf)" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M2 0 Q 15 -3 27 -2" fill="none" stroke="var(--leaf-soft)" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                )}

                {bud > 0 && (
                    <g transform={`translate(60 ${topY}) scale(${bud})`}>
                        {/* Sepals hold the closed bud and tuck away as it opens. */}
                        {open < 0.7 && [-35, 35].map((a) => (
                            <ellipse key={a} cx="0" cy="-5" rx="3" ry="7" fill="var(--leaf-fresh)" stroke="var(--leaf)" strokeWidth="1" transform={`rotate(${a})`} opacity={1 - open / 0.7} />
                        ))}
                        {petals.map((angle, i) => (
                            <ellipse
                                key={i}
                                cx="0"
                                cy={-petalL}
                                rx={petalW}
                                ry={petalL}
                                transform={`rotate(${angle})`}
                                fill={`url(#${uid}-petal)`}
                                stroke={`color-mix(in srgb, ${colors.petal} 70%, #5a2a1a)`}
                                strokeWidth="1.5"
                            />
                        ))}
                        {open > 0 && (
                            <circle r={lerp(1, 7, open)} fill={colors.center} stroke={`color-mix(in srgb, ${colors.center} 60%, #3a2a10)`} strokeWidth="1.5" />
                        )}
                    </g>
                )}

                {/* Ripening: a couple of petals resting on the soil. */}
                {tone === 'luteal' && open > 0.9 && (
                    <g fill={`url(#${uid}-petal)`} opacity="0.85">
                        <ellipse cx="38" cy={BASE_Y + 1} rx="3" ry="6" transform={`rotate(70 38 ${BASE_Y + 1})`} />
                        <ellipse cx="84" cy={BASE_Y + 2} rx="2.5" ry="5" transform={`rotate(-60 84 ${BASE_Y + 2})`} />
                    </g>
                )}
            </g>
        </svg>
    );
};
