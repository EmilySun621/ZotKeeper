import { useState, useEffect, useMemo } from 'react'
import { getRecipeById, getRecipesBulk } from '../api/recipesBackend'
import { useSavedRecipes } from './useSavedRecipes'

/**
 * Fetch full recipe data for saved IDs from recipe API (Spoonacular proxy).
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
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const load = async () => {
      try {
        const list = await getRecipesBulk(idList)
        if (cancelled) return
        if (list && list.length) {
          setRecipes(list)
          return
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load saved recipes')
      }

      try {
        const results = await Promise.all(
          idList.map((id) => getRecipeById(id).catch(() => null))
        )
        if (!cancelled) {
          const filtered = results.filter(Boolean)
          setRecipes(filtered)
          if (filtered.length === 0) {
            setError((prev) => prev || 'No saved recipes found.')
          } else {
            setError(null)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load saved recipes')
      }
    }
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [idList.join(',')])

  const sorted = useMemo(() => {
    const list = [...recipes]
    if (sort === 'time') {
      list.sort((a, b) => (a.timeMinutes ?? 0) - (b.timeMinutes ?? 0))
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    } else if (sort === 'recent') {
      const order = new Map()
      idList.forEach((id, idx) => order.set(String(id), idx))
      list.sort((a, b) => (order.get(String(b.id)) ?? -1) - (order.get(String(a.id)) ?? -1))
    }
    return list
  }, [recipes, sort, idList.join(',')])

  return { savedRecipes: sorted, loading, error }
}
