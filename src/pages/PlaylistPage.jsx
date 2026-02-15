import { useParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import { getPlaylistBySlug, filterRecipesForPlaylist } from '../data/playlists'
import { useFeedRecipes } from '../hooks/useFeedRecipes'
import FeedCard from '../components/feed/FeedCard'

export default function PlaylistPage() {
  const { slug } = useParams()
  const { recipes, loading, error } = useFeedRecipes()
  const playlist = useMemo(() => getPlaylistBySlug(slug), [slug])
  const list = useMemo(
    () => (playlist ? filterRecipesForPlaylist(recipes, playlist) : []),
    [playlist, recipes]
  )

  if (!playlist) {
    return (
      <div className="py-12 text-center" style={{ color: 'var(--theme-text)' }}>
        <p>Playlist not found.</p>
        <Link to="/" className="mt-4 inline-block underline">
          Back home
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-stone-700">
        <p className="font-medium">Could not load recipes</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'var(--theme-text)' }} />
        <p className="mt-4 text-sm" style={{ color: 'var(--theme-muted)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <Link to="/" className="mb-6 inline-block text-sm underline" style={{ color: 'var(--theme-muted)' }}>
        ← Home
      </Link>
      <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl" style={{ color: 'var(--theme-text)' }}>
        {playlist.title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--theme-muted)' }}>
        {list.length} {list.length === 1 ? 'recipe' : 'recipes'}
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {list.map((recipe) => (
          <FeedCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-8 text-center" style={{ color: 'var(--theme-muted)' }}>
          No recipes in this playlist yet.
        </p>
      )}
    </div>
  )
}
