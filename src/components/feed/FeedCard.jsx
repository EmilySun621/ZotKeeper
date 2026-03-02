import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSavedRecipes } from '../../hooks/useSavedRecipes'
import { getCuisineTheme } from '../../utils/cuisineCardThemes'
import { FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback'

function StatBlock({ icon, value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-lg py-1.5 bg-white/60">
      <span className="text-sm leading-none" aria-hidden>{icon}</span>
      <span className="mt-0.5 text-base font-extrabold leading-none text-stone-800">{value}</span>
      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-stone-600">{label}</span>
    </div>
  )
}

export default function FeedCard({ recipe }) {
  const [hovered, setHovered] = useState(false)
  const { isSaved, toggleSaved } = useSavedRecipes()
  const saved = isSaved(recipe.id)

  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSaved(recipe.id)
  }

  const theme = getCuisineTheme(recipe.cuisineTags)
  const stepCount = (recipe.steps || []).length
  const hasImage = !!recipe.image

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative block overflow-hidden rounded-xl bg-white text-stone-800 no-underline shadow-sm transition-all duration-300 ease-out hover:shadow-warm"
      style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Image area: real image or gradient + emoji fallback */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {hasImage ? (
          <img
            src={recipe.image || FALLBACK_IMAGE}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.color}, ${theme.accent})`,
            }}
          >
            <span className="text-5xl" aria-hidden>{theme.emoji}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white"
          aria-label={saved ? 'Unsave recipe' : 'Save recipe'}
        >
          <span
            className={`text-lg transition duration-200 ${saved ? 'scale-110 heart-pop' : 'scale-100'}`}
          >
            {saved ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      {/* Info area */}
      <div
        className="p-3"
        style={{
          background: `linear-gradient(180deg, ${theme.color}18 0%, ${theme.accent}08 100%)`,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      >
        <h3 className="font-display text-sm font-bold leading-tight text-stone-800 line-clamp-2">
          {recipe.title}
        </h3>
        <div className="mt-2 flex gap-1.5">
          <StatBlock
            icon="⏱️"
            value={recipe.timeMinutes != null ? recipe.timeMinutes : '—'}
            label={recipe.timeMinutes != null ? 'min' : 'time'}
          />
          <StatBlock
            icon="🔥"
            value={recipe.calories != null ? recipe.calories : '—'}
            label="cal"
          />
          <StatBlock
            icon="📋"
            value={stepCount > 0 ? stepCount : '—'}
            label="steps"
          />
        </div>
      </div>
    </Link>
  )
}
