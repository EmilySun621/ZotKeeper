/**
 * Fallback when recipe images fail to load (TheMealDB or network).
 * Use a neutral placeholder that doesn't depend on external CDN.
 */
export const FALLBACK_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e7e5e4" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#a8a29e" font-family="sans-serif" font-size="16">No image</text></svg>'
  )

export function handleImageError(e) {
  if (e?.target && e.target.src !== FALLBACK_IMAGE) {
    e.target.onerror = null
    e.target.src = FALLBACK_IMAGE
  }
}
