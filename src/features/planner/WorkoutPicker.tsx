'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { youtubeThumbnailUrl } from '@/lib/youtube';
import type { VideoCategory, VideoIntensity, VideoPhase, WorkoutVideo } from '@/types/exercises';
import type { WorkoutEntry } from '@/services/plannerService';

type Category = VideoCategory | 'all';
type Duration = 'all' | 'short' | 'mid' | 'long' | 'xl';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: 'grid_view' },
    { id: 'dance', label: 'Baile', icon: 'music_note' },
    { id: 'gym', label: 'Fuerza', icon: 'fitness_center' },
    { id: 'yoga', label: 'Yoga', icon: 'self_improvement' },
    { id: 'pilates', label: 'Pilates', icon: 'accessibility_new' },
];

const DURATIONS: { id: Duration; label: string; test: (min: number) => boolean }[] = [
    { id: 'all', label: 'Cualquier duración', test: () => true },
    { id: 'short', label: 'Hasta 10 min', test: (m) => m <= 10 },
    { id: 'mid', label: '10–20 min', test: (m) => m > 10 && m <= 20 },
    { id: 'long', label: '20–30 min', test: (m) => m > 20 && m <= 30 },
    { id: 'xl', label: 'Más de 30 min', test: (m) => m > 30 },
];

const INTENSITY: Record<VideoIntensity, { label: string; cls: string }> = {
    low: { label: 'Suave', cls: 'bg-leaf/90' },
    medium: { label: 'Moderada', cls: 'bg-sun/90' },
    high: { label: 'Alta', cls: 'bg-bud/90' },
};

const CATEGORY_ICON: Record<VideoCategory, string> = {
    dance: 'music_note',
    gym: 'fitness_center',
    yoga: 'self_improvement',
    pilates: 'accessibility_new',
};

const PAGE = 12;

const fold = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const Glyph: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PickerProps {
    videos: WorkoutVideo[];
    entry: WorkoutEntry | undefined;
    phase: VideoPhase;
    disabled?: boolean;
    /** '' clears the day, 'rest' / 'gym' are fixed options, anything else is a video id. */
    onChange: (value: string) => void;
}

