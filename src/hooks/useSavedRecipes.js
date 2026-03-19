import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY_PREFIX = 'zotkeeper_saved_recipes'
const CHANGE_EVENT = 'zotkeeper_saved_recipes_change'

function getStorageKey(username) {
  return username ? `${STORAGE_KEY_PREFIX}:${username}` : STORAGE_KEY_PREFIX
}

function loadSaved(storageKey) {
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
    if (raw) {
      const list = JSON.parse(raw)
      return new Set(Array.isArray(list) ? list.map((id) => String(id)) : [])
    }
  } catch (_) {}
  return new Set()
}

function saveToStorage(storageKey, ids) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...ids].map((id) => String(id))))
  } catch (_) {}
}

function emitChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function areSetsEqual(a, b) {
  if (a === b) return true
  if (!a || !b || a.size !== b.size) return false
  for (const v of a) {
    if (!b.has(v)) return false
  }
  return true
}

/**
 * Persisted saved recipe IDs in localStorage.
 * Returns { savedIds, isSaved(id), toggleSaved(id), setSaved(id, value) }.
 */
export function useSavedRecipes() {
  const { user } = useAuth()
  const storageKey = useMemo(() => getStorageKey(user?.username), [user?.username])
  const [savedIds, setSavedIds] = useState(() => loadSaved(storageKey))

  useEffect(() => {
    const handleChange = () => {
      const next = loadSaved(storageKey)
      setSavedIds((prev) => (areSetsEqual(prev, next) ? prev : next))
    }
    const handleStorage = (e) => {
      if (e.key === storageKey) handleChange()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(CHANGE_EVENT, handleChange)
      window.addEventListener('storage', handleStorage)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(CHANGE_EVENT, handleChange)
        window.removeEventListener('storage', handleStorage)
      }
    }
  }, [storageKey])

  useEffect(() => {
    setSavedIds(loadSaved(storageKey))
  }, [storageKey])

  const isSaved = useCallback((id) => savedIds.has(String(id)), [savedIds])
  const toggleSaved = useCallback((id) => {
    const key = String(id)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveToStorage(storageKey, next)
      emitChange()
      return next
    })
  }, [storageKey])
  const setSaved = useCallback((id, value) => {
    const key = String(id)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (value) next.add(key)
      else next.delete(key)
      saveToStorage(storageKey, next)
      emitChange()
      return next
    })
  }, [storageKey])

  return { savedIds, isSaved, toggleSaved, setSaved }
}
