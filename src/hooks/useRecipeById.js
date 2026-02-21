import { useState, useEffect } from 'react'
import { getRecipeById } from '../api/recipesBackend'

/**
 * Load a single recipe by id from the recipe ranking backend (GET /api/recipes/:id).
 */
export function useRecipeById(id) {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setRecipe(null)
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getRecipeById(id)
      .then((data) => {
        if (!cancelled) setRecipe(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load recipe')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  return { recipe, loading, error }
}
