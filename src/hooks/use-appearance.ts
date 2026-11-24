import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

export interface Appearance {
  theme: Theme
  /** Roda do mouse dá zoom. Se falso, a roda move o canvas e Ctrl + roda dá zoom. */
  wheelZooms: boolean
}

const KEY = 'funis-appearance'
const listeners = new Set<() => void>()

function read(): Appearance {
  const fallback: Appearance = {
    theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    wheelZooms: false,
  }
  try {
    return {
      ...fallback,
      ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Appearance>),
    }
  } catch {
    return fallback
  }
}

let current = read()

/** O editor lê o tema pelas classes do body (como no Obsidian); o shadcn, pela classe `dark` do html. */
export function applyTheme(theme: Theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark')
  document.body.classList.toggle('theme-light', theme !== 'dark')
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

applyTheme(current.theme)

function setAppearance(patch: Partial<Appearance>) {
  current = { ...current, ...patch }
  localStorage.setItem(KEY, JSON.stringify(current))
  applyTheme(current.theme)
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useAppearance() {
  const value = useSyncExternalStore(subscribe, () => current)
  const set = useCallback((patch: Partial<Appearance>) => setAppearance(patch), [])
  return [value, set] as const
}
