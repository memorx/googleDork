import { useCallback, useState } from 'react'
import { parseExternalHosts } from '../lib/importExternal'
import { computeSnapshotDiff, type ReconSnapshot, type SnapshotDiff } from '../lib/reconDiff'
import { isValidDomain, normalizeDomain } from '../lib/recon'
import { readJson, writeJson } from '../lib/storage'

export const WORKSPACE_KEY = 'googledork-workspace'

export type NoteSeverity = 'info' | 'low' | 'medium' | 'high'

export interface Note {
  id: string
  text: string
  severity: NoteSeverity
  createdAt: string
}

export interface Target {
  id: string
  domain: string
  addedAt: string
  notes: Note[]
  externalHosts: string[]
  snapshot?: ReconSnapshot
  /** Diff del último guardado (contra el snapshot anterior), para la vista del workspace. */
  lastDiff?: SnapshotDiff
}

export interface Project {
  id: string
  name: string
  createdAt: string
  targets: Target[]
}

export interface TargetRef {
  project: Project
  target: Target
}

export interface ExternalImportFeedback {
  added: number
  ignored: number
}

const SEVERITIES: NoteSeverity[] = ['info', 'low', 'medium', 'high']

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const note = value as Record<string, unknown>
  return (
    typeof note.id === 'string' &&
    typeof note.text === 'string' &&
    typeof note.createdAt === 'string' &&
    typeof note.severity === 'string' &&
    SEVERITIES.includes(note.severity as NoteSeverity)
  )
}

function isSnapshot(value: unknown): value is ReconSnapshot {
  if (typeof value !== 'object' || value === null) return false
  const snapshot = value as Record<string, unknown>
  if (typeof snapshot.date !== 'string' || !Array.isArray(snapshot.subdomains)) return false
  if (!snapshot.subdomains.every((item) => typeof item === 'string')) return false
  if (typeof snapshot.dns !== 'object' || snapshot.dns === null) return false
  return Object.values(snapshot.dns as Record<string, unknown>).every(
    (list) => Array.isArray(list) && list.every((item) => typeof item === 'string'),
  )
}

function isTarget(value: unknown): value is Target {
  if (typeof value !== 'object' || value === null) return false
  const target = value as Record<string, unknown>
  return (
    typeof target.id === 'string' &&
    typeof target.domain === 'string' &&
    typeof target.addedAt === 'string' &&
    Array.isArray(target.notes) &&
    (target.notes as unknown[]).every(isNote) &&
    (target.externalHosts === undefined ||
      (Array.isArray(target.externalHosts) &&
        (target.externalHosts as unknown[]).every((host) => typeof host === 'string'))) &&
    (target.snapshot === undefined || isSnapshot(target.snapshot))
  )
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false
  const project = value as Record<string, unknown>
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    typeof project.createdAt === 'string' &&
    Array.isArray(project.targets) &&
    (project.targets as unknown[]).every(isTarget)
  )
}

function loadProjects(): Project[] {
  const stored = readJson<unknown>(WORKSPACE_KEY, [])
  if (!Array.isArray(stored)) return []
  // Normaliza targets viejos sin externalHosts
  return stored.filter(isProject).map((project) => ({
    ...project,
    targets: project.targets.map((target) => ({
      ...target,
      externalHosts: target.externalHosts ?? [],
    })),
  }))
}

function mapTarget(
  projects: Project[],
  projectId: string,
  targetId: string,
  fn: (target: Target) => Target,
): Project[] {
  return projects.map((project) =>
    project.id !== projectId
      ? project
      : {
          ...project,
          targets: project.targets.map((target) =>
            target.id === targetId ? fn(target) : target,
          ),
        },
  )
}

