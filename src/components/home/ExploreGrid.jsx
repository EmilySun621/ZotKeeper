import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback'

const PAGE_SIZE = 12

/**
 * Masonry-style grid: mixed feel, recipe name on hover only. Infinite scroll.
 */
export default function ExploreGrid({ recipes }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const [hoveredId, setHoveredId] = useState(null)
  const sentinelRef = useRef(null)

  const loadMore = useCallback(() => {
    setShown((s) => Math.min(s + PAGE_SIZE, recipes.length))
  }, [recipes.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const slice = recipes.slice(0, shown)
  const hasMore = shown < recipes.length

  if (!slice.length) return null

  return (
    <section className="mt-16">
      <h2 className="mb-6 font-display text-xl font-medium tracking-tight text-stone-700">
        Explore
      </h2>
      <div className="columns-2 gap-4 sm:columns-3 md:gap-6">
        {slice.map((recipe, i) => (
          <Link
            key={recipe.id}
            to={`/recipe/${recipe.id}`}
            className="group mb-4 block break-inside-avoid overflow-hidden rounded-2xl bg-white md:mb-6"
            onMouseEnter={() => setHoveredId(recipe.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative overflow-hidden">
              <img
                src={recipe.image || FALLBACK_IMAGE}
                alt=""
                className="w-full object-cover transition duration-300 group-hover:scale-105"
                style={{ aspectRatio: 0.85 + (i % 3) * 0.15 }}
                onError={handleImageError}
              />
              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent py-3 px-3 transition duration-200 ${
                  hoveredId === recipe.id ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="text-sm font-medium text-white line-clamp-2">
                  {recipe.title}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-8 w-full" aria-hidden />}
    </section>
  )
}
