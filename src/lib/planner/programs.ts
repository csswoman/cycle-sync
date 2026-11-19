import data from '@/data/programsDataset.json';

export interface ProgramRoutineOption {
    id: string;
    label: string;
    minutes: number | null;
    exerciseCount: number;
}

export interface ProgramOption {
    id: string;
    name: string;
    category: 'home' | 'gym';
    difficulty: string;
    durationWeeks: number;
    routines: ProgramRoutineOption[];
}

interface RawRoutine { id: string; name: string; estimatedMinutes?: number; exercises?: unknown[] }
interface RawProgram { id: string; name: string; category: 'home' | 'gym'; difficulty: string; durationWeeks: number; routines: RawRoutine[] }

// Routine names look like "Abdomen - Rutina 1"; when every routine of a program shares the prefix, the label keeps the rest.
const routineLabel = (routine: RawRoutine, all: RawRoutine[]) => {
    const [head, ...rest] = routine.name.split(' - ');
    const shared = all.length > 1 && all.every((r) => r.name.split(' - ')[0] === head);
    return shared && rest.length ? rest.join(' - ') : head;
};

const raw = [...((data as { homePrograms?: RawProgram[] }).homePrograms ?? []), ...((data as { gymPrograms?: RawProgram[] }).gymPrograms ?? [])];

export const PROGRAMS: ProgramOption[] = raw.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    difficulty: p.difficulty,
    durationWeeks: p.durationWeeks,
    routines: p.routines.map((r) => ({
        id: r.id,
        label: routineLabel(r, p.routines),
        minutes: r.estimatedMinutes ?? null,
        exerciseCount: r.exercises?.length ?? 0,
    })),
}));

/** Title stored on the planner entry for a program routine. */
export const programEntryTitle = (program: ProgramOption, routine: ProgramRoutineOption) => `${program.name} · ${routine.label}`;

export interface ProgramExercise { id: string; name: string; sets: number | null; reps: string | null; category: string | null }

/** Exercises of a program day, for logging it in the journal. */
export function programRoutineExercises(routineId: string): ProgramExercise[] {
    for (const p of raw) {
        const r = p.routines.find((x) => x.id === routineId);
        if (!r) continue;
        return ((r.exercises ?? []) as { id?: string; name?: string; nameEs?: string; sets?: number; reps?: string | number; category?: string }[]).map((ex, i) => ({
            id: ex.id ?? `${routineId}-${i}`,
            name: ex.nameEs || ex.name || `Ejercicio ${i + 1}`,
            sets: typeof ex.sets === 'number' ? ex.sets : null,
            reps: ex.reps != null ? String(ex.reps) : null,
            category: ex.category ?? null,
        }));
    }
    return [];
}

export function findProgramRoutine(routineId: string): { program: ProgramOption; routine: ProgramRoutineOption } | null {
    for (const program of PROGRAMS) {
        const routine = program.routines.find((r) => r.id === routineId);
        if (routine) return { program, routine };
    }
    return null;
}
