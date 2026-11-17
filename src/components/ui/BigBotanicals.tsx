import React from 'react';

/*
 * Large background illustrations for cards. Each one fills its box (viewBox 200x200),
 * is aria-hidden, reads colors from the garden tokens and moves slowly with the shared
 * .anim-* classes (which stop under prefers-reduced-motion). No SVG filters: these are
 * big and animated, so the hand-drawn feel comes from the shapes.
 */

type Vars = React.CSSProperties & Record<`--${string}`, string>;
type Pt = [number, number];

const ink = (color: string, amount = 62) => `color-mix(in srgb, ${color} ${amount}%, #4a2418)`;
const svgProps = (className: string) => ({
    viewBox: '0 0 200 200',
    overflow: 'visible' as const,
    className: `pointer-events-none select-none ${className}`,
    'aria-hidden': true,
    focusable: 'false' as const,
});
const spin: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: '50% 50%' };

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
const quadAngle = (a: Pt, c: Pt, b: Pt, t: number) => {
    const dx = 2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
};

interface BigProps { className?: string; petal?: string; center?: string; leaf?: string }

/** Daisy with many slim petals; turns very slowly. */
export const BigDaisy: React.FC<BigProps> = ({ className = '', petal = 'var(--petal-light)', center = 'var(--sun)' }) => (
    <svg {...svgProps(className)}>
        <g className="anim-spin-slow" style={spin}>
            {Array.from({ length: 18 }, (_, i) => (
                <ellipse key={i} cx="100" cy="52" rx="9" ry="40" fill={petal} stroke={ink(petal)} strokeWidth="2" transform={`rotate(${i * 20} 100 100)`} />
            ))}
            {Array.from({ length: 18 }, (_, i) => (
                <path key={`v${i}`} d="M100 24 Q 98 50 100 74" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 20} 100 100)`} />
            ))}
        </g>
        <circle cx="100" cy="100" r="26" fill={center} stroke={ink(center)} strokeWidth="2.5" />
        {Array.from({ length: 14 }, (_, i) => {
            const a = i * 2.4;
            const r = 5 + (i % 4) * 4.5;
            return <circle key={i} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r="2" fill={ink(center, 45)} opacity="0.5" />;
        })}
    </svg>
);

/** Sunflower: two rings of pointed petals around a seeded center; turns slowly. */
export const BigSunflower: React.FC<BigProps> = ({ className = '', petal = 'var(--sun)', center = 'var(--coral)' }) => {
    const tip = 'M0 0 C 10 -18, 8 -44, 0 -58 C -8 -44, -10 -18, 0 0 Z';
    return (
        <svg {...svgProps(className)}>
            <g className="anim-spin-slow" style={spin}>
                {Array.from({ length: 14 }, (_, i) => (
                    <path key={`b${i}`} d={tip} transform={`translate(100 100) rotate(${i * (360 / 14) + 12}) translate(0 -22)`} fill={`color-mix(in srgb, ${petal} 70%, var(--coral))`} stroke={ink(petal)} strokeWidth="2" />
                ))}
                {Array.from({ length: 14 }, (_, i) => (
                    <path key={`f${i}`} d={tip} transform={`translate(100 100) rotate(${i * (360 / 14)}) translate(0 -24) scale(0.9)`} fill={petal} stroke={ink(petal)} strokeWidth="2" />
                ))}
            </g>
            <circle cx="100" cy="100" r="30" fill={center} stroke={ink(center)} strokeWidth="2.5" />
            {Array.from({ length: 40 }, (_, i) => {
                const a = i * 2.39996;
                const r = 4.2 * Math.sqrt(i);
                return <circle key={i} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r="1.8" fill={ink(center, 40)} opacity="0.6" />;
            })}
        </svg>
    );
};

/** Fern frond curling up from the bottom; sways. */
export const BigFern: React.FC<BigProps> = ({ className = '', leaf = 'var(--leaf-fresh)' }) => {
    const a: Pt = [70, 200];
    const c: Pt = [60, 90];
    const b: Pt = [150, 30];
    const pinna = 'M0 0 C 6 -6, 18 -7, 26 -1 C 18 4, 7 4, 0 0 Z';
    const n = 13;
    return (
        <svg {...svgProps(className)}>
            <g className="anim-sway" style={{ '--dur': '7s' } as Vars}>
                <path d={`M${a} Q ${c} ${b}`} fill="none" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
                {Array.from({ length: n }, (_, i) => {
                    const t = 0.08 + (i / n) * 0.88;
                    const [x, y] = quad(a, c, b, t);
                    const ang = quadAngle(a, c, b, t);
                    const s = 1.5 - t * 1.05;
                    return (
                        <g key={i}>
                            <path d={pinna} transform={`translate(${x} ${y}) rotate(${ang - 62}) scale(${s})`} fill={leaf} stroke="var(--leaf)" strokeWidth="1.4" />
                            <path d={pinna} transform={`translate(${x} ${y}) rotate(${ang + 62}) scale(${s} ${-s})`} fill={leaf} stroke="var(--leaf)" strokeWidth="1.4" />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};

/** One big rounded tropical leaf with veins; breathes gently. */
export const BigLeaf: React.FC<BigProps> = ({ className = '', leaf = 'var(--leaf-soft)' }) => (
    <svg {...svgProps(className)}>
        <g className="anim-breathe">
            <path
                d="M100 190 C 30 170, 10 100, 40 50 C 60 18, 92 12, 100 30 C 108 12, 140 18, 160 50 C 190 100, 170 170, 100 190 Z"
                fill={leaf}
                stroke="var(--leaf)"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path d="M100 30 C 98 90, 100 140, 100 190" fill="none" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
            {[50, 78, 106, 134, 158].map((y, i) => (
                <g key={y} fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" opacity="0.8">
                    <path d={`M100 ${y} Q ${70 - i * 2} ${y - 6} ${46 + i * 4} ${y - 22 + i * 3}`} />
                    <path d={`M100 ${y} Q ${130 + i * 2} ${y - 6} ${154 - i * 4} ${y - 22 + i * 3}`} />
                </g>
            ))}
            <path d="M70 60 Q 60 80 62 104" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        </g>
    </svg>
);

/** Two tulips on long stems with blade leaves; each sways on its own. */
export const BigTulips: React.FC<BigProps> = ({ className = '', petal = 'var(--blossom)', leaf = 'var(--leaf-fresh)' }) => {
    const Tulip: React.FC<{ x: number; top: number; bend: number; color: string; delay: string }> = ({ x, top, bend, color, delay }) => (
        <g className="anim-sway" style={{ '--delay': delay, '--dur': '6.5s' } as Vars}>
            <path d={`M${x} 200 Q ${x + bend} ${(200 + top) / 2} ${x + bend * 0.6} ${top}`} fill="none" stroke="var(--leaf)" strokeWidth="3.5" strokeLinecap="round" />
            <path d={`M${x} 200 C ${x - 30} 170, ${x - 34} 130, ${x - 22} ${top + 40} C ${x - 14} 140, ${x - 6} 172, ${x} 200 Z`} fill={leaf} stroke="var(--leaf)" strokeWidth="2" />
            <g transform={`translate(${x + bend * 0.6} ${top})`}>
                <path d="M-18 -4 C -22 -26, -12 -40, -6 -42 L 0 -30 L 6 -42 C 12 -40, 22 -26, 18 -4 C 12 6, -12 6, -18 -4 Z" fill={color} stroke={ink(color)} strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M-8 -6 C -10 -20, -6 -30, 0 -30 C 6 -30, 10 -20, 8 -6" fill="none" stroke={ink(color, 80)} strokeWidth="1.6" />
                <path d="M-12 -12 Q -13 -24 -8 -32" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
            </g>
        </g>
    );
    return (
        <svg {...svgProps(className)}>
            <Tulip x={80} top={60} bend={-10} color={petal} delay="0s" />
            <Tulip x={135} top={92} bend={12} color="var(--petal)" delay="-2.4s" />
        </svg>
    );
};

/** Eucalyptus-style branch with round leaves along a curve; sways. */
export const BigBranch: React.FC<BigProps> = ({ className = '', leaf = 'var(--leaf-soft)' }) => {
    const a: Pt = [10, 190];
    const c: Pt = [70, 60];
    const b: Pt = [190, 20];
    return (
        <svg {...svgProps(className)}>
            <g className="anim-sway" style={{ '--dur': '8s' } as Vars}>
                <path d={`M${a} Q ${c} ${b}`} fill="none" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
                {Array.from({ length: 9 }, (_, i) => {
                    const t = 0.1 + i * 0.1;
                    const [x, y] = quad(a, c, b, t);
                    const side = i % 2 ? 1 : -1;
                    const ang = quadAngle(a, c, b, t) + side * 70;
                    const r = 15 - i * 0.9;
                    return (
                        <g key={i} transform={`translate(${x} ${y}) rotate(${ang})`}>
                            <line x1="0" y1="0" x2={r * 0.6} y2="0" stroke="var(--leaf)" strokeWidth="2" />
                            <ellipse cx={r * 1.4} cy="0" rx={r} ry={r * 0.82} fill={leaf} stroke="var(--leaf)" strokeWidth="2" />
                            <path d={`M${r * 0.6} 0 L ${r * 2.1} 0`} stroke="var(--leaf)" strokeWidth="1.2" opacity="0.6" />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
