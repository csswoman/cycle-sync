import { describe, it, expect } from 'vitest';
import { exclusionChecks, logEvidence, phenotype } from './diagnosis';
const none = { irregular_cycles: false, clinical_hyperandrogenism: false, biochemical_hyperandrogenism: false, polycystic_ovaries: false };
describe('phenotype', () => {
  it('names A to D from the criteria', () => {
    expect(phenotype({ ...none, irregular_cycles: true, clinical_hyperandrogenism: true, polycystic_ovaries: true })).toBe('A');
    expect(phenotype({ ...none, irregular_cycles: true, biochemical_hyperandrogenism: true })).toBe('B');
    expect(phenotype({ ...none, clinical_hyperandrogenism: true, polycystic_ovaries: true })).toBe('C');
    expect(phenotype({ ...none, irregular_cycles: true, polycystic_ovaries: true })).toBe('D');
  });
  it('treats clinical and biochemical hyperandrogenism as one criterion', () => {
    expect(phenotype({ ...none, clinical_hyperandrogenism: true, biochemical_hyperandrogenism: true })).toBeNull();
  });
  it('is null with fewer than two criteria', () => {
    expect(phenotype(none)).toBeNull();
    expect(phenotype({ ...none, irregular_cycles: true })).toBeNull();
    expect(phenotype({})).toBeNull();
  });
});
describe('exclusionChecks', () => {
  it('reports missing, in-range and out-of-range results', () => {
    const checks = exclusionChecks([
      { date: '2026-01-01', marker: 'tsh', value: 6.2 },
      { date: '2026-03-01', marker: 'tsh', value: 2.1 },
      { date: '2026-03-01', marker: 'ohp17', value: 3.4 },
    ]);
    expect(checks.map((c) => [c.key, c.status])).toEqual([['tsh', 'ok'], ['prolactin', 'missing'], ['ohp17', 'abnormal']]);
  });
});
describe('logEvidence', () => {
  it('points each criterion to what the log shows', () => {
    const ev = logEvidence({
      cycleFlags: ['longCycles'],
      labs: [
        { date: '2026-02-01', marker: 'testosterone', value: 60 },
        { date: '2026-02-01', marker: 'shbg', value: 30 },
        { date: '2026-02-01', marker: 'amh', value: 7 },
      ],
      hirsutism: [{ date: '2026-01-01', total: 3 }],
    });
    expect(ev).toEqual({ irregular_cycles: ['cycle_pattern'], biochemical_hyperandrogenism: ['fai'], polycystic_ovaries: ['amh'] });
    expect(logEvidence({ cycleFlags: [], labs: [], hirsutism: [{ date: '2026-01-01', total: 8 }] })).toEqual({ clinical_hyperandrogenism: ['ferriman_gallwey'] });
  });
});
