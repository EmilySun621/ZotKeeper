import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback'

const HEADLINES = {
  morning: "Good morning. What's for later?",
  afternoon: "Take a moment. What would hit the spot?",
  evening: "It's evening. Sit down. What would you like to eat?",
  midnight: "It's late. Sit down. What would you like to eat?",
}

/**
 * Hero: minimal text, time-based headline, optional glow when lamp on, CTA "Let the kitchen decide".
 */
export default function HeroDiner({ recipes }) {
  const { effectiveTheme, lampOn } = useTheme()
  const headline = HEADLINES[effectiveTheme] ?? HEADLINES.midnight

  const surpriseRecipe = useMemo(() => {
    if (!recipes?.length) return null
    return recipes[Math.floor(Math.random() * recipes.length)]
  }, [recipes])
  const surpriseTo = surpriseRecipe ? `/recipe/${surpriseRecipe.id}` : '/search'
  const heroRecipe = surpriseRecipe ?? recipes?.[0]
  const imageUrl = heroRecipe?.image || FALLBACK_IMAGE

  return (
    <section className="relative -mx-4 mb-14 overflow-hidden rounded-2xl sm:mx-0 sm:rounded-3xl">
      <div className="relative aspect-[16/9] min-h-[260px] sm:min-h-[320px] md:aspect-[21/9]">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: 'var(--theme-overlay)' }}
          aria-hidden
        />
        {lampOn && (
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 100%, var(--theme-glow), transparent 70%)',
              animation: 'glow-pulse 4s ease-in-out infinite',
            }}
            aria-hidden
          />
        )}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pt-6 text-center sm:pb-14">
        <h1
          className="font-display text-2xl font-light tracking-tight sm:text-3xl md:text-4xl"
          style={{ color: 'var(--theme-text)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {headline}
        </h1>
        <Link
          to={surpriseTo}
          className="mt-5 rounded-full px-6 py-2.5 text-sm font-medium transition"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            color: 'var(--theme-text)',
            boxShadow: 'var(--theme-card-shadow)',
          }}
        >
          Let the kitchen decide
        </Link>
      </div>
    </section>
  )
}
