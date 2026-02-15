import { DEFAULT_PREFERENCES } from '../constants/preferences'

const PREF_STORAGE_KEY = 'zotkeeper_preferences'

/** Options for profile "About you" and onboarding (same source of truth) */
export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'No red meat', 'No pork', 'No beef', 'No seafood',
  'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'Low carb', 'Low sugar',
]

export const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Soy', 'Wheat',
  'Shellfish', 'Fish', 'Sesame',
]

export const CUISINE_OPTIONS = [
  'Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese', 'Indian', 'Italian',
  'Mexican', 'Mediterranean', 'French', 'American', 'Middle Eastern', 'Spanish',
]

export const SPICE_OPTIONS = ["Can't do spicy", 'Mild is okay', 'Love spicy']

const dietToToggle = {
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
  'Gluten-free': 'gluten-free',
  'Dairy-free': 'dairy-free',
  Halal: 'halal',
  Kosher: 'kosher',
}

const spiceToLevel = {
  "Can't do spicy": 0,
  'Mild is okay': 2,
  'Love spicy': 5,
}

/** Sync user profile (about you) to zotkeeper_preferences for search/feed */
export function syncProfileToPreferences(profile) {
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY)
    const prefs = raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES }
    const dietToggles = { ...prefs.dietToggles }
    for (const d of profile.dietaryRestrictions || []) {
      if (dietToToggle[d]) dietToggles[dietToToggle[d]] = true
    }
    prefs.dietToggles = dietToggles
    const cuisineWeights = { ...prefs.cuisineWeights }
    for (const c of profile.preferredCuisines || []) {
      cuisineWeights[c] = 4
    }
    prefs.cuisineWeights = cuisineWeights
    prefs.spiceLevel = spiceToLevel[profile.spiceLevel] ?? 2
    const disliked = [...(prefs.dislikedIngredients || [])]
    for (const a of profile.allergies || []) {
      const low = a.trim().toLowerCase()
      if (low && !disliked.includes(low)) disliked.push(low)
    }
    prefs.dislikedIngredients = disliked
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs))
  } catch (_) {}
}
