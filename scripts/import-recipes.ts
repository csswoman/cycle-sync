/**
 * Imports recipes from PDF files into the shared catalog (Gemini reads the PDFs).
 *
 *   npm run recipes:import -- <folder-or-pdf> [--lang es|en] [--dry-run]
 *
 * Needs GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Recipes already in the catalog (same or near identical title) are skipped.
 * --dry-run prints what would be imported and writes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateJson } from '../src/lib/ai/gemini.server';
import { createAdminClient } from '../src/lib/supabase/admin';
import { buildPdfPrompt } from '../src/lib/recipes/prompts';
import { parseRecipesJson } from '../src/lib/recipes/sanitize';
import { saveCatalogRecipes } from '../src/lib/recipes/catalog.server';
import type { RecipeLanguage } from '../src/types/recipes';

const MAX_PDF_BYTES = 18 * 1024 * 1024; // inline request limit is ~20 MB

async function main() {
  if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const langIdx = args.indexOf('--lang');
  const language: RecipeLanguage = langIdx >= 0 && args[langIdx + 1] === 'en' ? 'en' : 'es';
  const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--lang');
  if (!target || !fs.existsSync(target)) {
    console.error('Usage: npm run recipes:import -- <folder-or-pdf> [--lang es|en] [--dry-run]');
    process.exit(1);
  }

  const files = fs.statSync(target).isDirectory()
    ? fs.readdirSync(target).filter((f) => f.toLowerCase().endsWith('.pdf')).map((f) => path.join(target, f))
    : [target];
  if (files.length === 0) {
    console.error('No PDF files found.');
    process.exit(1);
  }

  const db = dryRun ? null : createAdminClient();
  let savedTotal = 0;
  let duplicateTotal = 0;

  for (const file of files) {
    const size = fs.statSync(file).size;
    if (size > MAX_PDF_BYTES) {
      console.warn(`- ${file}: skipped (over 18 MB, split the PDF)`);
      continue;
    }
    console.log(`- ${file}`);
    const dataUrl = `data:application/pdf;base64,${fs.readFileSync(file).toString('base64')}`;
    const recipes = parseRecipesJson(await generateJson(buildPdfPrompt(language), dataUrl), language);
    console.log(`  ${recipes.length} recipe(s) found`);

    if (dryRun || !db) {
      recipes.forEach((r) => console.log(`    · ${r.title}`));
      continue;
    }
    const result = await saveCatalogRecipes(db, recipes, 'pdf');
    savedTotal += result.saved.length;
    duplicateTotal += result.duplicates.length;
    result.saved.forEach((r) => console.log(`    + ${r.title}`));
    result.duplicates.forEach((t) => console.log(`    = ${t} (already exists)`));
  }

  if (!dryRun) console.log(`Done: ${savedTotal} saved, ${duplicateTotal} duplicates skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
