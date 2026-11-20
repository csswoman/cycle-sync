import React from 'react';
import { Exercise, Routine, WorkoutVideo } from '@/types/exercises';
import { youtubeEmbedUrl, youtubeThumbnailUrl } from '@/lib/youtube';
import { exerciseDisplayName } from '@/data/exerciseNamesEs';
import { BODY_PART_LABELS_ES, EQUIPMENT_LABELS_ES } from '@/services/exercisesService';
import { useLanguage } from '@/i18n/LanguageContext';

export const TARGET_LABELS_ES: Record<string, string> = {
    abs: 'Abdominales',
    abductors: 'Abductores',
    adductors: 'Aductores',
    biceps: 'Bíceps',
    calves: 'Pantorrillas',
    cardiovascular: 'Cardiovascular',
    'cardiovascular system': 'Cardiovascular',
    delts: 'Deltoides',
    forearms: 'Antebrazos',
    glutes: 'Glúteos',
    hamstrings: 'Isquiotibiales',
    lats: 'Dorsales',
    'levator scapulae': 'Elevador de la escápula',
    pectorals: 'Pectorales',
    quads: 'Cuádriceps',
    'serratus anterior': 'Serrato anterior',
    spine: 'Columna',
    traps: 'Trapecios',
    triceps: 'Tríceps',
    'upper back': 'Espalda alta',
};

const formatBodyPart = (bp: string): string => BODY_PART_LABELS_ES[bp] || bp;
const formatEquipment = (eq: string): string => EQUIPMENT_LABELS_ES[eq] || eq;
const formatTarget = (t: string): string => TARGET_LABELS_ES[t.toLowerCase()] || t;

interface ExerciseCardProps {
    exercise: Exercise;
    onSave?: () => void;
    saving?: boolean;
    variant?: 'default' | 'horizontal';
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSave, saving, variant = 'default' }) => {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const displayName = exerciseDisplayName(exercise, language);
    const bodyPartLabel = isEn ? exercise.bodyPart : formatBodyPart(exercise.bodyPart);
    const equipmentLabel = isEn ? exercise.equipment : formatEquipment(exercise.equipment);
    const targetLabel = isEn ? exercise.target : formatTarget(exercise.target);

    if (variant === 'horizontal') {
        return (
            <div className="flex flex-row items-stretch rounded-2xl shadow-sm bg-card overflow-hidden hover:shadow-md transition-all border border-border group h-full">
                <div className="w-24 sm:w-40 md:w-48 h-auto overflow-hidden bg-white dark:brightness-90 shrink-0">
                    <img
                        src={exercise.gifUrl || '/exercise-fallback.png'}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
                <div className="flex flex-1 min-w-0 flex-col justify-between p-3 sm:p-5 gap-3 sm:gap-4">
                    <div>
                        <h3 className="text-foreground text-base sm:text-xl font-bold leading-tight line-clamp-2 mb-2">{displayName}</h3>
                        <p className="max-sm:hidden text-muted-foreground text-sm mb-3 line-clamp-2">
                            {exercise.instructions[0] || (isEn ? `Focus on your ${targetLabel} using ${equipmentLabel}.` : `Enfócate en tu ${targetLabel} usando ${equipmentLabel}.`)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground font-bold">{bodyPartLabel}</span>
                            <span className="px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground font-bold">{equipmentLabel}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                            <span aria-hidden className="material-symbols-outlined text-[16px]">target</span>
                            <span>{targetLabel}</span>
                        </div>
                        {onSave && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => onSave()}
                                aria-label={isEn ? 'Add to my routine' : 'Agregar a mi rutina'}
                                className="cursor-pointer flex items-center justify-center gap-1.5 rounded-xl min-h-11 max-sm:min-w-11 px-4 max-sm:px-2.5 bg-secondary hover:bg-accent text-foreground border border-border text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                <span aria-hidden className="material-symbols-outlined text-lg">playlist_add</span>
                                <span className="max-sm:hidden">{isEn ? 'Add to my routine' : 'Agregar a mi rutina'}</span>
                            </button>
                        )}
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
                    alt={displayName}
                    className="w-full h-full object-cover sepia-[.12] dark:brightness-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    {onSave && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSave(); }}
                            disabled={saving}
                            className="size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[20px]">{saving ? 'sync' : 'bookmark'}</span>
                        </button>
                    )}
                    <div className="size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground">
                        <span className="material-symbols-outlined text-[20px]">play_circle</span>
                    </div>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-xs font-black text-white shadow-lg">
                        {targetLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-black text-foreground shadow-lg">
                        {equipmentLabel}
                    </span>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1 gap-2">
                <h4 className="text-foreground font-black text-lg tracking-tight group-hover:text-primary transition-colors">
                    {displayName}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 flex-1">
                    {exercise.instructions[0]}
                </p>
                <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border w-full">
                        <span className="material-symbols-outlined text-primary text-[16px]">fitness_center</span>
                        <span className="text-xs font-bold text-muted-foreground">{bodyPartLabel}</span>
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
    /** Drops the description below sm, for sections whose title and content already explain themselves. */
    compactOnMobile?: boolean;
}

