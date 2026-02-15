import FeedCard from '../feed/FeedCard'

export default function SearchResults({ recipes }) {
  if (!recipes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-cream-50 p-10 text-center text-stone-500">
        <p className="font-medium">No recipes match your search or filters.</p>
        <p className="mt-1 text-sm">Try different keywords or loosen filters.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {recipes.map((recipe) => (
        <FeedCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
