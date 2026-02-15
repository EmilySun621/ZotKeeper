/**
 * Single recommendation card: name, type, explanation, tags.
 * Styled for an appetizing, warm look.
 */

function flattenTags(tags) {
  const out = []
  for (const arr of Object.values(tags)) {
    if (Array.isArray(arr)) out.push(...arr)
  }
  return [...new Set(out)]
}

function formatTag(t) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const TAG_COLORS = [
  'bg-tomato-500/20 text-tomato-500',
  'bg-rose-100 text-rose-700',
  'bg-rose-100 text-red-600',
  'bg-stone-50 text-stone-700',
  'bg-amber-50 text-honey-600',
]

export default function RecommendationCard({ item, rank, typeLabel }) {
  const tags = flattenTags(item.tags || {}).slice(0, 5).map(formatTag)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:border-tomato-400/50 hover:shadow-warm-lg">
      {/* Warm accent bar on the left */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-tomato-400 via-honey-500 to-amber-400 opacity-90 transition-opacity group-hover:opacity-100" />
      <div className="pl-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tomato-400 to-honey-500 text-sm font-bold text-white shadow-sm">
            {rank}
          </span>
          <span className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-honey-700">
            {typeLabel}
          </span>
        </div>
        <h4 className="font-display text-lg font-semibold text-stone-800">{item.name}</h4>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.explanation}</p>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={tag}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
