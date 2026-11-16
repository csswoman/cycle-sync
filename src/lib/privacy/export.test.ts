import { describe, it, expect } from 'vitest';
import { buildExport, EXPORT_TABLES } from './export';

describe('buildExport', () => {
  it('keeps tables with rows, lists unreadable ones, drops empty ones', () => {
    const results: Record<string, unknown[] | null> = {};
    for (const t of EXPORT_TABLES) results[t] = [];
    results.periods = [{ id: 1 }];
    results.cycle_signs = null;
    const out = buildExport({ id: 'u1', email: 'a@b.c' }, results, new Date('2026-01-02T03:04:05Z'));
    expect(out.tables).toEqual({ periods: [{ id: 1 }] });
    expect(out.skipped).toEqual(['cycle_signs']);
    expect(out.userId).toBe('u1');
    expect(out.exportedAt).toBe('2026-01-02T03:04:05.000Z');
  });
  it('never exports secret tokens', () => {
    expect(EXPORT_TABLES).not.toContain('health_webhook_tokens' as never);
    expect(EXPORT_TABLES).not.toContain('fitbit_tokens' as never);
  });
});
