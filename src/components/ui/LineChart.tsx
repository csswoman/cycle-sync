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
  /** Dashed target line, e.g. a goal weight. */
  goal?: number | null;
  goalLabel?: string;
  height?: number;
}

const W = 320;
const PAD = { l: 36, r: 10, t: 10, b: 22 };

function toTime(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Small dependency-free SVG line chart over time. */
export const LineChart: React.FC<LineChartProps> = ({ points, unit, refLow, refHigh, goal, goalLabel, height = 140 }) => {
  if (points.length === 0) return null;
  const H = height;
  const times = points.map((p) => toTime(p.date));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const values = points.map((p) => p.value);
  const candidates = [...values];
  if (refLow != null) candidates.push(refLow);
  if (refHigh != null) candidates.push(refHigh);
  if (goal != null) candidates.push(goal);
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
  const shortDate = (d: string) => d.slice(5).split('-').reverse().join('/');
  const single = points.length === 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md mx-auto" role="img" aria-label={`Trend${unit ? ` in ${unit}` : ''}`}>
      {(refLow != null || refHigh != null) && (
        <rect x={PAD.l} y={bandTop} width={W - PAD.l - PAD.r} height={Math.max(0, bandBottom - bandTop)} className="fill-leaf/10" />
      )}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="stroke-border" />
      {!single && (
        <>
          <text x={PAD.l - 4} y={y(vMax - pad) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="12">{fmtVal(vMax - pad)}</text>
          <text x={PAD.l - 4} y={y(vMin + pad) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="12">{fmtVal(vMin + pad)}</text>
        </>
      )}
      <text x={single ? x(t0) : PAD.l} y={H - 6} textAnchor={single ? 'middle' : 'start'} className="fill-muted-foreground" fontSize="12">{shortDate(points[0].date)}</text>
      {points.length > 1 && (
        <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted-foreground" fontSize="12">{shortDate(points[points.length - 1].date)}</text>
      )}
      {goal != null && (
        <g>
          <line x1={PAD.l} y1={y(goal)} x2={W - PAD.r} y2={y(goal)} className="stroke-leaf" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={W - PAD.r} y={y(goal) - 5} textAnchor="end" className="fill-leaf" fontSize="12" fontWeight="600">
            {`${goalLabel ?? 'Goal'} ${fmtVal(goal)}`}
          </text>
        </g>
      )}
      <path d={path} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      {single && (
        <text x={x(t0)} y={y(points[0].value) - 12} textAnchor="middle" className="fill-foreground" fontSize="14" fontWeight="600">{fmtVal(points[0].value)}</text>
      )}
      {points.map((p) => (
        <circle key={`${p.date}-${p.value}`} cx={x(toTime(p.date))} cy={y(p.value)} r={single ? 5 : 3} className="fill-primary">
          <title>{`${p.date}: ${fmtVal(p.value)}${unit ? ` ${unit}` : ''}`}</title>
        </circle>
      ))}
    </svg>
  );
};
