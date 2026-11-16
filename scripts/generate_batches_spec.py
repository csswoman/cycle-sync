import json
import os

CATALOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'catalogRecipes.json')
OUTPUT_SPEC_PATH = os.path.join(os.path.dirname(__file__), 'recipe_collages_spec.json')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

# Agrupar en lotes de 4
batch_size = 4
batches = []

for i in range(0, len(recipes), batch_size):
    chunk = recipes[i:i + batch_size]
    batch_num = (i // batch_size) + 1
    
    positions = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"]
    items = []
    
    for idx, r in enumerate(chunk):
        pos = positions[idx] if idx < len(positions) else f"Position {idx+1}"
        items.append({
            "position": pos,
            "title": r['title'],
            "category": r.get('category', 'healthy'),
            "description": r.get('description', ''),
            "has_image": bool(r.get('imageUrl'))
        })
        
    batches.append({
        "batch_id": f"collage_{batch_num:02d}",
        "grid": "2x2",
        "recipes": [r['title'] for r in chunk],
        "items": items
    })

with open(OUTPUT_SPEC_PATH, 'w', encoding='utf-8') as f:
    json.dump({"total_recipes": len(recipes), "total_collages": len(batches), "batches": batches}, f, ensure_ascii=False, indent=2)

print(f"Generado {OUTPUT_SPEC_PATH} con {len(batches)} lotes de collages 2x2 para las {len(recipes)} recetas.")
