import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export const HISTORY_KEY = 'googledork-history'
export const HISTORY_LIMIT = 20

export interface HistoryEntry {
  engine: string
  query: string
  timestamp: number
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.engine === 'string' &&
    typeof entry.query === 'string' &&
    typeof entry.timestamp === 'number'
  )
}

function loadHistory(): HistoryEntry[] {
  const stored = readJson<unknown>(HISTORY_KEY, [])
  return Array.isArray(stored) ? stored.filter(isHistoryEntry).slice(0, HISTORY_LIMIT) : []
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory)

  const addToHistory = useCallback((entry: { engine: string; query: string }) => {
    setEntries((prev) => {
      const rest = prev.filter(
        (item) => !(item.engine === entry.engine && item.query === entry.query),
      )
      const next = [{ ...entry, timestamp: Date.now() }, ...rest].slice(0, HISTORY_LIMIT)
      writeJson(HISTORY_KEY, next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    writeJson(HISTORY_KEY, [])
    setEntries([])
  }, [])

  return { entries, addToHistory, clearHistory }
}
