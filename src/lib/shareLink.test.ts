import { describe, expect, it } from 'vitest'
import { decodeReconShare, encodeReconShare, type SharedRecon } from './shareLink'

const SAMPLE: SharedRecon = {
  domain: 'example.com',
  date: '2026-01-15T10:30:00.000Z',
  subdomains: ['www.example.com', 'mail.example.com', 'api.example.com'],
  dns: [
    { type: 'A', data: '93.184.216.34' },
    { type: 'MX', data: '10 mail.example.com' },
    { type: 'TXT', data: 'v=spf1 include:_spf.example.com ~all' },
  ],
}

describe('encodeReconShare / decodeReconShare', () => {
  it('round-trips a recon payload through the hash', async () => {
    const hash = await encodeReconShare(SAMPLE)
    expect(hash.startsWith('#recon=')).toBe(true)
    // base64url: sin '+', '/' ni '=' en el payload
    expect(hash.slice('#recon='.length)).not.toMatch(/[+/=]/)

    const decoded = await decodeReconShare(hash)
    expect(decoded).toEqual(SAMPLE)
  })

  it('compresses the payload (hash smaller than raw JSON for big lists)', async () => {
    const big: SharedRecon = {
      ...SAMPLE,
      subdomains: Array.from({ length: 200 }, (_, i) => `sub-${i}.example.com`),
    }
    const hash = await encodeReconShare(big)
    expect(hash.length).toBeLessThan(JSON.stringify(big).length)
    expect(await decodeReconShare(hash)).toEqual(big)
  })

  it('returns null for a corrupted hash', async () => {
    expect(await decodeReconShare('#recon=basura-no-valida!!!')).toBeNull()
    const hash = await encodeReconShare(SAMPLE)
    // truncar el payload corrompe el deflate
    expect(await decodeReconShare(hash.slice(0, hash.length - 10))).toBeNull()
  })

  it('returns null for hashes without the recon prefix or wrong shapes', async () => {
    expect(await decodeReconShare('#otro=abc')).toBeNull()
    expect(await decodeReconShare('recon=abc')).toBeNull()

    // JSON válido pero con forma incorrecta: lo codificamos manualmente
    const wrong = await encodeReconShare(SAMPLE)
    const tampered = wrong // sanity: el válido sí decodifica
    expect(await decodeReconShare(tampered)).not.toBeNull()

    // deflate-raw de "42" (número, no SharedRecon)
    const stream = new CompressionStream('deflate-raw')
    const writer = stream.writable.getWriter()
    void writer.write(new TextEncoder().encode('42')).then(() => writer.close())
    const buf = await new Response(stream.readable).arrayBuffer()
    let binary = ''
    for (const byte of new Uint8Array(buf)) binary += String.fromCharCode(byte)
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(await decodeReconShare(`#recon=${encoded}`)).toBeNull()
  })
})
