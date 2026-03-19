/**
 * Filter and rank recipes for search.
 * Ranking = Relevance (TF-IDF-style ingredient rarity + field weighting) + User_Preference + Recipe_Quality.
 * See docs/recipe-ranking-algorithm.md.
 */

import { TIME_OPTIONS } from '../constants/preferences'
import { loadPreferences } from '../hooks/usePreferences'

const FIELD_WEIGHTS = { title: 20, ingredient: 12, description: 5, steps: 2 }

function normalizeDietTag(tag) {
  if (!tag || typeof tag !== 'string') return ''
  return tag.trim().toLowerCase().replace(/\s+/g, '-')
}

function normalizeDietKey(tag) {
  const norm = normalizeDietTag(tag)
  if (norm === 'pescatarian') return 'pescetarian'
  return norm
}

const MEAT_KEYWORDS = ['beef', 'pork', 'lamb', 'mutton', 'veal', 'bacon', 'ham', 'prosciutto', 'pancetta', 'sausage', 'salami', 'pepperoni', 'chorizo', 'steak']
const POULTRY_KEYWORDS = ['chicken', 'turkey', 'duck', 'goose', 'poultry']
const SEAFOOD_KEYWORDS = ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'anchovy', 'sardine', 'tilapia', 'cod', 'mackerel', 'trout', 'clam', 'mussel', 'oyster', 'squid', 'octopus']
const DAIRY_KEYWORDS = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'ghee', 'whey', 'casein']
const EGG_KEYWORDS = ['egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks']
const GLUTEN_KEYWORDS = ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'noodles', 'barley', 'rye', 'gluten', 'couscous', 'semolina', 'soy sauce', 'seitan', 'cracker']
const LOW_CARB_KEYWORDS = ['bread', 'pasta', 'rice', 'noodle', 'noodles', 'flour', 'sugar', 'potato', 'potatoes', 'corn', 'tortilla', 'cereal', 'cake', 'cookie']
const LOW_SUGAR_KEYWORDS = ['sugar', 'honey', 'syrup', 'molasses', 'jam', 'jelly', 'candy', 'chocolate', 'sweetener']
const ALCOHOL_KEYWORDS = ['wine', 'beer', 'whiskey', 'vodka', 'rum', 'gin', 'brandy', 'liquor', 'sake']

const LOW_CALORIE_MAX = 450
const HIGH_PROTEIN_MIN = 20
const LOW_CARB_MAX = 30
const BUDGET_FRIENDLY_MAX_PRICE = 400

