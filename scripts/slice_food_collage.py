#!/usr/bin/env python3
"""
Corta collages de alimentos en imágenes individuales de 64x64 (o tamaño configurado en WebP)
para el catálogo de nutrición en CycleSync.

Uso:
    python scripts/slice_food_collage.py --image "ruta/collage.png" --grid 3x4 --items "pechuga-pollo,salmon-cocinado,..."
"""

import os
import sys
import argparse
from PIL import Image

PUBLIC_FOODS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'foods')

def slice_collage(image_path: str, grid: str, item_ids: list[str], margin_percent: float = 0.03, output_size: tuple[int, int] = (128, 128)):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"No se encontró la imagen: {image_path}")

    cols, rows = map(int, grid.lower().split('x'))
    total_slots = cols * rows

    os.makedirs(PUBLIC_FOODS_DIR, exist_ok=True)

    with Image.open(image_path) as im:
        im = im.convert('RGB')
        width, height = im.size
        cell_w = width / cols
        cell_h = height / rows

        print(f"[i] Procesando collage {image_path}: {width}x{height}, cuadrícula {cols}x{rows} ({total_slots} celdas)")

        saved_files = []
        for idx, item_id in enumerate(item_ids):
            if idx >= total_slots:
                break
            if not item_id or item_id == 'none' or item_id == '-':
                continue

            row = idx // cols
            col = idx % cols

            left = col * cell_w + (cell_w * margin_percent)
            top = row * cell_h + (cell_h * margin_percent)
            right = (col + 1) * cell_w - (cell_w * margin_percent)
            bottom = (row + 1) * cell_h - (cell_h * margin_percent)

            crop_box = (int(left), int(top), int(right), int(bottom))
            cropped = im.crop(crop_box)
            cropped = cropped.resize(output_size, Image.Resampling.LANCZOS)

            out_filename = f"{item_id.strip()}.webp"
            target_path = os.path.join(PUBLIC_FOODS_DIR, out_filename)
            cropped.save(target_path, 'WEBP', quality=85)
            print(f"  -> Guardado: {out_filename} ({output_size[0]}x{output_size[1]})")
            saved_files.append(target_path)

        return saved_files

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Recorta collages de alimentos")
    parser.add_argument("--image", required=True, help="Ruta de la imagen collage")
    parser.add_argument("--grid", required=True, help="Formato CxR (ej. 3x4 o 4x4)")
    parser.add_argument("--items", required=True, help="IDs separados por comas para cada celda de izquierda a derecha, arriba a abajo")
    parser.add_argument("--margin", type=float, default=0.03, help="Margen interior (ej. 0.03)")
    parser.add_argument("--size", type=int, default=128, help="Tamaño de salida en px (ej. 128 o 64)")

    args = parser.parse_args()
    items = [x.strip() for x in args.items.split(',')]
    slice_collage(args.image, args.grid, items, args.margin, (args.size, args.size))
