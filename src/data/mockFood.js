/**
 * Mock food recommendations (meals and restaurants).
 * Tags align with context keys for client-side ranking.
 */

export const MOCK_MEALS = [
  {
    id: 'm1',
    name: 'Avocado Toast',
    type: 'meal',
    explanation: 'Quick to make, fits morning & low energy. No cooking skill needed.',
    tags: { timeOfDay: ['morning'], budget: ['low', 'medium'], mood: ['tired', 'normal'], timeAvailable: ['quick'], dietary: ['vegan', 'none'] },
  },
  {
    id: 'm2',
    name: 'Overnight Oats',
    type: 'meal',
    explanation: 'Prep ahead for morning. Fits at-home and quick. Vegan-friendly.',
    tags: { timeOfDay: ['morning'], location: ['at_home'], budget: ['low'], timeAvailable: ['quick'], dietary: ['vegan', 'none'] },
  },
  {
    id: 'm3',
    name: 'Grilled Cheese & Tomato Soup',
    type: 'meal',
    explanation: 'Comfort food for rainy or cold days. Quick and low effort.',
    tags: { weather: ['rainy', 'cold'], timeAvailable: ['quick', 'medium'], location: ['at_home'], mood: ['tired', 'normal'] },
  },
  {
    id: 'm4',
    name: 'Pasta Primavera',
    type: 'meal',
    explanation: 'Medium effort, great for evening at home. Use whatever veggies you have.',
    tags: { timeOfDay: ['evening'], location: ['at_home'], timeAvailable: ['medium', 'long'], budget: ['medium'], dietary: ['vegan', 'none'] },
  },
  {
    id: 'm5',
    name: 'Late-Night Ramen',
    type: 'meal',
    explanation: 'Quick, satisfying for late night. Fits tired mood and low budget.',
    tags: { timeOfDay: ['late_night'], timeAvailable: ['quick'], mood: ['tired'], budget: ['low', 'medium'] },
  },
  {
    id: 'm6',
    name: 'Salmon Bowl',
    type: 'meal',
    explanation: 'Energetic choice with good protein. Medium time, medium budget.',
    tags: { mood: ['energetic', 'normal'], timeAvailable: ['medium'], budget: ['medium', 'high'], dietary: ['none', 'no_beef'] },
  },
  {
    id: 'm7',
    name: 'Hummus & Veggie Wrap',
    type: 'meal',
    explanation: 'Portable for on-the-go. Vegan, quick, and low budget.',
    tags: { location: ['on_campus', 'outside'], dietary: ['vegan', 'none'], timeAvailable: ['quick'], budget: ['low'] },
  },
  {
    id: 'm8',
    name: 'Halal Chicken Rice',
    type: 'meal',
    explanation: 'Filling and halal. Good for medium time and any location.',
    tags: { dietary: ['halal'], timeAvailable: ['medium'], budget: ['low', 'medium'] },
  },
  {
    id: 'm9',
    name: 'Smoothie Bowl',
    type: 'meal',
    explanation: 'Light and energizing. Perfect for sunny morning or afternoon.',
    tags: { timeOfDay: ['morning', 'afternoon'], weather: ['sunny'], mood: ['energetic', 'normal'], dietary: ['vegan', 'none'] },
  },
  {
    id: 'm10',
    name: 'Beef Stir-Fry',
    type: 'meal',
    explanation: 'High energy, longer cook. Not for no-beef or vegan.',
    tags: { mood: ['energetic'], timeAvailable: ['medium', 'long'], dietary: ['none'], budget: ['medium'] },
  },
]

export const MOCK_RESTAURANTS = [
  {
    id: 'r1',
    name: 'Campus Coffee & Bites',
    type: 'restaurant',
    explanation: 'Quick breakfast and coffee. On campus, low budget, quiet option.',
    tags: { location: ['on_campus'], timeOfDay: ['morning', 'afternoon'], budget: ['low'], noise: ['quiet'], timeAvailable: ['quick'] },
  },
  {
    id: 'r2',
    name: 'The Cozy Nook',
    type: 'restaurant',
    explanation: 'Quiet spot for tired days. Rainy-day comfort food.',
    tags: { noise: ['quiet'], mood: ['tired', 'normal'], weather: ['rainy', 'cold'], budget: ['medium'] },
  },
  {
    id: 'r3',
    name: 'Sunset Grill',
    type: 'restaurant',
    explanation: 'Evening and late-night. Lively vibe, medium to high budget.',
    tags: { timeOfDay: ['evening', 'late_night'], noise: ['lively'], budget: ['medium', 'high'], partySize: ['2', '3-4', '5+'] },
  },
  {
    id: 'r4',
    name: 'Green Leaf Kitchen',
    type: 'restaurant',
    explanation: 'Vegan and vegetarian focus. Quiet, medium time.',
    tags: { dietary: ['vegan'], noise: ['quiet'], timeAvailable: ['medium'], budget: ['medium'] },
  },
  {
    id: 'r5',
    name: 'Halal Express',
    type: 'restaurant',
    explanation: 'Quick halal options. On campus or outside, low budget.',
    tags: { dietary: ['halal'], timeAvailable: ['quick'], budget: ['low'], location: ['on_campus', 'outside'] },
  },
  {
    id: 'r6',
    name: 'Riverside Patio',
    type: 'restaurant',
    explanation: 'Sunny day outdoor seating. Lively, good for groups.',
    tags: { weather: ['sunny'], noise: ['lively'], partySize: ['3-4', '5+'], location: ['outside'] },
  },
  {
    id: 'r7',
    name: 'Quick Bites Food Truck',
    type: 'restaurant',
    explanation: 'Fast, cheap, on the go. Fits quick and low energy.',
    tags: { timeAvailable: ['quick'], budget: ['low'], mood: ['tired'], location: ['on_campus', 'outside'] },
  },
  {
    id: 'r8',
    name: 'Fine Dining at The Plaza',
    type: 'restaurant',
    explanation: 'Long meal, high budget. Best for energetic evenings with time.',
    tags: { timeAvailable: ['long'], budget: ['high'], mood: ['energetic', 'normal'], timeOfDay: ['evening'] },
  },
  {
    id: 'r9',
    name: 'Family Table',
    type: 'restaurant',
    explanation: 'Quiet, family-friendly. Good for medium time and budget.',
    tags: { noise: ['quiet'], partySize: ['3-4', '5+'], budget: ['medium'], timeAvailable: ['medium'] },
  },
  {
    id: 'r10',
    name: 'Late Night Tacos',
    type: 'restaurant',
    explanation: 'Open late, quick, lively. Perfect for late night + quick.',
    tags: { timeOfDay: ['late_night'], timeAvailable: ['quick'], noise: ['lively'], budget: ['low', 'medium'] },
  },
]
