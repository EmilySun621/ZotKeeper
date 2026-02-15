import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSavedRecipesData } from '../../hooks/useSavedRecipesData'
import FeedCard from '../feed/FeedCard'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently saved' },
  { value: 'time', label: 'Cook time' },
  { value: 'rating', label: 'Rating' },
]

export default function SavedRecipesTab() {
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('recent')
  const { savedRecipes, loading, error } = useSavedRecipesData(sort)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
        <p className="mt-3 text-sm text-stone-500">Loading saved recipes…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">Could not load saved recipes</p>
        <p className="mt-1 text-sm text-stone-500">{error}</p>
      </div>
    )
  }

  if (savedRecipes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-cream-50 p-10 text-center">
        <p className="text-4xl">❤️</p>
        <p className="mt-3 font-medium text-stone-800">Saved Recipes</p>
        <p className="mt-1 max-w-sm mx-auto text-sm text-stone-500">
          Recipes you tap the heart on will show up here. Browse the feed or search, then save your favorites to find them later.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-tomato-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-tomato-600"
          >
            Browse feed
          </Link>
          <Link
            to="/search"
            className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Search recipes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Recipes you’ve saved. Tap the heart on any card to unsave.
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setSort(o.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                sort === o.value ? 'bg-tomato-500 text-stone-800' : 'bg-white text-stone-500 hover:bg-stone-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`rounded-lg p-2 text-sm ${view === 'grid' ? 'bg-orange-100 text-honey-700' : 'text-stone-400 hover:text-stone-600'}`}
            aria-label="Grid view"
            title="Grid"
          >
            ⊞
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`rounded-lg p-2 text-sm ${view === 'list' ? 'bg-orange-100 text-honey-700' : 'text-stone-400 hover:text-stone-600'}`}
            aria-label="List view"
            title="List"
          >
            ≡
          </button>
        </div>
      </div>
      <div className={view === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'}>
        {savedRecipes.map((recipe) => (
          <FeedCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}
