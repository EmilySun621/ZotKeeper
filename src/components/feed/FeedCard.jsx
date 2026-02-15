import { Link } from 'react-router-dom'
import { useSavedRecipes } from '../../hooks/useSavedRecipes'
import { handleImageError } from '../../utils/imageFallback'

function Tag({ children }) {
  return (
    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-medium text-honey-700">
      {children}
    </span>
  )
}

export default function FeedCard({ recipe }) {
  const { isSaved, toggleSaved } = useSavedRecipes()

  const saved = isSaved(recipe.id)

  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSaved(recipe.id)
  }

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group block overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-warm-lg"
    >
      {/* Big image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={recipe.image}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={handleImageError}
        />
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white"
          aria-label={saved ? 'Unsave recipe' : 'Save recipe'}
        >
          <span className={`text-xl transition transform duration-200 ${saved ? 'scale-110 heart-pop' : 'scale-100'}`}>
            {saved ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-stone-900 line-clamp-1">
          {recipe.title}
        </h3>
        <p className="mt-1 text-sm text-stone-600 line-clamp-1">{recipe.descriptionHook}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.timeMinutes != null ? (
            <Tag>{recipe.timeMinutes} min</Tag>
          ) : (
            <Tag title="Cooking time not provided by source">—</Tag>
          )}
          {recipe.cuisineTags?.[0] && <Tag>{recipe.cuisineTags[0]}</Tag>}
          {recipe.calories != null && <Tag>{recipe.calories} cal</Tag>}
          <Tag>{recipe.difficulty}</Tag>
          <Tag>{recipe.budgetLevel}</Tag>
          {recipe.dietTags?.slice(0, 2).map((d) => (
            <Tag key={d}>{d}</Tag>
          ))}
        </div>
      </div>
    </Link>
  )
}
