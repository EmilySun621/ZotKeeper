import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_PREFERENCES } from '../constants/preferences'

const STORAGE_KEY = 'zotkeeper_preferences'

/** Load current preferences from localStorage. Use this when you need the latest saved state (e.g. search ranking) instead of in-memory state. */
export function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch (_) {}
  return { ...DEFAULT_PREFERENCES }
}

function saveToStorage(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (_) {}
}

/**
 * User preference settings persisted in localStorage.
 * Used for search ranking and profile settings.
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState(loadPreferences)

  useEffect(() => {
    saveToStorage(preferences)
  }, [preferences])

  const update = useCallback((partial) => {
    setPreferences((p) => ({ ...p, ...partial }))
  }, [])

  const setCuisineWeight = useCallback((cuisine, weight) => {
    setPreferences((p) => {
      const next = {
        ...p,
        cuisineWeights: { ...p.cuisineWeights, [cuisine]: Math.max(0, Math.min(5, weight)) },
      }
      saveToStorage(next) // save immediately so it's persisted even if user navigates away fast
      return next
    })
  }, [])

  const setDietToggle = useCallback((diet, on) => {
    setPreferences((p) => ({
      ...p,
      dietToggles: { ...p.dietToggles, [diet]: on },
    }))
  }, [])

  const addDislikedIngredient = useCallback((ingredient) => {
    const norm = ingredient.trim().toLowerCase()
    if (!norm) return
    setPreferences((p) => ({
      ...p,
      dislikedIngredients: [...new Set([...p.dislikedIngredients, norm])],
    }))
  }, [])

  const removeDislikedIngredient = useCallback((ingredient) => {
    setPreferences((p) => ({
      ...p,
      dislikedIngredients: p.dislikedIngredients.filter((x) => x !== ingredient),
    }))
  }, [])

  return {
    preferences,
    update,
    setCuisineWeight,
    setDietToggle,
    addDislikedIngredient,
    removeDislikedIngredient,
  }
}
