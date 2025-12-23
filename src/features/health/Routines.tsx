import React, { useEffect, useState } from 'react';
import { fetchWorkoutVideos } from '@/services/exercisesService';
import { Exercise, WorkoutVideo, Routine } from '@/types/exercises';
import phaseData from '@/data/phaseExercises.json';
import { supabase } from '@/lib/supabase';
import { ExerciseCard, RoutineSection, SavedRoutineCard, VideoCard } from './components/RoutinesComponents';

const Routines: React.FC = () => {
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [pcosExercises, setPcosExercises] = useState<Exercise[]>([]);
  const [workoutVideos, setWorkoutVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const currentPhaseData = phaseData['luteal'];
        
        setRecommendedExercises(currentPhaseData.exercises.map(ex => ({
          ...ex,
          secondaryMuscles: []
        })));

        const pcosData = phaseData['menstrual'].exercises.slice(0, 3);
        setPcosExercises(pcosData.map(ex => ({
          ...ex,
          secondaryMuscles: []
        })));

        const videos = await fetchWorkoutVideos();
        setWorkoutVideos(videos);
        setError(null);
      } catch (err) {
        console.error('Error loading routines data:', err);
        setError('No se pudieron cargar las rutinas. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    fetchUserRoutines();
  }, []);

  const fetchUserRoutines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserRoutines(data || []);
    } catch (err) {
      console.error('Error fetching user routines:', err);
    }
  };

  const onSaveExercise = async (ex: Exercise) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para guardar rutinas.');
        return;
      }

      const { error } = await supabase
        .from('routines')
        .insert([
          {
            user_id: user.id,
            name: `Rutina ${ex.name}`,
            description: `Enfocado en ${ex.target} para la fase lútea.`,
            exercises: [ex],
            phase: 'luteal'
          }
        ]);

      if (error) throw error;
      alert('Rutina guardada con éxito!');
      fetchUserRoutines();
    } catch (err: any) {
      alert('Error al guardar rutina: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-12 pb-24">
        
        {/* Hero Section */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-tight">Rutinas de Entrenamiento</h1>
            <p className="text-muted-foreground text-lg font-normal leading-relaxed">
              Entrenamientos diseñados para sincronizarse con tu cuerpo. Encuentra el equilibrio perfecto para tu fase lútea y tus objetivos de gestión de SOP.
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 min-w-[300px] shadow-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Estado Actual</p>
              <p className="text-foreground text-lg font-bold">Fase Lútea • Día 22</p>
            </div>
          </div>
        </section>

        {/* Category Chips */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Entrenamiento de Fuerza', p: 'Mejora la sensibilidad a la insulina', img: '/strength.png' },
            { title: 'Yoga & Pilates', p: 'Reduce el cortisol y balancea hormonas', img: '/yoga.png' },
            { title: 'Cardio Consciente', p: 'Bajo impacto para salud metabólica', img: '/cardio.png' }
          ].map((cat, i) => (
            <div key={i} className="group relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-md">
              <div className="absolute inset-0 bg-secondary" /> {/* Fallback bg */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 z-20">
                <h3 className="text-white font-bold text-lg">{cat.title}</h3>
                <p className="text-white/80 text-xs text-balance">{cat.p}</p>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center font-bold">
            {error}
          </div>
        )}

        {/* Section: My Saved Routines */}
        {userRoutines.length > 0 && (
          <RoutineSection title="Mis Rutinas Guardadas" icon="bookmark">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRoutines.map((routine) => (
                <SavedRoutineCard key={routine.id} routine={routine} />
              ))}
            </div>
          </RoutineSection>
        )}

        {/* Section 1: Recommended for Luteal Phase */}
        <RoutineSection 
          title="Recomendado para tu Fase Lútea" 
          description="Ejercicios de fuerza de baja a moderada intensidad para apoyar tu metabolismo basal elevado."
          rightElement={<button className="text-primary text-sm font-medium hover:underline">Ver todo</button>}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              recommendedExercises.slice(0, 4).map((ex) => (
                <ExerciseCard 
                    key={ex.id} 
                    exercise={ex} 
                    variant="horizontal" 
                    onSave={() => onSaveExercise(ex)} 
                    saving={saving}
                />
              ))
            )}
          </div>
        </RoutineSection>

        {/* Section 2: Workout Videos */}
        <RoutineSection 
            title="Videos Sugeridos" 
            icon="videocam"
            rightElement={<button className="text-primary text-sm font-medium hover:underline">Ver YouTube</button>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="aspect-video rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              workoutVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))
            )}
          </div>
        </RoutineSection>

        {/* Section 3: PCOS & Metabolic Health */}
        <RoutineSection 
            title="Gestión de Síntomas SOP" 
            description="Enfocado en sensibilidad a la insulina y reducción de andrógenos."
            icon="health_and_safety"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              pcosExercises.map((ex) => (
                <ExerciseCard 
                    key={ex.id} 
                    exercise={ex} 
                    onSave={() => onSaveExercise(ex)} 
                    saving={saving}
                />
              ))
            )}
          </div>
        </RoutineSection>

        {/* Privacy & Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-card rounded-full border border-border shadow-sm">
            <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
            <span className="text-muted-foreground text-xs font-medium">Tus datos de salud están protegidos. Tu privacidad es nuestra prioridad.</span>
          </div>
          <div className="flex justify-center gap-6 mt-8">
            <a className="text-muted-foreground text-sm hover:text-foreground transition-colors" href="#">Privacidad</a>
            <a className="text-muted-foreground text-sm hover:text-foreground transition-colors" href="#">Soporte Técnico</a>
          </div>
          <p className="text-primary/60 text-xs mt-6 font-bold uppercase tracking-widest">© 2023 CycleSync</p>
        </footer>
      </div>
    </div>
  );
};

export default Routines;