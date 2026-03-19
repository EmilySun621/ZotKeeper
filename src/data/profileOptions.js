import { DEFAULT_PREFERENCES } from '../constants/preferences'

const PREF_STORAGE_KEY_PREFIX = 'zotkeeper_preferences'
const CURRENT_USER_KEY = 'cooking_app_current_user'

function getPreferenceKey(username) {
  return username ? `${PREF_STORAGE_KEY_PREFIX}:${username}` : PREF_STORAGE_KEY_PREFIX
}

function getCurrentUsername() {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || ''
  } catch (_) {
    return ''
  }
}

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

const dietToToggle = {
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
  Pescatarian: 'pescatarian',
  'No red meat': 'no-red-meat',
  'No pork': 'no-pork',
  'No beef': 'no-beef',
  'No seafood': 'no-seafood',
  Halal: 'halal',
  Kosher: 'kosher',
  'Gluten-free': 'gluten-free',
  'Dairy-free': 'dairy-free',
  'Low carb': 'low-carb',
  'Low sugar': 'low-sugar',
}

/** Sync user profile (about you) to zotkeeper_preferences for search/feed */
export function syncProfileToPreferences(profile, username) {
  try {
    const key = getPreferenceKey(username || getCurrentUsername())
    const raw = localStorage.getItem(key)
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
    const disliked = [...(prefs.dislikedIngredients || [])]
    for (const a of profile.allergies || []) {
      const low = a.trim().toLowerCase()
      if (low && !disliked.includes(low)) disliked.push(low)
    }
    prefs.dislikedIngredients = disliked
    prefs.lowCaloriePriority = !!profile.lowCaloriePriority
    prefs.highProteinPriority = !!profile.highProteinPriority
    prefs.lowCarbPriority = !!profile.lowCarbPriority
    prefs.budgetFriendlyPriority = !!profile.budgetFriendlyPriority
    localStorage.setItem(key, JSON.stringify(prefs))
    if (key !== PREF_STORAGE_KEY_PREFIX) {
      localStorage.removeItem(PREF_STORAGE_KEY_PREFIX)
    }
  } catch (_) {}
}
