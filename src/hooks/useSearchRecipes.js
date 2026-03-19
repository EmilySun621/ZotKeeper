import { useState, useEffect } from 'react'
import { searchRecipes } from '../api/recipesBackend'
import { filterAndRankRecipes } from '../utils/searchRanking'
import { loadPreferences } from './usePreferences'

const PAGE_SIZE = 20
const FETCH_LIMIT = 100

/**
 * Search recipes via recipe API (Spoonacular). Supports pagination (page, 20 per page).
 */
export function useSearchRecipes(keyword, filters, page = 1) {
  const [recipes, setRecipes] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [suggestedKeyword, setSuggestedKeyword] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [prefsRevision, setPrefsRevision] = useState(0)

  useEffect(() => {
    setPrefsRevision((r) => r + 1)
  }, [])

  useEffect(() => {
    const q = (keyword || '').trim()
    if (!q) {
      setRecipes([])
      setTotalResults(0)
      setSuggestedKeyword(null)
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const preferences = loadPreferences()
    searchRecipes({
      keyword: q,
      filters: filters || {},
      preferences: {
        cuisineWeights: preferences.cuisineWeights || {},
        dietToggles: preferences.dietToggles || {},
        budgetDefault: preferences.budgetDefault,
        timeDefault: preferences.timeDefault,
        dislikedIngredients: preferences.dislikedIngredients || [],
        allergiesToAvoid: preferences.allergiesToAvoid || [],
      },
      limit: FETCH_LIMIT,
      offset: 0,
    })
      .then(({ recipes: list, suggestedKeyword: suggested }) => {
        if (!cancelled) {
          const ranked = filterAndRankRecipes(list || [], q, filters || {})
          setRecipes(ranked)
          setTotalResults(ranked.length)
          setSuggestedKeyword(suggested ?? null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Search failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [keyword, prefsRevision, JSON.stringify(filters || {})])

  const p = Math.max(1, Number(page) || 1)
  const start = (p - 1) * PAGE_SIZE
  const results = (keyword || '').trim() ? recipes.slice(start, start + PAGE_SIZE) : []
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  return { results, totalResults, totalPages, page: p, suggestedKeyword, loading, error }
}
