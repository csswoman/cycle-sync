export interface Exercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    target: string;
    instructions: string[];
    secondaryMuscles?: string[];
    /** Set when the exercise was copied from a program (those have a video instead of a GIF). */
    videoUrl?: string | null;
    sets?: number;
    reps?: string;
    restSeconds?: number;
}

export type VideoCategory = 'gym' | 'dance' | 'yoga' | 'pilates';
export type VideoIntensity = 'low' | 'medium' | 'high';
export type VideoPhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'any';
export interface WorkoutVideo {
    id: string;
    url: string;
    videoId: string;
    title: string;
    channelName: string;
    category: VideoCategory;
    phases: VideoPhase[];
    durationMinutes: number;
    intensity: VideoIntensity;
}

export type BodyPart = 'back' | 'cardio' | 'chest' | 'lower arms' | 'lower legs' | 'neck' | 'shoulders' | 'upper arms' | 'upper legs' | 'waist';
export type Equipment = 'body weight' | 'cable' | 'dumbbell' | 'barbell' | 'kettlebell' | 'resistance band' | 'none';

export interface Routine {
    id: string;
    user_id: string;
    name: string;
    description: string;
    exercises: Exercise[];
    phase: string;
    /** 0 = Monday ... 6 = Sunday. */
    weekday?: number | null;
    muscle_groups?: string[];
    created_at: string;
}
