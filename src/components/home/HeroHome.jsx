import { Link } from 'react-router-dom'
import { handleImageError } from '../../utils/imageFallback'

/**
 * Hero: one large atmospheric image, emotional headline, single CTA "Surprise Me".
 * Uses the first recipe in the feed so the big card stays the same when you navigate back.
 */
export default function HeroHome({ recipes }) {
  const heroRecipe = recipes?.[0] ?? null

  const imageUrl = heroRecipe?.image ?? 'https://www.themealdb.com/images/media/meals/placeholder.jpg'
  const surpriseTo = heroRecipe ? `/recipe/${heroRecipe.id}` : '/search'

  return (
    <section className="relative -mx-4 mb-16 overflow-hidden rounded-2xl bg-stone-900 sm:mx-0 sm:rounded-3xl">
      <div className="aspect-[16/9] min-h-[280px] sm:min-h-[360px] md:aspect-[21/9]">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover opacity-90"
          onError={handleImageError}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pt-8 text-center sm:pb-16 md:pb-20">
        <h1 className="font-display text-3xl font-light tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
          What should we eat tonight?
        </h1>
        <p className="mt-3 text-white/90 text-sm sm:text-base">
          One tap. No scrolling.
        </p>
        <Link
          to={surpriseTo}
          className="mt-6 rounded-full bg-white px-8 py-3.5 font-medium text-stone-800 shadow-lg transition hover:bg-stone-100 hover:shadow-xl"
        >
          Surprise Me
        </Link>
      </div>
    </section>
  )
}
