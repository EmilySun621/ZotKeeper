import { useState, useEffect } from 'react'
import { getAreas, filterByArea } from '../api/themealdb'
import { groupAreasByContinent, CONTINENT_ORDER } from '../data/regionsByContinent'
import FeedCard from '../components/feed/FeedCard'

/**
 * Explore by region: left = select continent + region, right = recipe grid.
 */
export default function MapPage() {
  const [areas, setAreas] = useState([])
  const [selectedContinent, setSelectedContinent] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [meals, setMeals] = useState([])
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [error, setError] = useState(null)

  const byContinent = groupAreasByContinent(areas)
  const orderedContinents = CONTINENT_ORDER.filter((c) => byContinent[c]?.length)
  const areasInContinent = selectedContinent ? (byContinent[selectedContinent] || []) : []

  useEffect(() => {
    let cancelled = false
    setLoadingAreas(true)
    getAreas()
      .then((list) => {
        if (!cancelled) setAreas(list)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load regions')
      })
      .finally(() => {
        if (!cancelled) setLoadingAreas(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedArea) {
      setMeals([])
      return
    }
    let cancelled = false
    setLoadingMeals(true)
    filterByArea(selectedArea)
      .then((list) => {
        if (!cancelled) setMeals(list)
      })
      .catch(() => {
        if (!cancelled) setMeals([])
      })
      .finally(() => {
        if (!cancelled) setLoadingMeals(false)
      })
    return () => { cancelled = true }
  }, [selectedArea])

  const handleContinentChange = (continent) => {
    setSelectedContinent(continent || '')
    const stillInContinent = continent && selectedArea && byContinent[continent]?.includes(selectedArea)
    if (!stillInContinent) setSelectedArea('')
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
            {loadingAreas ? (
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
                    Region
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value || '')}
                    disabled={!selectedContinent}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 focus:border-tomato-400 focus:outline-none focus:ring-2 focus:ring-tomato-400/20 disabled:opacity-50"
                  >
                    <option value="">— Select region —</option>
                    {areasInContinent.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </aside>

          {/* Right: recipes */}
          <main className="min-w-0 flex-1">
            {!selectedArea ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
                <p className="text-stone-500">Choose a continent and region to see recipes</p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 font-display text-lg font-medium text-stone-800">
                  {selectedArea} cuisine
                </h2>
                {loadingMeals ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
                  </div>
                ) : meals.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
                    No recipes found for this region.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {meals.map((recipe) => (
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