export const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
            active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
        }`}
    >
        {children}
    </button>
);

const WorkoutPicker: React.FC<PickerProps> = ({ videos, entry, phase, disabled, onChange }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<Category>('all');
    const [duration, setDuration] = useState<Duration>('all');
    const [visible, setVisible] = useState(PAGE);
    const searchRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selectedVideo = entry?.kind === 'video' ? videos.find((v) => v.id === entry.videoId) : undefined;

    const results = useMemo(() => {
        const q = fold(query.trim());
        const test = DURATIONS.find((d) => d.id === duration)?.test ?? (() => true);
        return videos
            .filter((v) => (category === 'all' || v.category === category) && test(v.durationMinutes))
            .filter((v) => !q || fold(`${v.title} ${v.channelName}`).includes(q))
            .sort((a, b) => Number(b.phases.includes(phase)) - Number(a.phases.includes(phase)));
    }, [videos, query, category, duration, phase]);

    useEffect(() => setVisible(PAGE), [query, category, duration]);

    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    useEffect(() => {
        if (!open) return;
        searchRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const choose = (value: string) => {
        onChange(value);
        close();
    };

    // --- Trigger shown inside the day row ---
    let triggerBody: React.ReactNode;
    if (selectedVideo) {
        triggerBody = (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={youtubeThumbnailUrl(selectedVideo.videoId)}
                    alt=""
                    loading="lazy"
                    className={`h-12 w-[4.5rem] rounded-lg object-cover shrink-0 bg-muted ${entry?.done ? 'opacity-60' : ''}`}
                />
                <span className="min-w-0 flex flex-col text-left">
                    <span className={`text-sm font-medium leading-snug line-clamp-2 text-foreground ${entry?.done ? 'line-through text-muted-foreground' : ''}`}>
                        {selectedVideo.title}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{selectedVideo.durationMinutes} min</span>
                </span>
            </>
        );
    } else if (entry) {
        const isRest = entry.kind === 'rest';
        triggerBody = (
            <>
                <span className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${isRest ? 'bg-leaf-soft text-leaf' : 'bg-blush text-primary'}`}>
                    <Glyph name={isRest ? 'bedtime' : 'fitness_center'} className="text-2xl" />
                </span>
                <span className="text-sm font-medium text-foreground text-left leading-snug">{entry.title}</span>
            </>
        );
    } else {
        triggerBody = (
            <span className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-muted-foreground group-hover:text-primary">
                <Glyph name="add" className="text-base" />
                Elegir entreno
            </span>
        );
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-label={entry ? `Cambiar entrenamiento: ${entry.title}` : 'Elegir entrenamiento'}
                className={`group w-full min-h-14 flex items-center gap-2 p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 ${
                    entry
                        ? 'bg-muted/30 hover:bg-muted/50'
                        : 'border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5'
                }`}
            >
                {triggerBody}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
                    onClick={close}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="workout-picker-title"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[88vh] bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        <header className="flex flex-col gap-3 p-4 sm:p-5 border-b border-border">
                            <div className="flex items-center justify-between gap-3">
                                <h2 id="workout-picker-title" className="text-lg font-semibold text-foreground text-balance">
                                    Elegir entrenamiento
                                </h2>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Cerrar"
                                    className="size-10 -mr-2 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <Glyph name="close" className="text-xl" />
                                </button>
                            </div>

                            <label className="relative block">
                                <span className="sr-only">Buscar entrenamiento</span>
                                <Glyph name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground pointer-events-none" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar por nombre o canal"
                                    className="w-full min-h-11 rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </label>

                            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 scrollbar-hide" role="group" aria-label="Tipo">
                                {CATEGORIES.map((c) => (
                                    <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                                        <Glyph name={c.icon} className="text-lg" />
                                        {c.label}
                                    </Chip>
                                ))}
                            </div>
                            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 scrollbar-hide" role="group" aria-label="Duración">
                                {DURATIONS.map((d) => (
                                    <Chip key={d.id} active={duration === d.id} onClick={() => setDuration(d.id)}>
                                        {d.id !== 'all' && <Glyph name="schedule" className="text-lg" />}
                                        {d.label}
                                    </Chip>
                                ))}
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground mr-1">Sin vídeo:</span>
                                <button
                                    type="button"
                                    onClick={() => choose('rest')}
                                    className={`inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                                        entry?.kind === 'rest' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:border-primary/40'
                                    }`}
                                >
                                    <Glyph name="bedtime" className="text-lg" />
                                    Día de descanso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => choose('gym')}
                                    className={`inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                                        entry?.kind === 'gym' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:border-primary/40'
                                    }`}
                                >
                                    <Glyph name="fitness_center" className="text-lg" />
                                    Gimnasio / Fuerza
                                </button>
                                {entry && (
                                    <button
                                        type="button"
                                        onClick={() => choose('')}
                                        className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                                    >
                                        <Glyph name="delete" className="text-lg" />
                                        Quitar entreno
                                    </button>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground" aria-live="polite">
                                {results.length} {results.length === 1 ? 'vídeo' : 'vídeos'}
                            </p>

                            {results.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <Glyph name="search_off" className="text-4xl text-muted-foreground/60" />
                                    <p className="text-sm text-muted-foreground text-pretty max-w-xs">
                                        Ningún vídeo coincide. Prueba otra duración o quita el filtro de tipo.
                                    </p>
                                </div>
                            ) : (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {results.slice(0, visible).map((v) => {
                                        const selected = entry?.kind === 'video' && entry.videoId === v.id;
                                        const intensity = INTENSITY[v.intensity];
                                        return (
                                            <li key={v.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => choose(v.id)}
                                                    aria-pressed={selected}
                                                    className={`group w-full text-left flex flex-col gap-2 rounded-2xl border p-2 transition-colors cursor-pointer ${
                                                        selected ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/40'
                                                    }`}
                                                >
                                                    <span className="relative block aspect-video rounded-xl overflow-hidden bg-muted">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={youtubeThumbnailUrl(v.videoId)}
                                                            alt=""
                                                            loading="lazy"
                                                            className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-semibold text-white ${intensity.cls}`}>
                                                            {intensity.label}
                                                        </span>
                                                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-xs font-medium tabular-nums">
                                                            <Glyph name="schedule" className="text-sm" />
                                                            {v.durationMinutes} min
                                                        </span>
                                                    </span>
                                                    <span className="px-1 pb-1 flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium text-foreground leading-snug line-clamp-2">{v.title}</span>
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Glyph name={CATEGORY_ICON[v.category]} className="text-sm" />
                                                            <span className="truncate">{v.channelName}</span>
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {results.length > visible && (
                                <button
                                    type="button"
                                    onClick={() => setVisible((n) => n + PAGE)}
                                    className="self-center min-h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 cursor-pointer transition-colors"
                                >
                                    Ver más
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WorkoutPicker;
