"""
Load recipes from SQLite DB (data/processed/recipes.db) for search/ranking.

Uses index tables (allergen_*, cuisine_*, ingredient_recipes, budget_*, etc.) to get candidate
recipe IDs, then loads full rows and returns normalized dicts for recipe_ranking.filter_and_rank.
"""

import json
import sqlite3
from pathlib import Path

# Allergen table names in DB (must match csv_to_sqlite.py)
ALLERGEN_TAGS = (
    "peanuts", "tree_nuts", "milk", "eggs", "soy", "wheat",
    "shellfish", "fish", "sesame",
)
TIME_MAX_MINUTES = {"quick": 30, "medium": 60, "long": 999}


def _db_path(db_path=None):
    if db_path:
        return Path(db_path)
    root = Path(__file__).resolve().parent.parent
    return root / "data" / "processed" / "recipes.db"


def _ids_for_term(conn, term):
    """Return set of recipe_ids that have an ingredient containing `term` (substring match)."""
    cur = conn.execute(
        "SELECT recipe_id FROM ingredient_recipes WHERE ingredient_name LIKE ?",
        (f"%{term}%",),
    )
    return set(row[0] for row in cur.fetchall())


def _relaxed_term_match(conn, term, min_len=4):
    """
    Try exact term; if no matches and term is long enough, try progressively shorter prefixes
    (e.g. lemonade -> lemonad, lemona, lemon) so "lemonade" can match recipes with "lemon".
    Returns (ids set, term_actually_used).
    """
    ids = _ids_for_term(conn, term)
    if ids or len(term) <= min_len:
        return (ids, term)
    for prefix_len in range(len(term) - 1, min_len - 1, -1):
        prefix = term[:prefix_len]
        ids = _ids_for_term(conn, prefix)
        if ids:
            return (ids, prefix)
    return (set(), term)


def get_candidate_ids(conn, filters):
    """
    Use index tables to get recipe IDs that pass filters.
    Returns (set of int ids, suggested_keyword or None).
    When exact keyword matches nothing, we try relaxed matching (e.g. lemonade -> lemon);
    suggested_keyword is then the query we actually matched, for UI to show "Showing results for lemon".
    """
    exclude_allergens = filters.get("exclude_allergens") or []
    cuisines = filters.get("cuisines") or []
    include_ingredient = (filters.get("include_ingredient") or "").strip()
    keyword = (filters.get("keyword") or "").strip()
    terms = [t.lower() for t in keyword.split() if t.strip() and len(t.strip()) >= 2]

    suggested_parts = None  # if we use relaxed match, list of terms we actually used

    if terms:
        candidate = None
        used_terms = []
        for term in terms:
            ids, term_used = _relaxed_term_match(conn, term)
            used_terms.append(term_used)
            candidate = ids if candidate is None else (candidate & ids)
        if candidate is None:
            candidate = set()
        if used_terms != terms:
            suggested_parts = used_terms
    else:
        cur = conn.execute("SELECT id FROM recipes")
        candidate = set(row[0] for row in cur.fetchall())

    # Exclude allergens: ids that appear in any of the allergen tables
    for tag in exclude_allergens:
        tag_clean = tag.strip().lower().replace(" ", "_")
        if tag_clean not in ALLERGEN_TAGS:
            continue
        try:
            cur = conn.execute(f"SELECT recipe_id FROM allergen_{tag_clean}")
            exclude_ids = set(row[0] for row in cur.fetchall())
            candidate -= exclude_ids
        except sqlite3.OperationalError:
            pass

    # Require cuisine: ids in any selected cuisine_<tag> table (e.g. cuisine_japanese)
    if cuisines:
        cuisine_ids = set()
        for c in cuisines:
            t = c.strip().lower().replace(" ", "_")
            if not t:
                continue
            try:
                cur = conn.execute(f"SELECT recipe_id FROM cuisine_{t}")
                cuisine_ids.update(row[0] for row in cur.fetchall())
            except sqlite3.OperationalError:
                pass
        if cuisine_ids:
            candidate &= cuisine_ids

    # Require ingredient (from ingredient_recipes)
    if include_ingredient:
        cur = conn.execute(
            "SELECT recipe_id FROM ingredient_recipes WHERE ingredient_name LIKE ?",
            (f"%{include_ingredient.lower()}%",),
        )
        ing_ids = set(row[0] for row in cur.fetchall())
        if ing_ids:
            candidate &= ing_ids

    # Time and budget: filter in SQL when loading (or we could use budget_low/medium/high tables)
    suggested = " ".join(suggested_parts) if suggested_parts else None
    return (candidate, suggested)


def load_recipes(db_path=None, recipe_ids=None, limit=2000):
    """
    Load recipe rows from DB and return list of dicts (normalized for ranking).

    db_path: path to recipes.db (default: data/processed/recipes.db)
    recipe_ids: optional set/list of ids to load; if None, load all up to limit.
    limit: max recipes to return when recipe_ids is None.
    """
    path = _db_path(db_path)
    if not path.exists():
        return []

    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row

    if recipe_ids is not None:
        ids = list(recipe_ids)[:limit] if limit else list(recipe_ids)
        if not ids:
            conn.close()
            return []
        placeholders = ",".join("?" * len(ids))
        cur = conn.execute(
            f"SELECT * FROM recipes WHERE id IN ({placeholders})",
            ids,
        )
    else:
        cur = conn.execute("SELECT * FROM recipes ORDER BY id LIMIT ?", (limit,))

    rows = cur.fetchall()
    conn.close()

    recipes = []
    for row in rows:
        r = dict(row)
        # Ensure JSON columns parsed
        if "ingredients_json" in r and isinstance(r["ingredients_json"], str):
            try:
                r["ingredients"] = json.loads(r["ingredients_json"])
            except Exception:
                r["ingredients"] = []
        if "steps_json" in r and isinstance(r["steps_json"], str):
            try:
                r["steps"] = json.loads(r["steps_json"])
            except Exception:
                r["steps"] = []
        if "cuisine_tags" in r and isinstance(r["cuisine_tags"], str):
            r["cuisine_tags"] = [x.strip() for x in r["cuisine_tags"].split(",") if x.strip()]
        if "diet_tags" in r and isinstance(r["diet_tags"], str):
            r["diet_tags"] = [x.strip() for x in r["diet_tags"].split(",") if x.strip()]
        recipes.append(r)
    return recipes


def search(db_path=None, keyword="", filters=None, preferences=None, limit=200):
    """
    One-shot: load candidates from DB (using index tables), then filter_and_rank in Python.
    Returns (sorted list of recipe dicts (best first), suggested_keyword or None).
    suggested_keyword is set when we used relaxed matching (e.g. "lemonade" -> "lemon").
    """
    import sys
    _here = Path(__file__).resolve().parent
    if str(_here) not in sys.path:
        sys.path.insert(0, str(_here))
    from recipe_ranking import filter_and_rank, normalize_recipe

    path = _db_path(db_path)
    if not path.exists():
        return [], None

    filters = dict(filters or {})
    filters["keyword"] = keyword
    preferences = preferences or {}

    conn = sqlite3.connect(path)
    candidate_ids, suggested_keyword = get_candidate_ids(conn, filters)
    conn.close()

    recipes = load_recipes(db_path=path, recipe_ids=candidate_ids, limit=5000)
    if not recipes:
        return [], suggested_keyword

    ranked = filter_and_rank(recipes, keyword, filters, preferences)
    return [normalize_recipe(r) for r in ranked[:limit]], suggested_keyword
