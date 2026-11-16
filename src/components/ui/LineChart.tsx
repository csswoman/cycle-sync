import React from 'react';

export interface LinePoint {
  /** 'YYYY-MM-DD' */
  date: string;
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  unit?: string;
  /** Shaded reference band. Either bound may be omitted. */
  refLow?: number | null;
  refHigh?: number | null;
  height?: number;
}

const W = 320;
const PAD = { l: 36, r: 10, t: 10, b: 22 };

function toTime(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Small dependency-free SVG line chart over time. */
export const LineChart: React.FC<LineChartProps> = ({ points, unit, refLow, refHigh, height = 140 }) => {
  if (points.length === 0) return null;
  const H = height;
  const times = points.map((p) => toTime(p.date));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const values = points.map((p) => p.value);
  const candidates = [...values];
  if (refLow != null) candidates.push(refLow);
  if (refHigh != null) candidates.push(refHigh);
  let vMin = Math.min(...candidates);
  let vMax = Math.max(...candidates);
  if (vMin === vMax) { vMin -= 1; vMax += 1; }
  const pad = (vMax - vMin) * 0.1;
  vMin -= pad;
  vMax += pad;

  const x = (t: number) => (t1 === t0 ? (W + PAD.l - PAD.r) / 2 : PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin)) * (H - PAD.t - PAD.b);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(toTime(p.date)).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  const bandTop = refHigh != null ? y(refHigh) : PAD.t;
  const bandBottom = refLow != null ? y(refLow) : H - PAD.b;
  const fmtVal = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
  const shortDate = (d: string) => d.slice(5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Trend${unit ? ` in ${unit}` : ''}`}>
      {(refLow != null || refHigh != null) && (
        <rect x={PAD.l} y={bandTop} width={W - PAD.l - PAD.r} height={Math.max(0, bandBottom - bandTop)} className="fill-green-500/10" />
      )}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="stroke-border" />
      <text x={PAD.l - 4} y={y(vMax - pad) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="9">{fmtVal(vMax - pad)}</text>
      <text x={PAD.l - 4} y={y(vMin + pad) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="9">{fmtVal(vMin + pad)}</text>
      <text x={PAD.l} y={H - 6} textAnchor="start" className="fill-muted-foreground" fontSize="9">{shortDate(points[0].date)}</text>
      {points.length > 1 && (
        <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted-foreground" fontSize="9">{shortDate(points[points.length - 1].date)}</text>
      )}
      <path d={path} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={`${p.date}-${p.value}`} cx={x(toTime(p.date))} cy={y(p.value)} r="3" className="fill-primary">
          <title>{`${p.date}: ${fmtVal(p.value)}${unit ? ` ${unit}` : ''}`}</title>
        </circle>
      ))}
    </svg>
  );
};
