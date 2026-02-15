import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'zotkeeper_saved_recipes'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch (_) {}
  return new Set()
}

function saveToStorage(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch (_) {}
}

/**
 * Persisted saved recipe IDs in localStorage.
 * Returns { savedIds, isSaved(id), toggleSaved(id), setSaved(id, value) }.
 */
export function useSavedRecipes() {
  const [savedIds, setSavedIds] = useState(loadSaved)

  useEffect(() => {
    saveToStorage(savedIds)
  }, [savedIds])

  const isSaved = useCallback((id) => savedIds.has(id), [savedIds])
  const toggleSaved = useCallback((id) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const setSaved = useCallback((id, value) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  return { savedIds, isSaved, toggleSaved, setSaved }
}
