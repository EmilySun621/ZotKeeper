/**
 * Recipe API server: proxies Spoonacular with server-side API key and cache.
 * Run: cd server && npm run dev  (or node server/index.js from project root)
 * Set SPOONACULAR_API_KEY in server/.env. Frontend uses Vite proxy in dev.
 */

import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

import express from 'express'
import cors from 'cors'
import { searchRecipes, getRecipeById, getRecipesBulk } from './spoonacular.js'
import { rankRecipes } from './ranking.js'

const app = express()
const PORT = process.env.PORT || 3001

/** Cache for ranked search results (keyword + filters + preferences) — TTL 58 min */
const RANKED_CACHE_TTL_MS = 3500 * 1000
const rankedCache = new Map()

function rankedCacheKey(q, filters, preferences) {
  return `ranked:${q}:${JSON.stringify(filters)}:${JSON.stringify(preferences || {})}`
}

function getRankedCache(key) {
  const entry = rankedCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    rankedCache.delete(key)
    return null
  }
  return entry.data
}

function setRankedCache(key, data) {
  rankedCache.set(key, { data, expires: Date.now() + RANKED_CACHE_TTL_MS })
}

app.use(cors({ origin: true }))
app.use(express.json())

/** GET /api/health — check server is up and API key is set (does not expose key) */
app.get('/api/health', (_req, res) => {
  const keySet = !!process.env.SPOONACULAR_API_KEY && process.env.SPOONACULAR_API_KEY !== 'your_api_key_here'
  res.json({ ok: true, keySet })
})

// Spoonacular-supported cuisines for filter dropdown / Explore by region
const CUISINES = [
  'African', 'Asian', 'American', 'British', 'Cajun', 'Caribbean', 'Chinese',
  'Eastern European', 'European', 'French', 'German', 'Greek', 'Indian',
  'Irish', 'Italian', 'Japanese', 'Jewish', 'Korean', 'Latin American',
  'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic', 'Southern',
  'Spanish', 'Thai', 'Vietnamese',
]

/** Time filter value -> maxReadyTime minutes */
function maxReadyFromFilter(time) {
  if (time === 'quick') return 30
  if (time === 'medium') return 60
  if (time === 'long') return 999
  return null
}

function normalizeList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}


/**
 * POST /api/search
 * Body: { keyword, filters: { cuisines[], diets[], time, caloriesMin, caloriesMax, ... }, preferences, limit }
 * Maps to Spoonacular complexSearch (addRecipeInformation only, no nutrition).
 */
const SEARCH_PAGE_SIZE = 20

app.post('/api/search', async (req, res) => {
  try {
    const { keyword = '', filters = {}, preferences = {}, limit = 24, offset = 0 } = req.body
    const q = (keyword || '').trim()
    const cuisine = Array.isArray(filters.cuisines) && filters.cuisines[0] ? filters.cuisines[0] : ''
    const diet = Array.isArray(filters.diets) && filters.diets[0] ? filters.diets[0] : ''
    const maxReadyTime = maxReadyFromFilter(filters.time) ?? null

    const minCal = filters.caloriesMin ?? filters.calories_min
    const maxCal = filters.caloriesMax ?? filters.calories_max
    const includeIngredient = filters.includeIngredient ?? filters.include_ingredient
    const excludeFromFilters = normalizeList(filters.excludeIngredients ?? filters.exclude_ingredients)
    const excludeFromAllergens = normalizeList(filters.excludeAllergens ?? filters.exclude_allergens)
    const excludeFromPrefs = normalizeList(preferences.disliked_ingredients ?? preferences.dislikedIngredients)
    const excludeIngredients = [...excludeFromFilters, ...excludeFromAllergens, ...excludeFromPrefs]
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean)
    const excludeCsv = excludeIngredients.length ? [...new Set(excludeIngredients)].join(',') : ''
    const off = Math.max(0, Number(offset) || 0)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || SEARCH_PAGE_SIZE))

    const spoonacularParams = {
      query: q || undefined,
      cuisine: cuisine || undefined,
      diet: diet || undefined,
      maxReadyTime: maxReadyTime && maxReadyTime < 999 ? maxReadyTime : undefined,
      minCalories: minCal != null && minCal !== '' ? Number(minCal) : undefined,
      maxCalories: maxCal != null && maxCal !== '' ? Number(maxCal) : undefined,
      includeIngredients: includeIngredient && String(includeIngredient).trim()
        ? String(includeIngredient).trim().toLowerCase()
        : undefined,
      excludeIngredients: excludeCsv || undefined,
      sort: q ? 'popularity' : 'random',
    }

    let recipes
    let totalResults

    if (q) {
      // Keyword search: fetch up to 100, rank once, cache, then paginate
      const rk = rankedCacheKey(q, filters, preferences)
      let cached = getRankedCache(rk)
      if (cached) {
        recipes = cached.recipes.slice(off, off + limitNum)
        totalResults = cached.totalResults
      } else {
        const result = await searchRecipes({
          ...spoonacularParams,
          number: 100,
          offset: 0,
        })
        const ranked = rankRecipes(result.recipes, q, preferences)
        totalResults = ranked.length
        setRankedCache(rk, { recipes: ranked, totalResults })
        recipes = ranked.slice(off, off + limitNum)
      }
    } else {
      // No keyword (feed or region): fetch page from Spoonacular, then rank within that set
      const number = Math.min(100, Math.max(1, Number(limit) || 24))
      const result = await searchRecipes({
        ...spoonacularParams,
        number,
        offset: off,
      })
      recipes = rankRecipes(result.recipes, '', preferences)
      totalResults = result.totalResults ?? recipes.length
    }

    res.json({
      recipes,
      totalResults,
      suggestedKeyword: null,
    })
  } catch (err) {
    console.error('[POST /api/search]', err.message)
    res.status(err.message?.includes('quota') ? 402 : 502).json({
      error: err.message || 'Search failed',
    })
  }
})

/** GET /api/cuisines — list for filters and Explore by region */
app.get('/api/cuisines', (_req, res) => {
  res.json({ cuisines: CUISINES })
})

/** GET /api/recipes/:id — single recipe detail (with nutrition for detail page) */
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const id = req.params.id
    const recipe = await getRecipeById(id, true)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    res.json(recipe)
  } catch (err) {
    console.error('[GET /api/recipes/:id]', err.message)
    res.status(err.message?.includes('quota') ? 402 : 502).json({
      error: err.message || 'Failed to load recipe',
    })
  }
})

/** GET /api/recipes/bulk?ids=1,2,3 — for saved recipes list (informationBulk) */
app.get('/api/recipes/bulk', async (req, res) => {
  try {
    const ids = (req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const recipes = await getRecipesBulk(ids)
    res.json({ recipes })
  } catch (err) {
    console.error('[GET /api/recipes/bulk]', err.message)
    res.status(err.message?.includes('quota') ? 402 : 502).json({
      error: err.message || 'Failed to load recipes',
    })
  }
})

app.listen(PORT, () => {
  const hasKey = !!process.env.SPOONACULAR_API_KEY && process.env.SPOONACULAR_API_KEY !== 'your_api_key_here'
  console.log(`Recipe API (Spoonacular proxy) running at http://localhost:${PORT}`)
  if (!hasKey) {
    console.warn('Warning: SPOONACULAR_API_KEY not set or invalid. Set it in server/.env — search will fail until then.')
  } else {
    console.log('SPOONACULAR_API_KEY loaded from server/.env')
  }
})
