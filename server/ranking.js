/**
 * Recipe ranking: Relevance (TF-IDF + field weights) + User preference + Recipe quality.
 * Port of scripts/recipe_ranking.py for use with Spoonacular results.
 */

const FIELD_WEIGHTS = { title: 20, ingredient: 12, description: 5, steps: 2 }
const TIME_MAX_MINUTES = { quick: 30, medium: 60, long: 999 }

function getMaxMinutes(timeFilter) {
  if (!timeFilter) return 999
  return TIME_MAX_MINUTES[timeFilter] ?? 999
}

function getCuisineWeight(cuisineWeights, tag) {
  if (!tag || typeof tag !== 'string') return 0
  const t = tag.trim()
  const w = cuisineWeights[t]
  if (w != null && w > 0) return w
  const lower = t.toLowerCase()
  for (const k of Object.keys(cuisineWeights || {})) {
    if (k && k.toLowerCase() === lower) return cuisineWeights[k]
  }
  return 0
}

/** IDF from current corpus. Higher IDF = rarer ingredient. */
function buildIngredientIDF(recipes) {
  const n = recipes.length
  const df = new Map()
  for (const r of recipes) {
    const termsInRecipe = new Set()
    const ings = r.ingredients || []
    for (const i of ings) {
      const name = (typeof i === 'object' && i != null && i.name != null) ? i.name : String(i)
      const nLower = String(name).trim().toLowerCase()
      if (!nLower) continue
      termsInRecipe.add(nLower)
      for (const t of nLower.split(/\s+/).filter(Boolean)) {
        if (t.length >= 2) termsInRecipe.add(t)
      }
    }
    for (const t of termsInRecipe) {
      df.set(t, (df.get(t) || 0) + 1)
    }
  }
  const idf = new Map()
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1)
  }
  return idf
}

function preferenceScore(recipe, preferences) {
  let score = 0
  const cuisineWeights = preferences.cuisine_weights || preferences.cuisineWeights || {}
  const dietToggles = preferences.diet_toggles || preferences.dietToggles || {}
  const budgetDefault = preferences.budget_default || preferences.budgetDefault
  const timeDefault = preferences.time_default || preferences.timeDefault

  for (const tag of recipe.cuisineTags || []) {
    const w = getCuisineWeight(cuisineWeights, tag)
    if (w > 0) score += w * 100
  }
  for (const d of recipe.dietTags || []) {
    if (dietToggles[d]) score += 200
  }
  if (budgetDefault && recipe.budgetLevel === budgetDefault) score += 50
  if (timeDefault) {
    const maxMin = getMaxMinutes(timeDefault)
    if ((recipe.timeMinutes ?? 999) <= maxMin) score += 30
  }
  return score
}

function qualityScore(recipe) {
  const rating = (recipe.rating ?? 0) * 2
  const rev = recipe.reviewCount ?? recipe.review_count
  const reviewSignal = rev != null ? Math.log1p(rev) : ((recipe.popularityScore ?? recipe.popularity_score ?? 0) * 0.1)
  return rating + reviewSignal
}

function relevanceScore(recipe, keyword, ingredientIDF) {
  if (!keyword || !keyword.trim()) return 0
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return 0
  let score = 0
  const title = (recipe.title || '').toLowerCase()
  const desc = (recipe.descriptionHook || recipe.description_hook || '').toLowerCase()
  const stepsList = recipe.steps || []
  const stepsText = stepsList.map((s) => (typeof s === 'string' ? s : '')).join(' ').toLowerCase()
  const ingNames = (recipe.ingredients || []).map((i) => {
    const name = typeof i === 'object' && i != null && i.name != null ? i.name : i
    return name ? String(name).toLowerCase() : ''
  }).filter(Boolean)

  for (const term of terms) {
    if (term.length < 2) continue
    if (title.includes(term)) score += FIELD_WEIGHTS.title
    const idf = ingredientIDF.get(term) ?? 1
    if (ingNames.some((n) => n.includes(term))) score += FIELD_WEIGHTS.ingredient * idf
    if (desc.includes(term)) score += FIELD_WEIGHTS.description
    if (stepsText.includes(term)) score += FIELD_WEIGHTS.steps
  }
  return score
}

/**
 * Rank recipes by Relevance + User preference + Recipe quality.
 * If user has cuisine preferences, preferred recipes come first (by pref, then relevance+quality), then rest by relevance+quality.
 * Otherwise sort by total score descending.
 *
 * @param {Object[]} recipes - Array of recipe objects (camelCase from mapper)
 * @param {string} keyword - Search query (optional)
 * @param {Object} preferences - { cuisine_weights, diet_toggles, budget_default, time_default }
 * @returns {Object[]} Sorted recipes (best first)
 */
function rankRecipes(recipes, keyword = '', preferences = {}) {
  if (!recipes.length) return []

  const ingredientIDF = buildIngredientIDF(recipes)
  const cuisineWeights = preferences.cuisine_weights || preferences.cuisineWeights || {}
  const hasPreferred = Object.keys(cuisineWeights).some((k) => (cuisineWeights[k] || 0) > 0)

  const scored = recipes.map((r) => {
    const rel = relevanceScore(r, keyword, ingredientIDF)
    const pref = preferenceScore(r, preferences)
    const qual = qualityScore(r)
    return {
      recipe: r,
      userPref: pref,
      relevancePlusQuality: rel + qual,
      total: rel + pref + qual,
    }
  })

  if (hasPreferred) {
    const preferred = scored.filter((x) => x.userPref > 0).sort((a, b) => {
      if (b.userPref !== a.userPref) return b.userPref - a.userPref
      return b.relevancePlusQuality - a.relevancePlusQuality
    })
    const rest = scored.filter((x) => x.userPref === 0).sort((a, b) => b.relevancePlusQuality - a.relevancePlusQuality)
    return preferred.map((x) => x.recipe).concat(rest.map((x) => x.recipe))
  }

  scored.sort((a, b) => b.total - a.total)
  return scored.map((x) => x.recipe)
}

export { rankRecipes, buildIngredientIDF, relevanceScore, preferenceScore, qualityScore }
