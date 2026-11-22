#!/usr/bin/env python3
import os
import shutil
import json
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_RECIPES_DIR = os.path.join(BASE_DIR, 'public', 'recipes')
OUTPUT_COLLAGES_DIR = os.path.join(BASE_DIR, 'public', 'recipes', 'collages')
CATALOG_PATH = os.path.join(BASE_DIR, 'src', 'data', 'catalogRecipes.json')

os.makedirs(OUTPUT_RECIPES_DIR, exist_ok=True)
os.makedirs(OUTPUT_COLLAGES_DIR, exist_ok=True)

COLLAGE_SOURCES = [
    {
        "id": "collage_01",
        "path": r"C:\Users\karla\.gemini\antigravity\brain\534355d3-7a43-41c4-99c9-e1337016aac2\healthy_desserts_collage_png_1795224929313.jpg",
        "grid": (2, 2),
        "crops": [
            {"row": 0, "col": 0, "filename": "red-velvet-proteica.webp"},
            {"row": 0, "col": 1, "filename": "selva-negra-fit.webp"},
            {"row": 1, "col": 0, "filename": "torta-de-chocolate-glaseado.webp"},
            {"row": 1, "col": 1, "filename": "crocante-de-pera.webp"},
        ]
    },
    {
        "id": "collage_02",
        "path": r"C:\Users\karla\.gemini\antigravity\brain\534355d3-7a43-41c4-99c9-e1337016aac2\healthy_desserts_2x2_grid_1795224973230.jpg",
        "grid": (2, 2),
        "crops": [
            {"row": 0, "col": 0, "filename": "blondie-fit.webp"},
            {"row": 0, "col": 1, "filename": "carrot-cake-saludable.webp"},
            {"row": 1, "col": 0, "filename": "torta-de-canela-keto.webp"},
            {"row": 1, "col": 1, "filename": "torta-de-manzana-especiada.webp"},
        ]
    },
    {
        "id": "collage_03",
        "path": r"C:\Users\karla\.gemini\antigravity\brain\534355d3-7a43-41c4-99c9-e1337016aac2\healthy_desserts_2x2_collage_1795225010034.jpg",
        "grid": (2, 2),
        "crops": [
            {"row": 0, "col": 0, "filename": "paraiso-frutal-de-vainilla.webp"},
            {"row": 0, "col": 1, "filename": "tiramisu-keto.webp"},
            {"row": 1, "col": 0, "filename": "tres-leches-fit.webp"},
            {"row": 1, "col": 1, "filename": "mocha-protein-cake.webp"},
        ]
    },
    {
        "id": "collage_04",
        "path": r"C:\Users\karla\.gemini\antigravity\brain\534355d3-7a43-41c4-99c9-e1337016aac2\healthy_desserts_grid_1795225048983.jpg",
        "grid": (2, 2),
        "crops": [
            {"row": 0, "col": 0, "filename": "torta-trufada-proteica.webp"},
            {"row": 0, "col": 1, "filename": "pasion-de-lucuma.webp"},
        ]
    }
]

# 1. Guardar y procesar imágenes
margin_percent = 0.02
output_size = (600, 600)

for idx, col in enumerate(COLLAGE_SOURCES):
    src_path = col["path"]
    if not os.path.exists(src_path):
        print(f"Error: {src_path} no existe.")
        continue
    
    # Copiar collage completo
    target_collage = os.path.join(OUTPUT_COLLAGES_DIR, f"{col['id']}.jpg")
    shutil.copy2(src_path, target_collage)
    print(f"[+] Collage guardado en: {target_collage}")

    # Recortar celdas
    cols, rows = col["grid"]
    with Image.open(src_path) as im:
        im = im.convert('RGB')
        w, h = im.size
        cell_w = w / cols
        cell_h = h / rows

        for crop in col["crops"]:
            r = crop["row"]
            c = crop["col"]
            left = c * cell_w + (cell_w * margin_percent)
            top = r * cell_h + (cell_h * margin_percent)
            right = (c + 1) * cell_w - (cell_w * margin_percent)
            bottom = (r + 1) * cell_h - (cell_h * margin_percent)

            box = (int(left), int(top), int(right), int(bottom))
            cropped = im.crop(box).resize(output_size, Image.Resampling.LANCZOS)
            dest = os.path.join(OUTPUT_RECIPES_DIR, crop["filename"])
            cropped.save(dest, 'WEBP', quality=88, method=6)
            print(f"  -> Recorte guardado: {dest}")

print("Imágenes procesadas exitosamente.")
