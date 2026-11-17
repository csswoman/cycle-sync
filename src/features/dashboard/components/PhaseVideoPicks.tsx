'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import workoutVideos from '@/data/workoutVideos.json';
import { parseYouTubeId } from '@/lib/youtube';
import { displayVideoTitle } from '@/data/videoTitleOverrides';
import type { PhaseKey } from '@/lib/cycle/phaseSuggestions';

interface RawVideo {
    url: string;
    title: string;
    channel_name?: string;
    category: string;
    phases: string[];
    duration_minutes: number;
    intensity: 'low' | 'medium' | 'high';
}

const CATEGORY: Record<string, { es: string; en: string }> = {
    yoga: { es: 'Yoga', en: 'Yoga' },
    pilates: { es: 'Pilates', en: 'Pilates' },
    gym: { es: 'Fuerza', en: 'Strength' },
    dance: { es: 'Baile', en: 'Dance' },
};

/** Intensity that suits each phase; a sedentary profile always starts low. */
const PHASE_INTENSITY: Record<PhaseKey, Array<RawVideo['intensity']>> = {
    menstrual: ['low'],
    follicular: ['medium', 'low'],
    ovulation: ['high', 'medium'],
    luteal: ['low', 'medium'],
};

function dayIndex(): number {
    const d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

/**
 * A few catalog videos for the phase, with YouTube thumbnails, read from the bundled
 * list so it works for guests and offline. The pick rotates daily.
 */
export const PhaseVideoPicks: React.FC<{ phase: PhaseKey; lang: 'es' | 'en'; lowActivity?: boolean; count?: number }> = ({ phase, lang, lowActivity = false, count = 3 }) => {
    const picks = useMemo(() => {
        const allowed = lowActivity ? ['low'] : PHASE_INTENSITY[phase];
        const pool = (workoutVideos as RawVideo[]).flatMap((v) => {
            if (!(v.phases.includes(phase) || v.phases.includes('any')) || !allowed.includes(v.intensity)) return [];
            const id = parseYouTubeId(v.url);
            return id ? [{ ...v, id }] : [];
        });
        if (pool.length === 0) return [];
        // Prefer different categories so the three rows are not all the same kind of class.
        const start = dayIndex() % pool.length;
        const rotated = [...pool.slice(start), ...pool.slice(0, start)];
        const out: typeof pool = [];
        const seen = new Set<string>();
        for (const v of rotated) {
            if (out.length >= count) break;
            if (!seen.has(v.category)) { out.push(v); seen.add(v.category); }
        }
        for (const v of rotated) {
            if (out.length >= count) break;
            if (!out.includes(v)) out.push(v);
        }
        return out;
    }, [phase, lowActivity, count]);

    if (picks.length === 0) return null;

    return (
        <ul className="flex flex-col gap-2">
            {picks.map((v) => (
                <li key={v.id}>
                    <Link
                        href="/routines?tab=phase"
                        className="group w-full flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-2 pr-3"
                    >
                        <div className="relative w-20 aspect-video shrink-0 rounded-lg overflow-hidden bg-secondary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-0.5 right-0.5 text-[10px] font-bold bg-black/75 text-white px-1 rounded">
                                {v.duration_minutes} min
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-sm font-semibold leading-snug line-clamp-2">{displayVideoTitle(v.title)}</p>
                            <p className="text-xs text-phase truncate">
                                {CATEGORY[v.category]?.[lang] ?? v.category}{v.channel_name ? ` · ${v.channel_name}` : ''}
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
};
