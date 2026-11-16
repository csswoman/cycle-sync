import { describe, it, expect } from 'vitest';
import { phenotype } from './diagnosis';
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
