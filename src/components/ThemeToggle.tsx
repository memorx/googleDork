import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'hacker'

/** Evento global para cambiar de tema desde fuera del toggle (p. ej. la paleta de comandos). */
export const CYCLE_THEME_EVENT = 'googledork:cycle-theme'

const THEME_ORDER: Theme[] = ['light', 'dark', 'hacker']

const THEME_LABELS: Record<Theme, string> = {
  light: 'claro',
  dark: 'oscuro',
  hacker: 'hacker',
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('googledork-theme')
  if (stored === 'light' || stored === 'dark' || stored === 'hacker') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('googledork-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleCycle = () =>
      setTheme((prev) => THEME_ORDER[(THEME_ORDER.indexOf(prev) + 1) % THEME_ORDER.length])
    window.addEventListener(CYCLE_THEME_EVENT, handleCycle)
    return () => window.removeEventListener(CYCLE_THEME_EVENT, handleCycle)
  }, [])

  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="btn btn-secondary rounded-full p-2.5"
      aria-label={`Cambiar a modo ${THEME_LABELS[nextTheme]}`}
      title={`Modo ${THEME_LABELS[nextTheme]}`}
    >
      {theme === 'light' && (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {theme === 'dark' && (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
      {theme === 'hacker' && (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  )
}
