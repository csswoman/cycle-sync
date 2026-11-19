'use client';

import React, { useMemo, useState } from 'react';
import { WorkoutVideo, VideoCategory } from '@/types/exercises';
import { useLanguage } from '@/i18n/LanguageContext';

const getCategoryLabel = (category: VideoCategory, isEn: boolean): string => {
  if (isEn) {
    switch (category) {
      case 'gym': return 'Strength';
      case 'dance': return 'Dance';
      case 'yoga': return 'Yoga';
      case 'pilates': return 'Pilates';
    }
  }
  switch (category) {
    case 'gym': return 'Fuerza';
    case 'dance': return 'Danza';
    case 'yoga': return 'Yoga';
    case 'pilates': return 'Pilates';
  }
};

const getPhases = (isEn: boolean) => [
  { key: 'menstrual', label: isEn ? 'Menstrual' : 'Menstrual' },
  { key: 'follicular', label: isEn ? 'Follicular' : 'Folicular' },
  { key: 'ovulation', label: isEn ? 'Ovulatory' : 'Ovulación' },
  { key: 'luteal', label: isEn ? 'Luteal' : 'Lútea' },
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
export function buildPhasePlaylist(videos: WorkoutVideo[], phaseKey: string, phaseLabel: string, isEn = false): Playlist | null {
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
    title: `${phaseLabel}: ${top.map((c) => getCategoryLabel(c, isEn).toLowerCase()).join(' + ')}`,
    videos: picked,
  };
}

interface Props {
  videos: WorkoutVideo[];
  currentPhaseKey: string;
  onPlay: (video: WorkoutVideo) => void;
}

const ROW = 12;
const GRID_PAGE = 24;

const VideoTile: React.FC<{ v: WorkoutVideo; onPlay: (v: WorkoutVideo) => void; className?: string }> = ({ v, onPlay, className = '' }) => (
  <button type="button" onClick={() => onPlay(v)} className={`text-left cursor-pointer group ${className}`}>
    <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
      <span className="absolute bottom-1 right-1 text-xs font-bold bg-black/75 text-white px-1.5 py-0.5 rounded">
        {v.durationMinutes} min
      </span>
    </div>
    <p className="text-xs font-semibold text-foreground mt-1.5 line-clamp-2">{v.title}</p>
    <p className="text-xs text-muted-foreground truncate">{v.channelName}</p>
  </button>
);

const PhasePlaylists: React.FC<Props> = ({ videos, currentPhaseKey, onPlay }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  // One playlist at a time can be opened as a full grid; the rest stay as rows.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gridShown, setGridShown] = useState(GRID_PAGE);
  const phases = useMemo(() => getPhases(isEn), [isEn]);
  const playlists = useMemo(
    () =>
      phases.map((p) => ({ phase: p.key, playlist: buildPhasePlaylist(videos, p.key, p.label, isEn) }))
        .filter((x): x is { phase: string; playlist: Playlist } => x.playlist !== null),
    [videos, phases, isEn],
  );

  if (playlists.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {playlists.map(({ phase, playlist }) => {
        const totalMin = playlist.videos.reduce((s, v) => s + v.durationMinutes, 0);
        return (
          <div key={phase} className={`rounded-2xl border p-4 ${phase === currentPhaseKey ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-sm text-foreground">
                {playlist.title}
                {phase === currentPhaseKey && <span className="ml-2 text-xs font-bold text-primary">{isEn ? 'Your phase' : 'Tu fase'}</span>}
              </h3>
              <span className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {playlist.videos.length} videos · {Math.round(totalMin / 60 * 10) / 10} h
                </span>
                {playlist.videos.length > ROW && (
                  <button
                    type="button"
                    aria-expanded={expanded === phase}
                    onClick={() => { setExpanded(expanded === phase ? null : phase); setGridShown(GRID_PAGE); }}
                    className="min-h-9 px-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    {expanded === phase ? (isEn ? 'Show less' : 'Ver menos') : (isEn ? 'View all' : 'Ver todos')}
                  </button>
                )}
              </span>
            </div>
            {expanded === phase ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {playlist.videos.slice(0, gridShown).map((v) => <VideoTile key={v.id} v={v} onPlay={onPlay} />)}
                </div>
                {playlist.videos.length > gridShown && (
                  <button
                    type="button"
                    onClick={() => setGridShown((n) => n + GRID_PAGE)}
                    className="self-center min-h-11 px-5 rounded-xl border border-border bg-card text-sm font-semibold hover:border-primary/50 cursor-pointer tabular-nums"
                  >
                    {isEn ? `Load more (${playlist.videos.length - gridShown} remaining)` : `Cargar más (${playlist.videos.length - gridShown} restantes)`}
                  </button>
                )}
              </div>
            ) : (
              <ol className="flex gap-3 overflow-x-auto pb-3 scroll-rail snap-x">
                {playlist.videos.slice(0, ROW).map((v) => (
                  <li key={v.id} className="w-44 sm:w-52 shrink-0 snap-start"><VideoTile v={v} onPlay={onPlay} className="w-full" /></li>
                ))}
                {playlist.videos.length > ROW && (
                  <li className="w-36 shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => { setExpanded(phase); setGridShown(GRID_PAGE); }}
                      className="w-full aspect-video rounded-lg border border-dashed border-border bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-sm font-semibold text-foreground cursor-pointer"
                    >
                      <span aria-hidden className="material-symbols-outlined text-2xl text-primary">grid_view</span>
                      {isEn ? `View all ${playlist.videos.length}` : `Ver los ${playlist.videos.length}`}
                    </button>
                  </li>
                )}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhasePlaylists;
