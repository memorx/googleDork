import type { HistoryEntry } from '../hooks/useHistory'

// Exportar/importar favoritos e historial como archivo JSON de respaldo.

export interface BackupData {
  favorites: string[]
  history: HistoryEntry[]
}

interface BackupFile extends BackupData {
  version: 1
  exportedAt: string
}

export function buildBackup(favorites: string[], history: HistoryEntry[]): string {
  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites,
    history,
  }
  return JSON.stringify(backup, null, 2)
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.engine === 'string' &&
    typeof entry.query === 'string' &&
    typeof entry.timestamp === 'number'
  )
}

/** Parsea y valida un JSON de respaldo; devuelve null si la estructura no es válida. */
export function parseBackup(json: string): BackupData | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Record<string, unknown>
  if (!Array.isArray(candidate.favorites) && !Array.isArray(candidate.history)) return null

  const favorites = Array.isArray(candidate.favorites)
    ? candidate.favorites.filter((id): id is string => typeof id === 'string')
    : []
  const history = Array.isArray(candidate.history)
    ? candidate.history.filter(isValidHistoryEntry)
    : []
  return { favorites, history }
}

/** Fusiona favoritos sin duplicados; devuelve la lista final y cuántos se agregaron. */
export function mergeFavorites(
  current: string[],
  incoming: string[],
): { merged: string[]; added: number } {
  const merged = [...current]
  let added = 0
  for (const id of incoming) {
    if (!merged.includes(id)) {
      merged.push(id)
      added++
    }
  }
  return { merged, added }
}

/** Fusiona historial sin duplicar (mismo motor + misma query); conserva el orden existente. */
export function mergeHistory(
  current: HistoryEntry[],
  incoming: HistoryEntry[],
  limit: number,
): { merged: HistoryEntry[]; added: number } {
  const merged = [...current]
  let added = 0
  for (const entry of incoming) {
    const exists = merged.some(
      (item) => item.engine === entry.engine && item.query === entry.query,
    )
    if (!exists) {
      merged.push(entry)
      added++
    }
  }
  return { merged: merged.slice(0, limit), added }
}
