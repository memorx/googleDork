import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FAVORITES_KEY, useFavorites } from './useFavorites'

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toEqual([])
  })

  it('adds a favorite and persists it to localStorage', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => result.current.toggleFavorite('site'))

    expect(result.current.favorites).toEqual(['site'])
    expect(result.current.isFavorite('site')).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith(FAVORITES_KEY, JSON.stringify(['site']))
  })

  it('removes a favorite when toggled twice', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => result.current.toggleFavorite('site'))
    act(() => result.current.toggleFavorite('site'))

    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite('site')).toBe(false)
    expect(localStorage.setItem).toHaveBeenLastCalledWith(FAVORITES_KEY, JSON.stringify([]))
  })

  it('loads stored favorites on init', () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce(JSON.stringify(['site', 'shodan-mongodb']))
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual(['site', 'shodan-mongodb'])
  })

  it('ignores malformed stored values', () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce('{"not":"an array"}')
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
  })
})
