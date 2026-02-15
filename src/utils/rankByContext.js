/**
 * Client-side ranking: score and sort recommendations by context match.
 * No backend; uses tag overlap with current context.
 */

function scoreItem(item, context) {
  let score = 0
  for (const [key, contextValue] of Object.entries(context)) {
    if (!contextValue || key === 'ingredients') continue
    const tagValues = item.tags[key]
    if (Array.isArray(tagValues) && tagValues.includes(contextValue)) score += 2
  }
  return score
}

export function rankFoodRecommendations(meals, restaurants, context, recommendationType) {
  const pool = recommendationType === 'meals' ? [...meals] : [...restaurants]
  const scored = pool.map((item) => ({ item, score: scoreItem(item, context) }))
  scored.sort((a, b) => b.score - a.score)
  return scored.map(({ item }) => item)
}

export function rankTravelRecommendations(attractions, context) {
  const scored = attractions.map((item) => ({ item, score: scoreItem(item, context) }))
  scored.sort((a, b) => b.score - a.score)
  return scored.map(({ item }) => item)
}
