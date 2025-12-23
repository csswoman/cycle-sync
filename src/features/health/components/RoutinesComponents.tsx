import React from 'react';
import { Exercise, Routine, WorkoutVideo } from '@/types/exercises';

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

export const SavedRoutineCard: React.FC<{ routine: Routine }> = ({ routine }) => {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                    <h3 className="text-foreground font-bold text-lg group-hover:text-primary transition-colors">{routine.name}</h3>
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit">{routine.phase}</span>
                </div>
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{routine.description}</p>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">{routine.exercises.length} Ejercicios</span>
                <button className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    Ver Rutina
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export const VideoCard: React.FC<{ video: WorkoutVideo }> = ({ video }) => {
    return (
        <div 
            className="flex flex-col gap-3 group cursor-pointer" 
            onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
        >
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-primary shadow-xl">
                        <span className="material-symbols-outlined scale-150">play_arrow</span>
                    </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    {video.duration}
                </div>
            </div>
            <div>
                <h4 className="text-foreground font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h4>
                <p className="text-muted-foreground text-xs mt-1">{video.channelName}</p>
            </div>
        </div>
    );
};
