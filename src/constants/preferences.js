/** Default keys and options for user preferences (search + profile) */

export const CUISINE_OPTIONS = [
  'Italian', 'Japanese', 'Asian', 'Chinese', 'Middle Eastern', 'Mediterranean',
  'Moroccan', 'American', 'Thai', 'Greek', 'Indian', 'Mexican', 'Korean',
  'French', 'Vietnamese',
]

export const DIET_OPTIONS = [
  'vegan', 'vegetarian', 'halal', 'gluten-free', 'dairy-free',
]

export const TIME_OPTIONS = [
  { value: 'quick', label: 'Quick', maxMinutes: 30 }, // 30 so TheMealDB default (30 min) still shows
  { value: 'medium', label: 'Medium', maxMinutes: 60 },
  { value: 'long', label: 'Long', maxMinutes: 999 },
]

export const BUDGET_OPTIONS = ['low', 'medium', 'high']

export const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard']

export const DEFAULT_PREFERENCES = {
  cuisineWeights: {}, // { [cuisine]: 0-5 }
  dietToggles: {},    // { [diet]: true/false }
  spiceLevel: 2,     // 0-5
  dislikedIngredients: [],
  budgetDefault: 'medium',
  timeDefault: 'medium',
}
