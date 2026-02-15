import { useState } from 'react'
import FeedCard from './FeedCard'

const PAGE_SIZE = 8

/**
 * Feed list with "Load more". Receives pre-ranked recipes.
 */
export default function Feed({ recipes }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const slice = recipes.slice(0, shown)
  const hasMore = shown < recipes.length

  return (
    <section>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {slice.map((recipe) => (
          <FeedCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE_SIZE)}
            className="rounded-full border border-orange-200 bg-white px-6 py-2.5 text-sm font-medium text-honey-700 shadow-warm transition hover:bg-cream-100"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  )
}
