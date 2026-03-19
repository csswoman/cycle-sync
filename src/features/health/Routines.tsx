'use client';

import React, { useEffect, useState } from 'react';
import { fetchWorkoutVideos } from '@/services/exercisesService';
import { Exercise, WorkoutVideo, Routine } from '@/types/exercises';
import phaseData from '@/data/phaseExercises.json';
import { supabase } from '@/lib/supabase';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useRoutineStore } from '@/stores/routineStore';
import { ExerciseCard, RoutineSection, SavedRoutineCard, VideoCard } from './components/RoutinesComponents';

const PHASE_KEY_MAP: Record<string, string> = {
  Menstrual: 'menstrual',
  Follicular: 'follicular',
  Ovulation: 'ovulation',
  Luteal: 'luteal',
};

const PHASE_GUIDANCE: Record<string, { title: string; desc: string; intensity: string }> = {
  menstrual: {
    title: 'Rest & Recovery',
    desc: 'Gentle yoga, stretching, and walks. Honor your body\'s need for rest.',
    intensity: 'Low',
  },
  follicular: {
    title: 'Build Strength',
    desc: 'Rising estrogen supports muscle growth. Time for progressive overload!',
    intensity: 'Moderate-High',
  },
  ovulation: {
    title: 'Peak Performance',
    desc: 'Energy peaks — go for HIIT, sprints, and challenging lifts.',
    intensity: 'High',
  },
  luteal: {
    title: 'Stabilize & Maintain',
    desc: 'Low impact strength and mobility. Avoid spiking cortisol.',
    intensity: 'Low-Moderate',
  },
};

