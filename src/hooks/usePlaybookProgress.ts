import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export const PLAYBOOK_PROGRESS_KEY = 'googledork-playbook-progress'

/** Mapa playbookId -> índices de pasos completados. */
export type PlaybookProgress = Record<string, number[]>

function loadProgress(): PlaybookProgress {
  const stored = readJson<unknown>(PLAYBOOK_PROGRESS_KEY, {})
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {}
  const progress: PlaybookProgress = {}
  for (const [playbookId, steps] of Object.entries(stored as Record<string, unknown>)) {
    if (!Array.isArray(steps)) continue
    progress[playbookId] = steps.filter(
      (step): step is number => typeof step === 'number' && Number.isInteger(step) && step >= 0,
    )
  }
  return progress
}

export function usePlaybookProgress() {
  const [progress, setProgress] = useState<PlaybookProgress>(loadProgress)

  const toggleStep = useCallback((playbookId: string, stepIndex: number) => {
    setProgress((prev) => {
      const done = prev[playbookId] ?? []
      const next = done.includes(stepIndex)
        ? done.filter((index) => index !== stepIndex)
        : [...done, stepIndex]
      const updated = { ...prev, [playbookId]: next }
      writeJson(PLAYBOOK_PROGRESS_KEY, updated)
      return updated
    })
  }, [])

  const resetPlaybook = useCallback((playbookId: string) => {
    setProgress((prev) => {
      const updated = { ...prev, [playbookId]: [] }
      writeJson(PLAYBOOK_PROGRESS_KEY, updated)
      return updated
    })
  }, [])

  return { progress, toggleStep, resetPlaybook }
}
