import React from 'react';
import { Flower } from '@/components/ui/Flower';

/*
 * Decorative, animated botanical illustrations. All are aria-hidden, ignore pointer
 * events, read colors from the garden tokens (so they follow light/dark mode) and stop
 * moving under prefers-reduced-motion (see the .anim-* classes in globals.css).
 *
 * Animated parts use no SVG filter: re-running a turbulence filter on every frame is
 * expensive, so the organic look comes from curved paths and varied shapes instead.
 */

type Vars = React.CSSProperties & Record<`--${string}`, string>;
type Pt = [number, number];

const LEAF = 'M0 0 C 7 -9, 21 -11, 30 -2 C 21 5, 8 5, 0 0 Z';
const LEAF_VEIN = 'M2 -0.5 Q 15 -3.5 27 -2';
const ink = (color: string, amount = 65) => `color-mix(in srgb, ${color} ${amount}%, #4a2418)`;

const bez = (p: Pt[], t: number): Pt => {
    const u = 1 - t;
    return [0, 1].map((k) =>
        u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k],
    ) as Pt;
};
const tangentDeg = (p: Pt[], t: number) => {
    const u = 1 - t;
    const d = [0, 1].map((k) =>
        3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]),
    );
    return (Math.atan2(d[1], d[0]) * 180) / Math.PI;
};

export type StemHead = 'blossom' | 'daisy' | 'bud' | 'tulip' | 'none';

interface StemProps {
    /** 0..1 share of the box the stem reaches. */
    height?: number;
    /** Sideways lean of the tip, roughly -30..30. The stem bends in an S toward it. */
    bend?: number;
    leaves?: number;
    head?: StemHead;
    /** Small side branch with a bud halfway up. */
    branch?: boolean;
    petal?: string;
    center?: string;
    leaf?: string;
    /** Animation offset in seconds (negative starts mid-cycle), so stems never move in sync. */
    delay?: number;
    /** Sway cycle length in seconds. */
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
}

const Head: React.FC<{ type: StemHead; petal: string; center: string; delay: number }> = ({ type, petal, center, delay }) => {
    const vars: Vars = { '--delay': `${delay}s` };
    if (type === 'none') return null;
    if (type === 'bud') {
        return (
            <g className="anim-breathe" style={vars}>
                <ellipse cx="-3" cy="-6" rx="5" ry="9" fill={petal} stroke={ink(petal)} strokeWidth="1.3" transform="rotate(-14)" />
                <ellipse cx="3" cy="-6" rx="5" ry="9" fill={petal} stroke={ink(petal)} strokeWidth="1.3" transform="rotate(14)" />
                <path d="M-1 -12 Q 0 -6 1 0" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <path d="M-7 1 Q -2 -6 0 0 Q 2 -6 7 1 Z" fill="var(--leaf-fresh)" stroke="var(--leaf)" strokeWidth="1.2" />
            </g>
        );
    }
    if (type === 'tulip') {
        return (
            <g className="anim-breathe" style={vars}>
                <path d="M-9 -2 C -11 -14, -6 -22, -3 -20 L 0 -12 L 3 -20 C 6 -22, 11 -14, 9 -2 C 6 3, -6 3, -9 -2 Z" fill={petal} stroke={ink(petal)} strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M-4 -16 C -6 -9, -4 -3, 0 0" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
        );
    }
    if (type === 'daisy') {
        return (
            <g className="anim-breathe" style={vars}>
                {Array.from({ length: 11 }, (_, i) => (
                    <ellipse key={i} cx="0" cy="-9" rx="2.6" ry="7.5" fill={petal} stroke={ink(petal, 75)} strokeWidth="0.9" transform={`rotate(${i * (360 / 11)})`} />
                ))}
                <circle r="4.6" fill={center} stroke={ink(center, 60)} strokeWidth="1.1" />
                <circle cx="-1.4" cy="-1.4" r="1.2" fill="#ffffff" opacity="0.5" />
            </g>
        );
    }
    // blossom
    return (
        <g className="anim-breathe" style={vars}>
            {Array.from({ length: 5 }, (_, i) => (
                <g key={i} transform={`rotate(${i * 72})`}>
                    <path d="M0 0 C -9 -4, -9 -17, 0 -19 C 9 -17, 9 -4, 0 0 Z" fill={petal} stroke={ink(petal)} strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M0 -4 Q -1 -10 0 -15" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                </g>
            ))}
            <circle r="5" fill={center} stroke={ink(center, 60)} strokeWidth="1.1" />
            {[0, 120, 240].map((a) => (
                <circle key={a} cx="0" cy="-2.2" r="0.9" fill={ink(center, 50)} transform={`rotate(${a})`} />
            ))}
        </g>
    );
};

