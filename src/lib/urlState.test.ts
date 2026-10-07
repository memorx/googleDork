import { describe, expect, it } from 'vitest'
import { buildUrlSearch, parseUrlState } from './urlState'

describe('parseUrlState', () => {
  it('parses engine, q and cat params', () => {
    expect(parseUrlState('?engine=shodan&q=camara&cat=shodan-camaras')).toEqual({
      engine: 'shodan',
      q: 'camara',
      cat: 'shodan-camaras',
      global: false,
      fav: false,
    })
  })

  it('parses the global and fav flags', () => {
    expect(parseUrlState('?global=1&fav=1')).toEqual({
      engine: undefined,
      q: undefined,
      cat: undefined,
      global: true,
      fav: true,
    })
  })

  it('returns undefined params and false flags for an empty query string', () => {
    expect(parseUrlState('')).toEqual({
      engine: undefined,
      q: undefined,
      cat: undefined,
      global: false,
      fav: false,
    })
  })

  it('ignores values other than "1" for the boolean flags', () => {
    const state = parseUrlState('?global=true&fav=0')
    expect(state.global).toBe(false)
    expect(state.fav).toBe(false)
  })

  it('decodes encoded characters in q', () => {
    expect(parseUrlState('?q=site%3Aexample.com').q).toBe('site:example.com')
  })
})

describe('buildUrlSearch', () => {
  it('omits default values', () => {
    expect(
      buildUrlSearch({ engine: 'google', query: '', category: null, global: false, fav: false }),
    ).toBe('')
  })

  it('serializes the full state', () => {
    expect(
      buildUrlSearch({
        engine: 'shodan',
        query: 'camara ip',
        category: 'shodan-camaras',
        global: false,
        fav: false,
      }),
    ).toBe('?engine=shodan&q=camara+ip&cat=shodan-camaras')
  })

  it('roundtrips with parseUrlState', () => {
    const state = { engine: 'github', query: 'api_key', category: null, global: true, fav: true }
    const parsed = parseUrlState(buildUrlSearch(state))
    expect(parsed).toEqual({
      engine: 'github',
      q: 'api_key',
      cat: undefined,
      global: true,
      fav: true,
    })
  })
})
