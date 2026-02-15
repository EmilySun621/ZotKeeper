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

function preferenceBoost(recipe, preferences) {
  let boost = 0
  const { cuisineWeights = {}, dietToggles = {} } = preferences || {}
  recipe.cuisineTags?.forEach((c) => {
    const w = cuisineWeights[c]
    if (w != null && w > 0) boost += w * 2
  })
  recipe.dietTags?.forEach((d) => {
    if (dietToggles[d]) boost += 3
  })
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
