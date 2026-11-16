#!/usr/bin/env python3
"""
Estrategia rápida de generación y recorte de imágenes de recetas para Cycle Sync.

Permite tomar una imagen collage (ej. cuadrícula 2x2 o 3x3) generada con fotografía culinaria real,
recortar automáticamente cada cuadrante/celda, optimizarla a WebP y vincularla a las recetas de
src/data/catalogRecipes.json.

Uso:
    python scripts/slice_recipe_collage.py --image "ruta/al/collage.jpg" --grid 2x2 --recipes "Pan con Palta y Huevo,Batido Verde Detox,Noquis de Calabaza,Solterito Arequipeno"
"""

import os
import sys
import json
import re
import unicodedata
import argparse
from PIL import Image

CATALOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'catalogRecipes.json')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'recipes')

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFD', text.lower())
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def normalize_title(text: str) -> str:
    text = unicodedata.normalize('NFD', text.lower())
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

def slice_and_assign(
    image_path: str,
    grid: str,
    recipe_titles: list[str],
    margin_percent: float = 0.02,
    output_size: tuple[int, int] = (600, 600),
    dry_run: bool = False
):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"No se encontró la imagen de collage: {image_path}")

    cols, rows = map(int, grid.lower().split('x'))
    total_slots = cols * rows

    if len(recipe_titles) != total_slots:
        print(f"[!] Advertencia: La cuadrícula {grid} tiene {total_slots} celdas, pero se especificaron {len(recipe_titles)} recetas.")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    catalog_map = {normalize_title(r['title']): idx for idx, r in enumerate(catalog)}

    with Image.open(image_path) as im:
        im = im.convert('RGB')
        width, height = im.size
        cell_w = width / cols
        cell_h = height / rows

        results = []

        for idx, title in enumerate(recipe_titles):
            if idx >= total_slots:
                break
            
            row = idx // cols
            col = idx % cols

            # Coordenadas con margen interno opcional para eliminar posibles bordes
            left = col * cell_w + (cell_w * margin_percent)
            top = row * cell_h + (cell_h * margin_percent)
            right = (col + 1) * cell_w - (cell_w * margin_percent)
            bottom = (row + 1) * cell_h - (cell_h * margin_percent)

            crop_box = (int(left), int(top), int(right), int(bottom))
            cropped = im.crop(crop_box)
            cropped = cropped.resize(output_size, Image.Resampling.LANCZOS)

            slug = slugify(title)
            filename = f"{slug}.webp"
            target_path = os.path.join(OUTPUT_DIR, filename)
            public_url = f"/recipes/{filename}"

            norm_title = normalize_title(title)
            matched_idx = catalog_map.get(norm_title)

            # Búsqueda difusa si no coincide exacto
            if matched_idx is None:
                for k, c_idx in catalog_map.items():
                    if norm_title in k or k in norm_title:
                        matched_idx = c_idx
                        break

            if matched_idx is not None:
                matched_recipe = catalog[matched_idx]
                results.append({
                    "cell": f"Fila {row+1}, Col {col+1}",
                    "title": title,
                    "catalog_title": matched_recipe['title'],
                    "catalog_index": matched_idx,
                    "file": filename,
                    "url": public_url,
                })
                if not dry_run:
                    cropped.save(target_path, 'WEBP', quality=88, method=6)
                    catalog[matched_idx]['imageUrl'] = public_url
            else:
                print(f"[!] Receta '{title}' no encontrada en el catálogo. Guardando imagen suelta...")
                if not dry_run:
                    cropped.save(target_path, 'WEBP', quality=88, method=6)
                results.append({
                    "cell": f"Fila {row+1}, Col {col+1}",
                    "title": title,
                    "catalog_title": None,
                    "catalog_index": None,
                    "file": filename,
                    "url": public_url,
                })

    if not dry_run:
        with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"PROCESAMIENTO DE COLLAGE COMPLETADO ({'DRY RUN' if dry_run else 'APLICADO'})")
    print("=" * 60)
    for res in results:
        status = f"✓ Vinculada a '{res['catalog_title']}'" if res['catalog_title'] else "✗ Sin receta en catálogo"
        print(f"[{res['cell']}] {res['title']} -> {res['url']} ({status})")
    print("=" * 60 + "\n")

    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Recorta collages de recetas y las asigna al catálogo.")
    parser.add_argument('--image', required=True, help="Ruta de la imagen de collage")
    parser.add_argument('--grid', default='2x2', help="Dimensiones de la cuadrícula, ej. 2x2 o 3x3")
    parser.add_argument('--recipes', required=True, help="Títulos de las recetas separados por comas (orden de lectura izq a der, arriba a abajo)")
    parser.add_argument('--margin', type=float, default=0.02, help="Margen de recorte interior (porcentaje entre 0.0 y 0.1)")
    parser.add_argument('--dry-run', action='store_true', help="Solo simular sin guardar archivos ni modificar json")

    args = parser.parse_args()
    recipes_list = [r.strip() for r in args.recipes.split(',') if r.strip()]
    slice_and_assign(args.image, args.grid, recipes_list, args.margin, dry_run=args.dry_run)