export function useWorkspace() {
  const [projects, setProjects] = useState<Project[]>(loadProjects)

  const update = useCallback((fn: (prev: Project[]) => Project[]) => {
    setProjects((prev) => {
      const next = fn(prev)
      writeJson(WORKSPACE_KEY, next)
      return next
    })
  }, [])

  const createProject = useCallback(
    (name: string): Project | null => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const project: Project = {
        id: createId(),
        name: trimmed,
        createdAt: new Date().toISOString(),
        targets: [],
      }
      update((prev) => [...prev, project])
      return project
    },
    [update],
  )

  const renameProject = useCallback(
    (projectId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      update((prev) =>
        prev.map((project) => (project.id === projectId ? { ...project, name: trimmed } : project)),
      )
    },
    [update],
  )

  const deleteProject = useCallback(
    (projectId: string) => {
      update((prev) => prev.filter((project) => project.id !== projectId))
    },
    [update],
  )

  const addTarget = useCallback(
    (projectId: string, domainInput: string): Target | null => {
      if (!isValidDomain(domainInput)) return null
      const target: Target = {
        id: createId(),
        domain: normalizeDomain(domainInput),
        addedAt: new Date().toISOString(),
        notes: [],
        externalHosts: [],
      }
      update((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, targets: [...project.targets, target] } : project,
        ),
      )
      return target
    },
    [update],
  )

  const removeTarget = useCallback(
    (projectId: string, targetId: string) => {
      update((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? { ...project, targets: project.targets.filter((target) => target.id !== targetId) }
            : project,
        ),
      )
    },
    [update],
  )

  const addNote = useCallback(
    (projectId: string, targetId: string, text: string, severity: NoteSeverity): Note | null => {
      const trimmed = text.trim()
      if (!trimmed) return null
      const note: Note = {
        id: createId(),
        text: trimmed,
        severity,
        createdAt: new Date().toISOString(),
      }
      update((prev) =>
        mapTarget(prev, projectId, targetId, (target) => ({
          ...target,
          notes: [...target.notes, note],
        })),
      )
      return note
    },
    [update],
  )

  const removeNote = useCallback(
    (projectId: string, targetId: string, noteId: string) => {
      update((prev) =>
        mapTarget(prev, projectId, targetId, (target) => ({
          ...target,
          notes: target.notes.filter((note) => note.id !== noteId),
        })),
      )
    },
    [update],
  )

  /**
   * Guarda el snapshot nuevo en el objetivo y devuelve el diff contra el
   * snapshot anterior (null si es el primero).
   */
  const saveSnapshot = useCallback(
    (projectId: string, targetId: string, snapshot: ReconSnapshot): SnapshotDiff | null => {
      const current = projects
        .find((project) => project.id === projectId)
        ?.targets.find((target) => target.id === targetId)
      const diff = current?.snapshot ? computeSnapshotDiff(current.snapshot, snapshot) : null
      update((prev) =>
        mapTarget(prev, projectId, targetId, (target) => ({
          ...target,
          snapshot,
          lastDiff: diff ?? undefined,
        })),
      )
      return diff
    },
    [projects, update],
  )

  /** Fusiona hosts importados de herramientas externas con el objetivo. */
  const importExternalHosts = useCallback(
    (projectId: string, targetId: string, text: string): ExternalImportFeedback => {
      const ref = projects
        .find((project) => project.id === projectId)
        ?.targets.find((target) => target.id === targetId)
      if (!ref) return { added: 0, ignored: 0 }

      const parsed = parseExternalHosts(text, ref.domain)
      const known = new Set([...ref.externalHosts, ...(ref.snapshot?.subdomains ?? [])])
      const newHosts = parsed.added.filter((host) => !known.has(host))
      const ignored = parsed.ignored + (parsed.added.length - newHosts.length)

      if (newHosts.length > 0) {
        update((prev) =>
          mapTarget(prev, projectId, targetId, (target) => ({
            ...target,
            externalHosts: [...target.externalHosts, ...newHosts].sort(),
          })),
        )
      }
      return { added: newHosts.length, ignored }
    },
    [projects, update],
  )

  const findTargetByDomain = useCallback(
    (domain: string): TargetRef | null => {
      const normalized = normalizeDomain(domain)
      for (const project of projects) {
        const target = project.targets.find((candidate) => candidate.domain === normalized)
        if (target) return { project, target }
      }
      return null
    },
    [projects],
  )

  return {
    projects,
    createProject,
    renameProject,
    deleteProject,
    addTarget,
    removeTarget,
    addNote,
    removeNote,
    saveSnapshot,
    importExternalHosts,
    findTargetByDomain,
  }
}

export type WorkspaceApi = ReturnType<typeof useWorkspace>
