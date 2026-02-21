import { useState, useEffect } from 'react'
import { getCuisines, searchRecipes } from '../api/recipesBackend'
import { groupCuisinesByContinent, CONTINENT_ORDER } from '../data/cuisinesByContinent'
import FeedCard from '../components/feed/FeedCard'

/** Display label for a cuisine tag. */
function cuisineLabel(tag) {
  if (!tag) return ''
  return tag.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Explore by region: left = select continent + cuisine, right = recipe grid (from recipe backend).
 */
export default function MapPage() {
  const [cuisines, setCuisines] = useState([])
  const [selectedContinent, setSelectedContinent] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loadingCuisines, setLoadingCuisines] = useState(true)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [error, setError] = useState(null)

  const byContinent = groupCuisinesByContinent(cuisines)
  const orderedContinents = CONTINENT_ORDER.filter((c) => byContinent[c]?.length)
  const cuisinesInContinent = selectedContinent ? (byContinent[selectedContinent] || []) : []

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
      limit: 48,
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

  const handleContinentChange = (continent) => {
    setSelectedContinent(continent || '')
    const stillInContinent = continent && selectedCuisine && byContinent[continent]?.includes(selectedCuisine)
    if (!stillInContinent) setSelectedCuisine('')
  }

  return (
    <div className="pb-12">
      <h1 className="mb-2 font-display text-2xl font-semibold text-stone-800">
        Explore by region
      </h1>
      <p className="mb-6 text-sm text-stone-600">
        Choose a continent and region to see its recipes
      </p>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left: selection */}
          <aside className="w-full shrink-0 rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:w-64">
            {loadingCuisines ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
                    Continent
                  </label>
                  <select
                    value={selectedContinent}
                    onChange={(e) => handleContinentChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 focus:border-tomato-400 focus:outline-none focus:ring-2 focus:ring-tomato-400/20"
                  >
                    <option value="">— Select continent —</option>
                    {orderedContinents.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
                    Cuisine
                  </label>
                  <select
                    value={selectedCuisine}
                    onChange={(e) => setSelectedCuisine(e.target.value || '')}
                    disabled={!selectedContinent}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 focus:border-tomato-400 focus:outline-none focus:ring-2 focus:ring-tomato-400/20 disabled:opacity-50"
                  >
                    <option value="">— Select cuisine —</option>
                    {cuisinesInContinent.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>{cuisineLabel(cuisine)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </aside>

          {/* Right: recipes */}
          <main className="min-w-0 flex-1">
            {!selectedCuisine ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
                <p className="text-stone-500">Choose a continent and cuisine to see recipes</p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 font-display text-lg font-medium text-stone-800">
                  {cuisineLabel(selectedCuisine)} cuisine
                </h2>
                {loadingRecipes ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
                  </div>
                ) : recipes.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
                    No recipes found for this cuisine.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {recipes.map((recipe) => (
                      <FeedCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
