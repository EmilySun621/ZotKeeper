#!/usr/bin/env python3
"""
Convert Epicurious full_format_recipes.json to ZotKeeper frontend schema.
Usage:
  python scripts/load_epicurious.py [input_json] [output_json]
  Default: reads from ../data/full_format_recipes.json or first arg,
           writes to ../src/data/epicuriousRecipes.json or second arg.
Place full_format_recipes.json in project (e.g. scripts/ or data/) or pass path.
"""

import json
import re
import sys
from pathlib import Path

# Cuisine-like and diet-like keywords from Epicurious categories
CUISINE_KEYWORDS = {
    "italian", "french", "mexican", "american", "asian", "indian", "japanese",
    "korean", "thai", "chinese", "mediterranean", "greek", "moroccan", "middle eastern",
    "vietnamese", "cuban", "spanish", "english", "german", "swiss", "cajun", "creole",
}
DIET_KEYWORDS = {"vegan", "vegetarian", "pescatarian", "dairy free", "gluten-free", "wheat/gluten-free", "kosher", "halal", "paleo"}

# Joke/minimal recipes to exclude from search (e.g. "Salt Water for Boiling")
SKIP_TITLES_LOWER = {"salt water for boiling", "water", "air", "boiling water"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "r"


def infer_cuisine_tags(categories):
    if not categories:
        return []
    cats_lower = [c.lower() for c in categories]
    return [c for c in CUISINE_KEYWORDS if c in " ".join(cats_lower)][:3]


def infer_diet_tags(categories):
    if not categories:
        return []
    out = []
    for c in categories:
        cl = c.lower()
        for d in DIET_KEYWORDS:
            if d in cl or cl in d:
                out.append(d.replace(" ", "-") if " " in d else d)
    return list(dict.fromkeys(out))[:5]


def ingredient_line_to_obj(line):
    line = (line or "").strip()
    if not line:
        return None
    # Try "amount name" or just name
    parts = line.split(None, 1)
    if len(parts) >= 2 and re.match(r"^[\d/\.\s\-]+$", parts[0]):
        return {"name": parts[1], "amount": parts[0]}
    return {"name": line, "amount": ""}


def map_recipe(raw, idx):
    title = (raw.get("title") or "").strip() or "Untitled"
    categories = raw.get("categories") or []
    ingredients_raw = raw.get("ingredients") or []
    directions = raw.get("directions") or []
    rid = f"epi-{idx}-{slug(title)[:30]}"
    ingredients = []
    for ing in ingredients_raw:
        if isinstance(ing, str):
            obj = ingredient_line_to_obj(ing)
            if obj:
                ingredients.append(obj)
        elif isinstance(ing, dict):
            ingredients.append({"name": ing.get("name", ""), "amount": ing.get("amount", "")})

    if not ingredients and ingredients_raw:
        ingredients = [{"name": str(i), "amount": ""} for i in ingredients_raw[:50]]

    rating = raw.get("rating")
    if rating is None:
        rating = 4.0
    try:
        rating = float(rating)
    except (TypeError, ValueError):
        rating = 4.0
    calories = raw.get("calories")
    try:
        calories = int(calories) if calories is not None else None
    except (TypeError, ValueError):
        calories = None

    # Estimate time from number of steps
    time_minutes = min(120, 15 + len(directions) * 8) if directions else 30
    # Placeholder image (picsum seed by id)
    image = f"https://picsum.photos/seed/{rid}/600/400"

    return {
        "id": rid,
        "title": title,
        "image": image,
        "descriptionHook": (raw.get("desc") or title)[:60].strip() or f"{time_minutes}-min recipe",
        "cuisineTags": infer_cuisine_tags(categories),
        "dietTags": infer_diet_tags(categories),
        "timeMinutes": time_minutes,
        "difficulty": "easy" if len(ingredients) <= 8 else "medium" if len(ingredients) <= 15 else "hard",
        "budgetLevel": "medium",
        "calories": calories,
        "rating": round(rating, 1),
        "ingredients": ingredients[:40],
        "steps": directions[:20],
        "recommendedReason": "Based on your preferences and recipe rating.",
        "popularityScore": int(rating * 20) + len(directions),
        "createdAt": raw.get("date") or "2020-01-01T00:00:00Z",
    }


def main():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    default_input = project_root / "data" / "full_format_recipes.json"
    if not default_input.exists():
        default_input = script_dir / "full_format_recipes.json"
    default_output = project_root / "src" / "data" / "epicuriousRecipes.json"

    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_input
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else default_output
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 500

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        print("Usage: python scripts/load_epicurious.py [input.json] [output.json] [limit]", file=sys.stderr)
        print("Copy full_format_recipes.json to project/data/ or pass path.", file=sys.stderr)
        sys.exit(1)

    print(f"Reading {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        data = [data]
    recipes = []
    skipped_minimal = 0
    for i, raw in enumerate(data):
        if len(recipes) >= limit:
            break
        try:
            title = (raw.get("title") or "").strip()
            if title and title.lower() in SKIP_TITLES_LOWER:
                skipped_minimal += 1
                continue
            r = map_recipe(raw, len(recipes))
            if r["title"]:
                recipes.append(r)
        except Exception as e:
            print(f"Skip recipe {i}: {e}", file=sys.stderr)
    if skipped_minimal:
        print(f"Skipped {skipped_minimal} minimal/joke recipe(s) (e.g. 'Salt Water for Boiling').", file=sys.stderr)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(recipes)} recipes to {output_path}")


if __name__ == "__main__":
    main()
