/**
 * Map recipe-backend cuisine tags to continents for "Explore by region".
 * Cuisine tags match DB (e.g. japanese, middle eastern).
 */
export const CUISINE_TO_CONTINENT = {
  american: 'Americas',
  mexican: 'Americas',
  cajun: 'Americas',
  creole: 'Americas',
  british: 'Europe',
  irish: 'Europe',
  french: 'Europe',
  italian: 'Europe',
  spanish: 'Europe',
  greek: 'Europe',
  german: 'Europe',
  mediterranean: 'Europe',
  japanese: 'Asia',
  chinese: 'Asia',
  thai: 'Asia',
  vietnamese: 'Asia',
  indian: 'Asia',
  korean: 'Asia',
  asian: 'Asia',
  moroccan: 'Africa',
  'middle eastern': 'Middle East',
}

export const CONTINENT_ORDER = ['Americas', 'Europe', 'Asia', 'Africa', 'Middle East', 'Other']

/**
 * Group an array of cuisine tags (from API) by continent.
 * @param {string[]} cuisines - e.g. ["japanese", "thai", "french"]
 * @returns {{ [continent]: string[] }}
 */
export function groupCuisinesByContinent(cuisines) {
  const groups = {}
  for (const c of cuisines) {
    const key = (c || '').toLowerCase().trim()
    const continent = CUISINE_TO_CONTINENT[key] || 'Other'
    if (!groups[continent]) groups[continent] = []
    if (!groups[continent].includes(c)) groups[continent].push(c)
  }
  for (const cont of CONTINENT_ORDER) {
    if (groups[cont]) groups[cont].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
  }
  return groups
}
