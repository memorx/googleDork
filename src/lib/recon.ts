// Lógica del panel "Recon de objetivo": validación de dominios, plantillas de
// queries por motor y consultas en vivo a crt.sh (Certificate Transparency) y
// dns.google (DNS over HTTPS). Todo es OSINT pasivo: solo fuentes públicas.

export interface ReconQuery {
  label: string
  query: string
  /** Motor de la query; si falta, se usa el engineId de la sección. */
  engineId?: string
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

// ---------------------------------------------------------------------------
// URLs históricas (Wayback Machine, API CDX)
// ---------------------------------------------------------------------------

/** Extensiones ofrecidas como filtros rápidos en la lista de URLs históricas. */
export const WAYBACK_FILTER_EXTENSIONS = [
  'php',
  'sql',
  'bak',
  'env',
  'zip',
  'log',
  'conf',
  'json',
  'xml',
  'old',
  'asp',
  'jsp',
] as const

/** Extensiones que suelen exponer datos sensibles (se marcan con badge). */
export const SENSITIVE_URL_EXTENSIONS = ['sql', 'bak', 'env', 'log', 'zip', 'conf', 'old'] as const

/**
 * Parsea la respuesta JSON de la API CDX con fl=original: un array de filas
 * donde la primera puede ser el encabezado ["original"]. Dedup preservando orden.
 */
export function parseCdxResponse(data: unknown): string[] {
  if (!Array.isArray(data)) return []
  const urls = new Set<string>()
  for (const row of data) {
    const value = Array.isArray(row) ? row[0] : row
    if (typeof value !== 'string') continue
    const url = value.trim()
    if (!url || url === 'original') continue
    urls.add(url)
  }
  return [...urls]
}

/** Consulta la API CDX de web.archive.org y devuelve las URLs archivadas (status 200). */
export async function fetchWaybackUrls(
  domain: string,
  fetcher: typeof fetch = fetch,
): Promise<string[]> {
  const target = encodeURIComponent(`*.${domain}/*`)
  const response = await fetcher(
    `https://web.archive.org/cdx/search/cdx?url=${target}&output=json&fl=original&collapse=urlkey&limit=500&filter=statuscode:200`,
  )
  if (!response.ok) throw new Error(`web.archive.org respondió ${response.status}`)
  const data: unknown = await response.json()
  return parseCdxResponse(data)
}

/** Extensión del último segmento del path de la URL (sin query/hash), en minúsculas. */
export function getUrlExtension(url: string): string | null {
  const path = url.split(/[?#]/)[0] ?? ''
  const segment = path.split('/').pop() ?? ''
  const dot = segment.lastIndexOf('.')
  if (dot === -1) return null
  const extension = segment.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,10}$/.test(extension) ? extension : null
}

export function urlHasParams(url: string): boolean {
  return url.includes('?')
}

/** ¿La URL apunta a un archivo potencialmente sensible (.sql, .env, .bak…)? */
export function isSensitiveUrl(url: string): boolean {
  const extension = getUrlExtension(url)
  return (
    extension !== null && (SENSITIVE_URL_EXTENSIONS as readonly string[]).includes(extension)
  )
}

/** Filtra URLs por extensión; el filtro especial 'params' deja solo URLs con query string. */
export function filterUrlsByExtension(urls: string[], filter: string | null): string[] {
  if (filter === null) return urls
  if (filter === 'params') return urls.filter(urlHasParams)
  return urls.filter((url) => getUrlExtension(url) === filter)
}

// ---------------------------------------------------------------------------
// Permutaciones de subdominios (verificación DNS en vivo)
// ---------------------------------------------------------------------------

/** Prefijos comunes de subdominios para fuzzing pasivo vía DoH. */
export const SUBDOMAIN_PREFIXES = [
  'dev',
  'staging',
  'test',
  'api',
  'vpn',
  'admin',
  'panel',
  'mail',
  'webmail',
  'remote',
  'portal',
  'git',
  'jenkins',
  'grafana',
  'db',
  'backup',
  'old',
  'beta',
  'app',
  'dashboard',
  'monitoring',
  'ci',
  'cd',
  'wiki',
  'docs',
  'ftp',
  'sftp',
  'proxy',
  'gateway',
  'internal',
  'intranet',
  'crm',
  'erp',
  'shop',
  'blog',
  'mx',
  'ns1',
  'ns2',
  'cdn',
  'static',
  'media',
] as const

export interface PermutationHit {
  host: string
  ip: string
}

/**
 * Resuelve PREFIJO.dominio por cada prefijo curado usando dns.google (tipo A),
 * con concurrencia limitada. Devuelve solo los hosts que existen, con su IP.
 */
export async function verifySubdomainPermutations(
  domain: string,
  fetcher: typeof fetch = fetch,
  options: {
    concurrency?: number
    onProgress?: (checked: number, total: number) => void
  } = {},
): Promise<PermutationHit[]> {
  const hosts = SUBDOMAIN_PREFIXES.map((prefix) => `${prefix}.${domain}`)
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 6, hosts.length))
  const hits: PermutationHit[] = []
  let index = 0
  let checked = 0

