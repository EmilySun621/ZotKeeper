import { useState, useEffect } from 'react'
import { searchRecipes } from '../api/recipesBackend'
import { usePreferences } from './usePreferences'

const FEED_STORAGE_KEY = 'zotkeeper_feed_cache'

function getPreferenceKey(preferences) {
  if (!preferences) return ''
  const o = {
    cuisineWeights: preferences.cuisineWeights ?? {},
    dietToggles: preferences.dietToggles ?? {},
    spiceLevel: preferences.spiceLevel ?? 2,
  }
  const sorted = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    return Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sorted(obj[k])
        return acc
      }, {})
  }
  return JSON.stringify(sorted(o))
}

function loadFeedFromStorage() {
  try {
    const raw = sessionStorage.getItem(FEED_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.recipes?.length && data.prefKey != null) return data
  } catch (_) {}
  return null
}

function saveFeedToStorage(recipes, prefKey) {
  try {
    sessionStorage.setItem(FEED_STORAGE_KEY, JSON.stringify({ recipes, prefKey }))
  } catch (_) {}
}

/**
 * Feed recipes from recipe ranking backend (no keyword = first N ranked by preference + quality).
 * Cached per preference key so list stays stable when navigating back.
 */
export function useFeedRecipes() {
  const { preferences } = usePreferences()
  const prefKey = getPreferenceKey(preferences)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stored = loadFeedFromStorage()
    if (stored && stored.prefKey === prefKey && stored.recipes.length > 0) {
      setRecipes(stored.recipes)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    searchRecipes({
      keyword: '',
      filters: {},
      preferences: {
        cuisineWeights: preferences.cuisineWeights ?? {},
        dietToggles: preferences.dietToggles ?? {},
        budgetDefault: preferences.budgetDefault,
        timeDefault: preferences.timeDefault,
        dislikedIngredients: preferences.dislikedIngredients ?? [],
        allergiesToAvoid: preferences.allergiesToAvoid ?? [],
      },
      limit: 24,
    })
      .then(({ recipes: list }) => {
        if (cancelled) return
        saveFeedToStorage(list, prefKey)
        setRecipes(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load recipes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [prefKey])

  return { recipes, loading, error }
}
