import { describe, expect, it, vi } from 'vitest'
import {
  SUBDOMAIN_PREFIXES,
  buildAuditMarkdown,
  extractSubdomains,
  fetchDnsRecords,
  fetchSubdomains,
  fetchUrlscanResults,
  fetchWaybackUrls,
  filterUrlsByExtension,
  generateReconSections,
  generateSecondGenDorks,
  getUrlExtension,
  isSensitiveUrl,
  isValidDomain,
  normalizeDomain,
  parseCdxResponse,
  parseDnsAnswer,
  parseUrlscanResponse,
  urlHasParams,
  verifySubdomainPermutations,
} from './recon'

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as unknown as Response)
}

describe('normalizeDomain', () => {
  it('strips protocol, path, port and whitespace', () => {
    expect(normalizeDomain('  https://Example.com/path?q=1#top ')).toBe('example.com')
    expect(normalizeDomain('example.com:8443/admin')).toBe('example.com')
  })
})

describe('isValidDomain', () => {
  it('accepts valid domains', () => {
    expect(isValidDomain('example.com')).toBe(true)
    expect(isValidDomain('sub.dominio-ejemplo.co.uk')).toBe(true)
    expect(isValidDomain('https://example.com/')).toBe(true)
  })

  it('rejects invalid domains', () => {
    expect(isValidDomain('')).toBe(false)
    expect(isValidDomain('not a domain')).toBe(false)
    expect(isValidDomain('example')).toBe(false)
    expect(isValidDomain('-bad.com')).toBe(false)
    expect(isValidDomain('bad-.com')).toBe(false)
    expect(isValidDomain('example.123')).toBe(false)
  })
})

describe('generateReconSections', () => {
  it('generates sections for the main engines with the domain applied', () => {
    const sections = generateReconSections('example.com')
    const engineIds = sections.map((section) => section.engineId)
    expect(engineIds).toContain('google')
    expect(engineIds).toContain('shodan')
    expect(engineIds).toContain('github')
    expect(engineIds).toContain('crtsh')
    expect(engineIds).toContain('wayback')

    const google = sections.find((section) => section.engineId === 'google')
    expect(google).toBeTruthy()
    expect(google!.queries.length).toBeGreaterThanOrEqual(8)
    for (const query of google!.queries) {
      expect(query.query).toContain('example.com')
    }

    const shodan = sections.find((section) => section.engineId === 'shodan')
    expect(shodan!.queries.map((q) => q.query)).toContain('hostname:example.com')
    expect(shodan!.queries.map((q) => q.query)).toContain('ssl:example.com')

    const github = sections.find((section) => section.engineId === 'github')
    expect(github!.queries.map((q) => q.query)).toContain('"example.com" filename:.env')
  })
})

describe('extractSubdomains', () => {
  it('dedupes name_value entries split by newlines and strips wildcards', () => {
    const entries = [
      { name_value: 'www.example.com\nmail.example.com' },
      { name_value: 'www.example.com' },
      { name_value: '*.api.example.com' },
      { name_value: 'unrelated.org' },
    ]
    expect(extractSubdomains(entries, 'example.com')).toEqual([
      'api.example.com',
      'mail.example.com',
      'www.example.com',
    ])
  })

  it('returns an empty list for malformed payloads', () => {
    expect(extractSubdomains(null, 'example.com')).toEqual([])
    expect(extractSubdomains({}, 'example.com')).toEqual([])
    expect(extractSubdomains([{ name_value: 42 }, {}], 'example.com')).toEqual([])
  })
})

describe('fetchSubdomains', () => {
  it('queries crt.sh with the wildcard query and returns the deduped list', async () => {
    const fetcher = mockFetchOk([{ name_value: 'a.example.com\nb.example.com' }])
    const result = await fetchSubdomains('example.com', fetcher)
    expect(fetcher).toHaveBeenCalledWith('https://crt.sh/?q=%25.example.com&output=json')
    expect(result).toEqual(['a.example.com', 'b.example.com'])
  })

  it('throws when crt.sh does not respond ok', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response)
    await expect(fetchSubdomains('example.com', fetcher)).rejects.toThrow()
  })
})