  const worker = async () => {
    while (index < hosts.length) {
      const host = hosts[index]
      index += 1
      if (host === undefined) break
      try {
        const response = await fetcher(
          `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
        )
        if (response.ok) {
          const ips = parseDnsAnswer(await response.json())
          const ip = ips[0]
          if (ip !== undefined) hits.push({ host, ip })
        }
      } catch {
        // Un host que falla no frena la verificación del resto del lote.
      }
      checked += 1
      options.onProgress?.(checked, hosts.length)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return hits.sort((a, b) => a.host.localeCompare(b.host))
}

// ---------------------------------------------------------------------------
// urlscan.io (búsqueda pública de escaneos)
// ---------------------------------------------------------------------------

export interface UrlscanResult {
  pageUrl: string
  ip: string | null
  server: string | null
  date: string | null
  resultUrl: string | null
}

export interface UrlscanSearch {
  total: number
  results: UrlscanResult[]
}

interface UrlscanPage {
  url?: unknown
  ip?: unknown
  server?: unknown
}

interface UrlscanEntry {
  page?: unknown
  task?: unknown
  result?: unknown
}

/** Mapea la respuesta de /api/v1/search/ de urlscan.io a una lista plana de escaneos. */
export function parseUrlscanResponse(json: unknown): UrlscanSearch {
  if (typeof json !== 'object' || json === null) return { total: 0, results: [] }
  const payload = json as { total?: unknown; results?: unknown }
  const total = typeof payload.total === 'number' ? payload.total : 0
  if (!Array.isArray(payload.results)) return { total, results: [] }

  const results: UrlscanResult[] = []
  for (const rawEntry of payload.results as UrlscanEntry[]) {
    if (typeof rawEntry !== 'object' || rawEntry === null) continue
    const page = rawEntry.page as UrlscanPage | undefined
    const task = rawEntry.task as { time?: unknown } | undefined
    if (typeof page?.url !== 'string') continue
    results.push({
      pageUrl: page.url,
      ip: typeof page.ip === 'string' ? page.ip : null,
      server: typeof page.server === 'string' ? page.server : null,
      date: typeof task?.time === 'string' ? task.time : null,
      resultUrl: typeof rawEntry.result === 'string' ? rawEntry.result : null,
    })
  }
  return { total, results }
}

/** Busca escaneos públicos del dominio en urlscan.io (sin API key). */
export async function fetchUrlscanResults(
  domain: string,
  fetcher: typeof fetch = fetch,
): Promise<UrlscanSearch> {
  const response = await fetcher(
    `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=50`,
  )
  if (!response.ok) throw new Error(`urlscan.io respondió ${response.status}`)
  const data: unknown = await response.json()
  return parseUrlscanResponse(data)
}

// ---------------------------------------------------------------------------
// Dorks de segunda generación (por subdominio descubierto)
// ---------------------------------------------------------------------------

/** Genera queries dirigidas a un subdominio concreto (Google, Shodan, GitHub). */
export function generateSecondGenDorks(subdomain: string): ReconQuery[] {
  return [
    { engineId: 'google', label: 'Contenido indexado del subdominio', query: `site:${subdomain}` },
    {
      engineId: 'google',
      label: 'Paneles de administración',
      query: `site:${subdomain} inurl:admin`,
    },
    {
      engineId: 'google',
      label: 'Documentos PDF indexados',
      query: `site:${subdomain} filetype:pdf`,
    },
    { engineId: 'shodan', label: 'Host en Shodan', query: `hostname:${subdomain}` },
    {
      engineId: 'github',
      label: 'Archivos .env que mencionan el subdominio',
      query: `"${subdomain}" filename:.env`,
    },
  ]
}
