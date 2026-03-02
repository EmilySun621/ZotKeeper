/**
 * Card theme: gradient (color, accent), emoji, and optional Tailwind classes.
 * Used by FeedCard for Bold Color Block style. Keys are lowercase.
 */
export const CUISINE_THEMES = {
  italian: { color: '#B45309', accent: '#D97706', emoji: '🍝' },
  japanese: { color: '#E11D48', accent: '#F43F5E', emoji: '🍣' },
  chinese: { color: '#DC2626', accent: '#EF4444', emoji: '🥡' },
  thai: { color: '#65A30D', accent: '#84CC16', emoji: '🍜' },
  vietnamese: { color: '#059669', accent: '#10B981', emoji: '🍲' },
  indian: { color: '#CA8A04', accent: '#EAB308', emoji: '🍛' },
  korean: { color: '#EA580C', accent: '#F97316', emoji: '🍱' },
  asian: { color: '#0D9488', accent: '#14B8A6', emoji: '🥢' },
  mexican: { color: '#15803D', accent: '#22C55E', emoji: '🌮' },
  american: { color: '#0284C7', accent: '#0EA5E9', emoji: '🍔' },
  french: { color: '#7C3AED', accent: '#8B5CF6', emoji: '🥐' },
  mediterranean: { color: '#B45309', accent: '#D97706', emoji: '🫒' },
  greek: { color: '#2563EB', accent: '#3B82F6', emoji: '🥗' },
  british: { color: '#57534E', accent: '#78716C', emoji: '☕' },
  irish: { color: '#15803D', accent: '#16A34A', emoji: '🥧' },
  spanish: { color: '#C2410C', accent: '#EA580C', emoji: '🥘' },
  german: { color: '#57534E', accent: '#78716C', emoji: '🥨' },
  moroccan: { color: '#C2410C', accent: '#EA580C', emoji: '🫓' },
  'middle eastern': { color: '#A16207', accent: '#CA8A04', emoji: '🧆' },
  cajun: { color: '#B91C1C', accent: '#DC2626', emoji: '🦞' },
  creole: { color: '#A16207', accent: '#CA8A04', emoji: '🍤' },
  hawaiian: { color: '#0D9488', accent: '#14B8A6', emoji: '🥑' },
}

const DEFAULT_THEME = { color: '#B45309', accent: '#D97706', emoji: '🍽️' }

export function getCuisineTheme(cuisineTags) {
  const first = (cuisineTags && cuisineTags[0]) ? String(cuisineTags[0]).toLowerCase().trim() : ''
  return CUISINE_THEMES[first] || DEFAULT_THEME
}
