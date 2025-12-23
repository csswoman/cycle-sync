import { useState, useEffect } from 'react';
import { Exercise, WorkoutVideo, BodyPart } from '@/types/exercises';
import {
    fetchExercises,
    fetchExercisesByBodyPart,
    searchExercises,
    fetchWorkoutVideos
} from '@/services/exercisesService';

export const useExercises = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [videos, setVideos] = useState<WorkoutVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadExercises = async (limit: number = 20) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchExercises(limit);
            setExercises(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error loading exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadByBodyPart = async (bodyPart: BodyPart) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchExercisesByBodyPart(bodyPart);
            setExercises(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error loading exercises by body part:', err);
        } finally {
            setLoading(false);
        }
    };

    const search = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await searchExercises(query);
            setExercises(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error searching exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadVideos = async (query: string = 'women workout', duration: string = 'medium') => {
        try {
            const data = await fetchWorkoutVideos(query, duration);
            setVideos(data);
        } catch (err) {
            console.error('Error loading workout videos:', err);
        }
    };

    useEffect(() => {
        loadExercises();
        loadVideos();
    }, []);

    return {
        exercises,
        videos,
        loading,
        error,
        refreshExercises: loadExercises,
        fetchByBodyPart: loadByBodyPart,
        searchExercises: search,
        loadWorkoutVideos: loadVideos
    };
};
