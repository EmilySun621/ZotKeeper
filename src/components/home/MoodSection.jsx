import { Link } from 'react-router-dom'
import { FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback'

/**
 * One horizontal-scroll row: mood label + cards (large image, short poetic title).
 * No ratings, time, or ingredients on the card.
 */
export default function MoodSection({ title, emoji, recipes }) {
  if (!recipes?.length) return null

  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-xl font-medium tracking-tight text-stone-700">
        {emoji} {title}
      </h2>
      <div className="mood-scroll flex gap-4 overflow-x-auto pb-2">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            to={`/recipe/${recipe.id}`}
            className="group flex shrink-0 flex-col rounded-2xl overflow-hidden bg-stone-100 transition hover:ring-2 hover:ring-stone-300"
          >
            <div className="aspect-[4/5] w-[200px] overflow-hidden sm:w-[220px]">
              <img
                src={recipe.image || FALLBACK_IMAGE}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
            </div>
            <p className="mt-2 px-2 pb-2 text-center font-medium text-stone-700 text-sm line-clamp-2 group-hover:text-stone-900">
              {recipe.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
