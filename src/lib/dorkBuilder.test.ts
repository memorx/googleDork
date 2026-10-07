import { describe, expect, it } from 'vitest'
import { buildQuery, getOperatorsForEngine } from './dorkBuilder'

describe('getOperatorsForEngine', () => {
  it('returns unique ":"-terminated operators for an engine', () => {
    const operators = getOperatorsForEngine('google')
    expect(operators.length).toBeGreaterThan(0)
    expect(operators.every((operator) => operator.endsWith(':'))).toBe(true)
    expect(new Set(operators).size).toBe(operators.length)
    expect(operators).toContain('site:')
  })

  it('returns an empty list when the engine has no ":" operators', () => {
    expect(getOperatorsForEngine('wayback')).toEqual([])
  })
})

describe('buildQuery', () => {
  it('combines operator and value conditions', () => {
    expect(
      buildQuery([
        { operator: 'site:', value: 'example.com' },
        { operator: 'filetype:', value: 'pdf' },
      ]),
    ).toBe('site:example.com filetype:pdf')
  })

  it('keeps free text values as-is', () => {
    expect(
      buildQuery([
        { operator: 'site:', value: 'example.com' },
        { operator: null, value: 'panel admin' },
      ]),
    ).toBe('site:example.com panel admin')
  })

  it('skips conditions with empty values', () => {
    expect(
      buildQuery([
        { operator: 'site:', value: '' },
        { operator: null, value: '  ' },
        { operator: 'intitle:', value: 'login' },
      ]),
    ).toBe('intitle:login')
  })

  it('returns an empty string when nothing has a value', () => {
    expect(buildQuery([{ operator: 'site:', value: '' }])).toBe('')
  })
})
