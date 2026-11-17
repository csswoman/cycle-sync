import { describe, it, expect } from 'vitest';
import {
  activeQuestions, cycleProfile, deriveArchetype, expectsLongGaps, isQuestionAnswered, profileNeedsReview, profileNudge,
  pruneAnswers, showsPmosTools, usesHormonalContraception, ONBOARDING_QUESTIONS,
} from './onboarding';

describe('onboarding', () => {
  it('derives the archetype from the goal, defaulting to wellness', () => {
    expect(deriveArchetype({ goal: 'fertility' })).toBe('fertility');
    expect(deriveArchetype({})).toBe('wellness');
  });
  it('detects hormonal contraception', () => {
    expect(usesHormonalContraception({ contraception: 'pill' })).toBe(true);
    expect(usesHormonalContraception({ contraception: 'nonhormonal' })).toBe(false);
    expect(usesHormonalContraception({})).toBe(false);
  });
  it('decides the profile from the diagnosis, not from regularity', () => {
    expect(cycleProfile({ diagnosis: 'yes', regularity: 'regular' })).toBe('pmos');
    expect(cycleProfile({ diagnosis: 'suspect', regularity: 'irregular' })).toBe('pmos');
    expect(cycleProfile({ diagnosis: 'no', regularity: 'irregular' })).toBe('irregular');
    expect(cycleProfile({ diagnosis: 'private', regularity: 'none' })).toBe('irregular');
    expect(cycleProfile({ diagnosis: 'no', regularity: 'regular' })).toBe('regular');
    expect(cycleProfile({ diagnosis: 'no', goal: 'pmos', regularity: 'regular' })).toBe('pmos');
  });
  it('keeps older answers without a diagnosis on the PMOS profile unless the cycle is regular', () => {
    expect(cycleProfile({ regularity: 'irregular' })).toBe('pmos');
    expect(cycleProfile({})).toBe('pmos');
    expect(cycleProfile({ regularity: 'regular', goal: 'performance' })).toBe('regular');
  });
  it('shows PMOS tools for the PMOS profile, with a manual override', () => {
    expect(showsPmosTools({ diagnosis: 'yes' })).toBe(true);
    expect(showsPmosTools({ diagnosis: 'no', regularity: 'irregular' })).toBe(false);
    expect(showsPmosTools({ diagnosis: 'no', regularity: 'regular', pmosTools: 'show' })).toBe(true);
    expect(showsPmosTools({ diagnosis: 'yes', pmosTools: 'hide' })).toBe(false);
  });
  it('asks why there is no period only when it applies, and drops stale answers', () => {
    const ids = (a: object) => activeQuestions(a).map((q) => q.id);
    expect(ids({ regularity: 'regular' })).not.toContain('noPeriodReason');
    expect(ids({ regularity: 'none' })).toContain('noPeriodReason');
    expect(pruneAnswers({ regularity: 'regular', noPeriodReason: 'breastfeeding' })).toEqual({ regularity: 'regular' });
  });
  it('treats breastfeeding, contraception and menopause as known causes of long gaps', () => {
    expect(expectsLongGaps({ regularity: 'none', noPeriodReason: 'breastfeeding' })).toBe(true);
    expect(expectsLongGaps({ regularity: 'none', noPeriodReason: 'stoppedPill' })).toBe(false);
    expect(expectsLongGaps({ regularity: 'none', noPeriodReason: 'unknown' })).toBe(false);
  });
  it('suggests a profile update when the log contradicts a regular profile, or after six months', () => {
    const regular = { diagnosis: 'no' as const, regularity: 'regular' as const };
    expect(profileNudge(regular, { irregular: true, flags: [] })).toBe('cyclesChanged');
    expect(profileNudge(regular, { irregular: false, flags: ['longCycles'] })).toBe('cyclesChanged');
    expect(profileNudge(regular, { irregular: false, flags: ['heavyBleeding'] })).toBeNull();
    expect(profileNudge({ ...regular, pmosTools: 'show' }, { irregular: true, flags: [] })).toBeNull();
    const today = new Date('2026-11-17T12:00:00Z');
    expect(profileNeedsReview({ answeredAt: '2026-04-01T00:00:00Z' }, today)).toBe(true);
    expect(profileNeedsReview({ answeredAt: '2026-10-01T00:00:00Z' }, today)).toBe(false);
    expect(profileNudge({ answeredAt: '2026-04-01T00:00:00Z', diagnosis: 'yes' }, { irregular: false, flags: [] }, today)).toBe('review');
  });
  it('requires every question except symptoms', () => {
    const goal = ONBOARDING_QUESTIONS.find((q) => q.id === 'goal')!;
    const symptoms = ONBOARDING_QUESTIONS.find((q) => q.id === 'symptoms')!;
    expect(isQuestionAnswered(goal, {})).toBe(false);
    expect(isQuestionAnswered(goal, { goal: 'pmos' })).toBe(true);
    expect(isQuestionAnswered(symptoms, {})).toBe(true);
  });
});
