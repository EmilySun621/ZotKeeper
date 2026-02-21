import { useState, useEffect } from 'react'
import { searchRecipes } from '../api/recipesBackend'
import { loadPreferences } from './usePreferences'

/**
 * Search recipes via the recipe ranking backend (DB + Python ranking).
 * Sends keyword, filters, and preferences to POST /api/search.
 */
export function useSearchRecipes(keyword, filters) {
  const [recipes, setRecipes] = useState([])
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
      limit: 200,
    })
      .then(({ recipes: list, suggestedKeyword: suggested }) => {
        if (!cancelled) {
          setRecipes(list)
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

  const results = (keyword || '').trim() ? recipes : []
  return { results, suggestedKeyword, loading, error }
}
