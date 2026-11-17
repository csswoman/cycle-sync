'use client';
import React, { useEffect, useState } from 'react';
import { Bloom } from './Bloom';
import type { BloomTone } from '@/lib/cycle/bloom';

interface GrowingBloomProps {
    className?: string;
    /** Seconds from seed to open flower. */
    growSeconds?: number;
    /** Seconds the open flower stays (ripening) before it starts again. */
    holdSeconds?: number;
}

const FADE = 0.8;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Color of the plant at each stage, so one loop walks through the four phases. */
function toneAt(growth: number, holding: boolean): BloomTone {
    if (holding) return 'luteal';
    if (growth < 0.3) return 'menstrual';
    if (growth < 0.75) return 'follicular';
    return 'ovulation';
}

/**
 * Decorative loop: a Bloom grows from seed to full flower, ripens, fades and starts again.
 * With reduced motion it shows the open flower without animating.
 */
export const GrowingBloom: React.FC<GrowingBloomProps> = ({ className = '', growSeconds = 7, holdSeconds = 3.5 }) => {
    const [state, setState] = useState({ growth: 1, tone: 'ovulation' as BloomTone, opacity: 1 });

    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const total = growSeconds + holdSeconds + FADE;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = ((now - start) / 1000) % total;
            const holding = t >= growSeconds;
            const growth = holding ? 1 : 0.02 + 0.98 * easeInOut(t / growSeconds);
            const fadeOut = t > growSeconds + holdSeconds ? 1 - (t - growSeconds - holdSeconds) / FADE : 1;
            const fadeIn = Math.min(1, t / 0.4);
            setState({ growth, tone: toneAt(growth, holding), opacity: Math.max(0, Math.min(fadeIn, fadeOut)) });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [growSeconds, holdSeconds]);

    return (
        <Bloom
            growth={state.growth}
            tone={state.tone}
            className={className}
            style={{ opacity: state.opacity, '--sway': '4deg', '--sway-dur': '4s' } as React.CSSProperties}
        />
    );
};
