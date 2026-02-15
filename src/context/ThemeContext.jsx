import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'zk_lamp'

export const PERIODS = {
  morning: 'morning',     // 07–11
  afternoon: 'afternoon', // 11–17
  evening: 'evening',     // 17–22
  midnight: 'midnight',   // 22–03, 03–07
}

function getHour() {
  return new Date().getHours()
}

function getTimePeriod() {
  const h = getHour()
  if (h >= 7 && h < 11) return PERIODS.morning
  if (h >= 11 && h < 17) return PERIODS.afternoon
  if (h >= 17 && h < 22) return PERIODS.evening
  return PERIODS.midnight
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [lampOn, setLampOnState] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      return v !== 'false'
    } catch {
      return true
    }
  })
  const [timePeriod, setTimePeriod] = useState(getTimePeriod)

  useEffect(() => {
    const id = setInterval(() => setTimePeriod(getTimePeriod()), 60_000)
    return () => clearInterval(id)
  }, [])

  const setLampOn = (on) => {
    setLampOnState(on)
    try {
      localStorage.setItem(STORAGE_KEY, String(on))
    } catch {}
  }

  const effectiveTheme = lampOn ? timePeriod : PERIODS.midnight

  const value = useMemo(
    () => ({
      timePeriod,
      lampOn,
      setLampOn,
      effectiveTheme,
    }),
    [timePeriod, lampOn, effectiveTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={effectiveTheme} className="theme-root transition-colors duration-500">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
