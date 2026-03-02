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

const app = express()
const PORT = process.env.PORT || 3001

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

/**
 * POST /api/search
 * Body: { keyword, filters: { cuisines[], diets[], time, caloriesMin, caloriesMax, ... }, preferences, limit }
 * Maps to Spoonacular complexSearch (addRecipeInformation only, no nutrition).
 */
const SEARCH_PAGE_SIZE = 20

app.post('/api/search', async (req, res) => {
  try {
    const { keyword = '', filters = {}, limit = 24, offset = 0 } = req.body
    const q = (keyword || '').trim()
    const cuisine = Array.isArray(filters.cuisines) && filters.cuisines[0] ? filters.cuisines[0] : ''
    const diet = Array.isArray(filters.diets) && filters.diets[0] ? filters.diets[0] : ''
    const maxReadyTime = maxReadyFromFilter(filters.time) ?? null

    const minCal = filters.caloriesMin ?? filters.calories_min
    const maxCal = filters.caloriesMax ?? filters.calories_max
    const isSearch = !!q
    const number = isSearch
      ? Math.min(100, Math.max(1, Number(limit) || SEARCH_PAGE_SIZE))
      : Math.min(100, Math.max(1, Number(limit) || 24))
    const off = Math.max(0, Number(offset) || 0)

    const result = await searchRecipes({
      query: q || undefined,
      cuisine: cuisine || undefined,
      diet: diet || undefined,
      maxReadyTime: maxReadyTime && maxReadyTime < 999 ? maxReadyTime : undefined,
      minCalories: minCal != null && minCal !== '' ? Number(minCal) : undefined,
      maxCalories: maxCal != null && maxCal !== '' ? Number(maxCal) : undefined,
      number,
      offset: off,
      sort: q ? 'popularity' : 'random', // feed = random when no keyword
    })

    res.json({
      recipes: result.recipes,
      totalResults: result.totalResults,
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
