#!/usr/bin/env python3
"""
Read data/raw/recipes.csv and write to data/processed/recipes.db (SQLite).
Use this DB for recommendation via SQL (see docs/data-sql-recommendation.md).

Usage:
  python scripts/csv_to_sqlite.py [output.db] [limit]
  Default: data/processed/recipes.db, limit 10000 (safe for local).
  Use limit 0 to import all rows (heavy; prefer on a cloud VM, see docs/data-cloud-options.md).
"""

import csv
import json
import re
import sqlite3
import sys
from pathlib import Path

# Reuse same logic as load_epicurious
CUISINE_KEYWORDS = {
    "italian", "french", "mexican", "american", "asian", "indian", "japanese",
    "korean", "thai", "chinese", "mediterranean", "greek", "moroccan", "middle eastern",
    "vietnamese", "spanish", "german", "cajun", "creole", "british", "irish",
}
DIET_KEYWORDS = {"vegan", "vegetarian", "pescatarian", "dairy free", "gluten-free", "kosher", "halal", "paleo", "low fat", "healthy"}
SKIP_TITLES_LOWER = {"salt water for boiling", "water", "air", "boiling water"}

# Allergen tag (DB) -> ingredient keywords that indicate this allergen (lowercase)
ALLERGEN_KEYWORDS = {
    "peanuts": ["peanut", "peanuts"],
    "tree_nuts": ["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "macadamia", "brazil nut", "pine nut", "chestnut"],
    "milk": ["milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "whey", "dairy"],
    "eggs": ["egg", "eggs"],
    "soy": ["soy", "soya", "tofu", "edamame", "miso", "tempeh"],
    "wheat": ["wheat", "flour", "bread", "pasta", "noodle", "couscous", "bulgur"],  # may over-tag
    "shellfish": ["shrimp", "prawn", "crab", "lobster", "scallop", "clam", "mussel", "oyster", "shellfish", "crayfish"],
    "fish": ["fish", "salmon", "tuna", "cod", "halibut", "sardine", "anchovy", "mackerel", "tilapia", "trout"],
    "sesame": ["sesame", "tahini"],
}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "r"


def parse_r_list(s):
    if not s or not s.strip():
        return []
    s = s.strip()
    if s.upper().startswith("C("):
        s = s[2:-1]
    out, current, in_quote = [], [], None
    for c in s:
        if c in '"\'' and (not in_quote or in_quote == c):
            if in_quote == c:
                out.append("".join(current).strip())
                current, in_quote = [], None
            else:
                in_quote = c
        elif in_quote is not None:
            current.append(c)
        elif c == "," and not in_quote and current:
            out.append("".join(current).strip().strip('"\''))
            current = []
    if current:
        out.append("".join(current).strip().strip('"\''))
    return [x for x in out if x]


def parse_iso_duration(s):
    if not s or s == "NA":
        return None
    total = 0
    h = re.search(r"(\d+)H", s, re.I)
    m = re.search(r"(\d+)M", s, re.I)
    if h:
        total += int(h.group(1)) * 60
    if m:
        total += int(m.group(1))
    return total if total else None


def first_image(images_str):
    if not images_str:
        return None
    for u in parse_r_list(images_str):
        u = u.strip().strip('"\'')
        if u.startswith("http"):
            return u
    return None


def infer_cuisine_tags(category, keywords_list):
    combined = (category or "").lower() + " " + " ".join(kw for kw in keywords_list if kw).lower()
    return [c for c in CUISINE_KEYWORDS if c in combined][:3]


def infer_diet_tags(keywords_list):
    out = []
    for kw in keywords_list or []:
        kl = kw.lower()
        for d in DIET_KEYWORDS:
            if d in kl or kl in d:
                tag = d.replace(" ", "-") if " " in d else d
                if tag not in out:
                    out.append(tag)
    return out[:5]


def infer_allergen_tags(ingredients):
    """From list of {name, amount}, return comma-separated allergen tags (e.g. peanuts,milk)."""
    if not ingredients:
        return ""
    text = " ".join((i.get("name") or i if isinstance(i, dict) else str(i) for i in ingredients)).lower()
    found = []
    for tag, keywords in ALLERGEN_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            found.append(tag)
    return ",".join(found)


def infer_spicy_level(keywords_list, description):
    """0=未知/不辣, 1=微辣/中辣, 2=辣。根据 Keywords 和 Description 里是否出现 spicy/hot/chili 等推断。"""
    text = " ".join(k for k in (keywords_list or []) if k).lower() + " " + (description or "").lower()
    if not text:
        return 0
    if any(w in text for w in ("spicy", "hot", "chili", "chilli", "jalapeño", "jalapeno", "cayenne", "habanero")):
        return 2 if any(w in text for w in ("very spicy", "extra hot", "fiery")) else 1
    return 0


def infer_budget_level(calories, num_ingredients):
    """low / medium / high。无热量时用食材数量粗分。"""
    if calories is not None:
        if calories <= 300:
            return "low"
        if calories > 500:
            return "high"
    if num_ingredients <= 6:
        return "low"
    if num_ingredients > 12:
        return "high"
    return "medium"


def map_row(row, idx):
    rid = row.get("RecipeId", "")
    title = (row.get("Name") or "").strip() or "Untitled"
    slug_id = f"csv-{rid}-{slug(title)[:30]}"

    total_min = parse_iso_duration(row.get("TotalTime"))
    if total_min is None:
        cook = parse_iso_duration(row.get("CookTime")) or 0
        prep = parse_iso_duration(row.get("PrepTime")) or 0
        total_min = cook + prep if (cook or prep) else 30
    total_min = min(300, max(5, total_min))

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
        cal = float(row.get("Calories") or 0)
        calories = int(cal) if cal > 0 else None
    except (TypeError, ValueError):
        calories = None
    difficulty = "easy" if len(ingredients) <= 8 else "medium" if len(ingredients) <= 15 else "hard"
    servings = int(row.get("RecipeServings") or 2) if str(row.get("RecipeServings")).isdigit() else 2
    popularity_score = int(rating * 20) + len(steps)
    allergen_tags = infer_allergen_tags(ingredients)
    spicy_level = infer_spicy_level(keywords_list, row.get("Description") or "")
    budget_level = infer_budget_level(calories, len(ingredients))

    return {
        "id": slug_id,
        "title": title,
        "image": image,
        "description_hook": desc,
        "cuisine_tags": ",".join(infer_cuisine_tags(category, keywords_list)),
        "diet_tags": ",".join(infer_diet_tags(keywords_list)),
        "allergen_tags": allergen_tags,
        "time_minutes": total_min,
        "spicy_level": spicy_level,
        "difficulty": difficulty,
        "budget_level": budget_level,
        "calories": calories,
        "rating": rating,
        "ingredients_json": json.dumps(ingredients, ensure_ascii=False),
        "steps_json": json.dumps(steps, ensure_ascii=False),
        "servings": servings,
        "popularity_score": popularity_score,
    }


def main():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    default_csv = project_root / "data" / "raw" / "recipes.csv"
    default_db = project_root / "data" / "processed" / "recipes.db"

    db_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_db
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10000

    if not default_csv.exists():
        print(f"CSV not found: {default_csv}", file=sys.stderr)
        sys.exit(1)

    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    # 主表：id 为自增整数 1, 2, 3...
    conn.execute("""
        CREATE TABLE recipes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            image TEXT,
            description_hook TEXT,
            cuisine_tags TEXT,
            diet_tags TEXT,
            allergen_tags TEXT,
            time_minutes INT,
            spicy_level INT,
            difficulty TEXT,
            budget_level TEXT,
            calories INT,
            rating REAL,
            ingredients_json TEXT,
            steps_json TEXT,
            servings INT,
            popularity_score INT
        )
    """)
    conn.execute("CREATE INDEX idx_cuisine ON recipes(cuisine_tags)")
    conn.execute("CREATE INDEX idx_allergen ON recipes(allergen_tags)")
    conn.execute("CREATE INDEX idx_time ON recipes(time_minutes)")
    conn.execute("CREATE INDEX idx_spicy ON recipes(spicy_level)")
    conn.execute("CREATE INDEX idx_rating ON recipes(rating)")

    # 过敏原：每种过敏原单独一张表，每行存一个含该过敏原的 recipe id（1,2,3...）
    for tag in ALLERGEN_KEYWORDS.keys():
        t = tag  # table name = allergen_peanuts, allergen_milk, ...
        conn.execute(f"""
            CREATE TABLE allergen_{t} (
                recipe_id INTEGER PRIMARY KEY,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )
        """)

    # 辣度分层：每档辣度一张表，存该辣度的 recipe id（0=不辣, 1=微/中辣, 2=辣）
    for level in (0, 1, 2):
        conn.execute(f"""
            CREATE TABLE spicy_{level} (
                recipe_id INTEGER PRIMARY KEY,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )
        """)

    # 预算分层：low / medium / high 各一张表，存该档的 recipe id
    for level in ("low", "medium", "high"):
        conn.execute(f"""
            CREATE TABLE budget_{level} (
                recipe_id INTEGER PRIMARY KEY,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )
        """)

    # 菜系：每种菜系一张表，存属于该菜系的 recipe id（表名如 cuisine_japanese, cuisine_middle_eastern）
    def _cuisine_table_name(tag):
        return tag.replace(" ", "_")

    for tag in sorted(CUISINE_KEYWORDS):
        t = _cuisine_table_name(tag)
        conn.execute(f"""
            CREATE TABLE cuisine_{t} (
                recipe_id INTEGER PRIMARY KEY,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )
        """)

    # 食材：每行一个食材，recipe_ids 存该食材对应的 recipe id 列表（JSON 数组如 "[1,2,3]"）
    conn.execute("""
        CREATE TABLE ingredients (
            ingredient_name TEXT PRIMARY KEY,
            recipe_ids TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX idx_ingredient_name ON ingredients(ingredient_name)")

    # 食材归一化表：每行 (ingredient_name, recipe_id)，按食材筛 id 时一条 SQL 得到 id 集合
    conn.execute("""
        CREATE TABLE ingredient_recipes (
            ingredient_name TEXT NOT NULL,
            recipe_id INTEGER NOT NULL,
            PRIMARY KEY (ingredient_name, recipe_id),
            FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        )
    """)
    conn.execute("CREATE INDEX idx_ingredient_recipes_name ON ingredient_recipes(ingredient_name)")
    conn.commit()

    sql = """INSERT INTO recipes (
            id, title, image, description_hook, cuisine_tags, diet_tags, allergen_tags,
            time_minutes, spicy_level, difficulty, budget_level, calories, rating,
            ingredients_json, steps_json, servings, popularity_score
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"""

    print(f"Reading {default_csv}...")
    n, skipped = 0, 0
    ingredient_to_ids = {}  # ingredient_name -> [1, 2, 5, ...]
    with open(default_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit and n >= limit:
                break
            try:
                title = (row.get("Name") or "").strip()
                if not title or title.lower() in SKIP_TITLES_LOWER:
                    skipped += 1
                    continue
                r = map_row(row, n)
                rid = n + 1  # 唯一整数 id：1, 2, 3...
                conn.execute(sql, (
                    rid, r["title"], r["image"], r["description_hook"],
                    r["cuisine_tags"], r["diet_tags"], r["allergen_tags"], r["time_minutes"],
                    r["spicy_level"], r["difficulty"], r["budget_level"], r["calories"], r["rating"],
                    r["ingredients_json"], r["steps_json"], r["servings"], r["popularity_score"],
                ))
                # 过敏原：按 tag 插入到对应表（每张表存 recipe_id）
                for tag in (r["allergen_tags"] or "").split(","):
                    tag = tag.strip()
                    if tag and tag in ALLERGEN_KEYWORDS:
                        conn.execute(
                            f"INSERT OR IGNORE INTO allergen_{tag} (recipe_id) VALUES (?)",
                            (rid,),
                        )
                # 辣度分层：插入到对应 spicy_0 / spicy_1 / spicy_2
                sl = max(0, min(2, int(r["spicy_level"])))
                conn.execute(
                    f"INSERT OR IGNORE INTO spicy_{sl} (recipe_id) VALUES (?)",
                    (rid,),
                )
                # 预算分层：插入到对应 budget_low / budget_medium / budget_high
                bl = r["budget_level"] if r["budget_level"] in ("low", "medium", "high") else "medium"
                conn.execute(
                    f"INSERT OR IGNORE INTO budget_{bl} (recipe_id) VALUES (?)",
                    (rid,),
                )
                # 菜系：按 tag 插入到对应表（cuisine_japanese, cuisine_thai, cuisine_middle_eastern 等）
                for tag in (r["cuisine_tags"] or "").split(","):
                    tag = tag.strip()
                    if tag and tag in CUISINE_KEYWORDS:
                        t = tag.replace(" ", "_")
                        conn.execute(
                            f"INSERT OR IGNORE INTO cuisine_{t} (recipe_id) VALUES (?)",
                            (rid,),
                        )
                # 食材：写入 ingredient_recipes（归一化表，便于筛 id）；同时收集到 ingredient_to_ids 写 ingredients 表
                seen_ing = set()
                for ing in json.loads(r["ingredients_json"]):
                    name = (ing.get("name") or "").strip().lower()
                    if name and name not in seen_ing:
                        seen_ing.add(name)
                        ingredient_to_ids.setdefault(name, []).append(rid)
                        conn.execute(
                            "INSERT OR IGNORE INTO ingredient_recipes (ingredient_name, recipe_id) VALUES (?,?)",
                            (name, rid),
                        )
                n += 1
            except Exception as e:
                print(f"Skip row {i}: {e}", file=sys.stderr)

    # 写入 ingredients：每行一个食材，recipe_ids 为 JSON 列表
    for name, ids in ingredient_to_ids.items():
        conn.execute(
            "INSERT INTO ingredients (ingredient_name, recipe_ids) VALUES (?,?)",
            (name, json.dumps(sorted(ids))),
        )
    conn.commit()
    conn.close()
    print(f"Wrote {n} recipes to {db_path}")


if __name__ == "__main__":
    main()
