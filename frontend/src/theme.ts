export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? systemTheme()
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/** Applies whatever theme is already stored, before React mounts, so there's no
 * flash of the wrong theme on load. No-op (defers to the CSS media query) if the
 * user has never toggled it. */
export function applyStoredTheme(): void {
  const stored = getStoredTheme()
  if (stored) applyTheme(stored)
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}
