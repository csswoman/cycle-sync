import { Exercise, WorkoutVideo, BodyPart, Equipment } from '@/types/exercises';

const EXERCISEDB_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com';



/**
 * Fetch exercises by body part
 */
export const fetchExercisesByBodyPart = async (bodyPart: BodyPart): Promise<Exercise[]> => {
    try {
        const response = await fetch(`${EXERCISEDB_BASE_URL}/exercises/bodyPart/${bodyPart}?limit=15`, {
            headers: {
                'X-RapidAPI-Key': EXERCISEDB_KEY,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`ExerciseDB error: ${response.status}`);
        }

        const data = await response.json();
        return data.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            bodyPart: ex.bodyPart,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl,
            target: ex.target,
            instructions: ex.instructions || [],
            secondaryMuscles: ex.secondaryMuscles || []
        }));
    } catch (error) {
        console.error('Error fetching exercises by body part:', error);
        return getFallbackExercises().filter(ex => ex.bodyPart === bodyPart);
    }
};

/**
 * Search exercises by name
 */
export const searchExercises = async (query: string): Promise<Exercise[]> => {
    try {
        const response = await fetch(`${EXERCISEDB_BASE_URL}/exercises/name/${query}?limit=10`, {
            headers: {
                'X-RapidAPI-Key': EXERCISEDB_KEY,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`ExerciseDB error: ${response.status}`);
        }

        const data = await response.json();
        return data.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            bodyPart: ex.bodyPart,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl,
            target: ex.target,
            instructions: ex.instructions || [],
            secondaryMuscles: ex.secondaryMuscles || []
        }));
    } catch (error) {
        console.error('Error searching exercises:', error);
        return [];
    }
};

import localExercisesData from '@/data/localExercises.json';

const CACHE_KEY = 'exercise_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
    timestamp: number;
    data: Exercise[];
}

/**
 * Fetch exercises from ExerciseDB API with Caching and Local Fallback
 */
export const fetchExercises = async (limit: number = 20): Promise<Exercise[]> => {
    // 1. Try to get from Local Storage Cache first
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached) as CacheEntry;
            if (Date.now() - timestamp < CACHE_DURATION) {
                // Return cached data if valid
                return data.slice(0, limit);
            }
        }
    } catch (e) {
        console.warn('Cache parsing failed', e);
    }

    // 2. If no cache, try API
    try {
        const response = await fetch(`${EXERCISEDB_BASE_URL}/exercises?limit=${limit}`, {
            headers: {
                'X-RapidAPI-Key': EXERCISEDB_KEY,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn('⚠️ API Limit Exceeded (429). Using local static dataset.');
                return getFallbackExercises(); // Or strictly return localExercisesData mapped
            }
            throw new Error(`ExerciseDB error: ${response.status}`);
        }

        const data = await response.json();
        const formattedData = data.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            bodyPart: ex.bodyPart,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl.replace('http://', 'https://'), // Force HTTPS
            target: ex.target,
            instructions: ex.instructions || [],
            secondaryMuscles: ex.secondaryMuscles || []
        }));

        // 3. Save to Cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: formattedData
            }));
        } catch (e) {
            console.warn('Failed to save to cache (quota exceeded?)', e);
        }

        return formattedData;

    } catch (error) {
        console.error('Error fetching exercises:', error);
        return getFallbackExercises();
    }
};

// ... existing code ...

/**
 * Fallback exercises when API fails
 */
const getFallbackExercises = (): Exercise[] => {
    // Use the imported local JSON + some hardcoded defaults if needed
    // Mapping local JSON to Exercise type
    const localData: Exercise[] = localExercisesData.map(ex => ({
        ...ex,
        gifUrl: ex.gifUrl.replace('http://', 'https://'),
        secondaryMuscles: [] // data might be missing this
    }));
    
    // Combine with original hardcoded fallbacks if localData is small, or just return localData
    if (localData.length > 0) return localData;

    return [
        {
            id: '1',
            name: 'Push-ups',
            bodyPart: 'chest',
            equipment: 'body weight',
            gifUrl: '/strength.png',
            target: 'pectorals',
            instructions: [
                'Start in a plank position with hands shoulder-width apart',
                'Lower your body until chest nearly touches the floor',
                'Push back up to starting position',
                'Repeat for desired reps'
            ]
        },
        {
            id: '2',
            name: 'Squats',
            bodyPart: 'upper legs',
            equipment: 'body weight',
            gifUrl: '/exercise-fallback.png',
            target: 'glutes',
            instructions: [
                'Stand with feet shoulder-width apart',
                'Lower your body as if sitting back into a chair',
                'Keep chest up and knees behind toes',
                'Push through heels to return to start'
            ]
        },
        {
            id: '3',
            name: 'Plank',
            bodyPart: 'waist',
            equipment: 'body weight',
            gifUrl: '/yoga.png',
            target: 'abs',
            instructions: [
                'Start in forearm plank position',
                'Keep body in straight line from head to heels',
                'Engage core and hold position',
                'Breathe steadily throughout'
            ]
        }
    ];
};

/**
 * Fetch workout videos from YouTube (mock implementation - would need YouTube API key)
 */
export const fetchWorkoutVideos = async (
    query: string = 'women workout',
    duration: string = 'medium'
): Promise<WorkoutVideo[]> => {
    // This would use YouTube Data API v3 in production
    // For now, returning curated static videos
    return getFallbackVideos();
};

const getFallbackVideos = (): WorkoutVideo[] => {
    return [
        {
            id: '1',
            title: '20 Min Full Body Workout - No Equipment',
            thumbnailUrl: 'https://i.ytimg.com/vi/ml6XDkPJEHo/hqdefault.jpg',
            channelName: 'Fitness Blender',
            duration: '20:00',
            videoId: 'ml6XDkPJEHo',
            description: 'Complete full body workout requiring no equipment'
        },
        {
            id: '2',
            title: '15 Min Low Impact Cardio Workout',
            thumbnailUrl: 'https://i.ytimg.com/vi/gC_L9qAHVJ8/hqdefault.jpg',
            channelName: 'POPSUGAR Fitness',
            duration: '15:00',
            videoId: 'gC_L9qAHVJ8',
            description: 'Gentle cardio perfect for all fitness levels'
        },
        {
            id: '3',
            title: '30 Min Yoga Flow for Beginners',
            thumbnailUrl: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg',
            channelName: 'Yoga With Adriene',
            duration: '30:00',
            videoId: 'v7AYKMP6rOE',
            description: 'Relaxing yoga flow to reduce stress'
        }
    ];
};
