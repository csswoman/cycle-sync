import { describe, it, expect } from 'vitest';
import { deriveArchetype, isQuestionAnswered, usesHormonalContraception, ONBOARDING_QUESTIONS } from './onboarding';

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
  it('requires every question except symptoms', () => {
    const [goal, , , symptoms] = ONBOARDING_QUESTIONS;
    expect(isQuestionAnswered(goal, {})).toBe(false);
    expect(isQuestionAnswered(goal, { goal: 'pmos' })).toBe(true);
    expect(isQuestionAnswered(symptoms, {})).toBe(true);
  });
});
