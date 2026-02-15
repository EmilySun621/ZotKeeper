import RecommendationCard from './RecommendationCard'

export default function RecommendationList({ items, typeLabel }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-cream-50 p-10 text-center text-stone-500">
        <span className="text-4xl" aria-hidden>🥗</span>
        <p className="mt-2 font-medium">No recommendations match your context.</p>
        <p className="mt-1 text-sm">Try adjusting the filters on the left.</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {items.map((item, i) => (
        <li key={item.id}>
          <RecommendationCard item={item} rank={i + 1} typeLabel={typeLabel} />
        </li>
      ))}
    </ul>
  )
}
