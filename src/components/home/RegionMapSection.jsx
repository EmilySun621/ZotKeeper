import { useState, useEffect } from 'react'
import { getCuisines, searchRecipes } from '../../api/recipesBackend'
import FeedCard from '../feed/FeedCard'

/** Display label for a cuisine tag (e.g. "middle eastern" → "Middle eastern"). */
function cuisineLabel(tag) {
  if (!tag) return ''
  return tag.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Section: "map" of cuisines (from recipe backend). Click a cuisine → show recipes for that cuisine.
 */
export default function RegionMapSection() {
  const [cuisines, setCuisines] = useState([])
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loadingCuisines, setLoadingCuisines] = useState(true)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoadingCuisines(true)
    getCuisines()
      .then((list) => {
        if (!cancelled) setCuisines(list)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load cuisines')
      })
      .finally(() => {
        if (!cancelled) setLoadingCuisines(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedCuisine) {
      setRecipes([])
      return
    }
    let cancelled = false
    setLoadingRecipes(true)
    searchRecipes({
      keyword: '',
      filters: { cuisines: [selectedCuisine] },
      preferences: {},
      limit: 24,
    })
      .then(({ recipes: list }) => {
        if (!cancelled) setRecipes(list)
      })
      .catch(() => {
        if (!cancelled) setRecipes([])
      })
      .finally(() => {
        if (!cancelled) setLoadingRecipes(false)
      })
    return () => { cancelled = true }
  }, [selectedCuisine])

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-stone-800">
          Explore by region
        </h2>
        <p className="text-sm text-red-600">{error}</p>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <h2 className="mb-2 font-display text-xl font-semibold text-stone-800">
        Explore by region
      </h2>
      <p className="mb-4 text-sm text-stone-500">
        Click a cuisine to see recipes
      </p>

      {loadingCuisines ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-400 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow transition ${
                  selectedCuisine === cuisine
                    ? 'bg-tomato-500 text-white ring-2 ring-tomato-400 ring-offset-2'
                    : 'bg-white/95 text-stone-700 hover:bg-orange-50 hover:ring-1 hover:ring-orange-200'
                }`}
              >
                {cuisineLabel(cuisine)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCuisine && (
        <div className="mt-6">
          <h3 className="mb-3 font-display text-lg font-medium text-stone-800">
            {cuisineLabel(selectedCuisine)} cuisine
          </h3>
          {loadingRecipes ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-400 border-t-transparent" />
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-stone-500">No recipes found for this cuisine.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <FeedCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