export const RoutineSection: React.FC<RoutineSectionProps> = ({ title, description, icon, children, rightElement, compactOnMobile }) => {
    return (
        <section className="flex flex-col gap-4 sm:gap-6 w-full">
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-6 max-sm:bg-card max-sm:border max-sm:border-border max-sm:rounded-2xl max-sm:p-3 ${compactOnMobile ? 'max-sm:border-b-0 max-sm:rounded-b-none' : ''}`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 max-sm:[&_.material-symbols-outlined]:text-xl">
                                <span className="material-symbols-outlined">{icon}</span>
                            </div>
                        )}
                        <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight text-balance">{title}</h3>
                    </div>
                    {description && <p className={`text-muted-foreground text-sm max-w-xl ${compactOnMobile ? 'max-sm:hidden' : ''}`}>{description}</p>}
                </div>
                {rightElement}
            </div>
            {children}
        </section>
    );
};

const WEEKDAY_SHORT_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEKDAY_SHORT_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface SavedRoutineCardProps {
    routine: Routine;
    /** Persists the training day; resolves once saved (or rejects). */
    onWeekdayChange?: (routine: Routine, weekday: number | null) => Promise<void>;
}

export const SavedRoutineCard: React.FC<SavedRoutineCardProps> = ({ routine, onWeekdayChange }) => {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const weekdays = isEn ? WEEKDAY_SHORT_EN : WEEKDAY_SHORT_ES;
    const [open, setOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(false);
    const selectId = React.useId();
    const hasDay = routine.weekday != null;

    const changeDay = async (value: string) => {
        if (!onWeekdayChange) return;
        setSaving(true);
        setError(false);
        try {
            await onWeekdayChange(routine, value === '' ? null : Number(value));
        } catch {
            setError(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col gap-2 mb-3">
                <h3 className="text-foreground font-bold text-lg group-hover:text-primary transition-colors">{routine.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5">
                    {onWeekdayChange ? (
                        <label htmlFor={selectId} className="relative inline-flex items-center">
                            <span className="sr-only">{isEn ? 'Training day' : 'Día de entrenamiento'}</span>
                            <span aria-hidden className={`material-symbols-outlined text-sm absolute left-2 pointer-events-none ${hasDay ? 'text-white' : 'text-muted-foreground'}`}>
                                {saving ? 'progress_activity' : 'calendar_month'}
                            </span>
                            <select
                                id={selectId}
                                value={routine.weekday ?? ''}
                                disabled={saving}
                                onChange={(e) => void changeDay(e.target.value)}
                                className={`appearance-none rounded-lg pl-7 pr-6 py-1 text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 ${
                                    hasDay
                                        ? 'bg-primary text-white'
                                        : 'bg-card text-muted-foreground border border-dashed border-border hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                <option value="">{isEn ? 'Assign day' : 'Asignar día'}</option>
                                {weekdays.map((d, i) => (
                                    <option key={d} value={i}>{d}</option>
                                ))}
                            </select>
                            <span aria-hidden className={`material-symbols-outlined text-sm absolute right-1.5 pointer-events-none ${hasDay ? 'text-white' : 'text-muted-foreground'}`}>
                                expand_more
                            </span>
                        </label>
                    ) : (
                        hasDay && <span className="px-2 py-0.5 rounded-lg bg-primary text-white text-xs font-bold w-fit">{weekdays[routine.weekday!]}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold w-fit">{routine.phase}</span>
                </div>
                {error && <p role="alert" className="text-xs text-destructive">{isEn ? 'Could not save day. Please try again.' : 'No se pudo guardar el día. Inténtalo de nuevo.'}</p>}
            </div>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{routine.description}</p>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">{routine.exercises.length} {isEn ? 'Exercises' : 'Ejercicios'}</span>
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                >
                    {open ? (isEn ? 'Hide' : 'Ocultar') : (isEn ? 'View Routine' : 'Ver Rutina')}
                    <span className="material-symbols-outlined text-sm">{open ? 'expand_less' : 'arrow_forward'}</span>
                </button>
            </div>
            {open && (
                <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                    {routine.exercises.map((ex) => (
                        <li key={ex.id} className="flex items-center gap-3">
                            {ex.gifUrl ? (
                                <img src={ex.gifUrl} alt="" loading="lazy" className="size-14 rounded-lg object-cover bg-muted shrink-0" />
                            ) : ex.videoUrl ? (
                                <video src={`${ex.videoUrl}#t=0.1`} muted playsInline preload="metadata" aria-hidden className="size-14 rounded-lg object-cover bg-black shrink-0" />
                            ) : (
                                <span aria-hidden className="size-14 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">fitness_center</span>
                                </span>
                            )}
                            <span className="min-w-0">
                                <span className="block text-sm text-foreground capitalize">{exerciseDisplayName(ex, language)}</span>
                                {ex.sets ? <span className="block text-xs font-semibold text-primary tabular-nums">{ex.sets} × {ex.reps}{ex.weight ? ` · ${ex.weight} kg` : ''}</span> : null}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const CATEGORY_LABEL_ES: Record<string, string> = {
    gym: 'Fuerza / Gym',
    dance: 'Danza',
    yoga: 'Yoga',
    pilates: 'Pilates'
};

export const CATEGORY_LABEL_EN: Record<string, string> = {
    gym: 'Strength / Gym',
    dance: 'Dance',
    yoga: 'Yoga',
    pilates: 'Pilates'
};

export const CATEGORY_LABEL = CATEGORY_LABEL_ES;

export const INTENSITY_LABEL_ES: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
};

export const INTENSITY_LABEL_EN: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
};

export const INTENSITY_LABEL = INTENSITY_LABEL_ES;

interface VideoCardProps {
    video: WorkoutVideo;
    isPhaseRecommended?: boolean;
    onPlay?: (video: WorkoutVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isPhaseRecommended, onPlay }) => {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const intensityMap = isEn ? INTENSITY_LABEL_EN : INTENSITY_LABEL_ES;
    const categoryMap = isEn ? CATEGORY_LABEL_EN : CATEGORY_LABEL_ES;
    const [playingInline, setPlayingInline] = React.useState(false);

    const handlePlayClick = () => {
        if (onPlay) {
            onPlay(video);
        } else {
            setPlayingInline(true);
        }
    };

    return (
        <div className="flex flex-row sm:flex-col gap-3 group bg-card rounded-2xl border border-border p-3 sm:p-3.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="relative aspect-video w-32 sm:w-full shrink-0 self-start rounded-xl overflow-hidden bg-black shadow-sm">
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
                        aria-label={isEn ? `Play ${video.title}` : `Reproducir ${video.title}`}
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
                            <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md shadow-md border border-white/20">
                                    <span aria-hidden className="material-symbols-outlined text-[13px] max-sm:!hidden">auto_awesome</span>
                                    {isEn ? 'Your phase' : 'Tu fase'}
                                </span>
                            </div>
                        )}

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-8 sm:size-12 rounded-full bg-white/95 text-primary shadow-xl flex items-center justify-center transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:bg-primary group-hover/btn:text-primary-foreground">
                                <span className="material-symbols-outlined text-2xl ml-0.5">play_arrow</span>
                            </div>
                        </div>

                        {/* Duration and intensity pill */}
                        <div className="absolute bottom-1.5 sm:bottom-2.5 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between max-sm:justify-end text-white text-xs">
                            <span className={`max-sm:hidden px-2 py-0.5 rounded-md font-semibold backdrop-blur-sm ${
                                video.intensity === 'low'
                                    ? 'bg-leaf/90'
                                    : video.intensity === 'medium'
                                    ? 'bg-sun/90'
                                    : 'bg-bud/90'
                            }`}>
                                {intensityMap[video.intensity]}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm font-medium">
                                <span aria-hidden className="material-symbols-outlined text-[12px] max-sm:!hidden">schedule</span>
                                {video.durationMinutes} min
                            </span>
                        </div>
                    </button>
                )}
            </div>

            <div className="flex flex-col max-sm:justify-center min-w-0 flex-1 gap-1.5 px-0.5">
                <h4 
                    onClick={handlePlayClick}
                    className="text-foreground font-semibold text-sm line-clamp-3 sm:line-clamp-2 leading-snug cursor-pointer group-hover:text-primary transition-colors"
                    title={video.title}
                >
                    {video.title}
                </h4>
                <div className="flex items-center justify-between max-sm:flex-wrap max-sm:gap-y-1 gap-x-2 text-xs text-muted-foreground mt-0.5">
                    <span className="truncate max-w-[65%] max-sm:max-w-full" title={video.channelName}>{video.channelName}</span>
                    <span className="sm:px-2 sm:py-0.5 sm:rounded-md sm:bg-secondary text-xs font-medium text-foreground/80">
                        {categoryMap[video.category] || video.category}
                        <span className="sm:hidden"> · {isEn ? `${intensityMap[video.intensity].toLowerCase()} intensity` : `intensidad ${intensityMap[video.intensity].toLowerCase()}`}</span>
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
    /** This video is already in today's history. */
    isLogged?: boolean;
}> = ({ video, onClose, onCompleteWorkout, isLogged }) => {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const intensityMap = isEn ? INTENSITY_LABEL_EN : INTENSITY_LABEL_ES;
    const categoryMap = isEn ? CATEGORY_LABEL_EN : CATEGORY_LABEL_ES;

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
                            <p className="text-muted-foreground text-xs">{video.channelName} • {categoryMap[video.category] || video.category}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center shrink-0 transition-colors"
                        aria-label={isEn ? 'Close video' : 'Cerrar video'}
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
                            {video.durationMinutes} {isEn ? 'minutes' : 'minutos'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                            {isEn ? `Intensity: ${intensityMap[video.intensity]}` : `Intensidad ${intensityMap[video.intensity]}`}
                        </span>
                    </div>

                    {onCompleteWorkout && (
                        <button
                            onClick={() => {
                                onCompleteWorkout();
                            }}
                            disabled={isLogged}
                            className={`flex items-center gap-2 px-4 min-h-11 rounded-xl text-sm font-bold transition-all shadow-sm ${
                                isLogged
                                    ? 'bg-leaf/10 text-leaf border border-leaf/20 cursor-default'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {isLogged ? 'check_circle' : 'task_alt'}
                            </span>
                            {isLogged ? (isEn ? 'Saved in today’s history' : 'Guardado en tu historial de hoy') : (isEn ? 'Mark as completed' : 'Marcar como completado')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
