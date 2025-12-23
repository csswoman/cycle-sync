import React, { useEffect, useState } from 'react';
import { fetchExercises, fetchExercisesByBodyPart, fetchWorkoutVideos } from '@/services/exercisesService';
import { Exercise, WorkoutVideo } from '@/types/exercises';

import phaseData from '@/data/phaseExercises.json';

const Routines: React.FC = () => {
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [pcosExercises, setPcosExercises] = useState<Exercise[]>([]);
  const [workoutVideos, setWorkoutVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simulating API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Load data from local JSON optimized for phases
        // TODO: Get dynamic phase from user context. Hardcoded to 'luteal' for demo.
        const currentPhaseData = phaseData['luteal'];
        
        // Transform local data to match Exercise type if needed, or use directly
        setRecommendedExercises(currentPhaseData.exercises.map(ex => ({
          ...ex,
          secondaryMuscles: [] // Ensure compatibility
        })));

        // For PCOS section, we can use low intensity exercises from Menstrual or Follicular
        const pcosData = phaseData['menstrual'].exercises.slice(0, 3);
        setPcosExercises(pcosData.map(ex => ({
          ...ex,
          secondaryMuscles: []
        })));

        // Videos still fetched from service (mocked there anyway)
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
  }, []);

  // Helper for broken images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string) => {
    const target = e.target as HTMLImageElement;
    // Prevent infinite loop by checking if we already tried the fallback
    if (target.getAttribute('src') !== fallback) {
      target.src = fallback;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">

      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-24">

        {/* Hero Section */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">Rutinas de Entrenamiento</h1>
            <p className="text-muted-foreground text-lg font-normal leading-relaxed">
              Entrenamientos diseñados para sincronizarse con tu cuerpo. Encuentra el equilibrio perfecto para tu fase lútea y tus objetivos de gestión de SOP.
            </p>
          </div>
          {/* Current Status Card */}
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


        {/* Category Chips with Premium Backgrounds */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-md">
            <img
              src="/strength.png"
              alt="Strength"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => handleImageError(e, '/strength.png')}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h3 className="text-white font-bold text-lg">Entrenamiento de Fuerza</h3>
              <p className="text-white/80 text-xs text-balance">Mejora la sensibilidad a la insulina</p>
            </div>
          </div>
          <div className="group relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-md">
            <img
              src="/yoga.png"
              alt="Yoga"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => handleImageError(e, '/yoga.png')}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h3 className="text-white font-bold text-lg">Yoga & Pilates</h3>
              <p className="text-white/80 text-xs text-balance">Reduce el cortisol y balancea hormonas</p>
            </div>
          </div>
          <div className="group relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-md">
            <img
              src="/cardio.png"
              alt="Cardio"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => handleImageError(e, '/cardio.png')}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h3 className="text-white font-bold text-lg">Cardio Consciente</h3>
              <p className="text-white/80 text-xs text-balance">Bajo impacto para salud metabólica</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center">
            {error}
          </div>
        )}

        {/* Section 1: Recommended for Luteal Phase */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">Recomendado para tu Fase Lútea</h2>
            <button className="text-primary text-sm font-medium hover:underline">Ver todo</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              recommendedExercises.slice(0, 4).map((ex) => (
                <div key={ex.id} className="@container">
                  <div className="flex flex-col md:flex-row items-stretch rounded-2xl shadow-sm bg-card overflow-hidden hover:shadow-md transition-all border border-border group h-full">
                    <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden bg-muted shrink-0">
                      <img
                        src={ex.gifUrl || '/exercise-fallback.png'}
                        alt={ex.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => handleImageError(e, '/exercise-fallback.png')}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-foreground text-xl font-bold leading-tight capitalize line-clamp-1">{ex.name}</h3>
                          <button className="text-muted-foreground hover:text-foreground"><span className="material-symbols-outlined">bookmark_add</span></button>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {ex.instructions[0] || `Enfócate en tu ${ex.target} usando ${ex.equipment}.`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-lg bg-secondary text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{ex.bodyPart}</span>
                          <span className="px-2 py-1 rounded-lg bg-secondary text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{ex.equipment}</span>
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
                </div>
              ))
            )}
          </div>
        </section>


        {/* Section 2: Workout Videos */}
        <section className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">Videos Sugeridos</h2>
            <button className="text-primary text-sm font-medium hover:underline">YouTube</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="aspect-video rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              workoutVideos.map((video) => (
                <div key={video.id} className="flex flex-col gap-3 group cursor-pointer" onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => handleImageError(e, '/exercise-fallback.png')}
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
              ))
            )}
          </div>
        </section>


        {/* Section 3: PCOS & Metabolic Health */}
        <section className="flex flex-col gap-4 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight">Gestión de Síntomas SOP</h2>
              <p className="text-muted-foreground text-sm mt-1">Enfocado en sensibilidad a la insulina y reducción de андrógenos.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="aspect-video rounded-2xl bg-card animate-pulse border border-border" />
              ))
            ) : (
              pcosExercises.map((ex) => (
                <div key={ex.id} className="group flex flex-col bg-card rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-border h-full">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={ex.gifUrl || '/exercise-fallback.png'}
                      alt={ex.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => handleImageError(e, '/exercise-fallback.png')}
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-foreground text-lg font-bold capitalize line-clamp-1">{ex.name}</h3>
                      <span className="bg-secondary text-foreground text-[10px] px-2 py-1 rounded-lg font-bold uppercase">SOP</span>
                    </div>
                    <p className="text-muted-foreground text-sm flex-1 line-clamp-2">
                      {ex.instructions[1] || `Excelente para trabajar ${ex.target} y mejorar la salud metabólica.`}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground capitalize font-medium">{ex.target}</span>
                      <button className="text-foreground hover:text-primary transition-colors"><span className="material-symbols-outlined">play_circle</span></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


        {/* Privacy & Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-card rounded-full border border-border shadow-sm">
            <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
            <span className="text-muted-foreground text-xs font-medium">Tus datos de salud están encriptados localmente. Tu privacidad es nuestra prioridad.</span>
          </div>
          <div className="flex justify-center gap-6 mt-8">
            <a className="text-muted-foreground text-sm hover:text-foreground transition-colors" href="#">Sobre Nosotros</a>
            <a className="text-muted-foreground text-sm hover:text-foreground transition-colors" href="#">Privacidad</a>
            <a className="text-muted-foreground text-sm hover:text-foreground transition-colors" href="#">Soporte</a>
          </div>
          <p className="text-primary/60 text-xs mt-6">© 2023 CycleSync. Todos los derechos reservados.</p>
        </footer>

      </div>
    </div>
  );
};

export default Routines;