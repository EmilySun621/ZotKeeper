/**
 * TheMealDB API client (free, no key required for v1).
 * Docs: https://www.themealdb.com/api.php
 * In dev we use a CORS proxy so the browser can reach TheMealDB without CORS errors.
 */

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

function buildUrl(pathAndQuery) {
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`
  const absolute = `${THEMEALDB_BASE}${path}`
  if (import.meta.env.DEV) {
    return `https://corsproxy.io/?${encodeURIComponent(absolute)}`
  }
  return absolute
}

/**
 * Parse instructions into steps (split by newline, filter empty).
 */
function instructionsToSteps(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Build ingredients list from strIngredient1..20, strMeasure1..20.
 */
function buildIngredients(meal) {
  const out = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (!name || !name.trim()) continue
    const amount = (measure && measure.trim()) ? measure.trim() : ''
    out.push({ name: name.trim(), amount })
  }
  return out
}

/**
 * Map TheMealDB meal object to app recipe schema.
 * TheMealDB free API has no cooking time — we leave timeMinutes null so UI can show "—".
 */
export function mapMealToRecipe(meal) {
  if (!meal || !meal.idMeal) return null
  const ingredients = buildIngredients(meal)
  const steps = instructionsToSteps(meal.strInstructions)
  const category = meal.strCategory ? [meal.strCategory] : []
  const area = meal.strArea ? [meal.strArea] : []
  const cuisineTags = [...new Set([...category, ...area])].filter(Boolean)
  const dietTags = []
  if (meal.strCategory && /vegetarian|vegan|salad/i.test(meal.strCategory)) {
    dietTags.push(meal.strCategory.toLowerCase())
  }
  return {
    id: String(meal.idMeal),
    title: meal.strMeal || 'Untitled',
    image: meal.strMealThumb || `https://www.themealdb.com/images/media/meals/placeholder.png`,
    descriptionHook: meal.strCategory
      ? `${meal.strCategory}${meal.strArea ? ` · ${meal.strArea}` : ''}`
      : 'From TheMealDB',
    cuisineTags,
    dietTags,
    timeMinutes: null,
    difficulty: 'medium',
    budgetLevel: 'medium',
    calories: null,
    rating: 4.5,
    ingredients,
    steps,
    servings: 2,
    recommendedReason: 'From TheMealDB.',
    popularityScore: 50,
    nutrition: null,
  }
}

/**
 * Map filter/search result (minimal meal) to app schema (no ingredients/steps).
 * TheMealDB has no cooking time — timeMinutes null so UI shows "—".
 */
