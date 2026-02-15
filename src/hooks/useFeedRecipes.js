import { useState, useEffect } from 'react'
import { getFeedMeals } from '../api/themealdb'
import { rankFeedRecipes } from '../utils/feedRanking'
import { usePreferences } from './usePreferences'

const FEED_STORAGE_KEY = 'zotkeeper_feed_cache'

/** Stable key so same preferences always get the same string */
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
 * Feed recipes: cached so the list stays the same when you navigate back.
 * Only refetches when preferences change.
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
    getFeedMeals(24)
      .then((list) => {
        if (cancelled) return
        const ranked = rankFeedRecipes(list, preferences)
        saveFeedToStorage(ranked, prefKey)
        setRecipes(ranked)
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
