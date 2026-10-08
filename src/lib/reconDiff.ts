// Snapshots de recon y diff entre escaneos: compara subdominios y registros DNS
// entre el snapshot anterior y el nuevo. Funciones puras, sin dependencias de UI.

import type { DnsRecord } from './recon'

export interface ReconSnapshot {
  date: string
  subdomains: string[]
  dns: Record<string, string[]>
}

export interface DnsTypeChange {
  type: string
  added: string[]
  removed: string[]
}

export interface SnapshotDiff {
  addedSubdomains: string[]
  removedSubdomains: string[]
  dnsChanges: DnsTypeChange[]
}

/** Agrupa registros DNS planos por tipo: { A: [...], MX: [...] }. */
export function dnsRecordsToMap(records: DnsRecord[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const record of records) {
    const list = map[record.type] ?? []
    if (!list.includes(record.data)) list.push(record.data)
    map[record.type] = list
  }
  for (const type of Object.keys(map)) map[type].sort()
  return map
}

function sortedDiff(prev: string[], next: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set(prev)
  const nextSet = new Set(next)
  return {
    added: next.filter((item) => !prevSet.has(item)).sort(),
    removed: prev.filter((item) => !nextSet.has(item)).sort(),
  }
}

/** Diff entre dos snapshots: subdominios nuevos/caídos y cambios DNS por tipo. */
export function computeSnapshotDiff(prev: ReconSnapshot, next: ReconSnapshot): SnapshotDiff {
  const { added: addedSubdomains, removed: removedSubdomains } = sortedDiff(
    prev.subdomains,
    next.subdomains,
  )

  const types = [...new Set([...Object.keys(prev.dns), ...Object.keys(next.dns)])].sort()
  const dnsChanges: DnsTypeChange[] = []
  for (const type of types) {
    const { added, removed } = sortedDiff(prev.dns[type] ?? [], next.dns[type] ?? [])
    if (added.length > 0 || removed.length > 0) dnsChanges.push({ type, added, removed })
  }

  return { addedSubdomains, removedSubdomains, dnsChanges }
}

/** ¿El diff está vacío (ningún cambio entre snapshots)? */
export function isDiffEmpty(diff: SnapshotDiff): boolean {
  return (
    diff.addedSubdomains.length === 0 &&
    diff.removedSubdomains.length === 0 &&
    diff.dnsChanges.length === 0
  )
}
