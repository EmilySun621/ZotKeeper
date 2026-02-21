#!/usr/bin/env python3
"""
Read data/raw/recipes.csv and convert to ZotKeeper frontend schema.
Output: src/data/epicuriousRecipes.json

Usage:
  python scripts/load_epicurious.py [output.json] [limit]
  Default: writes to src/data/epicuriousRecipes.json, limit 500 (set to 0 for no limit).
"""

import csv
import re
import sys
from pathlib import Path

# Cuisine-like and diet-like keywords from RecipeCategory / Keywords
CUISINE_KEYWORDS = {
    "italian", "french", "mexican", "american", "asian", "indian", "japanese",
    "korean", "thai", "chinese", "mediterranean", "greek", "moroccan", "middle eastern",
    "vietnamese", "spanish", "german", "cajun", "creole", "british", "irish",
}
DIET_KEYWORDS = {"vegan", "vegetarian", "pescatarian", "dairy free", "gluten-free", "kosher", "halal", "paleo", "low fat", "healthy"}

SKIP_TITLES_LOWER = {"salt water for boiling", "water", "air", "boiling water"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "r"


def parse_r_list(s):
    """Parse R-style c("a", "b", "c") or c('a','b') to list of strings."""
    if not s or not s.strip():
        return []
    s = s.strip()
    if s.upper().startswith("C("):
        s = s[2:-1]  # drop c( and )
    out = []
    current = []
    in_quote = None
    for i, c in enumerate(s):
        if c in '"\'' and (not in_quote or in_quote == c):
            if in_quote == c:
                out.append("".join(current).strip())
                current = []
                in_quote = None
            else:
                in_quote = c
        elif in_quote is not None:
            current.append(c)
        elif c == "," and not in_quote:
            if current:
                out.append("".join(current).strip().strip('"\''))
                current = []
    if current:
        out.append("".join(current).strip().strip('"\''))
    return [x for x in out if x]


def parse_iso_duration(s):
    """Parse ISO 8601 duration PT24H, PT45M, PT24H45M to total minutes."""
    if not s or s == "NA":
        return None
    total_min = 0
    h = re.search(r"(\d+)H", s, re.I)
    m = re.search(r"(\d+)M", s, re.I)
    if h:
        total_min += int(h.group(1)) * 60
    if m:
        total_min += int(m.group(1))
    return total_min if total_min else None


def first_image(images_str):
    """Get first URL from Images column (R list of URLs)."""
    if not images_str:
        return None
    urls = parse_r_list(images_str)
    for u in urls:
        u = u.strip().strip('"\'')
        if u.startswith("http"):
            return u
    return None


def infer_cuisine_tags(category, keywords_list):
    combined = (category or "").lower() + " " + " ".join(kw for kw in keywords_list if kw).lower()
    return [c for c in CUISINE_KEYWORDS if c in combined][:3]


def infer_diet_tags(keywords_list):
    out = []
    for kw in (keywords_list or []):
        kl = kw.lower()
        for d in DIET_KEYWORDS:
            if d in kl or kl in d:
                tag = d.replace(" ", "-") if " " in d else d
                if tag not in out:
                    out.append(tag)
    return out[:5]


def map_row(row, idx):
    rid = row.get("RecipeId", "")
    title = (row.get("Name") or "").strip() or "Untitled"
    slug_id = f"csv-{rid}-{slug(title)[:30]}"

    # Time: prefer TotalTime, else CookTime+PrepTime
    total_min = parse_iso_duration(row.get("TotalTime"))
    if total_min is None:
        cook = parse_iso_duration(row.get("CookTime")) or 0
        prep = parse_iso_duration(row.get("PrepTime")) or 0
        total_min = cook + prep if (cook or prep) else 30
    total_min = min(300, max(5, total_min))  # clamp 5–300 min

    image = first_image(row.get("Images")) or ""

    desc = (row.get("Description") or "").strip() or f"{total_min}-min recipe"
    category = (row.get("RecipeCategory") or "").strip()
    keywords_list = parse_r_list(row.get("Keywords") or "")
    quantities = parse_r_list(row.get("RecipeIngredientQuantities") or "")
    parts = parse_r_list(row.get("RecipeIngredientParts") or "")
    ingredients = []
    for i, name in enumerate(parts[:40]):
        amt = quantities[i] if i < len(quantities) else ""
        ingredients.append({"name": name.strip(), "amount": amt.strip()})

    steps = parse_r_list(row.get("RecipeInstructions") or "")[:20]

    try:
        rating = float(row.get("AggregatedRating") or 4.0)
    except (TypeError, ValueError):
        rating = 4.0
    rating = round(max(0, min(5, rating)), 1)

    try:
        calories = float(row.get("Calories") or 0)
        calories = int(calories) if calories > 0 else None
    except (TypeError, ValueError):
        calories = None

    difficulty = "easy" if len(ingredients) <= 8 else "medium" if len(ingredients) <= 15 else "hard"

    return {
        "id": slug_id,
        "title": title,
        "image": image,
        "descriptionHook": desc,
        "cuisineTags": infer_cuisine_tags(category, keywords_list),
        "dietTags": infer_diet_tags(keywords_list),
        "timeMinutes": total_min,
        "difficulty": difficulty,
        "budgetLevel": "medium",
        "calories": calories,
        "rating": rating,
        "ingredients": ingredients,
        "steps": steps,
        "servings": int(row.get("RecipeServings") or 2) if str(row.get("RecipeServings")).isdigit() else 2,
        "recommendedReason": "From recipe dataset.",
        "popularityScore": int(rating * 20) + len(steps),
    }


def main():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    default_csv = project_root / "data" / "raw" / "recipes.csv"
    default_output = project_root / "src" / "data" / "epicuriousRecipes.json"

    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_output
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 500

    if not default_csv.exists():
        print(f"CSV not found: {default_csv}", file=sys.stderr)
        print("Usage: python scripts/load_epicurious.py [output.json] [limit]", file=sys.stderr)
        sys.exit(1)

    print(f"Reading {default_csv}...")
    recipes = []
    skipped = 0
    with open(default_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit and len(recipes) >= limit:
                break
            try:
                title = (row.get("Name") or "").strip()
                if not title or title.lower() in SKIP_TITLES_LOWER:
                    skipped += 1
                    continue
                r = map_row(row, len(recipes))
                if r["title"]:
                    recipes.append(r)
            except Exception as e:
                print(f"Skip row {i}: {e}", file=sys.stderr)
    if skipped:
        print(f"Skipped {skipped} row(s).", file=sys.stderr)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    import json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(recipes)} recipes to {output_path}")


if __name__ == "__main__":
    main()
