// Lógica del panel "Recon de objetivo": validación de dominios, plantillas de
// queries por motor y consultas en vivo a crt.sh (Certificate Transparency) y
// dns.google (DNS over HTTPS). Todo es OSINT pasivo: solo fuentes públicas.

export interface ReconQuery {
  label: string
  query: string
}

export interface ReconSection {
  engineId: string
  title: string
  queries: ReconQuery[]
}

export interface DnsRecord {
  type: string
  data: string
}

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,63}$/i

/** Limpia la entrada (protocolo, ruta, puerto, espacios) y devuelve el dominio en minúsculas. */
export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase()
  value = value.replace(/^https?:\/\//, '')
  value = value.split(/[/?#]/)[0] ?? value
  value = value.split(':')[0] ?? value
  return value
}

export function isValidDomain(input: string): boolean {
  const domain = normalizeDomain(input)
  return domain.length <= 253 && DOMAIN_REGEX.test(domain)
}

/** Genera las secciones de queries pre-rellenadas para un dominio objetivo. */
export function generateReconSections(domain: string): ReconSection[] {
  return [
    {
      engineId: 'google',
      title: 'Google',
      queries: [
        { label: 'Documentos PDF indexados', query: `site:${domain} filetype:pdf` },
        { label: 'Paneles de administración', query: `site:${domain} inurl:admin` },
        { label: 'Directorios con autoindex', query: `site:${domain} intitle:"index of"` },
        { label: 'Volcados SQL expuestos', query: `site:${domain} ext:sql` },
        { label: 'Subdominios indexados (sin www)', query: `site:*.${domain} -www` },
        { label: 'Archivos de entorno .env', query: `site:${domain} filetype:env` },
        { label: 'Páginas de login', query: `site:${domain} intitle:"login"` },
        { label: 'robots.txt y sitemaps', query: `site:${domain} (inurl:robots.txt OR inurl:sitemap.xml)` },
        { label: 'Respaldos expuestos', query: `site:${domain} (ext:bak OR ext:old OR ext:backup)` },
        { label: 'Menciones de contraseñas', query: `site:${domain} ("password" OR "contraseña")` },
      ],
    },
    {
      engineId: 'crtsh',
      title: 'crt.sh (Certificate Transparency)',
      queries: [
        { label: 'Certificados del dominio y subdominios', query: `%.${domain}` },
      ],
    },
    {
      engineId: 'wayback',
      title: 'Wayback Machine',
      queries: [
        { label: 'Historial completo de URLs archivadas', query: `${domain}/*` },
      ],
    },
    {
      engineId: 'shodan',
      title: 'Shodan',
      queries: [
        { label: 'Hosts que responden por el dominio', query: `hostname:${domain}` },
        { label: 'Certificados SSL del dominio', query: `ssl:${domain}` },
      ],
    },
    {
      engineId: 'github',
      title: 'GitHub',
      queries: [
        { label: 'Archivos .env que mencionan el dominio', query: `"${domain}" filename:.env` },
        { label: 'Contraseñas asociadas al dominio', query: `"${domain}" password` },
        { label: 'Claves de API asociadas al dominio', query: `"${domain}" "api_key"` },
      ],
    },
  ]
}

interface CrtShEntry {
  name_value?: unknown
}

/**
 * Dedup de subdominios a partir de la respuesta JSON de crt.sh: name_value puede
 * traer varios nombres separados por \n, incluir comodines (*.) y duplicados.
 */
export function extractSubdomains(entries: unknown, domain: string): string[] {
  if (!Array.isArray(entries)) return []
  const found = new Set<string>()
  for (const entry of entries as CrtShEntry[]) {
    if (typeof entry?.name_value !== 'string') continue
    for (const rawName of entry.name_value.split('\n')) {
      const name = rawName.trim().toLowerCase().replace(/^\*\./, '')
      if (!name || !isValidDomain(name)) continue
      if (name === domain || name.endsWith(`.${domain}`)) found.add(name)
    }
  }
  return [...found].sort()
}

/** Consulta crt.sh y devuelve la lista deduplicada de subdominios del dominio. */
export async function fetchSubdomains(
  domain: string,
  fetcher: typeof fetch = fetch,
): Promise<string[]> {
  const response = await fetcher(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`)
  if (!response.ok) throw new Error(`crt.sh respondió ${response.status}`)
  const data: unknown = await response.json()
  return extractSubdomains(data, domain)
}

export const DNS_TYPES = ['A', 'MX', 'TXT', 'NS'] as const

interface DnsAnswer {
  type?: unknown
  data?: unknown
}

interface DnsJson {
  Answer?: unknown
}

/** Extrae los datos de respuesta de un JSON de dns.google. */
export function parseDnsAnswer(json: unknown): string[] {
  const answers = (json as DnsJson | null)?.Answer
  if (!Array.isArray(answers)) return []
  return (answers as DnsAnswer[])
    .map((answer) => (typeof answer?.data === 'string' ? answer.data : null))
    .filter((data): data is string => data !== null)
}

/** Consulta dns.google (DoH) para los tipos A, MX, TXT y NS del dominio. */
export async function fetchDnsRecords(
  domain: string,
  fetcher: typeof fetch = fetch,
): Promise<DnsRecord[]> {
  const results = await Promise.all(
    DNS_TYPES.map(async (type) => {
      const response = await fetcher(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
      )
      if (!response.ok) throw new Error(`dns.google respondió ${response.status}`)
      const data: unknown = await response.json()
      return parseDnsAnswer(data).map((record): DnsRecord => ({ type, data: record }))
    }),
  )
  return results.flat()
}

/** Arma el kit de auditoría en Markdown listo para descargar. */
export function buildAuditMarkdown(input: {
  domain: string
  date?: Date
  subdomains?: string[] | null
  dnsRecords?: DnsRecord[] | null
  sections: ReconSection[]
}): string {
  const { domain, sections } = input
  const date = (input.date ?? new Date()).toISOString()
  const lines: string[] = [
    `# Kit de auditoría OSINT: ${domain}`,
    '',
    `- Objetivo: ${domain}`,
    `- Generado: ${date}`,
    '- Alcance: reconocimiento pasivo con fuentes públicas. Usar solo con autorización.',
    '',
    '## Subdominios (crt.sh)',
    '',
  ]

  if (input.subdomains == null) {
    lines.push('_No consultados._')
  } else if (input.subdomains.length === 0) {
    lines.push('_Sin resultados._')
  } else {
    for (const subdomain of input.subdomains) lines.push(`- ${subdomain}`)
  }

  lines.push('', '## Registros DNS (dns.google)', '')
  if (input.dnsRecords == null) {
    lines.push('_No consultados._')
  } else if (input.dnsRecords.length === 0) {
    lines.push('_Sin resultados._')
  } else {
    for (const type of DNS_TYPES) {
      const records = input.dnsRecords.filter((record) => record.type === type)
      if (records.length === 0) continue
      lines.push('', `### ${type}`, '')
      for (const record of records) lines.push(`- ${record.data}`)
    }
  }

  lines.push('', '## Queries generadas', '')
  for (const section of sections) {
    lines.push('', `### ${section.title}`, '')
    for (const query of section.queries) lines.push(`- \`${query.query}\` — ${query.label}`)
  }

  lines.push('')
  return lines.join('\n')
}
