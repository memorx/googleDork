// Importar resultados de herramientas externas (subfinder, amass, nmap -oG):
// extrae hosts válidos, deduplica y filtra a los que pertenecen al dominio objetivo.

import { isValidDomain, normalizeDomain } from './recon'

export interface ExternalImportResult {
  /** Hosts nuevos, dentro de scope y deduplicados. */
  added: string[]
  /** Líneas ignoradas: inválidas, IPs o fuera del dominio objetivo. */
  ignored: number
}

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/

/**
 * Extrae el host candidato de una línea:
 * - nmap -oG: "Host: 1.2.3.4 () Ports: 80/open/tcp//http..."
 * - amass CSV: "www.example.com,source"
 * - subfinder: "www.example.com" (un host por línea)
 */
function extractHost(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const nmapMatch = /^Host:\s+(\S+)/i.exec(trimmed)
  const raw = nmapMatch ? (nmapMatch[1] ?? '') : trimmed.split(/[\s,]/)[0] ?? ''
  const host = raw.trim().toLowerCase().replace(/\.$/, '')
  return host || null
}

/** ¿El host pertenece al dominio objetivo (es el dominio o un subdominio)? */
export function hostBelongsToDomain(host: string, targetDomain: string): boolean {
  const target = normalizeDomain(targetDomain)
  return host === target || host.endsWith(`.${target}`)
}

/**
 * Parsea texto con resultados externos y devuelve los hosts dentro de scope.
 * Las IPs se ignoran: no se pueden asociar al dominio objetivo por texto.
 */
export function parseExternalHosts(text: string, targetDomain: string): ExternalImportResult {
  const found = new Set<string>()
  let ignored = 0

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const host = extractHost(line)
    if (!host || IPV4_REGEX.test(host) || !isValidDomain(host) || !hostBelongsToDomain(host, targetDomain)) {
      ignored += 1
      continue
    }
    found.add(host)
  }

  return { added: [...found].sort(), ignored }
}
