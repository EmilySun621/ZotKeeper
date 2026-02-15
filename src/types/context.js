/**
 * Context types for the recommendation system.
 * Values match option keys used in mock data tags.
 */

export const FOOD_CONTEXT_KEYS = {
  timeOfDay: ['morning', 'afternoon', 'evening', 'late_night'],
  location: ['on_campus', 'at_home', 'outside'],
  budget: ['low', 'medium', 'high'],
  mood: ['tired', 'normal', 'energetic'],
  timeAvailable: ['quick', 'medium', 'long'],
  weather: ['sunny', 'rainy', 'cold'],
  dietary: ['none', 'vegan', 'halal', 'no_beef', 'gluten_free', 'nut_allergy'],
  noise: ['quiet', 'lively'],
  partySize: ['1', '2', '3-4', '5+'],
}

export const TRAVEL_CONTEXT_KEYS = {
  weather: ['sunny', 'rainy', 'cold'],
  timeAvailable: ['quick', 'medium', 'long'],
  companion: ['solo', 'family', 'friends'],
  energy: ['low', 'medium', 'high'],
}

export const DEFAULT_FOOD_CONTEXT = {
  timeOfDay: 'afternoon',
  location: 'on_campus',
  budget: 'medium',
  mood: 'normal',
  timeAvailable: 'medium',
  weather: 'sunny',
  dietary: 'none',
  noise: 'lively',
  partySize: '2',
  ingredients: '',
}

export const DEFAULT_TRAVEL_CONTEXT = {
  weather: 'sunny',
  timeAvailable: 'medium',
  companion: 'friends',
  energy: 'medium',
}
