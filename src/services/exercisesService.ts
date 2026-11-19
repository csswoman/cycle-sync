import { Exercise, WorkoutVideo, BodyPart, Equipment } from '@/types/exercises';
import { supabase } from '@/lib/supabase';
import { parseYouTubeId } from '@/lib/youtube';
import workoutVideosData from '@/data/workoutVideos.json';
import { displayVideoTitle } from '@/data/videoTitleOverrides';
import dataset from '@/data/exercisesDataset.json';
import { exerciseDisplayName, cleanEnglishExerciseName } from '@/data/exerciseNamesEs';

// Exercise data comes from https://github.com/hasaneyldrm/exercises-dataset (bundled JSON).
// GIFs are loaded from our fork. Media © Gym visual — https://gymvisual.com/
export const EXERCISE_MEDIA_BASE =
    'https://raw.githubusercontent.com/FatCat-Game-Studio/exercises-dataset/main/';
export const EXERCISE_ATTRIBUTION = '© Gym visual — https://gymvisual.com/';

interface DatasetExercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    target: string;
    secondaryMuscles: string[];
    gif: string;
    steps: { en: string[]; es: string[] };
}

export type Lang = 'en' | 'es';

export const getLang = (): Lang => {
    if (typeof window === 'undefined') return 'es';
    return localStorage.getItem('language') === 'en' ? 'en' : 'es';
};

export const toExercise = (ex: DatasetExercise, lang: Lang = getLang()): Exercise => ({
    id: ex.id,
    name: lang === 'es' ? exerciseDisplayName(ex, 'es') : cleanEnglishExerciseName(ex.name),
    bodyPart: ex.bodyPart,
    equipment: ex.equipment,
    gifUrl: EXERCISE_MEDIA_BASE + ex.gif,
    target: ex.target,
    instructions: ex.steps[lang] || ex.steps.en || [],
    secondaryMuscles: ex.secondaryMuscles,
});

const all = dataset as DatasetExercise[];

/** First `limit` exercises of the dataset. */
export const fetchExercises = async (limit: number = 20): Promise<Exercise[]> => {
    const lang = getLang();
    return all.slice(0, limit).map((ex) => toExercise(ex, lang));
};

export const fetchExercisesByBodyPart = async (bodyPart: BodyPart, limit: number = 15): Promise<Exercise[]> => {
    const lang = getLang();
    return all
        .filter((ex) => ex.bodyPart === bodyPart)
        .slice(0, limit)
        .map((ex) => toExercise(ex, lang));
};

export const fetchExercisesByEquipment = async (equipment: Equipment, limit: number = 15): Promise<Exercise[]> => {
    const lang = getLang();
    return all
        .filter((ex) => ex.equipment === equipment)
        .slice(0, limit)
        .map((ex) => toExercise(ex, lang));
};

/** Case-insensitive search by exercise name (names are in English). */
export const searchExercises = async (query: string, limit: number = 10): Promise<Exercise[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const lang = getLang();
    return all
        .filter((ex) => ex.name.toLowerCase().includes(q))
        .slice(0, limit)
        .map((ex) => toExercise(ex, lang));
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let nameIndex: { ex: DatasetExercise; es: string; en: string; key: string }[] | null = null;

/** Search by Spanish or English name, ignoring accents. Names that start with the query come first. */
export const searchExercisesByName = (query: string, limit: number = 8): Exercise[] => {
    const q = fold(query.trim());
    if (q.length < 2) return [];
    nameIndex ??= all.map((ex) => {
        const es = exerciseDisplayName(ex, 'es');
        const en = cleanEnglishExerciseName(ex.name);
        return { ex, es, en, key: `${fold(es)} | ${fold(en)}` };
    });
    const lang = getLang();
    return nameIndex
        .filter((e) => e.key.includes(q))
        .sort((a, b) => Number(!fold(a.es).startsWith(q)) - Number(!fold(b.es).startsWith(q)) || a.es.length - b.es.length)
        .slice(0, limit)
        .map((e) => toExercise(e.ex, lang));
};

/**
 * Curated workout videos from the workout_videos table. Falls back to the bundled
 * JSON when offline or when the table is unavailable.
 */
export const fetchWorkoutVideos = async (): Promise<WorkoutVideo[]> => {
    try {
        const { data, error } = await supabase
            .from('workout_videos')
            .select('id, url, youtube_id, title, channel_name, category, phases, duration_minutes, intensity')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
            return data.map((v) => ({
                id: v.id,
                url: v.url,
                videoId: v.youtube_id,
                title: displayVideoTitle(v.title),
                channelName: v.channel_name ?? '',
                category: v.category,
                phases: v.phases,
                durationMinutes: v.duration_minutes,
                intensity: v.intensity,
            }));
        }
    } catch (error) {
        console.error('Error fetching workout videos:', error);
    }
    return getFallbackVideos();
};

