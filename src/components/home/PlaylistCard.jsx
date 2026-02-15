import { Link } from 'react-router-dom'
import { handleImageError } from '../../utils/imageFallback'

/**
 * Square playlist card: large atmospheric cover, title only. No metadata.
 */
export default function PlaylistCard({ playlist, coverImage, coverAlt }) {
  return (
    <Link
      to={`/playlist/${playlist.slug}`}
      className="group flex shrink-0 flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        boxShadow: 'var(--theme-card-shadow)',
      }}
    >
      <div className="aspect-square w-[160px] overflow-hidden sm:w-[200px]">
        <img
          src={coverImage}
          alt={coverAlt ?? ''}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={handleImageError}
        />
      </div>
      <p
        className="mt-2 px-2 pb-2 text-center text-sm font-medium line-clamp-2"
        style={{ color: 'var(--theme-text)' }}
      >
        {playlist.title}
      </p>
    </Link>
  )
}
