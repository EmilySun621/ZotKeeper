import { useState } from 'react'
import { useSearchRecipes } from '../hooks/useSearchRecipes'
import { usePreferences } from '../hooks/usePreferences'
import SearchBar from '../components/search/SearchBar'
import FilterPanel from '../components/search/FilterPanel'
import SearchResults from '../components/search/SearchResults'

const defaultFilters = {
  time: '',
  budget: '',
  cuisines: [],
  diets: [],
  difficulty: '',
  caloriesMin: '',
  caloriesMax: '',
  includeIngredient: '',
  excludeIngredients: [],
}

const SUGGESTIONS = ['chicken', 'pasta', 'cake', 'beef', 'fish', 'salad']

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const { preferences } = usePreferences()
  const { results, totalResults, totalPages, page: currentPage, suggestedKeyword, loading, error } = useSearchRecipes(keyword, filters, page)

  const hasSearched = keyword.trim().length > 0

  const handleKeywordChange = (v) => {
    setKeyword(v)
    setPage(1)
  }
  const handleFiltersChange = (f) => {
    setFilters(f)
    setPage(1)
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-stone-800">
        Search recipes
      </h1>
      <div className="mb-4">
        <SearchBar value={keyword} onChange={handleKeywordChange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <FilterPanel
            filters={filters}
            onChange={handleFiltersChange}
            preferences={preferences}
          />
        </aside>

        <section
          className="min-h-[320px] rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
          aria-live="polite"
        >
          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
              <p className="font-semibold text-red-800">Search failed</p>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <p className="mt-3 text-xs text-stone-500">
                Make sure the recipe API server is running (e.g. cd server && npm run dev on port 3001).
              </p>
            </div>
          )}

          {!error && loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
              <p className="mt-4 text-sm text-stone-500">Searching…</p>
            </div>
          )}

          {!error && !loading && !hasSearched && (
            <div className="py-6 text-center">
              <p className="font-medium text-stone-800">Type a meal name to search</p>
              <p className="mt-1 text-sm text-stone-500">
                Use the search box above, or click one of these:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {SUGGESTIONS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => { setKeyword(term); setPage(1) }}
                    className="rounded-full bg-tomato-500 px-5 py-2.5 text-sm font-medium text-white shadow transition hover:bg-tomato-600"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!error && !loading && hasSearched && results.length === 0 && (
            <div className="py-12 text-center text-stone-500">
              <p className="font-medium">No recipes match “{keyword}” with your filters.</p>
              <p className="mt-1 text-sm">Try a different word or clear some filters.</p>
            </div>
          )}

          {!error && !loading && hasSearched && results.length > 0 && (
            <>
              <p className="mb-4 text-sm text-stone-500">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
                {suggestedKeyword && suggestedKeyword !== keyword.trim() && (
                  <span className="ml-2 text-stone-400">
                    (showing results for “{suggestedKeyword}”)
                  </span>
                )}
              </p>
              <SearchResults recipes={results} />
              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-stone-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