const DIET_EXCLUDE_KEYWORDS = {
  vegan: [...MEAT_KEYWORDS, ...POULTRY_KEYWORDS, ...SEAFOOD_KEYWORDS, ...DAIRY_KEYWORDS, ...EGG_KEYWORDS, 'honey', 'gelatin'],
  vegetarian: [...MEAT_KEYWORDS, ...POULTRY_KEYWORDS, ...SEAFOOD_KEYWORDS, 'gelatin'],
  pescetarian: [...MEAT_KEYWORDS, ...POULTRY_KEYWORDS],
  'no-red-meat': ['beef', 'pork', 'lamb', 'mutton', 'veal', 'bacon', 'ham'],
  'no-beef': ['beef', 'steak', 'veal'],
  'no-pork': ['pork', 'bacon', 'ham', 'prosciutto', 'pancetta', 'sausage'],
  'no-seafood': [...SEAFOOD_KEYWORDS],
  halal: ['pork', 'bacon', 'ham', 'lard', ...ALCOHOL_KEYWORDS],
  kosher: ['pork', 'bacon', 'ham', 'lard', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster'],
  'gluten-free': [...GLUTEN_KEYWORDS],
  'dairy-free': [...DAIRY_KEYWORDS],
  'low-carb': [...LOW_CARB_KEYWORDS],
  'low-sugar': [...LOW_SUGAR_KEYWORDS],
}

function tokenize(text) {
  return text.match(/[a-z]+/g) || []
}

function hasKeyword(text, keywords) {
  if (!text) return false
  const lower = text.toLowerCase()
  const tokens = new Set(tokenize(lower))
  for (const keyword of keywords) {
    if (!keyword) continue
    const k = String(keyword).toLowerCase()
    if (k.includes(' ')) {
      if (lower.includes(k)) return true
      continue
    }
    if (tokens.has(k) || tokens.has(`${k}s`)) return true
  }
  return false
}

function buildSearchText(recipe) {
  const parts = [
    recipe.title,
    recipe.descriptionHook,
    ...(recipe.ingredients || []).map((i) => (typeof i === 'object' ? i.name : i)),
    ...(recipe.steps || []),
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function isLowCalorie(calories) {
  if (calories == null || Number.isNaN(Number(calories))) return false
  return Number(calories) <= LOW_CALORIE_MAX
}

function isHighProtein(protein) {
  if (protein == null || Number.isNaN(Number(protein))) return false
  return Number(protein) >= HIGH_PROTEIN_MIN
}

function isLowCarb(carbs) {
  if (carbs == null || Number.isNaN(Number(carbs))) return false
  return Number(carbs) <= LOW_CARB_MAX
}

function isBudgetFriendly(recipe) {
  if (!recipe) return false
  if (recipe.budgetLevel === 'low') return true
  if (recipe.pricePerServing == null || Number.isNaN(Number(recipe.pricePerServing))) return false
  return Number(recipe.pricePerServing) <= BUDGET_FRIENDLY_MAX_PRICE
}

/** Exported for use in useSearchRecipes when merging area-based results. */
export function recipeMatchesKeyword(recipe, query) {
  if (!query || !query.trim()) return true
  const q = query.trim().toLowerCase()
  const searchable = [
    recipe.title,
    recipe.descriptionHook,
    ...(recipe.cuisineTags || []),
    ...(recipe.dietTags || []),
    ...(recipe.ingredients || []).map((i) => (typeof i === 'object' ? i.name : i)),
  ].join(' ')
  return searchable.toLowerCase().includes(q)
}

function keywordMatch(recipe, query) {
  return recipeMatchesKeyword(recipe, query)
}

function getMaxMinutes(timeFilter) {
  if (!timeFilter) return 999
  const opt = TIME_OPTIONS.find((o) => o.value === timeFilter)
  return opt ? opt.maxMinutes : 999
}

/** Case-insensitive lookup: find weight for a tag from cuisineWeights (keys may be "Japanese" vs tag "japanese"). */
function getCuisineWeight(cuisineWeights, tag) {
  if (!tag || typeof tag !== 'string') return 0
  const t = tag.trim()
  if (cuisineWeights[t] != null) return cuisineWeights[t]
  const lower = t.toLowerCase()
  const key = Object.keys(cuisineWeights).find((k) => k.toLowerCase() === lower)
  return key != null ? cuisineWeights[key] : 0
}

/**
 * Build ingredient IDF from current corpus (filtered recipe list).
 * DF(term) = number of recipes that contain that term in any ingredient; IDF = log((N+1)/(df+1))+1.
 */
function buildIngredientIDF(recipes) {
  const N = recipes.length
  const df = new Map()
  for (const r of recipes) {
    const termsInRecipe = new Set()
    const ings = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.name : i)).filter(Boolean)
    for (const name of ings) {
      const n = String(name).trim().toLowerCase()
      if (!n) continue
      termsInRecipe.add(n)
      for (const t of n.split(/\s+/).filter(Boolean)) {
        if (t.length >= 2) termsInRecipe.add(t)
      }
    }
    for (const t of termsInRecipe) {
      df.set(t, (df.get(t) || 0) + 1)
    }
  }
  const idf = new Map()
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1)
  }
  return idf
}

/**
 * User-preference score (User_Preference in combined formula).
 * Large scale so preferred cuisines group first.
 */
function preferenceScore(recipe, preferences) {
  let score = 0
  const {
    cuisineWeights = {},
    dietToggles = {},
    budgetDefault,
    timeDefault,
    lowCaloriePriority,
    highProteinPriority,
    lowCarbPriority,
    budgetFriendlyPriority,
  } = preferences
  const dietToggleSet = new Set(
    Object.entries(dietToggles)
      .filter(([, on]) => !!on)
      .map(([key]) => normalizeDietKey(key))
      .filter(Boolean)
  )

  recipe.cuisineTags?.forEach((tag) => {
    const w = getCuisineWeight(cuisineWeights, tag)
    if (w != null && w > 0) score += w * 100
  })
  recipe.dietTags?.forEach((d) => {
    const key = normalizeDietKey(d)
    if (key && dietToggleSet.has(key)) score += 200
  })
  if (budgetDefault && recipe.budgetLevel === budgetDefault) score += 50
  if (timeDefault) {
    const maxMin = getMaxMinutes(timeDefault)
    if ((recipe.timeMinutes ?? 999) <= maxMin) score += 30
  }
  if (lowCaloriePriority && isLowCalorie(recipe.calories)) score += 80
  if (highProteinPriority && isHighProtein(recipe.protein)) score += 60
  if (lowCarbPriority && isLowCarb(recipe.carbs)) score += 60
  if (budgetFriendlyPriority && isBudgetFriendly(recipe)) score += 50
  return score
}

/**
 * Recipe_Quality: rating + popularity/review signal.
 */
function qualityScore(recipe) {
  const rating = (recipe.rating ?? 0) * 2
  const reviewSignal = recipe.reviewCount != null
    ? Math.log1p(recipe.reviewCount)
    : (recipe.popularityScore ?? 0) * 0.1
  return rating + reviewSignal
}

/**
 * Relevance = field-weighted text match + ingredient match with IDF (TF-IDF style).
 * Title > Ingredients (×IDF) > Description > Steps.
 */
