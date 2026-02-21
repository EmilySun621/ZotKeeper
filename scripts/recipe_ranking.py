"""
Recipe search ranking in Python: TF-IDF (ingredient rarity) + field weighting + combined score.
Score = Relevance + User_Preference + Recipe_Quality. See docs/recipe-ranking-algorithm.md.

Use with recipes loaded from DB (see load_recipes_from_db.py). Recipe dicts use snake_case.
"""

import json
import math
import re

FIELD_WEIGHTS = {"title": 20, "ingredient": 12, "description": 5, "steps": 2}

TIME_MAX_MINUTES = {"quick": 30, "medium": 60, "long": 999}


def _get_max_minutes(time_filter):
    if not time_filter:
        return 999
    return TIME_MAX_MINUTES.get(time_filter, 999)


def _get_cuisine_weight(cuisine_weights, tag):
    if not tag or not isinstance(tag, str):
        return 0
    t = tag.strip()
    if t in cuisine_weights and cuisine_weights[t] is not None:
        return cuisine_weights[t]
    lower = t.lower()
    for k, v in (cuisine_weights or {}).items():
        if k and k.lower() == lower:
            return v
    return 0


def normalize_recipe(r):
    """Convert DB row or mixed shape to canonical dict (snake_case, lists for tags/ingredients/steps).
       custine_tags: ["Chinese", "Spanish"]
       ingredients: [{"name": "Chicken", "amount": "1 cup"}, {"name": "Salt", "amount": "1 tsp"}]
    """
    if not isinstance(r, dict):
        return r
    out = dict(r)
    if "cuisine_tags" in out and isinstance(out["cuisine_tags"], str):
        out["cuisine_tags"] = [x.strip() for x in out["cuisine_tags"].split(",") if x.strip()]
    if "diet_tags" in out and isinstance(out["diet_tags"], str):
        out["diet_tags"] = [x.strip() for x in out["diet_tags"].split(",") if x.strip()]
    if "ingredients_json" in out and "ingredients" not in out:
        try:
            raw = out.pop("ingredients_json", None) or "[]"
            arr = json.loads(raw) if isinstance(raw, str) else raw
            out["ingredients"] = [x if isinstance(x, dict) else {"name": str(x)} for x in arr]
        except Exception:
            out["ingredients"] = []
    if "steps_json" in out and "steps" not in out:
        try:
            raw = out.pop("steps_json", None) or "[]"
            out["steps"] = json.loads(raw) if isinstance(raw, str) else raw
            if not isinstance(out["steps"], list):
                out["steps"] = []
        except Exception:
            out["steps"] = []
    if "ingredients" not in out:
        out["ingredients"] = []
    if "steps" not in out:
        out["steps"] = []
    return out


def build_ingredient_idf(recipes):
    """IDF from current corpus. DF(term) = number of recipes containing that term in ingredients.
    IDF = log((N+1)/(df+1))+1. N is the total number of recipes in the corpus. df is the number of recipes containing the term in ingredients.
    Higher IDF means the term is rarer in the corpus."""
    n = len(recipes)
    df = {}
    for r in recipes:
        terms_in_recipe = set()
        ings = r.get("ingredients") or []
        for i in ings:
            name = (i.get("name") if isinstance(i, dict) else i) or ""
            n_lower = str(name).strip().lower()
            if not n_lower:
                continue
            terms_in_recipe.add(n_lower)
            for t in re.split(r"\s+", n_lower):
                if len(t) >= 2:
                    terms_in_recipe.add(t)
        for t in terms_in_recipe:
            df[t] = df.get(t, 0) + 1
    idf = {}
    for term, count in df.items():
        idf[term] = math.log((n + 1) / (count + 1)) + 1
    return idf


def preference_score(recipe, preferences):
    """User_Preference: cuisine weights, diet toggles, budget/time defaults.
    Based on user preferences, we give a score to the recipe based on how well it matches the user's preferences."""
    score = 0
    cuisine_weights = preferences.get("cuisine_weights") or preferences.get("cuisineWeights") or {}
    diet_toggles = preferences.get("diet_toggles") or preferences.get("dietToggles") or {}
    budget_default = preferences.get("budget_default") or preferences.get("budgetDefault")
    time_default = preferences.get("time_default") or preferences.get("timeDefault")

    for tag in recipe.get("cuisine_tags") or []:
        w = _get_cuisine_weight(cuisine_weights, tag)
        if w and w > 0:
            score += w * 100
    for d in recipe.get("diet_tags") or []:
        if diet_toggles.get(d):
            score += 200
    if budget_default and recipe.get("budget_level") == budget_default:
        score += 50
    if time_default:
        max_min = _get_max_minutes(time_default)
        if (recipe.get("time_minutes") or 999) <= max_min:
            score += 30
    return score


def quality_score(recipe):
    """Recipe_Quality: rating + popularity/review signal. We give a score to the recipe based on its rating and the number of reviews it has."""
    rating = (recipe.get("rating") or 0) * 2
    rev = recipe.get("review_count") or recipe.get("reviewCount")
    if rev is not None:
        review_signal = math.log1p(rev)
    else:
        review_signal = (recipe.get("popularity_score") or recipe.get("popularityScore") or 0) * 0.1
    return rating + review_signal


