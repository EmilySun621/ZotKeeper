import { useMemo } from 'react'
import { useFeedRecipes } from '../hooks/useFeedRecipes'
import { partitionByMood, MOOD_SECTIONS } from '../utils/moodSections'
import HeroHome from '../components/home/HeroHome'
import MoodSection from '../components/home/MoodSection'
import Feed from '../components/feed/Feed'

export default function HomePage() {
  const { recipes, loading, error } = useFeedRecipes()
  const moodData = useMemo(() => partitionByMood(recipes), [recipes])

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-stone-700">
        <p className="font-medium">Could not load recipes</p>
        <p className="mt-1 text-sm text-stone-600">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
        <p className="mt-4 text-sm text-stone-600">Loading recipes…</p>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <HeroHome recipes={recipes} />
      {MOOD_SECTIONS.map((section) => (
        <MoodSection
          key={section.id}
          title={section.title}
          emoji={section.emoji}
          recipes={moodData[section.id]}
        />
      ))}
      <h2 className="mb-4 mt-8 font-display text-xl font-semibold text-stone-800">
        Daily inspiration
      </h2>
      <Feed recipes={recipes} />
    </div>
  )
}
