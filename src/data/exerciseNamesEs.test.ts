import { describe, it, expect } from 'vitest';
import {
  exerciseDisplayName,
  exerciseNameEs,
  exerciseNameEn,
  programExerciseDisplayName,
  cleanEnglishExerciseName,
} from './exerciseNamesEs';

describe('exerciseNamesEs translation logic', () => {
  it('translates phase exercises to Spanish and keeps English in English mode', () => {
    const ex = { id: '1363', name: 'spine stretch (female)' };

    expect(exerciseDisplayName(ex, 'es')).toBe('Estiramiento de columna');
    expect(exerciseDisplayName(ex, 'en')).toBe('spine stretch');
    expect(exerciseNameEs(ex)).toBe('Estiramiento de columna');
    expect(exerciseNameEn(ex)).toBe('spine stretch');
  });

  it('translates dataset exercises to Spanish', () => {
    const situp = { id: '0001', name: '3/4 sit-up' };
    expect(exerciseDisplayName(situp, 'es')).toBe('Abdominales 3/4');
    expect(exerciseDisplayName(situp, 'en')).toBe('3/4 sit-up');

    const benchPress = { id: '0025', name: 'barbell bench press' };
    expect(exerciseDisplayName(benchPress, 'es')).toBe('Press de banca con barra');
    expect(exerciseDisplayName(benchPress, 'en')).toBe('barbell bench press');
  });

  it('translates program exercises between Spanish and English', () => {
    const crunch = { name: 'Crunch en el suelo', nameEs: 'Crunch Abdominal' };
    expect(programExerciseDisplayName(crunch, 'es')).toBe('Crunch Abdominal');
    expect(programExerciseDisplayName(crunch, 'en')).toBe('Abdominal Crunch');

    const plank = { name: 'Plancha lateral', nameEs: 'Plancha Lateral' };
    expect(programExerciseDisplayName(plank, 'es')).toBe('Plancha Lateral');
    expect(programExerciseDisplayName(plank, 'en')).toBe('Side Plank');

    const deadlift = { name: 'Peso muerto rumano', nameEs: 'Peso Muerto Rumano con Barra' };
    expect(programExerciseDisplayName(deadlift, 'es')).toBe('Peso Muerto Rumano con Barra');
    expect(programExerciseDisplayName(deadlift, 'en')).toBe('Barbell Romanian Deadlift');
  });

  it('cleans redundant gender tags in English names', () => {
    expect(cleanEnglishExerciseName('arms apart circular toe touch (male)')).toBe(
      'arms apart circular toe touch',
    );
    expect(cleanEnglishExerciseName('push-up (female)')).toBe('push-up');
  });
});
