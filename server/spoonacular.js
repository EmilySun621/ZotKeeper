/**
 * Spoonacular API proxy with in-memory cache (max 1 hour per ToS).
 * API key must be set in env (SPOONACULAR_API_KEY) — never exposed to frontend.
 */

const BASE = 'https://api.spoonacular.com'
const CACHE_TTL_MS = 3500 * 1000 // ~58 min, under 1 hour

const cache = new Map()

function getKey() {
  const key = process.env.SPOONACULAR_API_KEY
  if (!key || key === 'your_api_key_here') {
    throw new Error('Missing SPOONACULAR_API_KEY in environment')
  }
  return key
}

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function cacheSet(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}

function stripHtml(html, maxLen = 300) {
  if (!html || typeof html !== 'string') return ''
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (maxLen == null) return text
  return text.slice(0, maxLen)
}

function normalizeDietTag(tag) {
  if (!tag || typeof tag !== 'string') return null
  return tag.trim().toLowerCase().replace(/\s+/g, '-')
}


/** Parse raw instructions string into steps array (fallback when analyzedInstructions missing). */
function instructionsToSteps(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .split(/\n|\r/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * Map Spoonacular result (complexSearch with addRecipeInformation + addRecipeNutrition for list cards).
 */
function mapFromSearch(r) {
  const nutrients = r.nutrition?.nutrients || []
  const caloriesNut = nutrients.find((n) => n.name === 'Calories')
  const proteinNut = nutrients.find((n) => n.name === 'Protein')
  const carbsNut = nutrients.find((n) => n.name === 'Carbohydrates')
  const calories = caloriesNut ? Math.round(caloriesNut.amount) : null
  const protein = proteinNut ? Math.round(proteinNut.amount) : null
  const carbs = carbsNut ? Math.round(carbsNut.amount) : null
  const fromAnalyzed = (r.analyzedInstructions?.[0]?.steps || []).map((s) => s.step || '')
  const steps = fromAnalyzed.length > 0 ? fromAnalyzed : instructionsToSteps(r.instructions)
  return {
    id: String(r.id),
    title: r.title || 'Untitled',
    image: r.image || `https://img.spoonacular.com/recipes/${r.id}-312x231.jpg`,
    descriptionHook: stripHtml(r.summary) || r.title || '',
    cuisineTags: Array.isArray(r.cuisines) ? r.cuisines : [],
    dietTags: Array.isArray(r.diets)
      ? r.diets.map(normalizeDietTag).filter(Boolean)
      : [],
    timeMinutes: r.readyInMinutes ?? 30,
    difficulty: (r.readyInMinutes ?? 60) <= 30 ? 'easy' : (r.readyInMinutes ?? 60) <= 60 ? 'medium' : 'hard',
    budgetLevel: r.cheap ? 'low' : 'medium',
    calories,
    protein,
    carbs,
    pricePerServing: r.pricePerServing ?? null,
    rating: r.spoonacularScore != null ? Math.round((r.spoonacularScore / 20) * 10) / 10 : 4,
    ingredients: (r.extendedIngredients || []).map((i) => ({
      name: i.originalName || i.name || '',
      amount: i.original || (i.amount != null ? `${i.amount} ${i.unit || ''}`.trim() : ''),
    })),
    steps,
    servings: r.servings ?? 2,
    recommendedReason: 'From Spoonacular.',
    popularityScore: r.spoonacularScore ?? 50,
  }
}

/**
 * Map full recipe information (detail or bulk) to app schema. Includes nutrition if present.
 */
function mapFromDetail(r) {
  const nutrients = r.nutrition?.nutrients || []
  const getN = (name) => nutrients.find((n) => n.name === name)
  const cal = getN('Calories')
  const protein = getN('Protein')
  const carbs = getN('Carbohydrates')
  const fat = getN('Fat')
  const proteinVal = protein ? Math.round(protein.amount) : null
  const carbsVal = carbs ? Math.round(carbs.amount) : null
  const steps = (r.analyzedInstructions?.[0]?.steps || []).map((s) => s.step || '')
  const ingredients = (r.extendedIngredients || []).map((i) => ({
    name: i.originalName || i.name || '',
    amount: i.original || (i.amount != null ? `${i.amount} ${i.unit || ''}`.trim() : ''),
  }))
  return {
    id: String(r.id),
    title: r.title || 'Untitled',
    image: r.image || `https://img.spoonacular.com/recipes/${r.id}-556x370.jpg`,
    descriptionHook: stripHtml(r.summary, null) || r.title || '',
    cuisineTags: Array.isArray(r.cuisines) ? r.cuisines : [],
    dietTags: Array.isArray(r.diets)
      ? r.diets.map(normalizeDietTag).filter(Boolean)
      : [],
    timeMinutes: r.readyInMinutes ?? 30,
    difficulty: (r.readyInMinutes ?? 60) <= 30 ? 'easy' : (r.readyInMinutes ?? 60) <= 60 ? 'medium' : 'hard',
    budgetLevel: r.cheap ? 'low' : 'medium',
    calories: cal ? Math.round(cal.amount) : null,
    protein: proteinVal,
    carbs: carbsVal,
    pricePerServing: r.pricePerServing ?? null,
    rating: r.spoonacularScore != null ? Math.round((r.spoonacularScore / 20) * 10) / 10 : 4,
    ingredients,
    steps,
    servings: r.servings ?? 2,
    recommendedReason: 'From Spoonacular.',
    popularityScore: r.spoonacularScore ?? 50,
    nutrition: (cal || protein || carbs || fat)
      ? {
          calories: cal ? Math.round(cal.amount) : null,
          protein: proteinVal,
          carbs: carbsVal,
          fat: fat ? Math.round(fat.amount) : null,
        }
      : undefined,
  }
}

/**
 * Search (complexSearch) with addRecipeInformation=true only (no nutrition to save points).
 */
export async function searchRecipes(params) {
  const cacheKey = `search:${JSON.stringify(params)}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const key = getKey()
  const searchParams = new URLSearchParams({
    apiKey: key,
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true', // so list cards show calories
    number: String(Math.min(100, Math.max(1, params.number ?? 12))),
    offset: String(Math.max(0, params.offset ?? 0)),
  })
  if (params.query && params.query.trim()) searchParams.set('query', params.query.trim())
  if (params.cuisine && params.cuisine.trim()) searchParams.set('cuisine', params.cuisine.trim())
  if (params.diet && params.diet.trim()) searchParams.set('diet', params.diet.trim().replace(/-/g, ' '))
  if (params.type && params.type.trim()) searchParams.set('type', params.type.trim())
  if (params.maxReadyTime != null && params.maxReadyTime > 0) searchParams.set('maxReadyTime', String(params.maxReadyTime))
  if (params.sort && params.sort.trim()) searchParams.set('sort', params.sort.trim())
  if (params.includeIngredients) {
    const include = Array.isArray(params.includeIngredients)
      ? params.includeIngredients.join(',')
      : String(params.includeIngredients)
    if (include.trim()) searchParams.set('includeIngredients', include.trim())
  }
  if (params.excludeIngredients) {
    const exclude = Array.isArray(params.excludeIngredients)
      ? params.excludeIngredients.join(',')
      : String(params.excludeIngredients)
    if (exclude.trim()) searchParams.set('excludeIngredients', exclude.trim())
  }
  if (params.minCalories != null) searchParams.set('minCalories', String(params.minCalories))
  if (params.maxCalories != null) searchParams.set('maxCalories', String(params.maxCalories))

  const res = await fetch(`${BASE}/recipes/complexSearch?${searchParams}`)
  if (res.status === 402) {
    throw new Error('Recipe API quota exceeded. Try again later.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular error: ${res.status}`)
  }
  const data = await res.json()
  const recipes = (data.results || []).map(mapFromSearch)
  const result = { recipes, totalResults: data.totalResults ?? recipes.length, offset: data.offset ?? 0 }
  cacheSet(cacheKey, result)
  return result
}

