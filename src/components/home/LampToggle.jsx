import { useTheme } from '../../context/ThemeContext'

/**
 * Diner-style lamp: toggles lighting. Lamp ON = time-based (warmer/brighter);
 * Lamp OFF = midnight mode (dark, calm). Symbolic: "the diner is still open."
 */
export default function LampToggle() {
  const { lampOn, setLampOn, effectiveTheme } = useTheme()
  const isMidnight = effectiveTheme === 'midnight'

  return (
    <button
      type="button"
      onClick={() => setLampOn(!lampOn)}
      className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 md:right-6 md:top-20"
      style={{
        backgroundColor: isMidnight ? 'var(--theme-card-bg)' : 'var(--theme-card-bg)',
        boxShadow: 'var(--theme-card-shadow)',
        color: 'var(--theme-text)',
      }}
      aria-label={lampOn ? 'Switch to late night mode' : 'Switch to lit mode'}
      title={lampOn ? 'Late night mode' : 'Lights on'}
    >
      {lampOn ? (
        <span className="text-2xl" aria-hidden>🪔</span>
      ) : (
        <span className="text-2xl opacity-80" aria-hidden>🌙</span>
      )}
    </button>
  )
}
