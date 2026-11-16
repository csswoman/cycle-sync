'use client';

import React, { useMemo } from 'react';
import { WorkoutVideo, VideoCategory } from '@/types/exercises';

const CATEGORY_LABELS: Record<VideoCategory, string> = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  gym: 'Fuerza',
  dance: 'Danza',
};

const PHASES: { key: string; label: string }[] = [
  { key: 'menstrual', label: 'Menstrual' },
  { key: 'follicular', label: 'Folicular' },
  { key: 'ovulation', label: 'Ovulación' },
  { key: 'luteal', label: 'Lútea' },
];

interface Playlist {
  id: string;
  title: string;
  videos: WorkoutVideo[];
}

/**
 * Builds playlists automatically from the catalog: per phase, the two categories with
 * the most videos, e.g. "Lútea: yoga + danza". Low-intensity videos come first.
 */
export function buildPhasePlaylist(videos: WorkoutVideo[], phaseKey: string, phaseLabel: string): Playlist | null {
  const inPhase = videos.filter((v) => v.phases.includes(phaseKey as any) || v.phases.includes('any'));
  const counts = new Map<VideoCategory, number>();
  inPhase.forEach((v) => counts.set(v.category, (counts.get(v.category) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
  if (top.length === 0) return null;

  const order = { low: 0, medium: 1, high: 2 } as const;
  const picked = inPhase
    .filter((v) => top.includes(v.category))
    .sort((a, b) => order[a.intensity] - order[b.intensity]);
  return {
    id: phaseKey,
    title: `${phaseLabel}: ${top.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(' + ')}`,
    videos: picked,
  };
}

interface Props {
  videos: WorkoutVideo[];
  currentPhaseKey: string;
  onPlay: (video: WorkoutVideo) => void;
}

const PhasePlaylists: React.FC<Props> = ({ videos, currentPhaseKey, onPlay }) => {
  const playlists = useMemo(
    () =>
      PHASES.map((p) => ({ phase: p.key, playlist: buildPhasePlaylist(videos, p.key, p.label) }))
        .filter((x): x is { phase: string; playlist: Playlist } => x.playlist !== null),
    [videos],
  );

  if (playlists.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {playlists.map(({ phase, playlist }) => {
        const totalMin = playlist.videos.reduce((s, v) => s + v.durationMinutes, 0);
        return (
          <div key={phase} className={`rounded-2xl border p-4 ${phase === currentPhaseKey ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-sm text-foreground">
                {playlist.title}
                {phase === currentPhaseKey && <span className="ml-2 text-[11px] font-bold text-primary">Tu fase</span>}
              </h3>
              <span className="text-xs text-muted-foreground shrink-0">
                {playlist.videos.length} videos · {Math.round(totalMin / 60 * 10) / 10} h
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {playlist.videos.slice(0, 12).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onPlay(v)}
                  className="w-44 shrink-0 text-left cursor-pointer group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/75 text-white px-1.5 py-0.5 rounded">
                      {v.durationMinutes} min
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-1.5 line-clamp-2">{v.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{v.channelName}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PhasePlaylists;
