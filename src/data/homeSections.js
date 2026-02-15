/**
 * Homepage section grouping: time label + section title + playlist slugs.
 */
import { PLAYLISTS } from './playlists'

export const HOME_SECTIONS = [
  {
    key: 'time-playlists',
    timeLabel: '🌙',
    title: 'Midnight',
    playlistSlugs: ['quiet-comfort', 'something-warm', 'just-one-bowl', 'sweet-before-sleep'],
  },
  {
    key: 'regulars',
    timeLabel: '♥',
    title: "Regulars' Favorites",
    playlistSlugs: ['regulars-favorites'],
  },
  {
    key: 'tonight',
    timeLabel: '✨',
    title: "Tonight's Special",
    playlistSlugs: ['tonights-special'],
  },
  {
    key: 'after-dark',
    timeLabel: '🌙',
    title: 'Only Available After Dark',
    playlistSlugs: ['only-after-dark'],
  },
]

export function getPlaylistsBySlugs(slugs) {
  return slugs
    .map((slug) => PLAYLISTS.find((p) => p.slug === slug))
    .filter(Boolean)
}