/**
 * Single recipe detail (includeNutrition=true for detail page).
 */
export async function getRecipeById(id, includeNutrition = true) {
  const cacheKey = `recipe:${id}:${includeNutrition}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const key = getKey()
  const url = `${BASE}/recipes/${id}/information?apiKey=${key}&includeNutrition=${includeNutrition ? 'true' : 'false'}`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (res.status === 402) throw new Error('Recipe API quota exceeded. Try again later.')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular error: ${res.status}`)
  }
  const data = await res.json()
  const recipe = mapFromDetail(data)
  cacheSet(cacheKey, recipe)
  return recipe
}

/**
 * Bulk recipe info (for saved recipes list). 1 point for many.
 */
export async function getRecipesBulk(ids) {
  if (!ids.length) return []
  const cleanIds = ids.slice(0, 20).map((id) => String(id).replace(/\D/g, '')).filter(Boolean)
  if (!cleanIds.length) return []

  const cacheKey = `bulk:${cleanIds.join(',')}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const key = getKey()
  const res = await fetch(
    `${BASE}/recipes/informationBulk?apiKey=${key}&ids=${cleanIds.join(',')}&includeNutrition=false`
  )
  if (res.status === 402) throw new Error('Recipe API quota exceeded. Try again later.')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular error: ${res.status}`)
  }
  const data = await res.json()
  const list = Array.isArray(data) ? data : []
  const recipes = list.map(mapFromDetail)
  cacheSet(cacheKey, recipes)
  return recipes
}
