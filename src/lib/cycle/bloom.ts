/**
 * How far the cycle "flower" has grown, 0..1. It grows from a seed on day 1 to full
 * bloom at ovulation and stays open through the luteal phase (it ripens instead, which
 * the UI shows with warmer colors). Purely decorative: never use it for predictions.
 */
export function bloomGrowth(cycleDay: number, ovulationDay: number, overdue = false): number {
  if (overdue) return 1;
  if (!Number.isFinite(cycleDay) || !Number.isFinite(ovulationDay) || cycleDay < 1) return 0;
  if (ovulationDay <= 1 || cycleDay >= ovulationDay) return 1;
  // Starts as a visible seed (0.08) so day 1 is never empty.
  const t = (cycleDay - 1) / (ovulationDay - 1);
  return Math.round((0.08 + 0.92 * t) * 1000) / 1000;
}

export type BloomTone = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export function bloomTone(phase: string): BloomTone {
  const key = phase.toLowerCase();
  if (key.startsWith('mens')) return 'menstrual';
  if (key.startsWith('ovul')) return 'ovulation';
  if (key.startsWith('lute')) return 'luteal';
  return 'follicular';
}
