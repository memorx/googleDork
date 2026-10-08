import { describe, expect, it } from 'vitest'
import { hostBelongsToDomain, parseExternalHosts } from './importExternal'

describe('parseExternalHosts', () => {
  it('parses subfinder output (one host per line) and dedupes', () => {
    const text = [
      'www.example.com',
      'mail.example.com',
      'www.example.com',
      '',
      'api.example.com',
    ].join('\n')
    const result = parseExternalHosts(text, 'example.com')
    expect(result.added).toEqual(['api.example.com', 'mail.example.com', 'www.example.com'])
    expect(result.ignored).toBe(0)
  })

  it('parses amass CSV lines (host,source)', () => {
    const result = parseExternalHosts('www.example.com,crtsh\nmail.example.com,dns', 'example.com')
    expect(result.added).toEqual(['mail.example.com', 'www.example.com'])
    expect(result.ignored).toBe(0)
  })

  it('parses nmap -oG lines with a hostname', () => {
    const text =
      'Host: vpn.example.com () Ports: 22/open/tcp//ssh///, 443/open/tcp//https///\n' +
      'Host: db.example.com () Ports: 5432/open/tcp//postgresql///'
    const result = parseExternalHosts(text, 'example.com')
    expect(result.added).toEqual(['db.example.com', 'vpn.example.com'])
    expect(result.ignored).toBe(0)
  })

  it('ignores nmap -oG lines with plain IPs (not attributable to the domain)', () => {
    const text = 'Host: 203.0.113.10 () Ports: 80/open/tcp//http///'
    const result = parseExternalHosts(text, 'example.com')
    expect(result.added).toEqual([])
    expect(result.ignored).toBe(1)
  })

  it('filters hosts outside the target domain and invalid lines', () => {
    const text = [
      'www.example.com',
      'otro-dominio.org',
      'no es un dominio',
      '# comentario',
      'sub.otherexample.com',
    ].join('\n')
    const result = parseExternalHosts(text, 'example.com')
    expect(result.added).toEqual(['www.example.com'])
    expect(result.ignored).toBe(4)
  })

  it('keeps the target domain itself when listed', () => {
    const result = parseExternalHosts('example.com\nwww.example.com', 'example.com')
    expect(result.added).toEqual(['example.com', 'www.example.com'])
  })

  it('normalizes case and trailing dots', () => {
    const result = parseExternalHosts('WWW.Example.COM.\nmail.EXAMPLE.com', 'EXAMPLE.com')
    expect(result.added).toEqual(['mail.example.com', 'www.example.com'])
  })
})

describe('hostBelongsToDomain', () => {
  it('matches the domain and its subdomains only', () => {
    expect(hostBelongsToDomain('example.com', 'example.com')).toBe(true)
    expect(hostBelongsToDomain('a.b.example.com', 'example.com')).toBe(true)
    expect(hostBelongsToDomain('notexample.com', 'example.com')).toBe(false)
    expect(hostBelongsToDomain('example.com.ar', 'example.com')).toBe(false)
  })
})