function mapMealMinimal(meal) {
  if (!meal || !meal.idMeal) return null
  const category = meal.strCategory ? [meal.strCategory] : []
  const area = meal.strArea ? [meal.strArea] : []
  const cuisineTags = [...new Set([...category, ...area])].filter(Boolean)
  return {
    id: String(meal.idMeal),
    title: meal.strMeal || 'Untitled',
    image: meal.strMealThumb || `https://www.themealdb.com/images/media/meals/placeholder.png`,
    descriptionHook: meal.strCategory
      ? `${meal.strCategory}${meal.strArea ? ` · ${meal.strArea}` : ''}`
      : 'From TheMealDB',
    cuisineTags,
    dietTags: [],
    timeMinutes: null,
    difficulty: 'medium',
    budgetLevel: 'medium',
    calories: null,
    rating: 4.5,
    ingredients: [],
    steps: [],
    servings: 2,
    recommendedReason: 'From TheMealDB.',
    popularityScore: 50,
  }
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TheMealDB error: ${res.status}`)
  return res.json()
}

/**
 * Search meals by name.
 * GET search.php?s=Arrabiata
 */
export async function searchMeals(query = '') {
  const q = (query || '').trim()
  if (!q) return { meals: [], totalResults: 0 }
  const url = buildUrl(`/search.php?s=${encodeURIComponent(q)}`)
  const data = await fetchJson(url)
  const list = Array.isArray(data.meals) ? data.meals : []
  const meals = list.map(mapMealMinimal).filter(Boolean)
  return { meals, totalResults: meals.length }
}

/**
 * List meals by first letter.
 * GET search.php?f=a
 */
export async function searchMealsByFirstLetter(letter) {
  const c = (letter && letter.charAt(0)) || 'a'
  const data = await fetchJson(buildUrl(`/search.php?f=${encodeURIComponent(c)}`))
  const list = Array.isArray(data.meals) ? data.meals : []
  return list.map(mapMealMinimal).filter(Boolean)
}

/**
 * Lookup full meal details by id.
 * GET lookup.php?i=52772
 */
export async function getMealById(id) {
  if (!id) return null
  const data = await fetchJson(buildUrl(`/lookup.php?i=${encodeURIComponent(id)}`))
  const meal = data.meals && data.meals[0]
  return meal ? mapMealToRecipe(meal) : null
}

/**
 * Lookup a single random meal.
 * GET random.php
 */
export async function getRandomMeal() {
  const data = await fetchJson(buildUrl('/random.php'))
  const meal = data.meals && data.meals[0]
  return meal ? mapMealToRecipe(meal) : null
}

/**
 * Get multiple random meals by calling random.php N times in parallel.
 * Free API returns 1 per request.
 */
export async function getRandomMeals(count = 20) {
  const promises = Array.from({ length: Math.min(24, Math.max(1, count)) }, () =>
    fetchJson(buildUrl('/random.php'))
  )
  const results = await Promise.all(promises)
  const byId = new Map()
  results.forEach((data) => {
    const m = data.meals && data.meals[0]
    if (m && m.idMeal && !byId.has(m.idMeal)) byId.set(m.idMeal, mapMealToRecipe(m))
  })
  return Array.from(byId.values())
}

/**
 * List all meal categories.
 * GET categories.php
 */
export async function getCategories() {
  const data = await fetchJson(buildUrl('/categories.php'))
  const list = Array.isArray(data.categories) ? data.categories : []
  return list
}

/**
 * List all areas (for region map). GET list.php?a=list
 */
export async function getAreas() {
  const data = await fetchJson(buildUrl('/list.php?a=list'))
  const list = Array.isArray(data.meals) ? data.meals : []
  return list.map((m) => m.strArea).filter(Boolean)
}

/**
 * Filter by category. GET filter.php?c=Seafood
 */
export async function filterByCategory(category) {
  if (!(category && category.trim())) return []
  const data = await fetchJson(
    buildUrl(`/filter.php?c=${encodeURIComponent(category.trim())}`)
  )
  const list = Array.isArray(data.meals) ? data.meals : []
  return list.map(mapMealMinimal).filter(Boolean)
}

/**
 * Filter by area. GET filter.php?a=Canadian
 */
export async function filterByArea(area) {
  if (!(area && area.trim())) return []
  const data = await fetchJson(
    buildUrl(`/filter.php?a=${encodeURIComponent(area.trim())}`)
  )
  const list = Array.isArray(data.meals) ? data.meals : []
  return list.map(mapMealMinimal).filter(Boolean)
}

/**
 * Filter by main ingredient. GET filter.php?i=chicken_breast
 */
export async function filterByIngredient(ingredient) {
  if (!(ingredient && ingredient.trim())) return []
  const data = await fetchJson(
    buildUrl(`/filter.php?i=${encodeURIComponent(ingredient.trim().replace(/\s+/g, '_'))}`)
  )
  const list = Array.isArray(data.meals) ? data.meals : []
  return list.map(mapMealMinimal).filter(Boolean)
}

/**
 * Feed: get a mix of meals from several categories, merged in deterministic order.
 * Same categories + same API response => same list order every time.
 */
const FEED_CATEGORIES = ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Dessert', 'Pasta']

export async function getFeedMeals(limit = 24) {
  const promises = FEED_CATEGORIES.map((c) => filterByCategory(c))
  const results = await Promise.all(promises)
  const byId = new Map()
  results.flat().forEach((r) => {
    if (r && r.id && !byId.has(r.id)) byId.set(r.id, r)
  })
  const list = Array.from(byId.values()).sort((a, b) => (a.id || '').localeCompare(b.id || ''))
  return list.slice(0, limit)
}

/**
 * Get full recipe details for multiple ids (parallel lookup.php per id).
 */
export async function getMealsByIds(ids) {
  if (!ids.length) return []
  const unique = [...new Set(ids)]
  const results = await Promise.all(unique.map((id) => getMealById(id)))
  return results.filter(Boolean)
}