describe('parseDnsAnswer', () => {
  it('extracts the data field of each answer', () => {
    const json = {
      Status: 0,
      Answer: [
        { name: 'example.com', type: 1, data: '93.184.216.34' },
        { name: 'example.com', type: 1, data: '93.184.216.35' },
        { name: 'example.com', type: 1 },
      ],
    }
    expect(parseDnsAnswer(json)).toEqual(['93.184.216.34', '93.184.216.35'])
  })

  it('returns an empty list when there is no Answer', () => {
    expect(parseDnsAnswer({ Status: 3 })).toEqual([])
    expect(parseDnsAnswer(null)).toEqual([])
  })
})

describe('fetchDnsRecords', () => {
  it('queries dns.google for A, MX, TXT and NS and tags each record', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      const type = new URL(url).searchParams.get('type')
      return {
        ok: true,
        json: async () => ({ Answer: [{ data: `valor-${type}` }] }),
      } as unknown as Response
    })
    const records = await fetchDnsRecords('example.com', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(records).toEqual([
      { type: 'A', data: 'valor-A' },
      { type: 'MX', data: 'valor-MX' },
      { type: 'TXT', data: 'valor-TXT' },
      { type: 'NS', data: 'valor-NS' },
    ])
  })

  it('throws when dns.google does not respond ok', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 502 } as unknown as Response)
    await expect(fetchDnsRecords('example.com', fetcher)).rejects.toThrow()
  })
})

describe('buildAuditMarkdown', () => {
  it('includes target, date, subdomains, DNS and all queries grouped by engine', () => {
    const sections = generateReconSections('example.com')
    const markdown = buildAuditMarkdown({
      domain: 'example.com',
      date: new Date('2026-01-01T00:00:00Z'),
      subdomains: ['www.example.com', 'mail.example.com'],
      dnsRecords: [
        { type: 'A', data: '93.184.216.34' },
        { type: 'MX', data: '10 mail.example.com' },
      ],
      sections,
    })
    expect(markdown).toContain('# Kit de auditoría OSINT: example.com')
    expect(markdown).toContain('2026-01-01')
    expect(markdown).toContain('- www.example.com')
    expect(markdown).toContain('### A')
    expect(markdown).toContain('- 93.184.216.34')
    expect(markdown).toContain('### MX')
    expect(markdown).toContain('### Google')
    expect(markdown).toContain('`site:example.com filetype:pdf`')
    expect(markdown).toContain('### Shodan')
    expect(markdown).toContain('`hostname:example.com`')
  })

  it('marks sections not consulted as such', () => {
    const markdown = buildAuditMarkdown({
      domain: 'example.com',
      subdomains: null,
      dnsRecords: null,
      sections: [],
    })
    expect(markdown).toContain('_No consultados._')
  })
})

describe('parseCdxResponse', () => {
  it('skips the header row and dedupes URLs preserving order', () => {
    const payload = [
      ['original'],
      ['http://example.com/index.php'],
      ['http://example.com/backup.sql'],
      ['http://example.com/index.php'],
    ]
    expect(parseCdxResponse(payload)).toEqual([
      'http://example.com/index.php',
      'http://example.com/backup.sql',
    ])
  })

  it('accepts plain string rows and trims whitespace', () => {
    expect(parseCdxResponse([' http://example.com/a ', 'http://example.com/a'])).toEqual([
      'http://example.com/a',
    ])
  })

  it('returns an empty list for malformed payloads', () => {
    expect(parseCdxResponse(null)).toEqual([])
    expect(parseCdxResponse({})).toEqual([])
    expect(parseCdxResponse('oops')).toEqual([])
    expect(parseCdxResponse([[42], [{}], []])).toEqual([])
  })
})

