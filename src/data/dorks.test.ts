import { describe, expect, it } from 'vitest'
import {
  buildSearchUrl,
  categories,
  countDorksByEngine,
  dorks,
  engines,
  getCategories,
  getCategoriesByEngine,
  getDorks,
  getDorksByCategory,
  getDorksByEngine,
  getEngineById,
  getEngines,
  searchDorks,
} from './dorks'

describe('dorks data', () => {
  it('has categories', () => {
    expect(categories.length).toBeGreaterThan(0)
    expect(getCategories()).toEqual(categories)
  })

  it('has dorks', () => {
    expect(dorks.length).toBeGreaterThan(0)
    expect(getDorks()).toEqual(dorks)
  })

  it('has 16 engines', () => {
    expect(engines).toHaveLength(16)
    expect(getEngines()).toEqual(engines)
    const ids = engines.map((engine) => engine.id)
    expect(ids).toEqual([
      'google',
      'bing',
      'duckduckgo',
      'yandex',
      'shodan',
      'censys',
      'github',
      'fofa',
      'zoomeye',
      'crtsh',
      'wayback',
      'netlas',
      'greynoise',
      'binaryedge',
      'publicwww',
      'searxng',
    ])
  })

  it('the new engines have dorks and categories', () => {
    const expectedMinimums: Record<string, number> = {
      netlas: 8,
      greynoise: 6,
      binaryedge: 6,
      publicwww: 5,
      searxng: 4,
    }
    for (const [engineId, minimum] of Object.entries(expectedMinimums)) {
      expect(getDorksByEngine(engineId).length).toBeGreaterThanOrEqual(minimum)
      expect(getCategoriesByEngine(engineId).length).toBeGreaterThan(0)
    }
  })

  it('every dork belongs to a valid category', () => {
    const categoryIds = new Set(categories.map((c) => c.id))
    for (const dork of dorks) {
      expect(categoryIds.has(dork.category)).toBe(true)
    }
  })

  it('every dork has required fields including engine', () => {
    for (const dork of dorks) {
      expect(dork.id).toBeTruthy()
      expect(dork.operator).toBeTruthy()
      expect(dork.description).toBeTruthy()
      expect(dork.example).toBeTruthy()
      expect(dork.usage).toBeTruthy()
      expect(dork.category).toBeTruthy()
      expect(dork.engine).toBeTruthy()
    }
  })

  it('every dork has a valid engine and its category belongs to that engine', () => {
    const engineIds = new Set(engines.map((e) => e.id))
    const categoryById = new Map(categories.map((c) => [c.id, c]))
    for (const dork of dorks) {
      expect(engineIds.has(dork.engine)).toBe(true)
      expect(categoryById.get(dork.category)?.engineId).toBe(dork.engine)
    }
  })

  it('every category belongs to a valid engine', () => {
    const engineIds = new Set(engines.map((e) => e.id))
    for (const category of categories) {
      expect(engineIds.has(category.engineId)).toBe(true)
    }
  })

  it('the new GHDB-style categories exist and are valid Google categories', () => {
    const newCategories: Array<{ id: string; sensitive: boolean }> = [
      { id: 'sensitive-files', sensitive: true },
      { id: 'login-panels', sensitive: false },
      { id: 'error-messages', sensitive: true },
      { id: 'dashboards', sensitive: true },
      { id: 'iot-devices', sensitive: true },
      { id: 'cloud-buckets', sensitive: true },
      { id: 'leaky-documents', sensitive: true },
    ]
    for (const { id, sensitive } of newCategories) {
      const category = getCategoriesByEngine('google').find((c) => c.id === id)
      expect(category, `categoría ${id}`).toBeTruthy()
      expect(Boolean(category!.sensitive)).toBe(sensitive)
      expect(getDorksByCategory(id).length).toBeGreaterThanOrEqual(8)
    }
  })

  it('every category has at least one dork', () => {
    for (const category of categories) {
      expect(getDorksByCategory(category.id).length).toBeGreaterThan(0)
    }
  })

  it('every engine has at least one dork', () => {
    const counts = countDorksByEngine()
    for (const engine of engines) {
      expect(counts[engine.id]).toBeGreaterThan(0)
    }
  })

  it('getCategoriesByEngine returns only categories of that engine', () => {
    const googleCategories = getCategoriesByEngine('google')
    expect(googleCategories).toHaveLength(21)
    for (const category of googleCategories) {
      expect(category.engineId).toBe('google')
    }
    expect(getCategoriesByEngine('shodan').length).toBeGreaterThan(0)
    expect(getCategories('shodan')).toEqual(getCategoriesByEngine('shodan'))
  })

  it('getDorksByEngine returns only dorks of that engine', () => {
    const shodanDorks = getDorksByEngine('shodan')
    expect(shodanDorks.length).toBeGreaterThanOrEqual(20)
    for (const dork of shodanDorks) {
      expect(dork.engine).toBe('shodan')
    }
    const githubDorks = getDorksByEngine('github')
    expect(githubDorks.length).toBeGreaterThanOrEqual(20)
    for (const dork of githubDorks) {
      expect(dork.engine).toBe('github')
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

  it('combines search with engine filter', () => {
    const results = searchDorks('port', undefined, 'shodan')
    expect(results.length).toBeGreaterThan(0)
    for (const dork of results) {
      expect(dork.engine).toBe('shodan')
    }
    // El mismo término no devuelve dorks de Google en modo Shodan
    expect(results.some((d) => d.engine === 'google')).toBe(false)
  })

  it('returns empty array for non-matching search', () => {
    expect(searchDorks('xyznonexistent123')).toEqual([])
  })
})

describe('buildSearchUrl', () => {
  it('builds a Google URL with encoded query', () => {
    expect(buildSearchUrl('google', 'site:example.com')).toBe(
      'https://www.google.com/search?q=site%3Aexample.com',
    )
  })

  it('builds a Shodan URL with encoded query', () => {
    expect(buildSearchUrl('shodan', 'webcam country:MX')).toBe(
      'https://www.shodan.io/search?query=webcam%20country%3AMX',
    )
  })

  it('builds a GitHub URL pointing to code search', () => {
    expect(buildSearchUrl('github', 'filename:.env')).toBe(
      'https://github.com/search?q=filename%3A.env&type=code',
    )
  })

  it('builds a FOFA URL with the query in base64', () => {
    const query = 'port="3389"'
    expect(buildSearchUrl('fofa', query)).toBe(`https://fofa.info/result?qbase64=${btoa(query)}`)
  })

  it('builds a FOFA URL handling non-ASCII characters', () => {
    const query = 'title="Panel de administración"'
    const url = buildSearchUrl('fofa', query)
    expect(url.startsWith('https://fofa.info/result?qbase64=')).toBe(true)
    expect(url).toContain(btoa(unescape(encodeURIComponent(query))))
  })

  it('builds a Wayback URL with the query as path (no encoding)', () => {
    expect(buildSearchUrl('wayback', 'example.com/robots.txt')).toBe(
      'https://web.archive.org/web/*/example.com/robots.txt',
    )
  })

  it('builds a Netlas URL with encoded query', () => {
    expect(buildSearchUrl('netlas', 'host:ejemplo.com port:443')).toBe(
      'https://app.netlas.io/responses/?q=host%3Aejemplo.com%20port%3A443',
    )
  })

  it('builds a GreyNoise GNQL URL with encoded query', () => {
    expect(buildSearchUrl('greynoise', 'classification:malicious')).toBe(
      'https://viz.greynoise.io/query?gnql=classification%3Amalicious',
    )
  })

  it('builds a BinaryEdge URL with encoded query', () => {
    expect(buildSearchUrl('binaryedge', 'port:3389 country:"MX"')).toBe(
      'https://app.binaryedge.io/services/query?query=port%3A3389%20country%3A%22MX%22',
    )
  })

  it('builds a PublicWWW URL with the query as path (no encoding)', () => {
    expect(buildSearchUrl('publicwww', '"UA-12345678-1"')).toBe(
      'https://publicwww.com/websites/"UA-12345678-1"/',
    )
  })

  it('builds a SearXNG URL with encoded query', () => {
    expect(buildSearchUrl('searxng', 'site:gob.mx transparencia')).toBe(
      'https://searx.be/search?q=site%3Agob.mx%20transparencia',
    )
  })

  it('accepts an Engine object', () => {
    const engine = getEngineById('censys')
    expect(engine).toBeTruthy()
    expect(buildSearchUrl(engine!, 'services.port: 22')).toBe(
      'https://search.censys.io/search?resource=hosts&q=services.port%3A%2022',
    )
  })

  it('throws for an unknown engine', () => {
    expect(() => buildSearchUrl('unknown-engine', 'test')).toThrow()
  })
})