const getFallbackVideos = (): WorkoutVideo[] =>
    (workoutVideosData as any[]).flatMap((v, i) => {
        const videoId = parseYouTubeId(v.url);
        return videoId
            ? [{
                id: `local-${i}`,
                url: v.url,
                videoId,
                title: displayVideoTitle(v.title),
                channelName: v.channel_name ?? '',
                category: v.category,
                phases: v.phases,
                durationMinutes: v.duration_minutes,
                intensity: v.intensity,
            }]
            : [];
    });

/** Exercises for the given dataset ids, in the same order. Unknown ids are skipped. */
export const getExercisesByIds = (ids: string[], lang: Lang = getLang()): Exercise[] => {
    const byId = new Map(all.map((ex) => [ex.id, ex]));
    return ids.flatMap((id) => {
        const ex = byId.get(id);
        return ex ? [toExercise(ex, lang)] : [];
    });
};

export const BODY_PART_LABELS_ES: Record<string, string> = {
    back: 'Espalda',
    cardio: 'Cardio',
    chest: 'Pecho',
    'lower arms': 'Antebrazos',
    'lower legs': 'Pantorrillas',
    neck: 'Cuello',
    shoulders: 'Hombros',
    'upper arms': 'Brazos',
    'upper legs': 'Piernas y glúteos',
    waist: 'Abdomen y core',
};

export const EQUIPMENT_LABELS_ES: Record<string, string> = {
    'body weight': 'Sin equipo',
    dumbbell: 'Mancuernas',
    band: 'Banda elástica',
    kettlebell: 'Pesa rusa',
    'stability ball': 'Pelota de estabilidad',
    barbell: 'Barra',
    cable: 'Polea',
    'leverage machine': 'Máquina',
    'smith machine': 'Máquina Smith',
    'ez barbell': 'Barra EZ',
    weighted: 'Con peso',
};

export const listBodyParts = (): string[] =>
    Array.from(new Set(all.map((ex) => ex.bodyPart))).sort();

export const listEquipment = (): string[] =>
    Array.from(new Set(all.map((ex) => ex.equipment))).sort();

export interface ExerciseQuery {
    bodyPart?: string;
    equipment?: string;
    text?: string;
    offset?: number;
    limit?: number;
    lang?: Lang;
}

/** Filtered, paginated browse of the whole dataset. `total` ignores offset/limit. */
export const queryExercises = ({
    bodyPart,
    equipment,
    text,
    offset = 0,
    limit = 24,
    lang = getLang(),
}: ExerciseQuery): { items: Exercise[]; total: number } => {
    const q = text?.trim().toLowerCase();
    const matches = all.filter((ex) => {
        if (bodyPart && ex.bodyPart !== bodyPart) return false;
        if (equipment && ex.equipment !== equipment) return false;
        if (!q) return true;
        const nameEs = exerciseDisplayName(ex, 'es').toLowerCase();
        const nameEn = ex.name.toLowerCase();
        const target = ex.target.toLowerCase();
        return nameEs.includes(q) || nameEn.includes(q) || target.includes(q);
    });
    return {
        items: matches.slice(offset, offset + limit).map((ex) => toExercise(ex, lang)),
        total: matches.length,
    };
};
