/**
 * Map TheMealDB area names to continents for "Explore by region".
 * Any area from the API not listed here will appear under "Other".
 */
export const AREA_TO_CONTINENT = {
  American: 'Americas',
  Canadian: 'Americas',
  Mexican: 'Americas',
  Jamaican: 'Americas',
  Brazilian: 'Americas',
  Peruvian: 'Americas',

  British: 'Europe',
  Irish: 'Europe',
  French: 'Europe',
  Italian: 'Europe',
  Spanish: 'Europe',
  Greek: 'Europe',
  Dutch: 'Europe',
  Polish: 'Europe',
  Portuguese: 'Europe',
  Croatian: 'Europe',

  Japanese: 'Asia',
  Chinese: 'Asia',
  Thai: 'Asia',
  Vietnamese: 'Asia',
  Indian: 'Asia',
  Malaysian: 'Asia',
  Filipino: 'Asia',
  Korean: 'Asia',

  Moroccan: 'Africa',
  Egyptian: 'Africa',
  Tunisian: 'Africa',
  Kenyan: 'Africa',

  Turkish: 'Middle East',
  Armenian: 'Middle East',
}

export const CONTINENT_ORDER = ['Americas', 'Europe', 'Asia', 'Africa', 'Middle East', 'Other']

/**
 * Group an array of area names by continent.
 * @param {string[]} areas
 * @returns {{ [continent]: string[] }}
 */
export function groupAreasByContinent(areas) {
  const groups = {}
  for (const area of areas) {
    const continent = AREA_TO_CONTINENT[area] || 'Other'
    if (!groups[continent]) groups[continent] = []
    groups[continent].push(area)
  }
  for (const c of CONTINENT_ORDER) {
    if (groups[c]) groups[c].sort((a, b) => a.localeCompare(b))
  }
  return groups
}
