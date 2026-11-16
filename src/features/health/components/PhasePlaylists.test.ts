import { describe, it, expect } from 'vitest';
import { buildPhasePlaylist } from './PhasePlaylists';
import type { WorkoutVideo } from '@/types/exercises';

const v = (id: string, category: WorkoutVideo['category'], phases: WorkoutVideo['phases'], intensity: WorkoutVideo['intensity']): WorkoutVideo => ({
  id, url: '', videoId: id, title: id, channelName: 'c', category, phases, durationMinutes: 10, intensity,
});

describe('buildPhasePlaylist', () => {
  it('uses the two most common categories of the phase, low intensity first', () => {
    const videos = [
      v('a', 'yoga', ['luteal'], 'medium'), v('b', 'yoga', ['luteal'], 'low'),
      v('c', 'dance', ['luteal'], 'low'), v('d', 'gym', ['luteal'], 'low'), v('e', 'dance', ['luteal'], 'high'),
      v('f', 'yoga', ['follicular'], 'low'),
    ];
    const p = buildPhasePlaylist(videos, 'luteal', 'Lútea')!;
    expect(p.title).toBe('Lútea: yoga + danza');
    expect(p.videos.map((x) => x.id)).toEqual(['b', 'c', 'a', 'e']);
  });

  it('returns null when the phase has no videos', () => {
    expect(buildPhasePlaylist([v('a', 'yoga', ['luteal'], 'low')], 'ovulation', 'Ovulación')).toBeNull();
  });
});