describe('fetchWaybackUrls', () => {
  it('queries the CDX API with the wildcard URL and status filter', async () => {
    const fetcher = mockFetchOk([['original'], ['http://a.example.com/x']])
    const result = await fetchWaybackUrls('example.com', fetcher)
    const calledUrl = fetcher.mock.calls[0][0] as string
    expect(calledUrl).toContain('https://web.archive.org/cdx/search/cdx?')
    expect(calledUrl).toContain('url=')
    expect(calledUrl).toContain('filter=statuscode:200')
    expect(calledUrl).toContain('collapse=urlkey')
    expect(result).toEqual(['http://a.example.com/x'])
  })

  it('throws when web.archive.org does not respond ok', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response)
    await expect(fetchWaybackUrls('example.com', fetcher)).rejects.toThrow()
  })
})

describe('getUrlExtension', () => {
  it('extracts the extension ignoring query string and hash', () => {
    expect(getUrlExtension('http://example.com/config.php?id=1#top')).toBe('php')
    expect(getUrlExtension('http://example.com/.env')).toBe('env')
    expect(getUrlExtension('http://example.com/index.php.bak')).toBe('bak')
  })

  it('returns null when the last segment has no valid extension', () => {
    expect(getUrlExtension('http://example.com/')).toBeNull()
    expect(getUrlExtension('http://example.com/admin/login')).toBeNull()
    expect(getUrlExtension('http://example.com/file.')).toBeNull()
  })
})

describe('urlHasParams / isSensitiveUrl / filterUrlsByExtension', () => {
  const urls = [
    'http://example.com/index.php?id=2',
    'http://example.com/backup.sql',
    'http://example.com/.env',
    'http://example.com/about',
  ]

  it('detects URLs with query params', () => {
    expect(urlHasParams('http://example.com/index.php?id=2')).toBe(true)
    expect(urlHasParams('http://example.com/about')).toBe(false)
  })

  it('flags sensitive extensions only', () => {
    expect(isSensitiveUrl('http://example.com/backup.sql')).toBe(true)
    expect(isSensitiveUrl('http://example.com/.env')).toBe(true)
    expect(isSensitiveUrl('http://example.com/index.php?id=2')).toBe(false)
    expect(isSensitiveUrl('http://example.com/about')).toBe(false)
  })

  it('filters by extension and by the special params filter', () => {
    expect(filterUrlsByExtension(urls, 'sql')).toEqual(['http://example.com/backup.sql'])
    expect(filterUrlsByExtension(urls, 'params')).toEqual([
      'http://example.com/index.php?id=2',
    ])
    expect(filterUrlsByExtension(urls, null)).toEqual(urls)
  })
})

describe('verifySubdomainPermutations', () => {
  it('returns only the hosts that resolve, with their IP, sorted', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      const name = new URL(url).searchParams.get('name')
      const resolves = name === 'dev.example.com' || name === 'vpn.example.com'
      return {
        ok: true,
        json: async () => ({
          Status: resolves ? 0 : 3,
          Answer: resolves ? [{ name, type: 1, data: '10.0.0.1' }] : undefined,
        }),
      } as unknown as Response
    })
    const progress: Array<[number, number]> = []
    const hits = await verifySubdomainPermutations('example.com', fetcher, {
      onProgress: (checked, total) => progress.push([checked, total]),
    })
    expect(fetcher).toHaveBeenCalledTimes(SUBDOMAIN_PREFIXES.length)
    expect(hits).toEqual([
      { host: 'dev.example.com', ip: '10.0.0.1' },
      { host: 'vpn.example.com', ip: '10.0.0.1' },
    ])
    expect(progress.length).toBe(SUBDOMAIN_PREFIXES.length)
    expect(progress[progress.length - 1]).toEqual([
      SUBDOMAIN_PREFIXES.length,
      SUBDOMAIN_PREFIXES.length,
    ])
  })

  it('limits the number of in-flight DNS requests', async () => {
    let active = 0
    let maxActive = 0
    const fetcher = vi.fn().mockImplementation(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1
      return { ok: true, json: async () => ({ Answer: [] }) } as unknown as Response
    })
    await verifySubdomainPermutations('example.com', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(SUBDOMAIN_PREFIXES.length)
    expect(maxActive).toBeLessThanOrEqual(6)
  })

  it('keeps verifying when individual DNS requests fail', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      const name = new URL(url).searchParams.get('name')
      if (name === 'api.example.com') throw new Error('network down')
      return {
        ok: true,
        json: async () => ({ Answer: name === 'git.example.com' ? [{ data: '10.1.1.1' }] : [] }),
      } as unknown as Response
    })
    const hits = await verifySubdomainPermutations('example.com', fetcher)
    expect(hits).toEqual([{ host: 'git.example.com', ip: '10.1.1.1' }])
  })
})

