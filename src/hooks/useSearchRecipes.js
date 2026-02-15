import { useState, useEffect, useMemo } from 'react'
import { searchMeals, filterByArea } from '../api/themealdb'
import { filterAndRankRecipes, recipeMatchesKeyword } from '../utils/searchRanking'
import { loadPreferences } from './usePreferences'

/** Cuisine names that match TheMealDB area (filter.php?a=). Others are skipped for area fetch. */
const THEMEALDB_AREAS = new Set([
  'American', 'Canadian', 'Mexican', 'Jamaican', 'Brazilian', 'Peruvian',
  'British', 'Irish', 'French', 'Italian', 'Spanish', 'Greek', 'Dutch', 'Polish', 'Portuguese', 'Croatian',
  'Japanese', 'Chinese', 'Thai', 'Vietnamese', 'Indian', 'Malaysian', 'Filipino', 'Korean',
  'Moroccan', 'Egyptian', 'Tunisian', 'Kenyan', 'Turkish', 'Armenian',
])

/**
 * Search recipes via TheMealDB, then filter and rank by preference.
 * When user has strong cuisine preferences (weight >= 4), also fetches meals from those areas
 * and merges in any that match the keyword, so e.g. "chicken" + Thai/Japanese preference
 * surfaces Thai/Japanese chicken dishes even if they don't appear in name search.
 */
export function useSearchRecipes(keyword, filters) {
  const [apiRecipes, setApiRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [prefsRevision, setPrefsRevision] = useState(0)
  useEffect(() => {
    setPrefsRevision((r) => r + 1)
  }, [])

  useEffect(() => {
    const q = keyword.trim()
    if (!q) {
      setApiRecipes([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    const { cuisineWeights = {} } = loadPreferences()
    const topCuisines = Object.entries(cuisineWeights)
      .filter(([, w]) => w >= 4)
      .map(([c]) => c)
      .filter((c) => THEMEALDB_AREAS.has(c))
      .slice(0, 4) // limit to 4 areas to avoid too many requests

    const searchPromise = searchMeals(q)
    const areaPromises = topCuisines.map((area) =>
      filterByArea(area).catch(() => [])
    )

    Promise.all([searchPromise, ...areaPromises])
      .then(([searchResult, ...areaResults]) => {
        if (cancelled) return
        const mainMeals = searchResult.meals || []
        const byId = new Map(mainMeals.map((r) => [r.id, r]))
        areaResults.flat().forEach((r) => {
          if (r && r.id && recipeMatchesKeyword(r, q) && !byId.has(r.id)) {
            byId.set(r.id, r)
          }
        })
        setApiRecipes(Array.from(byId.values()))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Search failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [keyword])

  const results = useMemo(() => {
    const list = keyword.trim() ? apiRecipes : []
    if (!list.length) return []
    const filtered = filterAndRankRecipes(list, keyword, filters || {})
    // If filters removed everyone, show ranked results anyway (so e.g. time=Quick doesn’t hide all)
    if (filtered.length === 0 && list.length > 0) {
      return filterAndRankRecipes(list, keyword, {})
    }
    return filtered
  }, [apiRecipes, keyword, filters, prefsRevision])

  return { results, loading, error }
}
