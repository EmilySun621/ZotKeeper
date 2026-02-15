import { useState, useEffect, useMemo } from 'react'
import { getMealsByIds } from '../api/themealdb'
import { useSavedRecipes } from './useSavedRecipes'

/**
 * Fetch full recipe data for saved IDs from TheMealDB.
 */
export function useSavedRecipesData(sort = 'recent') {
  const { savedIds } = useSavedRecipes()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const idList = [...savedIds]

  useEffect(() => {
    if (idList.length === 0) {
      setRecipes([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getMealsByIds(idList)
      .then((list) => {
        if (!cancelled) setRecipes(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load saved recipes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
  }, [idList.join(',')])

  const sorted = useMemo(() => {
    const list = [...recipes]
    if (sort === 'time') list.sort((a, b) => (a.timeMinutes ?? 0) - (b.timeMinutes ?? 0))
    else if (sort === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    return list
  }, [recipes, sort])

  return { savedRecipes: sorted, loading, error }
}
