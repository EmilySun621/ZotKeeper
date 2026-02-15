/**
 * Filter and rank recipes for search:
 * - Keyword match on title, descriptionHook, cuisineTags, dietTags, ingredients
 * - Filter by time, budget, cuisine, diet, difficulty, calories
 * - Ranking: user preference (cuisine weights, diet, budget/time defaults) first, then keyword relevance, then base score
 */

import { TIME_OPTIONS } from '../constants/preferences'
import { loadPreferences } from '../hooks/usePreferences'

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
 * User-preference score for ranking (higher = better match to profile).
 * Uses a large scale (hundreds) so preferred cuisines always rise to the top.
 */
function preferenceScore(recipe, preferences) {
  let score = 0
  const {
    cuisineWeights = {},
    dietToggles = {},
    budgetDefault,
    timeDefault,
  } = preferences

  // Cuisine: weight 0–5 → 100–500 points per matching tag so they always beat non-matching
  recipe.cuisineTags?.forEach((tag) => {
    const w = getCuisineWeight(cuisineWeights, tag)
    if (w != null && w > 0) score += w * 100
  })

  // Diet: strong boost when recipe matches user's diet toggles
  recipe.dietTags?.forEach((d) => {
    if (dietToggles[d]) score += 200
  })

  // Default budget / time: smaller boost
  if (budgetDefault && recipe.budgetLevel === budgetDefault) score += 50
  if (timeDefault) {
    const maxMin = getMaxMinutes(timeDefault)
    if ((recipe.timeMinutes ?? 999) <= maxMin) score += 30
  }

  return score
}

/**
 * Keyword relevance: title match > description/tags so better keyword matches rank higher when preference is equal.
 */
function keywordRelevanceScore(recipe, keyword) {
  if (!keyword || !keyword.trim()) return 0
  const q = keyword.trim().toLowerCase()
  let score = 0
  if (recipe.title?.toLowerCase().includes(q)) score += 15
  if (recipe.descriptionHook?.toLowerCase().includes(q)) score += 5
  const inTags = [...(recipe.cuisineTags || []), ...(recipe.dietTags || [])].some((t) =>
    String(t).toLowerCase().includes(q)
  )
  if (inTags) score += 3
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
  const excludeIngredients = [
    ...excludeFromFilters,
    ...(preferences.dislikedIngredients || []),
  ]

  let list = recipes.filter((r) => keywordMatch(r, keyword))

  if (time) {
    const maxMin = getMaxMinutes(time)
    list = list.filter((r) => (r.timeMinutes ?? 0) <= maxMin)
  }
  if (budget) list = list.filter((r) => r.budgetLevel === budget)
  if (cuisines.length) list = list.filter((r) => !r.cuisineTags?.length || r.cuisineTags.some((c) => cuisines.includes(c)))
  if (diets.length) list = list.filter((r) => !r.dietTags?.length || r.dietTags.some((d) => diets.includes(d)))
  if (difficulty) list = list.filter((r) => r.difficulty === difficulty)
  if (caloriesMin != null) list = list.filter((r) => (r.calories ?? 0) >= caloriesMin)
  if (caloriesMax != null) list = list.filter((r) => (r.calories ?? 9999) <= caloriesMax)
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
      const names = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.name : i).toLowerCase())
      if (names.length === 0) return true
      return !excludeIngredients.some((e) => names.some((n) => n.includes(e)))
    })
  }

  // Score each recipe (preference score + keyword relevance + tie-breakers)
  const cuisineWeights = preferences.cuisineWeights || {}
  const hasPreferredCuisines = Object.keys(cuisineWeights).some((k) => (cuisineWeights[k] || 0) > 0)

  const scored = list.map((r) => {
    const prefScore = preferenceScore(r, preferences)
    const otherScore =
      keywordRelevanceScore(r, keyword) +
      (r.rating ?? 0) * 2 +
      (r.popularityScore ?? 0) * 0.1
    return { recipe: r, prefScore, otherScore }
  })

  // If user has cuisine preferences: put preferred recipes first, then the rest (each group sorted by otherScore)
  if (hasPreferredCuisines) {
    const preferred = scored.filter((x) => x.prefScore > 0).sort((a, b) => b.prefScore - a.prefScore || b.otherScore - a.otherScore)
    const rest = scored.filter((x) => x.prefScore === 0).sort((a, b) => b.otherScore - a.otherScore)
    return preferred.map((x) => x.recipe).concat(rest.map((x) => x.recipe))
  }

  // No cuisine weights: sort by otherScore only
  scored.sort((a, b) => b.otherScore - a.otherScore)
  return scored.map((x) => x.recipe)
}
