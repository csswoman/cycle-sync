import React from 'react';
import { Exercise, Routine, WorkoutVideo } from '@/types/exercises';
import { youtubeEmbedUrl, youtubeThumbnailUrl } from '@/lib/youtube';

interface ExerciseCardProps {
    exercise: Exercise;
    onSave?: () => void;
    saving?: boolean;
    variant?: 'default' | 'horizontal';
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSave, saving, variant = 'default' }) => {
    if (variant === 'horizontal') {
        return (
            <div className="flex flex-col md:flex-row items-stretch rounded-2xl shadow-sm bg-card overflow-hidden hover:shadow-md transition-all border border-border group h-full">
                <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden bg-muted shrink-0">
                    <img
                        src={exercise.gifUrl || '/exercise-fallback.png'}
                        alt={exercise.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-foreground text-xl font-bold leading-tight capitalize line-clamp-1">{exercise.name}</h3>
                            <button 
                                disabled={saving}
                                onClick={() => onSave?.()}
                                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined font-variation-icon-fill">bookmark_add</span>
                            </button>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {exercise.instructions[0] || `Enfócate en tu ${exercise.target} usando ${exercise.equipment}.`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 rounded-lg bg-secondary text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{exercise.bodyPart}</span>
                            <span className="px-2 py-1 rounded-lg bg-secondary text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{exercise.equipment}</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                            <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                            <span>Salud Hormonal</span>
                        </div>
                        <button className="cursor-pointer flex items-center justify-center rounded-xl h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-sm hover:shadow-md">
                            Empezar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-muted">
                <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSave?.(); }}
                        disabled={saving}
                        className="size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">{saving ? 'sync' : 'bookmark'}</span>
                    </button>
                    <div className="size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground">
                        <span className="material-symbols-outlined text-[20px]">play_circle</span>
                    </div>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                        {exercise.target}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-foreground shadow-lg">
                        {exercise.equipment}
                    </span>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1 gap-2">
                <h4 className="text-foreground font-black text-lg capitalize tracking-tight group-hover:text-primary transition-colors">
                    {exercise.name}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 flex-1">
                    {exercise.instructions[0]}
                </p>
                <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border w-full">
                        <span className="material-symbols-outlined text-primary text-[16px]">fitness_center</span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{exercise.bodyPart}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface RoutineSectionProps {
    title: string;
    description?: string;
    icon?: string;
    children: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const RoutineSection: React.FC<RoutineSectionProps> = ({ title, description, icon, children, rightElement }) => {
    return (
        <section className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">{icon}</span>
                            </div>
                        )}
                        <h3 className="text-2xl font-black text-foreground tracking-tight">{title}</h3>
                    </div>
                    {description && <p className="text-muted-foreground text-sm max-w-xl">{description}</p>}
                </div>
                {rightElement}
            </div>
            {children}
        </section>
    );
};

const WEEKDAY_SHORT_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const SavedRoutineCard: React.FC<{ routine: Routine }> = ({ routine }) => {
    const [open, setOpen] = React.useState(false);
    const day = routine.weekday != null ? WEEKDAY_SHORT_ES[routine.weekday] : null;
    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                    <h3 className="text-foreground font-bold text-lg group-hover:text-primary transition-colors">{routine.name}</h3>
                    <div className="flex flex-wrap gap-1">
                        {day && <span className="px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase w-fit">{day}</span>}
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit">{routine.phase}</span>
                    </div>
                </div>
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{routine.description}</p>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">{routine.exercises.length} Ejercicios</span>
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                >
                    {open ? 'Ocultar' : 'Ver Rutina'}
                    <span className="material-symbols-outlined text-sm">{open ? 'expand_less' : 'arrow_forward'}</span>
                </button>
            </div>
            {open && (
                <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                    {routine.exercises.map((ex) => (
                        <li key={ex.id} className="flex items-center gap-3">
                            <img src={ex.gifUrl} alt={ex.name} loading="lazy" className="size-14 rounded-lg object-cover bg-muted shrink-0" />
                            <span className="text-sm text-foreground capitalize">{ex.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const CATEGORY_LABEL: Record<string, string> = {
    gym: 'Fuerza / Gym',
    dance: 'Danza',
    yoga: 'Yoga',
    pilates: 'Pilates'
};

export const INTENSITY_LABEL: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
};

interface VideoCardProps {
    video: WorkoutVideo;
    isPhaseRecommended?: boolean;
    onPlay?: (video: WorkoutVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isPhaseRecommended, onPlay }) => {
    const [playingInline, setPlayingInline] = React.useState(false);

    const handlePlayClick = () => {
        if (onPlay) {
            onPlay(video);
        } else {
            setPlayingInline(true);
        }
    };

    return (
        <div className="flex flex-col gap-3 group bg-card rounded-2xl border border-border p-3.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-sm">
                {playingInline ? (
                    <iframe
                        src={youtubeEmbedUrl(video.videoId, true)}
                        title={video.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={handlePlayClick}
                        aria-label={`Reproducir ${video.title}`}
                        className="absolute inset-0 w-full h-full cursor-pointer text-left group/btn"
                    >
                        <img
                            src={youtubeThumbnailUrl(video.videoId)}
                            alt={video.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Phase recommendation badge */}
                        {isPhaseRecommended && (
                            <div className="absolute top-2.5 left-2.5 z-10">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md shadow-md border border-white/20">
                                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                                    Tu fase
                                </span>
                            </div>
                        )}

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/95 text-primary shadow-xl flex items-center justify-center transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:bg-primary group-hover/btn:text-primary-foreground">
                                <span className="material-symbols-outlined text-2xl ml-0.5">play_arrow</span>
                            </div>
                        </div>

                        {/* Duration and intensity pill */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                            <span className={`px-2 py-0.5 rounded-md font-semibold backdrop-blur-sm ${
                                video.intensity === 'low'
                                    ? 'bg-emerald-600/90'
                                    : video.intensity === 'medium'
                                    ? 'bg-amber-600/90'
                                    : 'bg-rose-600/90'
                            }`}>
                                {INTENSITY_LABEL[video.intensity]}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm font-medium">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {video.durationMinutes} min
                            </span>
                        </div>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-1.5 px-0.5">
                <h4 
                    onClick={handlePlayClick}
                    className="text-foreground font-semibold text-sm line-clamp-2 leading-snug cursor-pointer group-hover:text-primary transition-colors"
                    title={video.title}
                >
                    {video.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                    <span className="truncate max-w-[65%]" title={video.channelName}>{video.channelName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-foreground/80">
                        {CATEGORY_LABEL[video.category] || video.category}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const VideoModal: React.FC<{
    video: WorkoutVideo | null;
    onClose: () => void;
    onCompleteWorkout?: () => void;
    isCompletedToday?: boolean;
}> = ({ video, onClose, onCompleteWorkout, isCompletedToday }) => {
    React.useEffect(() => {
        if (!video) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [video, onClose]);

    if (!video) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card">
                    <div className="flex items-center gap-3 pr-4 min-w-0">
                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-lg">play_circle</span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-foreground font-bold text-sm sm:text-base truncate">{video.title}</h3>
                            <p className="text-muted-foreground text-xs">{video.channelName} • {CATEGORY_LABEL[video.category] || video.category}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center shrink-0 transition-colors"
                        aria-label="Cerrar video"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        src={youtubeEmbedUrl(video.videoId, true)}
                        title={video.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>

                {/* Footer info & action */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-card border-t border-border">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {video.durationMinutes} minutos
                        </span>
                        <span className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                            Intensidad {INTENSITY_LABEL[video.intensity]}
                        </span>
                    </div>

                    {onCompleteWorkout && (
                        <button
                            onClick={() => {
                                onCompleteWorkout();
                            }}
                            disabled={isCompletedToday}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                                isCompletedToday
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {isCompletedToday ? 'check_circle' : 'task_alt'}
                            </span>
                            {isCompletedToday ? 'Entrenamiento completado hoy' : 'Marcar como completado'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
