/**
 * Spoonacular Food API client.
 * Docs: https://spoonacular.com/food-api/docs#Search-Recipes-Complex
 * Uses VITE_SPOONACULAR_API_KEY from .env.
 */

const BASE = 'https://api.spoonacular.com'

function getApiKey() {
  const key = import.meta.env.VITE_SPOONACULAR_API_KEY
  if (!key || key === 'your_api_key_here') {
    throw new Error('Missing VITE_SPOONACULAR_API_KEY. Copy .env.example to .env and add your Spoonacular API key.')
  }
  return key
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 200)
}

/**
 * Map Spoonacular search result (with addRecipeInformation) to app recipe schema.
 */
function mapSearchResult(r) {
  const calories = r.nutrition?.nutrients?.find((n) => n.name === 'Calories')
  return {
    id: String(r.id),
    title: r.title || 'Untitled',
    image: r.image || `https://img.spoonacular.com/recipes/${r.id}-312x231.jpg`,
    descriptionHook: stripHtml(r.summary) || r.title || '',
    cuisineTags: Array.isArray(r.cuisines) ? r.cuisines : [],
    dietTags: Array.isArray(r.diets) ? r.diets : [],
    timeMinutes: r.readyInMinutes ?? 30,
    difficulty: (r.readyInMinutes ?? 60) <= 30 ? 'easy' : (r.readyInMinutes ?? 60) <= 60 ? 'medium' : 'hard',
    budgetLevel: r.cheap ? 'low' : 'medium',
    calories: calories ? Math.round(calories.amount) : null,
    rating: r.spoonacularScore != null ? Math.round((r.spoonacularScore / 20) * 10) / 10 : 4,
    ingredients: [],
    steps: [],
    servings: r.servings ?? 2,
    recommendedReason: 'Based on your preferences and recipe rating.',
    popularityScore: r.spoonacularScore ?? 50,
  }
}

/**
 * Map Spoonacular recipe information (detail) to app recipe schema.
 */
function mapRecipeDetail(r) {
  const nutrients = r.nutrition?.nutrients || []
  const getNutrient = (name) => nutrients.find((n) => n.name === name)
  const calories = getNutrient('Calories')
  const protein = getNutrient('Protein')
  const carbs = getNutrient('Carbohydrates')
  const fat = getNutrient('Fat')
  const steps = (r.analyzedInstructions?.[0]?.steps || []).map((s) => s.step || '')
  const ingredients = (r.extendedIngredients || []).map((i) => ({
    name: i.originalName || i.name || '',
    amount: i.original || (i.amount != null ? `${i.amount} ${i.unit || ''}`.trim() : ''),
  }))
  return {
    id: String(r.id),
    title: r.title || 'Untitled',
    image: r.image || `https://img.spoonacular.com/recipes/${r.id}-556x370.jpg`,
    descriptionHook: stripHtml(r.summary) || r.title || '',
    cuisineTags: Array.isArray(r.cuisines) ? r.cuisines : [],
    dietTags: Array.isArray(r.diets) ? r.diets : [],
    timeMinutes: r.readyInMinutes ?? 30,
    difficulty: (r.readyInMinutes ?? 60) <= 30 ? 'easy' : (r.readyInMinutes ?? 60) <= 60 ? 'medium' : 'hard',
    budgetLevel: r.cheap ? 'low' : 'medium',
    calories: calories ? Math.round(calories.amount) : null,
    rating: r.spoonacularScore != null ? Math.round((r.spoonacularScore / 20) * 10) / 10 : 4,
    ingredients,
    steps,
    servings: r.servings ?? 2,
    recommendedReason: 'Based on your preferences and recipe rating.',
    popularityScore: r.spoonacularScore ?? 50,
    nutrition: {
      calories: calories ? Math.round(calories.amount) : null,
      protein: protein ? Math.round(protein.amount) : null,
      carbs: carbs ? Math.round(carbs.amount) : null,
      fat: fat ? Math.round(fat.amount) : null,
    },
  }
}

/**
 * Search recipes (complexSearch).
 * @param {Object} params - query, maxReadyTime, cuisine, diet, includeIngredients, excludeIngredients, minCalories, maxCalories, number, offset
 * @returns {Promise<{ recipes: array, totalResults: number }>}
 */
export async function searchRecipes(params = {}) {
  const key = getApiKey()
  const {
    query = '',
    maxReadyTime,
    cuisine,
    diet,
    includeIngredients,
    excludeIngredients,
    minCalories,
    maxCalories,
    number = 20,
    offset = 0,
  } = params

  const searchParams = new URLSearchParams({
    apiKey: key,
    number: String(Math.min(100, Math.max(1, number))),
    offset: String(Math.max(0, offset)),
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    instructionsRequired: 'true',
  })
  if (query && query.trim()) searchParams.set('query', query.trim())
  if (maxReadyTime != null && maxReadyTime > 0) searchParams.set('maxReadyTime', String(maxReadyTime))
  if (cuisine && cuisine.trim()) searchParams.set('cuisine', cuisine.trim().toLowerCase())
  if (diet && diet.trim()) searchParams.set('diet', diet.trim().toLowerCase().replace(/-/g, ' '))
  if (includeIngredients && includeIngredients.trim()) searchParams.set('includeIngredients', includeIngredients.trim().toLowerCase())
  if (excludeIngredients && excludeIngredients.trim()) searchParams.set('excludeIngredients', excludeIngredients.trim().toLowerCase())
  if (minCalories != null) searchParams.set('minCalories', String(minCalories))
  if (maxCalories != null) searchParams.set('maxCalories', String(maxCalories))

  const res = await fetch(`${BASE}/recipes/complexSearch?${searchParams}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular API error: ${res.status}`)
  }
  const data = await res.json()
  const recipes = (data.results || []).map(mapSearchResult)
  return { recipes, totalResults: data.totalResults ?? recipes.length }
}

/**
 * Get random recipes for feed (no query).
 * Uses complexSearch with sort=random.
 */
export async function getRandomRecipes(number = 20) {
  const key = getApiKey()
  const searchParams = new URLSearchParams({
    apiKey: key,
    number: String(Math.min(100, Math.max(1, number))),
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    instructionsRequired: 'true',
    sort: 'random',
  })
  const res = await fetch(`${BASE}/recipes/complexSearch?${searchParams}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular API error: ${res.status}`)
  }
  const data = await res.json()
  return (data.results || []).map(mapSearchResult)
}

/**
 * Get full recipe by id (GET /recipes/{id}/information).
 */
export async function getRecipeById(id) {
  const key = getApiKey()
  const res = await fetch(`${BASE}/recipes/${id}/information?apiKey=${key}&includeNutrition=true`)
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular API error: ${res.status}`)
  }
  const data = await res.json()
  return mapRecipeDetail(data)
}

/**
 * Get multiple recipes by ids (informationBulk).
 * @param {string[]} ids - Recipe ids (numeric strings from Spoonacular)
 */
export async function getRecipesBulk(ids) {
  if (!ids.length) return []
  const key = getApiKey()
  const idList = ids.slice(0, 20).join(',') // API limit
  const res = await fetch(`${BASE}/recipes/informationBulk?ids=${idList}&apiKey=${key}&includeNutrition=true`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Spoonacular API error: ${res.status}`)
  }
  const data = await res.json()
  const list = Array.isArray(data) ? data : []
  return list.map(mapRecipeDetail)
}
