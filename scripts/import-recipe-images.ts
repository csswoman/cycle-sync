/**
 * Attaches photos to catalog recipes.
 *
 *   npm run recipes:images -- --list                      recipes that still have no photo
 *   npm run recipes:images -- <folder> [--dry-run]        upload photos and link them
 *
 * Name each image after its recipe title ("arroz-con-frijoles.png", "Arroz con frijoles.jpg")
 * or after the recipe id ("<uuid>.webp"). Titles match like duplicates do: accents, case,
 * punctuation and word order are ignored. jpg, png and webp up to 5 MB.
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from '../src/lib/supabase/admin';
import { titleKey } from '../src/lib/recipes/normalize';

const BUCKET = 'recipe-images';
const MAX_BYTES = 5 * 1024 * 1024;
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Row {
  id: string;
  title: string;
  language: string;
  image_url: string | null;
}

async function main() {
  if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const list = args.includes('--list');
  const folder = args.find((a) => !a.startsWith('--'));

  const db = createAdminClient();
  const { data, error } = await db
    .from('recipes')
    .select('id, title, language, image_url')
    .is('owner_id', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  if (list) {
    const missing = rows.filter((r) => !r.image_url);
    console.log(`${missing.length} of ${rows.length} recipes have no photo:`);
    missing.forEach((r) => console.log(`${r.id}\t${r.title}`));
    return;
  }

  if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.error('Usage: npm run recipes:images -- --list | <folder> [--dry-run]');
    process.exit(1);
  }

  const byId = new Map(rows.map((r) => [r.id.toLowerCase(), r]));
  const byKey = new Map<string, Row[]>();
  rows.forEach((r) => {
    const k = titleKey(r.title);
    byKey.set(k, [...(byKey.get(k) ?? []), r]);
  });

  let linked = 0;
  const unmatched: string[] = [];

  for (const file of fs.readdirSync(folder)) {
    const ext = path.extname(file).toLowerCase();
    if (!MIME[ext]) continue;
    const base = path.basename(file, ext);
    const full = path.join(folder, file);

    let recipe: Row | undefined;
    if (UUID.test(base)) {
      recipe = byId.get(base.toLowerCase());
    } else {
      const matches = byKey.get(titleKey(base.replace(/[-_]+/g, ' '))) ?? [];
      if (matches.length > 1) {
        console.warn(`- ${file}: matches ${matches.length} recipes (different languages), rename it with the recipe id`);
        continue;
      }
      recipe = matches[0];
    }
    if (!recipe) {
      unmatched.push(file);
      continue;
    }
    if (fs.statSync(full).size > MAX_BYTES) {
      console.warn(`- ${file}: skipped (over 5 MB)`);
      continue;
    }

    if (dryRun) {
      console.log(`- ${file} -> ${recipe.title}`);
      continue;
    }

    const objectPath = `${recipe.id}${ext}`;
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(objectPath, fs.readFileSync(full), { contentType: MIME[ext], upsert: true, cacheControl: '31536000' });
    if (uploadError) throw uploadError;

    // The ?v= suffix busts browser and CDN caches when a photo is replaced.
    const url = `${db.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await db.from('recipes').update({ image_url: url }).eq('id', recipe.id);
    if (updateError) throw updateError;
    linked++;
    console.log(`+ ${recipe.title}`);
  }

  if (!dryRun) console.log(`Done: ${linked} photo(s) linked.`);
  if (unmatched.length) {
    console.warn(`No recipe found for: ${unmatched.join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
