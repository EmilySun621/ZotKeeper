import { useParams, Link } from 'react-router-dom'
import { useRecipeById } from '../hooks/useRecipeById'
import { useSavedRecipes } from '../hooks/useSavedRecipes'
import WhyRecommended from '../components/recipe/WhyRecommended'
import NutritionSummary from '../components/recipe/NutritionSummary'
import { handleImageError } from '../utils/imageFallback'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const { recipe, loading, error } = useRecipeById(id)
  const { isSaved, toggleSaved } = useSavedRecipes()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
        <p className="mt-4 text-sm text-stone-600">Loading recipe…</p>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="py-12 text-center">
        <p className="text-stone-600">{error || 'Recipe not found.'}</p>
        <Link to="/" className="mt-4 inline-block text-tomato-500 hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  const saved = isSaved(recipe.id)

  return (
    <article className="mx-auto max-w-3xl">
      <div className="relative -mx-4 aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100 sm:mx-0">
        <img
          src={recipe.image}
          alt=""
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
        <button
          type="button"
          onClick={() => toggleSaved(recipe.id)}
          className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white"
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <span className="text-2xl">{saved ? '❤️' : '🤍'}</span>
        </button>
      </div>

      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          {recipe.title}
        </h1>
        <p className="mt-2 text-stone-600">{recipe.descriptionHook}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-500">
          <span>⭐ {recipe.rating}</span>
          <span>·</span>
          <span>{recipe.timeMinutes != null ? `${recipe.timeMinutes} min` : 'Time not specified'}</span>
          <span>·</span>
          <span>{recipe.servings ?? '2–4'} servings</span>
          <span>·</span>
          <span>{recipe.difficulty}</span>
          <span>·</span>
          <span>Budget: {recipe.budgetLevel}</span>
        </div>
      </div>

      <WhyRecommended text={recipe.recommendedReason} />

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-stone-800">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {(recipe.ingredients || []).map((ing, i) => (
              <li key={i} className="flex gap-2 text-stone-700">
                <span className="text-tomato-500">•</span>
                {typeof ing === 'object' ? (
                  <span>{ing.name} — {ing.amount}</span>
                ) : (
                  <span>{ing}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <NutritionSummary recipe={recipe} />
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-800">
          Steps
        </h2>
        <ol className="space-y-4">
          {(recipe.steps || []).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tomato-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="text-stone-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex justify-between border-t border-stone-200 pt-6">
        <Link to="/search" className="text-tomato-500 hover:underline">
          ← Search more
        </Link>
        <Link to="/" className="text-tomato-500 hover:underline">
          Home →
        </Link>
      </div>
    </article>
  )
}