def relevance_score(recipe, keyword, ingredient_idf):
    """Relevance: field-weighted match + ingredient × IDF. Title > Ingredient > Description > Steps.
    It split long words into smaller words to match with title, ingredients, description, and steps. For
    matches in different fields, we give a score based on the field weight.IDF is applied to ingredients to give 
    a score based on how rare the ingredient is in the corpus."""
    if not keyword or not keyword.strip():
        return 0
    terms = [t for t in keyword.strip().lower().split() if t]
    if not terms:
        return 0
    score = 0
    title = (recipe.get("title") or "").lower()
    desc = (recipe.get("description_hook") or recipe.get("descriptionHook") or "").lower()
    steps_list = recipe.get("steps") or []
    steps_text = " ".join(s if isinstance(s, str) else "" for s in steps_list).lower()
    ing_names = []
    for i in recipe.get("ingredients") or []:
        name = i.get("name") if isinstance(i, dict) else i
        if name:
            ing_names.append(str(name).lower())

    for term in terms:
        if len(term) < 2:
            continue
        if term in title:
            score += FIELD_WEIGHTS["title"]
        idf = ingredient_idf.get(term, 1.0)
        if any(term in n for n in ing_names):
            score += FIELD_WEIGHTS["ingredient"] * idf
        if term in desc:
            score += FIELD_WEIGHTS["description"]
        if term in steps_text:
            score += FIELD_WEIGHTS["steps"]
    return score


def filter_and_rank(recipes, keyword, filters, preferences):
    """
    Apply keyword + filters, then rank by Relevance + User_Preference + Recipe_Quality.

    recipes: list of dicts (can be DB rows; will be normalized). 
    keyword: only used to calculate relevance scor. 
    filters: dict with time, budget, cuisines[], diets[], difficulty, calories_min, calories_max,
             include_ingredient, exclude_ingredients[].
    preferences: dict with cuisine_weights, diet_toggles, budget_default, time_default, disliked_ingredients.

    Returns list of recipe dicts (normalized), sorted by score (best first).
    """
    recipes = [normalize_recipe(r) for r in recipes]
    exclude_ingredients = list(filters.get("exclude_ingredients") or [])
    exclude_ingredients.extend(preferences.get("disliked_ingredients") or preferences.get("dislikedIngredients") or [])

    time_val = filters.get("time")
    if time_val:
        max_min = _get_max_minutes(time_val)
        recipes = [r for r in recipes if (r.get("time_minutes") or 0) <= max_min]

    if filters.get("budget"):
        recipes = [r for r in recipes if r.get("budget_level") == filters["budget"]]

    cuisines = filters.get("cuisines") or []
    if cuisines:
        recipes = [r for r in recipes if not (r.get("cuisine_tags") or []) or any(c in cuisines for c in r.get("cuisine_tags") or [])]

    diets = filters.get("diets") or []
    if diets:
        # Only show recipes that have at least one of the selected diet tags (exclude untagged when filtering)
        diets_set = {d.strip().lower() for d in diets if d}
        recipes = [
            r for r in recipes
            if (r.get("diet_tags") or []) and any((d or "").strip().lower() in diets_set for d in (r.get("diet_tags") or []))
        ]

    if filters.get("difficulty"):
        recipes = [r for r in recipes if r.get("difficulty") == filters["difficulty"]]

    cal_min = filters.get("calories_min")
    if cal_min is not None:
        recipes = [r for r in recipes if (r.get("calories") or 0) >= cal_min]
    cal_max = filters.get("calories_max")
    if cal_max is not None:
        recipes = [r for r in recipes if (r.get("calories") or 9999) <= cal_max]

    include_ing = (filters.get("include_ingredient") or "").strip()
    if include_ing:
        ing_lower = include_ing.lower()
        def has_ing(r):
            for i in r.get("ingredients") or []:
                n = (i.get("name") if isinstance(i, dict) else i) or ""
                if ing_lower in str(n).lower():
                    return True
            return False
        recipes = [r for r in recipes if has_ing(r)]

    if exclude_ingredients:
        def excluded(r):
            names = []
            for i in r.get("ingredients") or []:
                n = (i.get("name") if isinstance(i, dict) else i) or ""
                names.append(str(n).lower())
            for e in exclude_ingredients:
                if any(e.lower() in n for n in names):
                    return True
            return False
        recipes = [r for r in recipes if not excluded(r)]

    # Score: Relevance + User_Preference + Recipe_Quality
    ingredient_idf = build_ingredient_idf(recipes)
    cuisine_weights = preferences.get("cuisine_weights") or preferences.get("cuisineWeights") or {}
    has_preferred = any((cuisine_weights.get(k) or 0) > 0 for k in (cuisine_weights or {}))

    scored = []
    for r in recipes:
        rel = relevance_score(r, keyword, ingredient_idf)
        pref = preference_score(r, preferences)
        qual = quality_score(r)
        scored.append({"recipe": r, "user_pref": pref, "relevance_plus_quality": rel + qual, "total": rel + pref + qual})

    if has_preferred:
        preferred = sorted([x for x in scored if x["user_pref"] > 0], key=lambda x: (-x["user_pref"], -x["relevance_plus_quality"]))
        rest = sorted([x for x in scored if x["user_pref"] == 0], key=lambda x: -x["relevance_plus_quality"])
        return [x["recipe"] for x in preferred] + [x["recipe"] for x in rest]
    scored.sort(key=lambda x: -x["total"])
    return [x["recipe"] for x in scored]
