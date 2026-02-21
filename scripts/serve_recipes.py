"""
Optional: run a small API that reads from recipes.db and ranks in Python.
  pip install fastapi uvicorn
  python -m scripts.serve_recipes
  # or: uvicorn scripts.serve_recipes:app --reload --port 8000
Then GET /api/search?q=chicken&time=quick etc. Returns JSON list of ranked recipes.
"""

from pathlib import Path

try:
    from fastapi import FastAPI, Query, Body
    from fastapi.responses import Response
except ImportError:
    FastAPI = None
    Query = None
    Body = None
    Response = None

_scripts_dir = Path(__file__).resolve().parent
_db_path = _scripts_dir.parent / "data" / "processed" / "recipes.db"


def _search(q="", filters=None, preferences=None, limit=200, **kwargs):
    import sys
    if str(_scripts_dir) not in sys.path:
        sys.path.insert(0, str(_scripts_dir))
    from load_recipes_from_db import search as db_search
    f = dict(filters or {})
    if kwargs.get("time") is not None: f["time"] = kwargs["time"]
    if kwargs.get("budget") is not None: f["budget"] = kwargs["budget"]
    if kwargs.get("cuisines") is not None:
        c = kwargs["cuisines"]
        f["cuisines"] = c if isinstance(c, list) else [x.strip() for x in (c or "").split(",") if x.strip()]
    if kwargs.get("exclude_allergens") is not None:
        a = kwargs["exclude_allergens"]
        f["exclude_allergens"] = a if isinstance(a, list) else [x.strip() for x in (a or "").split(",") if x.strip()]
    if kwargs.get("include_ingredient") is not None:
        f["include_ingredient"] = kwargs["include_ingredient"]
    recipes, suggested_keyword = db_search(db_path=_db_path, keyword=q or "", filters=f, preferences=preferences or {}, limit=limit)
    return recipes, suggested_keyword


if FastAPI is not None:
    app = FastAPI(title="ZotKeeper Recipe Search")

    @app.middleware("http")
    async def cors_middleware(request, call_next):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                },
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    @app.get("/api/cuisines")
    def api_cuisines():
        """Return list of cuisine tags that have at least one recipe (from cuisine_* index tables)."""
        import sqlite3
        if not _db_path.exists():
            return {"cuisines": []}
        conn = sqlite3.connect(_db_path)
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cuisine_%' ORDER BY name"
        )
        # name is e.g. cuisine_japanese -> japanese; cuisine_middle_eastern -> middle eastern
        tags = [row[0].replace("cuisine_", "", 1).replace("_", " ") for row in cur.fetchall()]
        conn.close()
        return {"cuisines": tags}

    @app.get("/api/search")
    def api_search_get(
        q: str = Query("", description="Search keyword"),
        time: str = Query(None),
        budget: str = Query(None),
        cuisines: str = Query(None),
        exclude_allergens: str = Query(None),
        include_ingredient: str = Query(None),
        limit: int = Query(200, le=500),
    ):
        recipes, suggested_keyword = _search(
            q, filters={}, preferences={}, limit=limit,
            time=time, budget=budget, cuisines=cuisines,
            exclude_allergens=exclude_allergens, include_ingredient=include_ingredient,
        )
        out = {"recipes": recipes, "count": len(recipes)}
        if suggested_keyword:
            out["suggestedKeyword"] = suggested_keyword
        return out

    @app.post("/api/search")
    def api_search_post(
        body: dict = Body(default=None),
    ):
        body = body or {}
        q = body.get("keyword", "").strip()
        filters = body.get("filters") or {}
        preferences = body.get("preferences") or {}
        limit = min(500, int(body.get("limit", 200)))
        # map frontend filter keys to backend
        f = {}
        if filters.get("time"): f["time"] = filters["time"]
        if filters.get("budget"): f["budget"] = filters["budget"]
        if filters.get("cuisines"): f["cuisines"] = filters["cuisines"]
        if filters.get("diets"): f["diets"] = filters["diets"]
        if filters.get("difficulty"): f["difficulty"] = filters["difficulty"]
        try:
            if filters.get("calories_min") not in (None, ""): f["calories_min"] = int(filters["calories_min"])
        except (TypeError, ValueError): pass
        try:
            if filters.get("calories_max") not in (None, ""): f["calories_max"] = int(filters["calories_max"])
        except (TypeError, ValueError): pass
        if filters.get("include_ingredient"): f["include_ingredient"] = filters["include_ingredient"]
        if filters.get("exclude_ingredients"): f["exclude_ingredients"] = filters["exclude_ingredients"]
        if filters.get("exclude_allergens"): f["exclude_allergens"] = filters["exclude_allergens"]
        prefs = {}
        if preferences.get("cuisine_weights"): prefs["cuisine_weights"] = preferences["cuisine_weights"]
        if preferences.get("diet_toggles"): prefs["diet_toggles"] = preferences["diet_toggles"]
        if preferences.get("budget_default"): prefs["budget_default"] = preferences["budget_default"]
        if preferences.get("time_default"): prefs["time_default"] = preferences["time_default"]
        if preferences.get("disliked_ingredients"): prefs["disliked_ingredients"] = preferences["disliked_ingredients"]
        recipes, suggested_keyword = _search(q, filters=f, preferences=prefs, limit=limit)
        out = {"recipes": recipes, "count": len(recipes)}
        if suggested_keyword:
            out["suggestedKeyword"] = suggested_keyword
        return out

    @app.get("/api/recipes/{recipe_id}")
    def get_recipe(recipe_id):
        import sqlite3
        import json
        if not _db_path.exists():
            return {"error": "DB not found"}
        rid = int(recipe_id) if recipe_id is not None else None
        conn = sqlite3.connect(_db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM recipes WHERE id = ?", (rid,)).fetchone()
        conn.close()
        if not row:
            return {"error": "Not found"}
        r = dict(row)
        if isinstance(r.get("ingredients_json"), str):
            r["ingredients"] = json.loads(r["ingredients_json"])
        if isinstance(r.get("steps_json"), str):
            r["steps"] = json.loads(r["steps_json"])
        return r
else:
    app = None

if app is None:
    raise RuntimeError("FastAPI could not be imported. Run: pip install fastapi uvicorn (and use that same Python to run uvicorn).")


if __name__ == "__main__":
    if app is None:
        print("Install: pip install fastapi uvicorn")
        print("Then: uvicorn scripts.serve_recipes:app --reload --port 8000")
        raise SystemExit(1)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
