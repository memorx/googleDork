import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HISTORY_KEY, HISTORY_LIMIT, useHistory } from './useHistory'

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.entries).toEqual([])
  })

  it('adds entries newest-first with engine, query and timestamp', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.addToHistory({ engine: 'google', query: 'site:example.com' }))
    act(() => result.current.addToHistory({ engine: 'shodan', query: 'port:22' }))

    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[0].engine).toBe('shodan')
    expect(result.current.entries[0].query).toBe('port:22')
    expect(typeof result.current.entries[0].timestamp).toBe('number')
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      HISTORY_KEY,
      JSON.stringify(result.current.entries),
    )
  })

  it(`keeps at most ${HISTORY_LIMIT} entries`, () => {
    const { result } = renderHook(() => useHistory())
    act(() => {
      for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
        result.current.addToHistory({ engine: 'google', query: `query-${i}` })
      }
    })

    expect(result.current.entries).toHaveLength(HISTORY_LIMIT)
    expect(result.current.entries[0].query).toBe(`query-${HISTORY_LIMIT + 4}`)
    expect(result.current.entries.at(-1)?.query).toBe('query-5')
  })

  it('moves a repeated engine+query to the front without duplicating it', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.addToHistory({ engine: 'google', query: 'site:a.com' }))
    act(() => result.current.addToHistory({ engine: 'google', query: 'site:b.com' }))
    act(() => result.current.addToHistory({ engine: 'google', query: 'site:a.com' }))

    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[0].query).toBe('site:a.com')
  })

  it('clears the history and persists the empty list', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.addToHistory({ engine: 'google', query: 'site:example.com' }))
    act(() => result.current.clearHistory())

    expect(result.current.entries).toEqual([])
    expect(localStorage.setItem).toHaveBeenLastCalledWith(HISTORY_KEY, JSON.stringify([]))
  })
})