const Routines: React.FC = () => {
  const { cycleInfo, loading: cycleLoading } = useCycleInfo();
  const { streak, badges, newBadges, completeWorkout, clearNewBadges } = useRoutineStore();

  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [pcosExercises, setPcosExercises] = useState<Exercise[]>([]);
  const [workoutVideos, setWorkoutVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const phaseKey = cycleInfo ? PHASE_KEY_MAP[cycleInfo.phase] || 'follicular' : 'follicular';
  const guidance = PHASE_GUIDANCE[phaseKey];

  useEffect(() => {
    if (newBadges.length > 0) {
      setShowBadgeModal(true);
    }
  }, [newBadges]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentPhaseData = (phaseData as any)[phaseKey];
        if (currentPhaseData) {
          setRecommendedExercises(currentPhaseData.exercises.map((ex: any) => ({
            ...ex,
            secondaryMuscles: []
          })));
        }

        const pcosKey = phaseKey === 'menstrual' ? 'follicular' : 'menstrual';
        const pcosData = (phaseData as any)[pcosKey]?.exercises?.slice(0, 3) ?? [];
        setPcosExercises(pcosData.map((ex: any) => ({ ...ex, secondaryMuscles: [] })));

        const videos = await fetchWorkoutVideos();
        setWorkoutVideos(videos);
        setError(null);
      } catch (err) {
        console.error('Error loading routines data:', err);
        setError('Could not load routines. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (!cycleLoading) loadData();
    fetchUserRoutines();
  }, [cycleLoading, phaseKey]);

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
      if (!user) return;

      const { error } = await supabase.from('routines').insert([{
        user_id: user.id,
        name: `${ex.name} Routine`,
        description: `Targeting ${ex.target} for the ${cycleInfo?.phase ?? 'current'} phase.`,
        exercises: [ex],
        phase: phaseKey,
      }]);

      if (error) throw error;
      fetchUserRoutines();
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWorkout = () => {
    completeWorkout();
  };

  const earnedBadges = badges.filter((b) => b.earnedAt);
  const unearnedBadges = badges.filter((b) => !b.earnedAt);

  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">
      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-10 pb-24">

        {/* Badge Unlock Modal */}
        {showBadgeModal && newBadges.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowBadgeModal(false); clearNewBadges(); }}>
            <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="text-6xl mb-4">
                <span className="material-symbols-outlined text-yellow-400 text-[64px]">emoji_events</span>
              </div>
              <h3 className="text-foreground text-2xl font-black mb-2">Badge Unlocked!</h3>
              {newBadges.map((id) => {
                const badge = badges.find((b) => b.id === id);
                return badge ? (
                  <div key={id} className="mt-4 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/30">
                    <span className="material-symbols-outlined text-yellow-400 text-3xl">{badge.icon}</span>
                    <p className="text-foreground font-bold mt-2">{badge.name}</p>
                    <p className="text-muted-foreground text-sm">{badge.description}</p>
                  </div>
                ) : null;
              })}
              <button
                onClick={() => { setShowBadgeModal(false); clearNewBadges(); }}
                className="mt-6 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-tight">
              Workout Routines
            </h1>
            <p className="text-muted-foreground text-lg font-normal leading-relaxed">
              Workouts designed to sync with your body. {guidance.desc}
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 min-w-[300px] shadow-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Current Status</p>
              <p className="text-foreground text-lg font-bold">
                {cycleLoading ? 'Loading...' : `${cycleInfo?.phase ?? 'Unknown'} Phase • Day ${cycleInfo?.cycleDay ?? '?'}`}
              </p>
            </div>
          </div>
        </section>

        {/* Streak & Badges Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Streak */}
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-5">
              <span className="material-symbols-outlined text-7xl">local_fire_department</span>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <span className="material-symbols-outlined text-orange-500 text-3xl">local_fire_department</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Current Streak</p>
              <p className="text-foreground text-3xl font-black">{streak.currentStreak} <span className="text-sm font-medium text-muted-foreground">days</span></p>
            </div>
          </div>

          {/* Total Workouts */}
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-5">
              <span className="material-symbols-outlined text-7xl">fitness_center</span>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl">fitness_center</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Workouts</p>
              <p className="text-foreground text-3xl font-black">{streak.totalCompleted}</p>
            </div>
          </div>

          {/* Complete Workout CTA */}
          <button
            onClick={handleCompleteWorkout}
            disabled={streak.lastCompletedDate === new Date().toISOString().split('T')[0]}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground rounded-xl border-0 p-5 flex items-center gap-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="material-symbols-outlined text-3xl">
                {streak.lastCompletedDate === new Date().toISOString().split('T')[0] ? 'check_circle' : 'play_arrow'}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                {streak.lastCompletedDate === new Date().toISOString().split('T')[0] ? 'Completed Today' : 'Mark as Done'}
              </p>
              <p className="text-lg font-black">
                {streak.lastCompletedDate === new Date().toISOString().split('T')[0] ? 'Great Job!' : 'Log Workout'}
              </p>
            </div>
          </button>
        </section>

        {/* Badges */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-foreground text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400">emoji_events</span>
            Badges ({earnedBadges.length}/{badges.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  badge.earnedAt
                    ? 'bg-yellow-400/10 border-yellow-400/30 text-foreground'
                    : 'bg-secondary/50 border-border text-muted-foreground opacity-50'
                }`}
              >
                <span className={`material-symbols-outlined ${badge.earnedAt ? 'text-yellow-400' : ''}`}>
                  {badge.icon}
                </span>
                <div>
                  <p className="text-sm font-bold">{badge.name}</p>
                  <p className="text-[10px]">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase Guidance */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Strength Training', p: 'Improve insulin sensitivity', icon: 'fitness_center' },
            { title: 'Yoga & Pilates', p: 'Reduce cortisol & balance hormones', icon: 'self_improvement' },
            { title: 'Mindful Cardio', p: 'Low impact for metabolic health', icon: 'directions_run' },
          ].map((cat, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden cursor-pointer bg-card border border-border p-6 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">{cat.icon}</span>
                </div>
                <h3 className="text-foreground font-bold">{cat.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm">{cat.p}</p>
            </div>
          ))}
        </section>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center font-bold">
            {error}
          </div>
        )}

        {/* Saved Routines */}
        {userRoutines.length > 0 && (
          <RoutineSection title="My Saved Routines" icon="bookmark">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRoutines.map((routine) => (
                <SavedRoutineCard key={routine.id} routine={routine} />
              ))}
            </div>
          </RoutineSection>
        )}

        {/* Phase Exercises */}
        <RoutineSection
          title={`Recommended for ${cycleInfo?.phase ?? 'Your'} Phase`}
          description={guidance.desc}
          rightElement={
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase">
              {guidance.intensity} Intensity
            </span>
          }
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

        {/* Videos */}
        <RoutineSection
          title="Suggested Videos"
          icon="videocam"
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

        {/* PCOS Exercises */}
        <RoutineSection
          title="PCOS Symptom Management"
          description="Focused on insulin sensitivity and androgen reduction."
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
      </div>
    </div>
  );
};

export default Routines;
