import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DEFAULT_PREFERENCES } from '../constants/preferences'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY_PREFIX = 'zotkeeper_preferences'
const CURRENT_USER_KEY = 'cooking_app_current_user'

function getStorageKey(username) {
  return username ? `${STORAGE_KEY_PREFIX}:${username}` : STORAGE_KEY_PREFIX
}

function getCurrentUsername() {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || ''
  } catch (_) {
    return ''
  }
}

/** Load current preferences from localStorage. Use this when you need the latest saved state (e.g. search ranking) instead of in-memory state. */
export function loadPreferences(username) {
  const storageKey = getStorageKey(username || getCurrentUsername())
  try {
    let raw = localStorage.getItem(storageKey)
    if (!raw && storageKey !== STORAGE_KEY_PREFIX) {
      const legacy = localStorage.getItem(STORAGE_KEY_PREFIX)
      if (legacy) {
        localStorage.setItem(storageKey, legacy)
        localStorage.removeItem(STORAGE_KEY_PREFIX)
        raw = legacy
      }
    }
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch (_) {}
  return { ...DEFAULT_PREFERENCES }
}

function saveToStorage(storageKey, prefs) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(prefs))
  } catch (_) {}
}

/**
 * User preference settings persisted in localStorage.
 * Used for search ranking and profile settings.
 */
export function usePreferences() {
  const { user } = useAuth()
  const storageKey = useMemo(() => getStorageKey(user?.username), [user?.username])
  const [preferences, setPreferences] = useState(() => loadPreferences(user?.username))
  const skipSaveRef = useRef(true)

  useEffect(() => {
    setPreferences(loadPreferences(user?.username))
    skipSaveRef.current = true
  }, [storageKey])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    saveToStorage(storageKey, preferences)
  }, [storageKey, preferences])

  const update = useCallback((partial) => {
    setPreferences((p) => ({ ...p, ...partial }))
  }, [])

  const setCuisineWeight = useCallback((cuisine, weight) => {
    setPreferences((p) => {
      const next = {
        ...p,
        cuisineWeights: { ...p.cuisineWeights, [cuisine]: Math.max(0, Math.min(5, weight)) },
      }
      saveToStorage(storageKey, next) // save immediately so it's persisted even if user navigates away fast
      return next
    })
  }, [storageKey])

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
