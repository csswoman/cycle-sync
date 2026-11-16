/**
 * Upserts the YouTube videos listed in src/data/workoutVideos.json into workout_videos.
 *
 *   npm run videos:import [-- --dry-run]
 *
 * Each entry: url, title, channel_name?, category (gym|dance|yoga|pilates),
 * phases (menstrual|follicular|ovulation|luteal|any)[], duration_minutes, intensity (low|medium|high).
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import fs from 'node:fs';
import { createAdminClient } from '../src/lib/supabase/admin';
import { parseYouTubeId } from '../src/lib/youtube';

const CATEGORIES = ['gym', 'dance', 'yoga', 'pilates'];
const PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal', 'any'];
const INTENSITIES = ['low', 'medium', 'high'];

async function main() {
  if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
  const dryRun = process.argv.includes('--dry-run');
  const entries = JSON.parse(fs.readFileSync('src/data/workoutVideos.json', 'utf8')) as any[];

  const rows = entries.map((e, i) => {
    const youtube_id = parseYouTubeId(String(e.url ?? ''));
    const problems: string[] = [];
    if (!youtube_id) problems.push('invalid url');
    if (!e.title) problems.push('missing title');
    if (!CATEGORIES.includes(e.category)) problems.push('invalid category');
    if (!Array.isArray(e.phases) || e.phases.length === 0 || !e.phases.every((p: string) => PHASES.includes(p))) problems.push('invalid phases');
    if (!Number.isInteger(e.duration_minutes) || e.duration_minutes <= 0) problems.push('invalid duration_minutes');
    if (!INTENSITIES.includes(e.intensity)) problems.push('invalid intensity');
    if (problems.length) {
      console.error(`Entry ${i} (${e.title ?? e.url}): ${problems.join(', ')}`);
      process.exit(1);
    }
    return {
      url: e.url,
      youtube_id,
      title: e.title,
      channel_name: e.channel_name ?? null,
      category: e.category,
      phases: e.phases,
      duration_minutes: e.duration_minutes,
      intensity: e.intensity,
    };
  });

  if (dryRun) {
    console.log(`Dry run: ${rows.length} videos valid, nothing written.`);
    return;
  }
  const { error } = await createAdminClient().from('workout_videos').upsert(rows, { onConflict: 'youtube_id' });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Upserted ${rows.length} videos.`);
}

main();
