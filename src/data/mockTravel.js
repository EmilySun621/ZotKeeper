/**
 * Mock travel/attraction recommendations.
 * Tags align with travel context for client-side ranking.
 */

export const MOCK_ATTRACTIONS = [
  {
    id: 'a1',
    name: 'City Art Museum',
    type: 'attraction',
    explanation: 'Indoor, rainy-day friendly. Good for low energy and solo or small groups.',
    tags: { weather: ['rainy', 'cold'], energy: ['low', 'medium'], companion: ['solo', 'friends'], timeAvailable: ['medium', 'long'] },
  },
  {
    id: 'a2',
    name: 'Central Park Walk',
    type: 'attraction',
    explanation: 'Sunny day classic. Flexible time; good for any energy level.',
    tags: { weather: ['sunny'], timeAvailable: ['quick', 'medium', 'long'], energy: ['low', 'medium', 'high'], companion: ['solo', 'friends', 'family'] },
  },
  {
    id: 'a3',
    name: 'Indoor Trampoline Park',
    type: 'attraction',
    explanation: 'High energy, great for friends or family. Works in any weather.',
    tags: { energy: ['high'], companion: ['friends', 'family'], weather: ['rainy', 'sunny', 'cold'], timeAvailable: ['medium'] },
  },
  {
    id: 'a4',
    name: 'Historic District Tour',
    type: 'attraction',
    explanation: 'Medium to long visit. Good for sunny or cold; adaptable energy.',
    tags: { timeAvailable: ['medium', 'long'], weather: ['sunny', 'cold'], companion: ['solo', 'friends', 'family'], energy: ['medium', 'high'] },
  },
  {
    id: 'a5',
    name: 'Cozy Book Café Trail',
    type: 'attraction',
    explanation: 'Low energy, rainy or cold. Quick stops, solo or friends.',
    tags: { weather: ['rainy', 'cold'], energy: ['low'], timeAvailable: ['quick', 'medium'], companion: ['solo', 'friends'] },
  },
  {
    id: 'a6',
    name: 'Waterfront Bike Ride',
    type: 'attraction',
    explanation: 'Sunny day, high energy. Medium time, friends or solo.',
    tags: { weather: ['sunny'], energy: ['high'], timeAvailable: ['medium', 'long'], companion: ['solo', 'friends'] },
  },
  {
    id: 'a7',
    name: 'Science Center',
    type: 'attraction',
    explanation: 'Indoor, family-friendly. Rain or shine; medium to long visit.',
    tags: { weather: ['rainy', 'sunny', 'cold'], companion: ['family', 'friends'], timeAvailable: ['medium', 'long'], energy: ['medium', 'high'] },
  },
  {
    id: 'a8',
    name: 'Quick Viewpoint Photo Stop',
    type: 'attraction',
    explanation: 'Short visit, any weather. Low effort, good for tired days.',
    tags: { timeAvailable: ['quick'], energy: ['low', 'medium'], weather: ['sunny', 'rainy', 'cold'], companion: ['solo', 'friends', 'family'] },
  },
  {
    id: 'a9',
    name: 'Street Food Market',
    type: 'attraction',
    explanation: 'Lively, medium time. Best in dry weather; friends or family.',
    tags: { weather: ['sunny', 'cold'], companion: ['friends', 'family'], timeAvailable: ['medium'], energy: ['medium', 'high'] },
  },
  {
    id: 'a10',
    name: 'Spa & Wellness Half-Day',
    type: 'attraction',
    explanation: 'Low energy, any weather. Long, relaxing; solo or friends.',
    tags: { energy: ['low'], timeAvailable: ['long'], weather: ['rainy', 'sunny', 'cold'], companion: ['solo', 'friends'] },
  },
]
