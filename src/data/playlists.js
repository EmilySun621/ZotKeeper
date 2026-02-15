/**
 * Playlist definitions for homepage (NetEase-style).
 * Each playlist has slug, title, time label, and categories to filter recipes.
 */

export const PLAYLISTS = [
  {
    slug: 'quiet-comfort',
    title: 'Quiet Comfort',
    timeLabel: '🌙',
    categories: ['Beef', 'Pasta', 'Chicken'],
  },
  {
    slug: 'something-warm',
    title: 'Something Warm',
    timeLabel: '🍲',
    categories: ['Chicken', 'Beef', 'Seafood'],
  },
  {
    slug: 'just-one-bowl',
    title: 'Just One Bowl',
    timeLabel: '🥣',
    categories: ['Pasta', 'Vegetarian', 'Seafood'],
  },
  {
    slug: 'sweet-before-sleep',
    title: 'Sweet Things Before Sleep',
    timeLabel: '🍰',
    categories: ['Dessert'],
  },
  {
    slug: 'regulars-favorites',
    title: "Regulars' Favorites",
    timeLabel: '♥',
    categories: ['Beef', 'Chicken', 'Dessert', 'Pasta'],
  },
  {
    slug: 'tonights-special',
    title: "Tonight's Special",
    timeLabel: '✨',
    categories: ['Seafood', 'Beef', 'Vegetarian'],
  },
  {
    slug: 'only-after-dark',
    title: 'Only Available After Dark',
    timeLabel: '🌙',
    categories: ['Dessert', 'Beef', 'Pasta'],
  },
]

export function getPlaylistBySlug(slug) {
  return PLAYLISTS.find((p) => p.slug === slug) ?? null
}

export function recipeInPlaylist(recipe, playlist) {
  const tags = recipe.cuisineTags || []
  return playlist.categories.some((c) =>
    tags.some((t) => t.toLowerCase() === c.toLowerCase())
  )
}

export function filterRecipesForPlaylist(recipes, playlist) {
  return recipes.filter((r) => recipeInPlaylist(r, playlist))
}
