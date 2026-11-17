/**
 * Recipe tags come from several sources (seed data, AI, the user) and repeat the same idea
 * with different casing, accents, plurals or gender ("Antiinflamatoria" / "Antiinflamatorio").
 * The tag filter groups them under one canonical key and one readable label.
 */

const strip = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

// Variants that mean the same thing, keyed by their stripped form.
const CANONICAL: Record<string, string> = {
  antiinflamatoria: 'antiinflamatorio',
  antioxidantes: 'antioxidante',
  'antioxidante potente': 'antioxidante',
  digestiva: 'digestion',
  'enzimas digestivas': 'digestion',
  'diuretico natural': 'diuretico',
  'hidratacion tropical': 'hidratacion',
  'energia natural': 'energia',
  proteina: 'proteina',
  'vitaminas a y c': 'vitamina c',
  'vitaminas k y a': 'vitamina a',
  vegetariana: 'vegetariano',
};

const LABELS: Record<string, string> = {
  antiinflamatorio: 'Antiinflamatorio',
  antioxidante: 'Antioxidante',
  digestion: 'Digestión',
  diuretico: 'Diurético',
  hidratacion: 'Hidratación',
  energia: 'Energía',
  proteina: 'Proteína',
  vegetariano: 'Vegetariano',
  'bajo ig': 'Bajo IG',
  'sin gluten': 'Sin gluten',
  'omega 3': 'Omega 3',
  'fase lutea': 'Fase lútea',
  'fase ovulatoria': 'Fase ovulatoria',
  'fase folicular': 'Fase folicular',
  'fase menstrual': 'Fase menstrual',
  'seed cycling': 'Seed cycling',
};

export function tagKey(tag: string): string {
  const k = strip(tag);
  return CANONICAL[k] ?? k;
}

export function tagLabel(tag: string): string {
  const k = tagKey(tag);
  if (LABELS[k]) return LABELS[k];
  // Fallback: sentence case of the original, which fixes "EnergíA" style casing.
  const t = tag.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
