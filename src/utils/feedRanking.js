/**
 * Rank recipes for the daily feed:
 * baseScore = popularityScore + date-seeded randomness
 * boost if recipe matches user preferences (cuisine weights, diet toggles)
 */

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function dateSeed() {
  const d = new Date()
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate()
}

/** Deterministic numeric seed from recipe id so same recipe always gets same score. */
function idSeed(id) {
  if (!id) return 0
  return [...String(id)].reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

function normalizeDietTag(tag) {
  if (!tag || typeof tag !== 'string') return ''
  return tag.trim().toLowerCase().replace(/\s+/g, '-')
}

function normalizeDietKey(tag) {
  const norm = normalizeDietTag(tag)
  if (norm === 'pescatarian') return 'pescetarian'
  return norm
}

function getCuisineWeight(cuisineWeights, tag) {
  if (!tag || typeof tag !== 'string') return 0
  const t = tag.trim()
  if (cuisineWeights[t] != null) return cuisineWeights[t]
  const lower = t.toLowerCase()
  const key = Object.keys(cuisineWeights).find((k) => k.toLowerCase() === lower)
  return key != null ? cuisineWeights[key] : 0
}

const LOW_CALORIE_MAX = 450
const HIGH_PROTEIN_MIN = 20
const LOW_CARB_MAX = 30
const BUDGET_FRIENDLY_MAX_PRICE = 400

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

function preferenceBoost(recipe, preferences) {
  let boost = 0
  const {
    cuisineWeights = {},
    dietToggles = {},
    lowCaloriePriority,
    highProteinPriority,
    lowCarbPriority,
    budgetFriendlyPriority,
  } = preferences || {}
  recipe.cuisineTags?.forEach((c) => {
    const w = getCuisineWeight(cuisineWeights, c)
    if (w != null && w > 0) boost += w * 2
  })
  recipe.dietTags?.forEach((d) => {
    const key = normalizeDietKey(d)
    if (key && dietToggles[key]) boost += 3
  })
  if (lowCaloriePriority && isLowCalorie(recipe.calories)) boost += 8
  if (highProteinPriority && isHighProtein(recipe.protein)) boost += 6
  if (lowCarbPriority && isLowCarb(recipe.carbs)) boost += 6
  if (budgetFriendlyPriority && isBudgetFriendly(recipe)) boost += 5
  return boost
}

/**
 * Returns recipes sorted by feed score (highest first).
 * Order is deterministic: same recipes + same preferences + same day => same order every time.
 */
export function rankFeedRecipes(recipes, preferences = {}) {
  const seed = dateSeed()
  const scored = recipes.map((r) => {
    const randomPart = seededRandom(seed + idSeed(r.id)) * 15
    const base = (r.popularityScore ?? 50) + randomPart
    const pref = preferenceBoost(r, preferences)
    return { recipe: r, score: base + pref }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.recipe)
}