describe('parseUrlscanResponse', () => {
  it('maps page, task and result fields of each scan', () => {
    const payload = {
      total: 2,
      results: [
        {
          page: { url: 'https://example.com/login', ip: '93.184.216.34', server: 'nginx' },
          task: { time: '2024-05-01T10:00:00.000Z' },
          result: 'https://urlscan.io/result/abc/',
        },
        {
          page: { url: 'https://example.com/' },
          task: {},
        },
      ],
    }
    expect(parseUrlscanResponse(payload)).toEqual({
      total: 2,
      results: [
        {
          pageUrl: 'https://example.com/login',
          ip: '93.184.216.34',
          server: 'nginx',
          date: '2024-05-01T10:00:00.000Z',
          resultUrl: 'https://urlscan.io/result/abc/',
        },
        {
          pageUrl: 'https://example.com/',
          ip: null,
          server: null,
          date: null,
          resultUrl: null,
        },
      ],
    })
  })

  it('skips entries without page URL and handles empty or malformed payloads', () => {
    expect(parseUrlscanResponse({ total: 1, results: [{ task: {} }] })).toEqual({
      total: 1,
      results: [],
    })
    expect(parseUrlscanResponse({ total: 0, results: [] })).toEqual({ total: 0, results: [] })
    expect(parseUrlscanResponse(null)).toEqual({ total: 0, results: [] })
    expect(parseUrlscanResponse([])).toEqual({ total: 0, results: [] })
  })
})

describe('fetchUrlscanResults', () => {
  it('queries the public search API scoped to the domain', async () => {
    const fetcher = mockFetchOk({ total: 0, results: [] })
    await fetchUrlscanResults('example.com', fetcher)
    expect(fetcher).toHaveBeenCalledWith(
      'https://urlscan.io/api/v1/search/?q=domain:example.com&size=50',
    )
  })

  it('throws with the status code when rate-limited (429)', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 } as unknown as Response)
    await expect(fetchUrlscanResults('example.com', fetcher)).rejects.toThrow(/429/)
  })
})

describe('generateSecondGenDorks', () => {
  it('generates the expected queries per subdomain with their engine', () => {
    const queries = generateSecondGenDorks('api.example.com')
    expect(queries).toEqual([
      {
        engineId: 'google',
        label: 'Contenido indexado del subdominio',
        query: 'site:api.example.com',
      },
      {
        engineId: 'google',
        label: 'Paneles de administración',
        query: 'site:api.example.com inurl:admin',
      },
      {
        engineId: 'google',
        label: 'Documentos PDF indexados',
        query: 'site:api.example.com filetype:pdf',
      },
      { engineId: 'shodan', label: 'Host en Shodan', query: 'hostname:api.example.com' },
      {
        engineId: 'github',
        label: 'Archivos .env que mencionan el subdominio',
        query: '"api.example.com" filename:.env',
      },
    ])
  })
})
