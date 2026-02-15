import { useState, useEffect } from 'react'
import { getAreas, filterByArea } from '../../api/themealdb'
import FeedCard from '../feed/FeedCard'

/**
 * Section: "map" of regions (by country/area). Click a region → it lights up,
 * below show that region's meals (filter.php?a=AreaName).
 */
export default function RegionMapSection() {
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [meals, setMeals] = useState([])
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [error, setError] = useState(null)

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
      .catch((e) => {
        if (!cancelled) setMeals([])
      })
      .finally(() => {
        if (!cancelled) setLoadingMeals(false)
      })
    return () => { cancelled = true }
  }, [selectedArea])

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
        Click a region to see its cuisine
      </p>

      {loadingAreas ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-400 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(selectedArea === area ? null : area)}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow transition ${
                  selectedArea === area
                    ? 'bg-tomato-500 text-white ring-2 ring-tomato-400 ring-offset-2'
                    : 'bg-white/95 text-stone-700 hover:bg-orange-50 hover:ring-1 hover:ring-orange-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedArea && (
        <div className="mt-6">
          <h3 className="mb-3 font-display text-lg font-medium text-stone-800">
            {selectedArea} cuisine
          </h3>
          {loadingMeals ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-400 border-t-transparent" />
            </div>
          ) : meals.length === 0 ? (
            <p className="text-sm text-stone-500">No recipes found for this region.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((recipe) => (
                <FeedCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
