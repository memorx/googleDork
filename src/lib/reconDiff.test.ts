import { describe, expect, it } from 'vitest'
import {
  computeSnapshotDiff,
  dnsRecordsToMap,
  isDiffEmpty,
  type ReconSnapshot,
} from './reconDiff'

function snapshot(input: Partial<ReconSnapshot>): ReconSnapshot {
  return { date: '2026-01-01T00:00:00.000Z', subdomains: [], dns: {}, ...input }
}

describe('dnsRecordsToMap', () => {
  it('groups records by type, dedupes and sorts values', () => {
    const map = dnsRecordsToMap([
      { type: 'A', data: '2.2.2.2' },
      { type: 'MX', data: '10 mail.example.com' },
      { type: 'A', data: '1.1.1.1' },
      { type: 'A', data: '2.2.2.2' },
    ])
    expect(map).toEqual({
      A: ['1.1.1.1', '2.2.2.2'],
      MX: ['10 mail.example.com'],
    })
  })
})

describe('computeSnapshotDiff', () => {
  it('detects added and removed subdomains', () => {
    const prev = snapshot({ subdomains: ['a.example.com', 'b.example.com'] })
    const next = snapshot({ subdomains: ['b.example.com', 'c.example.com'] })
    const diff = computeSnapshotDiff(prev, next)
    expect(diff.addedSubdomains).toEqual(['c.example.com'])
    expect(diff.removedSubdomains).toEqual(['a.example.com'])
    expect(diff.dnsChanges).toEqual([])
  })

  it('detects DNS changes per record type', () => {
    const prev = snapshot({
      dns: { A: ['1.1.1.1'], MX: ['10 viejo.example.com'] },
    })
    const next = snapshot({
      dns: { A: ['1.1.1.1', '2.2.2.2'], MX: ['10 nuevo.example.com'], TXT: ['v=spf1 ~all'] },
    })
    const diff = computeSnapshotDiff(prev, next)
    expect(diff.dnsChanges).toEqual([
      { type: 'A', added: ['2.2.2.2'], removed: [] },
      { type: 'MX', added: ['10 nuevo.example.com'], removed: ['10 viejo.example.com'] },
      { type: 'TXT', added: ['v=spf1 ~all'], removed: [] },
    ])
  })

  it('reports an empty diff when nothing changed', () => {
    const prev = snapshot({ subdomains: ['a.example.com'], dns: { A: ['1.1.1.1'] } })
    const next = snapshot({ subdomains: ['a.example.com'], dns: { A: ['1.1.1.1'] } })
    const diff = computeSnapshotDiff(prev, next)
    expect(isDiffEmpty(diff)).toBe(true)
  })

  it('handles a first snapshot compared against an empty one', () => {
    const diff = computeSnapshotDiff(
      snapshot({}),
      snapshot({ subdomains: ['a.example.com'], dns: { A: ['1.1.1.1'] } }),
    )
    expect(diff.addedSubdomains).toEqual(['a.example.com'])
    expect(diff.dnsChanges).toEqual([{ type: 'A', added: ['1.1.1.1'], removed: [] }])
  })
})