/**
 * One organic stem: S-curve, alternating leaves at varied angles and sizes, optional
 * side bud, and a flower head that follows the direction of the tip. Sways from its base.
 */
export const Stem: React.FC<StemProps> = ({
    height = 0.9,
    bend = 10,
    leaves = 4,
    head = 'blossom',
    branch = false,
    petal = 'var(--petal)',
    center = 'var(--sun)',
    leaf = 'var(--leaf-fresh)',
    delay = 0,
    duration = 6,
    className = '',
    style,
}) => {
    const baseY = 196;
    const top = baseY - 170 * height;
    const pts: Pt[] = [
        [50, baseY],
        [50 - bend * 0.5, baseY - (baseY - top) * 0.35],
        [50 + bend * 1.2, baseY - (baseY - top) * 0.7],
        [50 + bend, top],
    ];
    const d = `M${pts[0]} C${pts[1]} ${pts[2]} ${pts[3]}`;
    const tip = pts[3];
    const tipAngle = tangentDeg(pts, 1) + 90;

    const leafList = Array.from({ length: leaves }, (_, i) => {
        const t = 0.16 + (i * 0.6) / Math.max(1, leaves - 1);
        const side = i % 2 === 0 ? -1 : 1;
        const [x, y] = bez(pts, t);
        // Lower leaves are bigger and open wider; a little irregularity avoids a stamped look.
        const size = (1.05 - t * 0.55) * (i % 3 === 1 ? 0.85 : 1);
        const angle = tangentDeg(pts, t) + side * (62 - t * 25) + (i % 2 ? 6 : -4);
        return { x, y, size, angle, side, i };
    });

    const branchAt = bez(pts, 0.5);
    const branchAngle = tangentDeg(pts, 0.5) + (bend >= 0 ? -42 : 42);
    const sway: Vars = { '--delay': `${delay}s`, '--dur': `${duration}s` };

    return (
        <svg viewBox="0 0 100 200" overflow="visible" className={`pointer-events-none select-none ${className}`} style={style} aria-hidden="true" focusable="false">
            <g className="anim-sway" style={sway}>
                <path d={d} fill="none" stroke="var(--leaf)" strokeWidth="2.6" strokeLinecap="round" />
                {leafList.map((l) => (
                    <g key={l.i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle}) scale(${l.size} ${l.side * l.size})`}>
                        <g className="anim-flutter" style={{ '--delay': `${delay - l.i * 0.7}s`, '--dur': `${2.8 + (l.i % 3) * 0.6}s` } as Vars}>
                            <path d={LEAF} fill={leaf} stroke="var(--leaf)" strokeWidth="1.3" strokeLinejoin="round" />
                            <path d={LEAF_VEIN} fill="none" stroke="var(--leaf-soft)" strokeWidth="1" strokeLinecap="round" />
                        </g>
                    </g>
                ))}
                {branch && (
                    <g transform={`translate(${branchAt[0]} ${branchAt[1]}) rotate(${branchAngle})`}>
                        <path d="M0 0 Q 12 -3 22 0" fill="none" stroke="var(--leaf)" strokeWidth="1.8" strokeLinecap="round" />
                        <g transform="translate(22 0) rotate(90) scale(0.75)">
                            <Head type="bud" petal={petal} center={center} delay={delay - 1.5} />
                        </g>
                    </g>
                )}
                <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${tipAngle}) scale(1.25)`}>
                    {head === 'none' ? (
                        <g transform="rotate(-90) scale(0.55)">
                            <path d={LEAF} fill={leaf} stroke="var(--leaf)" strokeWidth="2" />
                        </g>
                    ) : (
                        <Head type={head} petal={petal} center={center} delay={delay} />
                    )}
                </g>
            </g>
        </svg>
    );
};

/** Back-compat sprig: a short stem with a bud (or a leaf tip when bud is null). */
export const Sprig: React.FC<{ leaf?: string; bud?: string | null; className?: string; style?: React.CSSProperties }> = ({
    leaf = 'var(--leaf-fresh)',
    bud = 'var(--petal)',
    className = '',
    style,
}) => (
    <Stem height={0.92} bend={8} leaves={5} head={bud ? 'bud' : 'none'} petal={bud ?? undefined} leaf={leaf} duration={7} className={className} style={style} />
);

/** Small sprig that sits inline before a page title and scales with its font size. */
export const TitleSprig: React.FC<{ bud?: string | null }> = ({ bud = 'var(--petal)' }) => (
    <Sprig bud={bud} className="inline-block h-[1.1em] w-auto mr-1.5 align-[-0.12em] -rotate-12" />
);

/** Petals that drift down and spin, on a loop. Fill the parent area with it. */
export const PetalFall: React.FC<{ colors?: string[]; count?: number; className?: string }> = ({
    colors = ['var(--petal)', 'var(--blossom-soft)'],
    count = 6,
    className = '',
}) => (
    <svg viewBox="0 0 100 100" overflow="visible" className={`pointer-events-none ${className}`} aria-hidden="true" focusable="false">
        {Array.from({ length: count }, (_, i) => {
            const x = 8 + ((i * 37) % 84);
            const y = 4 + ((i * 23) % 30);
            const color = colors[i % colors.length];
            const vars: Vars = {
                '--delay': `${-(i * 1.7)}s`,
                '--dur': `${7 + (i % 3) * 1.5}s`,
                '--dx': `${i % 2 ? -14 : 12}px`,
            };
            return (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="anim-petal-fall" style={vars}>
                        <ellipse rx="2.2" ry="3.8" fill={color} stroke={ink(color)} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                    </g>
                </g>
            );
        })}
    </svg>
);

/** A few loose petals gently floating in place, for empty corners and section ends. */
export const PetalDrift: React.FC<{ color?: string; className?: string; style?: React.CSSProperties }> = ({
    color = 'var(--petal)',
    className = '',
    style,
}) => {
    const petals = [
        { x: 14, y: 40, r: 30, s: 1 },
        { x: 42, y: 18, r: -40, s: 0.8 },
        { x: 70, y: 42, r: 65, s: 0.9 },
        { x: 88, y: 14, r: -15, s: 0.6 },
    ];
    return (
        <svg viewBox="0 0 100 60" overflow="visible" className={`pointer-events-none select-none ${className}`} style={style} aria-hidden="true" focusable="false">
            {petals.map((p, i) => (
                <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s})`}>
                    <g className="anim-float" style={{ '--delay': `${-i * 1.3}s` } as Vars}>
                        <ellipse rx="4.5" ry="8" fill={color} stroke={ink(color)} strokeWidth="1.2" />
                        <path d="M0 -5 Q -1 0 0 5" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                </g>
            ))}
        </svg>
    );
};

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
const smoothPath = (pts: Pt[]) =>
    pts.reduce((d, p, i, a) => {
        if (i === 0) return `M${p}`;
        const p0 = a[i - 2] ?? a[i - 1];
        const p1 = a[i - 1];
        const p3 = a[i + 1] ?? p;
        const c1: Pt = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
        const c2: Pt = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
        return `${d} C${c1} ${c2} ${p}`;
    }, '');

/**
 * Trends: a rising line that draws itself, a soft area under it, and flowers that
 * open on the peaks one after another. Decorative only, it does not show real data.
 */
export const GrowthLine: React.FC<{ className?: string }> = ({ className = '' }) => {
    const pts: Pt[] = [[8, 80], [36, 62], [64, 70], [94, 44], [124, 52], [154, 30], [190, 36]];
    const line = smoothPath(pts);
    const area = `${line} L190 96 L8 96 Z`;
    const peaks: { i: number; head: StemHead; petal: string }[] = [
        { i: 1, head: 'daisy', petal: 'var(--petal-light)' },
        { i: 3, head: 'blossom', petal: 'var(--petal)' },
        { i: 5, head: 'tulip', petal: 'var(--blossom)' },
    ];
    return (
        <svg viewBox="0 0 200 100" overflow="visible" className={`pointer-events-none select-none ${className}`} aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--leaf-fresh)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--leaf-fresh)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--leaf)" />
                    <stop offset="60%" stopColor="var(--petal)" />
                    <stop offset="100%" stopColor="var(--blossom)" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#growth-area)" className="anim-fade-in" style={{ '--delay': '0.9s' } as Vars} />
            <path d={line} pathLength={1} fill="none" stroke="url(#growth-line)" strokeWidth="3" strokeLinecap="round" className="anim-draw" />
            {pts.filter((_, i) => i % 2 === 0 && i > 0 && i < pts.length - 1).map((p, k) => (
                <g key={k} transform={`translate(${p[0]} ${p[1]}) rotate(${k % 2 ? 40 : -140}) scale(0.45)`}>
                    <g className="anim-pop" style={{ '--delay': `${0.6 + k * 0.3}s` } as Vars}>
                        <path d={LEAF} fill="var(--leaf-fresh)" stroke="var(--leaf)" strokeWidth="2" />
                    </g>
                </g>
            ))}
            {peaks.map((pk, k) => (
                <g key={pk.i} transform={`translate(${pts[pk.i][0]} ${pts[pk.i][1] - 2}) scale(0.62)`}>
                    <g className="anim-pop" style={{ '--delay': `${0.9 + k * 0.35}s` } as Vars}>
                        <Head type={pk.head} petal={pk.petal} center="var(--sun)" delay={-k} />
                    </g>
                </g>
            ))}
            <circle cx={pts[6][0]} cy={pts[6][1]} r="4" fill="var(--blossom)" className="anim-pop" style={{ '--delay': '1.6s' } as Vars} />
            <circle cx={pts[6][0]} cy={pts[6][1]} r="4" fill="none" stroke="var(--blossom)" strokeWidth="1.5" className="anim-ping" />
        </svg>
    );
};

/**
 * Weekly planner: one sprout per day. The first `bloomed` sprouts carry an open
 * flower, the rest are still buds, so the row fills with flowers as the week gets done.
 */
export const WeekSprouts: React.FC<{ bloomed?: number; className?: string }> = ({ bloomed = 0, className = '' }) => {
    const heights = [0.6, 0.8, 0.66, 0.92, 0.72, 0.86, 0.64];
    const bends = [-8, 6, -4, 10, -10, 5, -6];
    const heads: StemHead[] = ['blossom', 'daisy', 'tulip'];
    const petals = ['var(--petal)', 'var(--petal-light)', 'var(--blossom)'];
    return (
        <div className={`pointer-events-none relative inline-flex items-end ${className}`} aria-hidden="true">
            {heights.map((h, i) => (
                <Stem
                    key={i}
                    height={h}
                    bend={bends[i]}
                    leaves={2 + (i % 2)}
                    head={i < bloomed ? heads[i % 3] : 'bud'}
                    petal={i < bloomed ? petals[i % 3] : 'var(--petal-light)'}
                    delay={-i * 0.8}
                    duration={5 + (i % 3)}
                    className="h-full w-auto -mx-2.5 first:ml-0 last:mr-0 shrink-0"
                />
            ))}
            <span className="absolute -bottom-1 inset-x-1 h-2 rounded-full bg-leaf-soft" />
        </div>
    );
};

/** Articles: three stems fanned out from a ribbon, like a small bouquet. */
export const Bouquet: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`pointer-events-none relative ${className}`} aria-hidden="true">
        <Stem height={0.82} bend={-22} leaves={3} head="daisy" petal="var(--petal-light)" delay={-2} duration={6.6} className="absolute bottom-0 left-[4%] h-full w-auto" />
        <Stem height={0.95} bend={2} leaves={4} branch head="blossom" petal="var(--petal)" delay={0} duration={5.8} className="absolute bottom-0 left-[26%] h-full w-auto" />
        <Stem height={0.8} bend={20} leaves={3} head="tulip" petal="var(--blossom)" delay={-4} duration={7.2} className="absolute bottom-0 left-[48%] h-full w-auto" />
        <svg viewBox="0 0 60 30" className="absolute bottom-[4%] left-[30%] w-[40%]" overflow="visible">
            <path d="M30 14 C 18 2, 6 6, 10 16 C 14 24, 24 18, 30 14 Z" fill="var(--blossom)" stroke={ink('var(--blossom)')} strokeWidth="1.2" />
            <path d="M30 14 C 42 2, 54 6, 50 16 C 46 24, 36 18, 30 14 Z" fill="var(--blossom)" stroke={ink('var(--blossom)')} strokeWidth="1.2" />
            <path d="M28 15 L 22 30 M32 15 L 38 30" stroke="var(--blossom)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="30" cy="14" r="4" fill="var(--petal)" stroke={ink('var(--blossom)')} strokeWidth="1.2" />
        </svg>
    </div>
);

/** Routines: a warm sun with slowly turning rays and a soft pulse. */
export const SunGlow: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg viewBox="0 0 100 100" overflow="visible" className={`pointer-events-none select-none ${className}`} aria-hidden="true" focusable="false">
        <defs>
            <radialGradient id="sun-core">
                <stop offset="0%" stopColor="var(--sun)" />
                <stop offset="100%" stopColor="var(--coral)" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="var(--sun)" opacity="0.18" className="anim-pulse-soft" />
        <g className="anim-spin-slow" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
            {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d="M50 8 Q 53 16 50 22 Q 47 16 50 8 Z" fill="var(--sun)" stroke={ink('var(--sun)', 70)} strokeWidth="1" transform={`rotate(${i * 30} 50 50)`} />
            ))}
        </g>
        <circle cx="50" cy="50" r="20" fill="url(#sun-core)" stroke={ink('var(--sun)', 65)} strokeWidth="1.5" />
        <circle cx="43" cy="44" r="5" fill="#ffffff" opacity="0.35" />
    </svg>
);

type CornerVariant = 'blossom' | 'leaf' | 'sun';

interface CornerPalette {
    big: [string, string];
    stems: { head: StemHead; petal: string; center: string }[];
    leaf: string;
    fall: string[];
}

const CORNER: Record<CornerVariant, CornerPalette> = {
    blossom: {
        big: ['var(--blossom-soft)', 'var(--sun)'],
        stems: [
            { head: 'blossom', petal: 'var(--petal)', center: 'var(--sun)' },
            { head: 'daisy', petal: 'var(--petal-light)', center: 'var(--sun)' },
            { head: 'bud', petal: 'var(--blossom)', center: 'var(--sun)' },
        ],
        leaf: 'var(--leaf-fresh)',
        fall: ['var(--petal)', 'var(--petal-light)'],
    },
    leaf: {
        big: ['var(--leaf-soft)', 'var(--blossom-soft)'],
        stems: [
            { head: 'tulip', petal: 'var(--petal)', center: 'var(--sun)' },
            { head: 'blossom', petal: 'var(--petal-light)', center: 'var(--sun)' },
            { head: 'bud', petal: 'var(--blossom)', center: 'var(--sun)' },
        ],
        leaf: 'var(--leaf-fresh)',
        fall: ['var(--leaf-fresh)', 'var(--petal-light)'],
    },
    sun: {
        big: ['var(--peach)', 'var(--sun)'],
        stems: [
            { head: 'daisy', petal: 'var(--petal-light)', center: 'var(--sun)' },
            { head: 'tulip', petal: 'var(--coral)', center: 'var(--sun)' },
            { head: 'blossom', petal: 'var(--sun)', center: 'var(--coral)' },
        ],
        leaf: 'var(--leaf-fresh)',
        fall: ['var(--sun)', 'var(--petal-light)'],
    },
};

/**
 * A small animated garden that grows up from the bottom corner of a card: three stems
 * of different heights and flowers, a large flower peeking from the corner and petals
 * falling. The parent needs `relative overflow-hidden`; put the card content in a
 * `relative` wrapper so it stays above the decoration.
 */
export const GardenCorner: React.FC<{
    variant?: CornerVariant;
    side?: 'right' | 'left';
    className?: string;
}> = ({ variant = 'blossom', side = 'right', className = 'size-40 sm:size-52' }) => {
    const c = CORNER[variant];
    return (
        <div
            className={`pointer-events-none absolute bottom-0 ${side === 'right' ? 'right-0' : 'left-0 -scale-x-100'} ${className}`}
            aria-hidden="true"
        >
            <PetalFall colors={c.fall} className="absolute inset-0 h-full w-full" />
            <div className="absolute -bottom-[24%] -right-[22%] w-[62%] anim-spin-slow">
                <Flower petal={c.big[0]} center={c.big[1]} petals={7} rotate={-14} className="w-full opacity-80" />
            </div>
            <Stem
                height={0.95} bend={-16} leaves={5} branch head={c.stems[0].head}
                petal={c.stems[0].petal} center={c.stems[0].center} leaf={c.leaf}
                delay={-1} duration={6.5}
                className="absolute bottom-0 right-[36%] h-full w-auto"
            />
            <Stem
                height={0.8} bend={14} leaves={4} head={c.stems[1].head}
                petal={c.stems[1].petal} center={c.stems[1].center} leaf={c.leaf}
                delay={-3} duration={5.2}
                className="absolute bottom-0 right-[14%] h-[78%] w-auto"
            />
            <Stem
                height={0.85} bend={-6} leaves={3} head={c.stems[2].head}
                petal={c.stems[2].petal} center={c.stems[2].center} leaf={c.leaf}
                delay={-2} duration={7.4}
                className="absolute bottom-0 right-[58%] h-[52%] w-auto"
            />
        </div>
    );
};
