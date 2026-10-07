import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export const FAVORITES_KEY = 'googledork-favorites'

function loadFavorites(): string[] {
  const stored = readJson<unknown>(FAVORITES_KEY, [])
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)

  const toggleFavorite = useCallback((dorkId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(dorkId) ? prev.filter((id) => id !== dorkId) : [...prev, dorkId]
      writeJson(FAVORITES_KEY, next)
      return next
    })
  }, [])

  const isFavorite = useCallback((dorkId: string) => favorites.includes(dorkId), [favorites])

  return { favorites, toggleFavorite, isFavorite }
}
