import { supabase } from '@/lib/supabase';
import { parseFoodPreferences, type FoodPreferences } from '@/lib/nutrition/foodPreferences';

async function currentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** The saved preferences of the signed-in user, or null when signed out or none saved yet. */
export async function fetchRemoteFoodPreferences(): Promise<FoodPreferences | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_food_preferences')
    .select('likes, avoid, sun, activity')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('Could not load food preferences:', error);
    return null;
  }
  return data ? parseFoodPreferences(data) : null;
}

/** Saves the preferences for the signed-in user. Does nothing in guest mode. */
export async function saveRemoteFoodPreferences(prefs: FoodPreferences): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase.from('user_food_preferences').upsert(
    {
      user_id: userId,
      likes: prefs.likes,
      avoid: prefs.avoid,
      sun: prefs.sun,
      activity: prefs.activity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) console.warn('Could not save food preferences:', error);
}
