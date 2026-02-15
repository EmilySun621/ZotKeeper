/**
 * Partition recipes into mood-based sections for the homepage.
 * Each recipe is assigned to the first matching section; rest go to explore.
 */

export const MOOD_SECTIONS = [
  { id: 'midnight', title: 'Midnight Cravings', emoji: '🌙', categories: ['Beef', 'Pasta', 'Chicken'] },
  { id: 'coffee', title: 'Coffee Break', emoji: '☕', categories: ['Side', 'Vegetarian', 'Starter'] },
  { id: 'sweet', title: 'Sweet Therapy', emoji: '🍰', categories: ['Dessert'] },
]

function recipeMatchesSection(recipe, categories) {
  const tags = recipe.cuisineTags || []
  return categories.some((c) => tags.some((t) => t.toLowerCase() === c.toLowerCase()))
}

/**
 * Returns { midnightCravings, coffeeBreak, sweetTherapy, explore }.
 * Each mood array is a subset of recipes; explore is the full list (for masonry).
 */
export function partitionByMood(recipes) {
  const midnight = []
  const coffee = []
  const sweet = []
  const used = new Set()

  for (const r of recipes) {
    if (recipeMatchesSection(r, MOOD_SECTIONS[0].categories)) {
      midnight.push(r)
      used.add(r.id)
    } else if (recipeMatchesSection(r, MOOD_SECTIONS[1].categories)) {
      coffee.push(r)
      used.add(r.id)
    } else if (recipeMatchesSection(r, MOOD_SECTIONS[2].categories)) {
      sweet.push(r)
      used.add(r.id)
    }
  }

  return {
    midnight,
    coffee,
    sweet,
    explore: recipes,
  }
}
