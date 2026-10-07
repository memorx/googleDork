import { describe, expect, it, vi } from 'vitest'
import {
  buildAuditMarkdown,
  extractSubdomains,
  fetchDnsRecords,
  fetchSubdomains,
  generateReconSections,
  isValidDomain,
  normalizeDomain,
  parseDnsAnswer,
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