function relevanceScore(recipe, keyword, ingredientIDF) {
  if (!keyword || !keyword.trim()) return 0
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return 0
  let score = 0
  const title = (recipe.title || '').toLowerCase()
  const desc = (recipe.descriptionHook || '').toLowerCase()
  const stepsText = (recipe.steps || []).map((s) => (typeof s === 'string' ? s : '')).join(' ').toLowerCase()
  const ingNames = (recipe.ingredients || []).map((i) => (typeof i === 'object' ? i.name : i)).filter(Boolean)

  for (const term of terms) {
    if (term.length < 2) continue
    if (title.includes(term)) score += FIELD_WEIGHTS.title
    const idf = ingredientIDF.get(term) ?? 1
    const inIng = ingNames.some((n) => String(n).toLowerCase().includes(term))
    if (inIng) score += FIELD_WEIGHTS.ingredient * idf
    if (desc.includes(term)) score += FIELD_WEIGHTS.description
    if (stepsText.includes(term)) score += FIELD_WEIGHTS.steps
  }
  return score
}

/**
 * Apply filters (from Search UI) and keyword, then rank by match + preference.
 * Always reads latest preferences from localStorage so ranking reflects saved profile.
 * filters: { time, budget, cuisines[], diets[], difficulty, caloriesMin, caloriesMax, includeIngredient?, excludeIngredients[] }
 */
export function filterAndRankRecipes(recipes, keyword, filters) {
  const preferences = loadPreferences()
  const {
    time,
    budget,
    cuisines = [],
    diets = [],
    difficulty,
    caloriesMin,
    caloriesMax,
    includeIngredient,
    excludeIngredients: excludeFromFilters = [],
  } = filters
  const dietPrefKeys = Object.entries(preferences.dietToggles || {})
    .filter(([, on]) => !!on)
    .map(([key]) => normalizeDietKey(key))
    .filter(Boolean)

  const dietFilterKeys = diets.map((d) => normalizeDietKey(d)).filter(Boolean)
  const dietExcludeKeywords = [
    ...dietPrefKeys.flatMap((k) => DIET_EXCLUDE_KEYWORDS[k] || []),
    ...dietFilterKeys.flatMap((k) => DIET_EXCLUDE_KEYWORDS[k] || []),
  ]

  const excludeIngredients = [
    ...excludeFromFilters,
    ...(preferences.dislikedIngredients || []),
    ...dietExcludeKeywords,
  ]

  let list = recipes.filter((r) => keywordMatch(r, keyword))

  if (time) {
    const maxMin = getMaxMinutes(time)
    list = list.filter((r) => (r.timeMinutes ?? 0) <= maxMin)
  }
  if (budget) list = list.filter((r) => r.budgetLevel === budget)
  if (cuisines.length) list = list.filter((r) => !r.cuisineTags?.length || r.cuisineTags.some((c) => cuisines.includes(c)))
  // Diet filters are applied as exclusion keywords to avoid dropping recipes without tags.
  if (difficulty) list = list.filter((r) => r.difficulty === difficulty)
  const minCal = caloriesMin === '' ? null : caloriesMin
  const maxCal = caloriesMax === '' ? null : caloriesMax
  if (minCal != null) list = list.filter((r) => (r.calories ?? 0) >= minCal)
  if (maxCal != null) list = list.filter((r) => (r.calories ?? 9999) <= maxCal)
  if (includeIngredient?.trim()) {
    const ing = includeIngredient.trim().toLowerCase()
    list = list.filter((r) => {
      const ings = (r.ingredients || [])
      if (ings.length === 0) return true
      return ings.some((i) => (typeof i === 'object' ? i.name : i).toLowerCase().includes(ing))
    })
  }
  if (excludeIngredients.length) {
    list = list.filter((r) => {
      const searchText = buildSearchText(r)
      if (!searchText) return true
      return !hasKeyword(searchText, excludeIngredients)
    })
  }

  // Combined score: Relevance + User_Preference + Recipe_Quality (see docs/recipe-ranking-algorithm.md)
  const ingredientIDF = buildIngredientIDF(list)
  const cuisineWeights = preferences.cuisineWeights || {}
  const hasPreferredCuisines = Object.keys(cuisineWeights).some((k) => (cuisineWeights[k] || 0) > 0)

  const scored = list.map((r) => {
    const relevance = relevanceScore(r, keyword, ingredientIDF)
    const userPref = preferenceScore(r, preferences)
    const quality = qualityScore(r)
    const total = relevance + userPref + quality
    return { recipe: r, userPref, relevancePlusQuality: relevance + quality, total }
  })

  if (hasPreferredCuisines) {
    const preferred = scored.filter((x) => x.userPref > 0).sort((a, b) => b.userPref - a.userPref || b.relevancePlusQuality - a.relevancePlusQuality)
    const rest = scored.filter((x) => x.userPref === 0).sort((a, b) => b.relevancePlusQuality - a.relevancePlusQuality)
    return preferred.map((x) => x.recipe).concat(rest.map((x) => x.recipe))
  }

  scored.sort((a, b) => b.total - a.total)
  return scored.map((x) => x.recipe)
}
