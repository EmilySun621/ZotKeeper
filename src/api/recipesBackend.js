/**
 * Client for the recipe ranking backend (Python serve_recipes / load_recipes_from_db).
 * Base URL: VITE_RECIPE_API_URL or http://localhost:8000
 */

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RECIPE_API_URL) || 'http://localhost:8000'

/** Backend returns snake_case; frontend expects camelCase. */
export function recipeToCamel(r) {
  if (!r || typeof r !== 'object') return r
  const out = { ...r }
  if (out.description_hook != null) { out.descriptionHook = out.description_hook; delete out.description_hook }
  if (out.cuisine_tags != null) { out.cuisineTags = out.cuisine_tags; delete out.cuisine_tags }
  if (out.diet_tags != null) { out.dietTags = out.diet_tags; delete out.diet_tags }
  if (out.time_minutes != null) { out.timeMinutes = out.time_minutes; delete out.time_minutes }
  if (out.budget_level != null) { out.budgetLevel = out.budget_level; delete out.budget_level }
  if (out.popularity_score != null) { out.popularityScore = out.popularity_score; delete out.popularity_score }
  if (out.ingredients_json != null) { delete out.ingredients_json }
  if (out.steps_json != null) { delete out.steps_json }
  return out
}

/**
 * Search/feed: POST /api/search with body { keyword, filters, preferences, limit }.
 * Returns { recipes: [...] } (recipes converted to camelCase).
 */
export async function searchRecipes({ keyword = '', filters = {}, preferences = {}, limit = 200 } = {}) {
  const res = await fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword: keyword.trim(),
      filters: {
        time: filters.time || undefined,
        budget: filters.budget || undefined,
        cuisines: Array.isArray(filters.cuisines) ? filters.cuisines : [],
        diets: Array.isArray(filters.diets) ? filters.diets : [],
        difficulty: filters.difficulty || undefined,
        calories_min: filters.caloriesMin,
        calories_max: filters.caloriesMax,
        include_ingredient: filters.includeIngredient || undefined,
        exclude_ingredients: filters.excludeIngredients || [],
        exclude_allergens: preferences.allergiesToAvoid || [],
      },
      preferences: {
        cuisine_weights: preferences.cuisineWeights || {},
        diet_toggles: preferences.dietToggles || {},
        budget_default: preferences.budgetDefault,
        time_default: preferences.timeDefault,
        disliked_ingredients: preferences.dislikedIngredients || [],
      },
      limit,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Search failed: ${res.status}`)
  }
  const data = await res.json()
  const recipes = (data.recipes || []).map(recipeToCamel)
  return {
    recipes,
    count: recipes.length,
    suggestedKeyword: data.suggestedKeyword ?? null,
  }
}

/**
 * List cuisine tags that have recipes. GET /api/cuisines.
 */
export async function getCuisines() {
  const res = await fetch(`${BASE}/api/cuisines`)
  if (!res.ok) throw new Error('Failed to load cuisines')
  const data = await res.json()
  return data.cuisines || []
}

/**
 * Single recipe: GET /api/recipes/:id
 */
export async function getRecipeById(id) {
  const res = await fetch(`${BASE}/api/recipes/${encodeURIComponent(id)}`)
  if (!res.ok) {
    if (res.status === 404) return null
    const t = await res.text()
    throw new Error(t || `Failed to load recipe: ${res.status}`)
  }
  const r = await res.json()
  if (r.error) return null
  return recipeToCamel(r)
}
