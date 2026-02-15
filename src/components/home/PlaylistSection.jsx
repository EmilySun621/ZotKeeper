import { Link } from 'react-router-dom'
import PlaylistCard from './PlaylistCard'
import { filterRecipesForPlaylist } from '../../data/playlists'
import { FALLBACK_IMAGE } from '../../utils/imageFallback'

/**
 * One time-based row: label + horizontal playlist cards + View All.
 */
export default function PlaylistSection({ sectionTitle, timeLabel, playlists, recipes }) {
  const playlistsWithCovers = playlists.map((pl) => {
    const items = filterRecipesForPlaylist(recipes, pl)
    const cover = items[0]
    return {
      playlist: pl,
      coverImage: cover?.image ?? FALLBACK_IMAGE,
      coverAlt: cover?.title ?? pl.title,
    }
  })

  if (!playlistsWithCovers.length) return null

  return (
    <section className="mb-12">
      <h2
        className="mb-4 font-display text-xl font-medium tracking-tight"
        style={{ color: 'var(--theme-text)' }}
      >
        {timeLabel} {sectionTitle}
      </h2>
      <div className="mood-scroll flex gap-5 overflow-x-auto pb-2">
        {playlistsWithCovers.map(({ playlist, coverImage, coverAlt }) => (
          <PlaylistCard
            key={playlist.slug}
            playlist={playlist}
            coverImage={coverImage}
            coverAlt={coverAlt}
          />
        ))}
        <Link
          to="/search"
          className="flex shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition hover:opacity-80"
          style={{
            width: 160,
            minHeight: 160,
            borderColor: 'var(--theme-muted)',
            color: 'var(--theme-muted)',
          }}
        >
          <span className="text-sm font-medium">View All</span>
        </Link>
      </div>
    </section>
  )
}
