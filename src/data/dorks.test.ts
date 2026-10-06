import { describe, expect, it } from 'vitest'
import { categories, dorks, getCategories, getDorks, getDorksByCategory, searchDorks } from './dorks'

describe('dorks data', () => {
  it('has categories', () => {
    expect(categories.length).toBeGreaterThan(0)
    expect(getCategories()).toEqual(categories)
  })

  it('has dorks', () => {
    expect(dorks.length).toBeGreaterThan(0)
    expect(getDorks()).toEqual(dorks)
  })

  it('every dork belongs to a valid category', () => {
    const categoryIds = new Set(categories.map((c) => c.id))
    for (const dork of dorks) {
      expect(categoryIds.has(dork.category)).toBe(true)
    }
  })

  it('every dork has required fields', () => {
    for (const dork of dorks) {
      expect(dork.id).toBeTruthy()
      expect(dork.operator).toBeTruthy()
      expect(dork.description).toBeTruthy()
      expect(dork.example).toBeTruthy()
      expect(dork.usage).toBeTruthy()
      expect(dork.category).toBeTruthy()
    }
  })

  it('filters dorks by category', () => {
    const basicDorks = getDorksByCategory('basic')
    expect(basicDorks.length).toBeGreaterThan(0)
    for (const dork of basicDorks) {
      expect(dork.category).toBe('basic')
    }
  })

  it('searches dorks by operator', () => {
    const results = searchDorks('site:')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((d) => d.operator.includes('site:'))).toBe(true)
  })

  it('searches dorks by description', () => {
    const results = searchDorks('seguridad')
    expect(results.length).toBeGreaterThan(0)
  })

  it('combines search with category filter', () => {
    const results = searchDorks('filetype', 'files')
    expect(results.length).toBeGreaterThan(0)
    for (const dork of results) {
      expect(dork.category).toBe('files')
      expect(
        dork.operator.toLowerCase().includes('filetype') ||
          dork.description.toLowerCase().includes('filetype') ||
          dork.example.toLowerCase().includes('filetype') ||
          dork.usage.toLowerCase().includes('filetype'),
      ).toBe(true)
    }
  })

  it('returns empty array for non-matching search', () => {
    expect(searchDorks('xyznonexistent123')).toEqual([])
  })
})
