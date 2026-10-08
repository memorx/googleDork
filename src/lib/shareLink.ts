// Compartir un recon por URL: serializa el resultado a JSON, lo comprime con
// CompressionStream ('deflate-raw', nativa del navegador) y lo codifica en
// base64url para llevarlo en el hash #recon=... sin dependencias externas.

import type { DnsRecord } from './recon'

export interface SharedRecon {
  domain: string
  date: string
  subdomains: string[]
  dns: DnsRecord[]
}

export const RECON_HASH_PREFIX = '#recon='

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function transformBytes(
  data: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  const written = writer.write(data).then(() => writer.close())
  // Si el stream falla (datos corruptos), el reader rechaza primero y este
  // catch evita un "unhandled rejection" del lado del writer.
  written.catch(() => {})
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  await written
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function isSharedRecon(value: unknown): value is SharedRecon {
  if (typeof value !== 'object' || value === null) return false
  const recon = value as Record<string, unknown>
  return (
    typeof recon.domain === 'string' &&
    typeof recon.date === 'string' &&
    Array.isArray(recon.subdomains) &&
    recon.subdomains.every((item) => typeof item === 'string') &&
    Array.isArray(recon.dns) &&
    recon.dns.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DnsRecord).type === 'string' &&
        typeof (item as DnsRecord).data === 'string',
    )
  )
}

/** Codifica un recon como hash `#recon=...` listo para pegar en la URL. */
export async function encodeReconShare(recon: SharedRecon): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(recon))
  const compressed = await transformBytes(json, new CompressionStream('deflate-raw'))
  return `${RECON_HASH_PREFIX}${bytesToBase64Url(compressed)}`
}

/** Decodifica un hash `#recon=...`. Devuelve null si está corrupto o mal formado. */
export async function decodeReconShare(hash: string): Promise<SharedRecon | null> {
  try {
    if (!hash.startsWith(RECON_HASH_PREFIX)) return null
    const bytes = base64UrlToBytes(hash.slice(RECON_HASH_PREFIX.length))
    const decompressed = await transformBytes(bytes, new DecompressionStream('deflate-raw'))
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decompressed))
    return isSharedRecon(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** URL completa compartible (origen + ruta actuales + hash). */
export async function buildReconShareUrl(recon: SharedRecon): Promise<string> {
  const hash = await encodeReconShare(recon)
  return `${window.location.origin}${window.location.pathname}${hash}`
}
