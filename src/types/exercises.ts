export interface Exercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    target: string;
    instructions: string[];
    secondaryMuscles?: string[];
}

export interface WorkoutVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    duration: string;
    videoId: string;
    description?: string;
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
    created_at: string;
}
