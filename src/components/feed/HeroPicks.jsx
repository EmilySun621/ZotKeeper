import { Link } from 'react-router-dom'
import { FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback'

/**
 * "Today's Picks" hero: 2–3 featured recipes with large images.
 */
export default function HeroPicks({ recipes }) {
  const picks = recipes.slice(0, 3)
  if (picks.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-display text-xl font-semibold text-stone-800">
        Today&apos;s Picks
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((r) => (
          <Link
            key={r.id}
            to={`/recipe/${r.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-warm transition hover:shadow-warm-lg"
          >
            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
              <img
                src={r.image || FALLBACK_IMAGE}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h3 className="font-display text-lg font-semibold text-white drop-shadow">
                {r.title}
              </h3>
              <p className="mt-0.5 text-sm text-white/90">{r.descriptionHook}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
