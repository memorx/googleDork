import { describe, expect, it } from 'vitest'
import { buildBackup, mergeFavorites, mergeHistory, parseBackup } from './dataTransfer'

const sampleHistory = [
  { engine: 'google', query: 'site:example.com', timestamp: 1000 },
  { engine: 'shodan', query: 'hostname:example.com', timestamp: 2000 },
]

describe('buildBackup / parseBackup', () => {
  it('round-trips favorites and history', () => {
    const json = buildBackup(['site', 'filetype'], sampleHistory)
    const parsed = parseBackup(json)
    expect(parsed).toBeTruthy()
    expect(parsed!.favorites).toEqual(['site', 'filetype'])
    expect(parsed!.history).toEqual(sampleHistory)
  })

  it('returns null for invalid JSON', () => {
    expect(parseBackup('not json {')).toBeNull()
  })

  it('returns null for JSON with a wrong structure', () => {
    expect(parseBackup('{"foo": 1}')).toBeNull()
    expect(parseBackup('42')).toBeNull()
    expect(parseBackup('null')).toBeNull()
  })

  it('filters malformed entries but keeps the valid ones', () => {
    const json = JSON.stringify({
      version: 1,
      favorites: ['site', 42, null],
      history: [
        { engine: 'google', query: 'site:example.com', timestamp: 1000 },
        { engine: 'google' },
        'garbage',
      ],
    })
    const parsed = parseBackup(json)
    expect(parsed!.favorites).toEqual(['site'])
    expect(parsed!.history).toEqual([{ engine: 'google', query: 'site:example.com', timestamp: 1000 }])
  })
})

describe('mergeFavorites', () => {
  it('merges without duplicates and reports how many were added', () => {
    const { merged, added } = mergeFavorites(['site'], ['site', 'filetype'])
    expect(merged).toEqual(['site', 'filetype'])
    expect(added).toBe(1)
  })
})

describe('mergeHistory', () => {
  it('dedupes by engine + query and respects the limit', () => {
    const { merged, added } = mergeHistory(
      [sampleHistory[0]],
      [sampleHistory[0], sampleHistory[1]],
      20,
    )
    expect(merged).toEqual(sampleHistory)
    expect(added).toBe(1)

    const capped = mergeHistory([], sampleHistory, 1)
    expect(capped.merged).toHaveLength(1)
    expect(capped.added).toBe(2)
  })
})
