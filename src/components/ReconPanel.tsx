import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSearchUrl, getEngineById } from '../data/dorks'
import { copyText } from '../lib/clipboard'
import { downloadTextFile } from '../lib/download'
import {
  SUBDOMAIN_PREFIXES,
  WAYBACK_FILTER_EXTENSIONS,
  buildAuditMarkdown,
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
  urlHasParams,
  verifySubdomainPermutations,
  type DnsRecord,
  type PermutationHit,
  type ReconSection,
  type UrlscanSearch,
} from '../lib/recon'
import { dnsRecordsToMap, type ReconSnapshot, type SnapshotDiff } from '../lib/reconDiff'
import { buildReconShareUrl } from '../lib/shareLink'

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; data: T }

type PermState =
  | { status: 'idle' }
  | { status: 'loading'; checked: number; total: number }
  | { status: 'error' }
  | { status: 'done'; data: PermutationHit[]; total: number }

const WAYBACK_PAGE_SIZE = 100

function formatScanDate(date: string): string {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString()
}

function QueryRow({ engineId, label, query }: { engineId: string; label: string; query: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="break-all font-mono text-sm text-[var(--text-primary)]">{query}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-secondary"
          aria-label={`Copiar query: ${query}`}
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={() => window.open(buildSearchUrl(engineId, query), '_blank', 'noopener,noreferrer')}
          className="btn btn-secondary"
          aria-label={`Probar query: ${query}`}
        >
          Probar
        </button>
      </div>
    </li>
  )
}

interface ReconPanelProps {
  initialDomain?: string
  /** ¿El dominio analizado es un objetivo del workspace? */
  isWorkspaceTarget?: (domain: string) => boolean
  /** Guarda el snapshot en el workspace y devuelve el diff contra el anterior. */
  onSaveSnapshot?: (domain: string, snapshot: ReconSnapshot) => SnapshotDiff | null
  /** Hosts externos ya registrados para el dominio en el workspace. */
  externalHosts?: (domain: string) => string[]
  /** Agrega hosts confirmados a la lista del objetivo en el workspace. */
  onAddHosts?: (domain: string, hosts: string[]) => void
}

export function ReconPanel({
  initialDomain,
  isWorkspaceTarget,
  onSaveSnapshot,
  externalHosts,
  onAddHosts,
}: ReconPanelProps) {
  const [input, setInput] = useState(initialDomain ?? '')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ domain: string; sections: ReconSection[] } | null>(null)
  const [subdomains, setSubdomains] = useState<FetchState<string[]>>({ status: 'idle' })
  const [dns, setDns] = useState<FetchState<DnsRecord[]>>({ status: 'idle' })
  const [wayback, setWayback] = useState<FetchState<string[]>>({ status: 'idle' })
  const [waybackFilter, setWaybackFilter] = useState<string | null>(null)
  const [waybackVisible, setWaybackVisible] = useState(WAYBACK_PAGE_SIZE)
  const [copiedUrlList, setCopiedUrlList] = useState(false)
  const [perm, setPerm] = useState<PermState>({ status: 'idle' })
  const [addedPermHosts, setAddedPermHosts] = useState<string[]>([])
  const [urlscan, setUrlscan] = useState<FetchState<UrlscanSearch>>({ status: 'idle' })
  const [urlscanRateLimited, setUrlscanRateLimited] = useState(false)
  const [gen2Selection, setGen2Selection] = useState<string | null>(null)
  const [copiedList, setCopiedList] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  // 'first' = primer snapshot del objetivo; SnapshotDiff = diff contra el anterior
  const [snapshotFeedback, setSnapshotFeedback] = useState<'first' | SnapshotDiff | null>(null)
  // Guarda contra carreras: solo la última corrida de permutaciones actualiza el estado
  const permRunRef = useRef(0)

  const runAnalysis = useCallback((rawInput: string) => {
    if (!isValidDomain(rawInput)) {
      setError('Ingresá un dominio válido, por ejemplo: ejemplo.com')
      setResult(null)
      return
    }
    const domain = normalizeDomain(rawInput)
    setError(null)
    setResult({ domain, sections: generateReconSections(domain) })
    setSnapshotFeedback(null)
    setGen2Selection(null)
    setAddedPermHosts([])

    setSubdomains({ status: 'loading' })
    fetchSubdomains(domain)
      .then((list) => setSubdomains({ status: 'done', data: list }))
      .catch(() => setSubdomains({ status: 'error' }))

    setDns({ status: 'loading' })
    fetchDnsRecords(domain)
      .then((records) => setDns({ status: 'done', data: records }))
      .catch(() => setDns({ status: 'error' }))

    setWayback({ status: 'loading' })
    setWaybackFilter(null)
    setWaybackVisible(WAYBACK_PAGE_SIZE)
    fetchWaybackUrls(domain)
      .then((urls) => setWayback({ status: 'done', data: urls }))
      .catch(() => setWayback({ status: 'error' }))

    setUrlscan({ status: 'loading' })
    setUrlscanRateLimited(false)
    fetchUrlscanResults(domain)
      .then((search) => setUrlscan({ status: 'done', data: search }))
      .catch((fetchError: unknown) => {
        setUrlscanRateLimited(
          fetchError instanceof Error && fetchError.message.includes('429'),
        )
        setUrlscan({ status: 'error' })
      })

    const runId = ++permRunRef.current
    setPerm({ status: 'loading', checked: 0, total: SUBDOMAIN_PREFIXES.length })
    verifySubdomainPermutations(domain, fetch, {
      onProgress: (checked, total) => {
        if (permRunRef.current !== runId) return
        setPerm((prev) =>
          prev.status === 'loading' ? { status: 'loading', checked, total } : prev,
        )
      },
    })
      .then((hits) => {
        if (permRunRef.current !== runId) return
        setPerm({ status: 'done', data: hits, total: SUBDOMAIN_PREFIXES.length })
      })
      .catch(() => {
        if (permRunRef.current !== runId) return
        setPerm({ status: 'error' })
      })
  }, [])

  // Viene del workspace con un dominio precargado: analizar de una (una sola vez)
  const autoAnalyzedRef = useRef(false)
  useEffect(() => {
    if (autoAnalyzedRef.current || !initialDomain || !isValidDomain(initialDomain)) return
    autoAnalyzedRef.current = true
    runAnalysis(initialDomain)
  }, [initialDomain, runAnalysis])

  const handleAnalyze = () => {
    runAnalysis(input)
  }

  const handleCopySubdomains = async () => {
    if (subdomains.status !== 'done') return
    await copyText(subdomains.data.join('\n'))
    setCopiedList(true)
    setTimeout(() => setCopiedList(false), 2000)
  }

  const waybackCounts = useMemo(() => {
    if (wayback.status !== 'done') return null
    const counts: Record<string, number> = {}
    for (const url of wayback.data) {
      const extension = getUrlExtension(url)
      if (extension) counts[extension] = (counts[extension] ?? 0) + 1
    }
    return counts
  }, [wayback])

  const waybackParamsCount = useMemo(
    () => (wayback.status === 'done' ? wayback.data.filter(urlHasParams).length : 0),
    [wayback],
  )

  const waybackFiltered = useMemo(
    () => (wayback.status === 'done' ? filterUrlsByExtension(wayback.data, waybackFilter) : []),
    [wayback, waybackFilter],
  )

  const handleCopyWaybackUrls = async () => {
    if (wayback.status !== 'done') return
    await copyText(waybackFiltered.join('\n'))
    setCopiedUrlList(true)
    setTimeout(() => setCopiedUrlList(false), 2000)
  }

  const handleSelectWaybackFilter = (filter: string) => {
    setWaybackFilter((prev) => (prev === filter ? null : filter))
    setWaybackVisible(WAYBACK_PAGE_SIZE)
  }

  const handleAddPermHosts = (hosts: string[]) => {
    if (!result || hosts.length === 0) return
    setAddedPermHosts((prev) => [...new Set([...prev, ...hosts])])
    if (onAddHosts && isWorkspaceTarget?.(result.domain) === true) {
      onAddHosts(result.domain, hosts)
    }
  }

  // Subdominios descubiertos por todas las fuentes: crt.sh, permutaciones
  // verificadas y hosts externos importados al workspace.
  const combinedSubdomains = useMemo(() => {
    if (!result) return []
    const found = new Set<string>()
    if (subdomains.status === 'done') {
      for (const host of subdomains.data) found.add(host)
    }
    if (perm.status === 'done') {
      for (const hit of perm.data) found.add(hit.host)
    }
    for (const host of externalHosts?.(result.domain) ?? []) found.add(host)
    found.delete(result.domain)
    return [...found].sort()
  }, [result, subdomains, perm, externalHosts])

  const gen2Target =
    gen2Selection !== null && combinedSubdomains.includes(gen2Selection)
      ? gen2Selection
      : (combinedSubdomains[0] ?? null)

  const handleExportKit = () => {
    if (!result) return
    const markdown = buildAuditMarkdown({
      domain: result.domain,
      sections: result.sections,
      subdomains: subdomains.status === 'done' ? subdomains.data : null,
      dnsRecords: dns.status === 'done' ? dns.data : null,
    })
    downloadTextFile(`recon-${result.domain}.md`, markdown, 'text/markdown')
  }

  const handleCopyLink = async () => {
    if (!result) return
    const url = await buildReconShareUrl({
      domain: result.domain,
      date: new Date().toISOString(),
      subdomains: subdomains.status === 'done' ? subdomains.data : [],
      dns: dns.status === 'done' ? dns.data : [],
    })
    await copyText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const canSaveSnapshot =
    result !== null && isWorkspaceTarget?.(result.domain) === true && onSaveSnapshot !== undefined

  const handleSaveSnapshot = () => {
    if (!result || !onSaveSnapshot) return
    const snapshot: ReconSnapshot = {
      date: new Date().toISOString(),
      subdomains: subdomains.status === 'done' ? subdomains.data : [],
      dns: dnsRecordsToMap(dns.status === 'done' ? dns.data : []),
    }
    const diff = onSaveSnapshot(result.domain, snapshot)
    setSnapshotFeedback(diff ?? 'first')
  }

  return (
    <div className="dork-card" data-testid="recon-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recon de objetivo</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Reconocimiento pasivo sobre un dominio: queries pre-rellenadas por motor, subdominios
          vía crt.sh, permutaciones verificadas por DNS, registros DNS vía dns.google, URLs
          históricas de la Wayback Machine y escaneos de urlscan.io. Usalo solo sobre dominios
          propios o autorizados.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="recon-domain" className="sr-only">
          Dominio objetivo
        </label>
        <input
          id="recon-domain"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAnalyze()
          }}
          placeholder="ejemplo.com"
          className="field-input flex-1"
          aria-label="Dominio objetivo"
        />
        <button type="button" onClick={handleAnalyze} className="btn btn-primary shrink-0">
          Analizar
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-[var(--danger-500)]" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 flex flex-col gap-6">
          {/* Subdominios en vivo */}
          <section aria-label="Subdominios encontrados">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Subdominios (crt.sh)
                {subdomains.status === 'done' && (
                  <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {subdomains.data.length} subdominios
                  </span>
                )}
              </h4>
              {subdomains.status === 'done' && subdomains.data.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopySubdomains}
                  className="btn btn-secondary"
                  aria-label="Copiar lista de subdominios"
                >
                  {copiedList ? '¡Copiado!' : 'Copiar lista'}
                </button>
              )}
            </div>
            {subdomains.status === 'loading' && (
              <p className="text-sm text-[var(--text-secondary)]">Consultando crt.sh…</p>
            )}
            {subdomains.status === 'error' && (
              <p className="text-sm text-[var(--danger-500)]">
                No se pudo consultar crt.sh. Podés probar la query de crt.sh manualmente más abajo.
              </p>
            )}
            {subdomains.status === 'done' && subdomains.data.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                crt.sh no devolvió subdominios para este dominio.
              </p>
            )}
            {subdomains.status === 'done' && subdomains.data.length > 0 && (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
                {subdomains.data.map((subdomain) => (
                  <li key={subdomain}>
                    <a
                      href={`https://${subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-[var(--accent-600)] hover:underline"
                    >
                      {subdomain}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Permutaciones de subdominios verificadas por DNS */}
          <section aria-label="Permutaciones de subdominios">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Permutaciones de subdominios
                {perm.status === 'done' && (
                  <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {perm.data.length} activos
                  </span>
                )}
              </h4>
              {perm.status === 'done' &&
                perm.data.length > 0 &&
                perm.data.some((hit) => !addedPermHosts.includes(hit.host)) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAddPermHosts(
                        perm.data
                          .map((hit) => hit.host)
                          .filter((host) => !addedPermHosts.includes(host)),
                      )
                    }
                    className="btn btn-secondary"
                    aria-label="Agregar todos los subdominios activos al objetivo"
                  >
                    Agregar todos
                  </button>
                )}
            </div>
            {perm.status === 'loading' && (
              <div>
                <p className="mb-1 text-sm text-[var(--text-secondary)]">
                  Verificando permutaciones comunes… {perm.checked}/{perm.total} verificados
                </p>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]"
                  role="progressbar"
                  aria-label="Progreso de verificación de permutaciones"
                  aria-valuemin={0}
                  aria-valuemax={perm.total}
                  aria-valuenow={perm.checked}
                >
                  <div
                    className="h-full bg-[var(--accent-500)] transition-all"
                    style={{
                      width: `${perm.total > 0 ? (perm.checked / perm.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {perm.status === 'error' && (
              <p className="text-sm text-[var(--danger-500)]">
                No se pudieron verificar las permutaciones. Revisá tu conexión e intentá de nuevo.
              </p>
            )}
            {perm.status === 'done' && perm.data.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                Ninguna de las {perm.total} permutaciones comunes resolvió por DNS.
              </p>
            )}
            {perm.status === 'done' && perm.data.length > 0 && (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
                {perm.data.map((hit) => (
                  <li key={hit.host} className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://${hit.host}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-[var(--accent-600)] hover:underline"
                    >
                      {hit.host}
                    </a>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {hit.ip}
                    </span>
                    <span className="rounded-full bg-[var(--success-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      activo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddPermHosts([hit.host])}
                      disabled={addedPermHosts.includes(hit.host)}
                      className="btn btn-secondary"
                      aria-label={`Agregar ${hit.host} al objetivo`}
                    >
                      {addedPermHosts.includes(hit.host) ? 'Agregado' : 'Agregar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* DNS en vivo */}
          <section aria-label="Registros DNS">
            <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Registros DNS (dns.google)
            </h4>
            {dns.status === 'loading' && (
              <p className="text-sm text-[var(--text-secondary)]">Consultando dns.google…</p>
            )}
            {dns.status === 'error' && (
              <p className="text-sm text-[var(--danger-500)]">
                No se pudo consultar dns.google. Revisá tu conexión e intentá de nuevo.
              </p>
            )}
            {dns.status === 'done' && dns.data.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                No se encontraron registros A, MX, TXT ni NS.
              </p>
            )}
            {dns.status === 'done' && dns.data.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                      <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Tipo</th>
                      <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dns.data.map((record, index) => (
                      <tr
                        key={`${record.type}-${index}`}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-[var(--accent-600)]">
                          {record.type}
                        </td>
                        <td className="break-all px-3 py-2 font-mono text-[var(--text-primary)]">
                          {record.data}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* URLs históricas de la Wayback Machine */}
          <section aria-label="URLs históricas de la Wayback Machine">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                URLs históricas (Wayback Machine)
                {wayback.status === 'done' && (
                  <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {wayback.data.length} URLs
                  </span>
                )}
              </h4>
              {wayback.status === 'done' && wayback.data.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyWaybackUrls}
                  className="btn btn-secondary"
                  aria-label="Copiar lista de URLs históricas"
                >
                  {copiedUrlList ? '¡Copiado!' : 'Copiar lista'}
                </button>
              )}
            </div>
            {wayback.status === 'loading' && (
              <p className="text-sm text-[var(--text-secondary)]">
                Consultando web.archive.org…
              </p>
            )}
            {wayback.status === 'error' && (
              <p className="text-sm text-[var(--danger-500)]">
                No se pudo consultar la Wayback Machine. Podés probar la query de Wayback
                manualmente más abajo.
              </p>
            )}
            {wayback.status === 'done' && wayback.data.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                La Wayback Machine no tiene URLs archivadas para este dominio.
              </p>
            )}
            {wayback.status === 'done' && wayback.data.length > 0 && (
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {WAYBACK_FILTER_EXTENSIONS.map((extension) => {
                    const count = waybackCounts?.[extension] ?? 0
                    if (count === 0) return null
                    const active = waybackFilter === extension
                    return (
                      <button
                        key={extension}
                        type="button"
                        onClick={() => handleSelectWaybackFilter(extension)}
                        className={`category-pill${active ? ' active' : ''}`}
                        aria-pressed={active}
                      >
                        .{extension} ({count})
                      </button>
                    )
                  })}
                  {waybackParamsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectWaybackFilter('params')}
                      className={`category-pill${waybackFilter === 'params' ? ' active' : ''}`}
                      aria-pressed={waybackFilter === 'params'}
                    >
                      con parámetros ({waybackParamsCount})
                    </button>
                  )}
                </div>
                {waybackFiltered.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No hay URLs que coincidan con ese filtro.
                  </p>
                ) : (
                  <>
                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
                      {waybackFiltered.slice(0, waybackVisible).map((url) => (
                        <li key={url} className="flex items-start gap-2">
                          <a
                            href={`https://web.archive.org/web/2im_/${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all font-mono text-xs text-[var(--accent-600)] hover:underline"
                          >
                            {url}
                          </a>
                          {isSensitiveUrl(url) && (
                            <span className="shrink-0 rounded-full bg-[var(--danger-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              sensible
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {waybackFiltered.length > waybackVisible && (
                      <button
                        type="button"
                        onClick={() =>
                          setWaybackVisible((prev) => prev + WAYBACK_PAGE_SIZE)
                        }
                        className="btn btn-secondary mt-2"
                      >
                        Mostrar más ({waybackFiltered.length - waybackVisible} restantes)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {/* Escaneos públicos de urlscan.io */}
          <section aria-label="Escaneos de urlscan.io">
            <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Escaneos (urlscan.io)
              {urlscan.status === 'done' && (
                <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {urlscan.data.total} escaneos
                </span>
              )}
            </h4>
            {urlscan.status === 'loading' && (
              <p className="text-sm text-[var(--text-secondary)]">Consultando urlscan.io…</p>
            )}
            {urlscan.status === 'error' && (
              <p className="text-sm text-[var(--danger-500)]">
                {urlscanRateLimited
                  ? 'urlscan.io limitó las peticiones (429). Esperá un momento y volvé a analizar.'
                  : 'No se pudo consultar urlscan.io. Revisá tu conexión e intentá de nuevo.'}
              </p>
            )}
            {urlscan.status === 'done' && urlscan.data.results.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                urlscan.io no tiene escaneos públicos para este dominio.
              </p>
            )}
            {urlscan.status === 'done' && urlscan.data.results.length > 0 && (
              <ul className="flex flex-col gap-2">
                {urlscan.data.results.map((scan) => (
                  <li
                    key={scan.resultUrl ?? scan.pageUrl}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3"
                  >
                    <a
                      href={scan.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-sm text-[var(--accent-600)] hover:underline"
                    >
                      {scan.pageUrl}
                    </a>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {scan.ip !== null && (
                        <>
                          IP: <span className="font-mono">{scan.ip}</span>
                        </>
                      )}
                      {scan.server !== null && <> · Servidor: {scan.server}</>}
                      {scan.date !== null && <> · {formatScanDate(scan.date)}</>}
                    </p>
                    {scan.resultUrl !== null && (
                      <a
                        href={scan.resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[var(--accent-600)] hover:underline"
                      >
                        Ver resultado en urlscan.io
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Queries por motor */}
          {result.sections.map((section) => {
            const engine = getEngineById(section.engineId)
            return (
              <section key={section.engineId} aria-label={`Queries para ${section.title}`}>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {engine && (
                    <span
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: engine.color }}
                    >
                      {engine.name}
                    </span>
                  )}
                  {section.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {section.queries.map((query) => (
                    <QueryRow
                      key={query.query}
                      engineId={query.engineId ?? section.engineId}
                      label={query.label}
                      query={query.query}
                    />
                  ))}
                </ul>
              </section>
            )
          })}

          {/* Dorks de segunda generación por subdominio descubierto */}
          {gen2Target !== null && (
            <section aria-label="Dorks de segunda generación">
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                Dorks de segunda generación
              </h4>
              <p className="mb-2 text-sm text-[var(--text-secondary)]">
                Queries dirigidas a cada subdominio descubierto (crt.sh, permutaciones activas y
                hosts externos del objetivo).
              </p>
              <label htmlFor="gen2-subdomain" className="sr-only">
                Subdominio para dorks de segunda generación
              </label>
              <select
                id="gen2-subdomain"
                value={gen2Target}
                onChange={(event) => setGen2Selection(event.target.value)}
                className="field-input mb-3"
                aria-label="Subdominio para dorks de segunda generación"
              >
                {combinedSubdomains.map((host) => (
                  <option key={host} value={host}>
                    {host}
                  </option>
                ))}
              </select>
              <ul className="flex flex-col gap-2">
                {generateSecondGenDorks(gen2Target).map((query) => (
                  <QueryRow
                    key={query.query}
                    engineId={query.engineId ?? 'google'}
                    label={query.label}
                    query={query.query}
                  />
                ))}
              </ul>
            </section>
          )}

          {canSaveSnapshot && (
            <section aria-label="Snapshot en workspace">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSnapshot}
                  className="btn btn-secondary"
                  disabled={subdomains.status === 'loading' || dns.status === 'loading'}
                >
                  Guardar snapshot en workspace
                </button>
                {snapshotFeedback === 'first' && (
                  <p className="text-sm text-[var(--success-500)]" role="status">
                    Primer snapshot guardado para este objetivo.
                  </p>
                )}
              </div>
              {snapshotFeedback !== null && snapshotFeedback !== 'first' && (
                <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3" data-testid="snapshot-diff">
                  <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]" role="status">
                    Snapshot guardado — cambios contra el escaneo anterior
                  </p>
                  {snapshotFeedback.addedSubdomains.length === 0 &&
                    snapshotFeedback.removedSubdomains.length === 0 &&
                    snapshotFeedback.dnsChanges.length === 0 && (
                      <p className="text-sm text-[var(--text-secondary)]">Sin cambios.</p>
                    )}
                  {snapshotFeedback.addedSubdomains.length > 0 && (
                    <ul className="mb-1 flex flex-col gap-1">
                      {snapshotFeedback.addedSubdomains.map((host) => (
                        <li key={`added-${host}`} className="flex items-center gap-2 font-mono text-xs text-[var(--text-primary)]">
                          <span className="rounded-full bg-[var(--success-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            NUEVO
                          </span>
                          {host}
                        </li>
                      ))}
                    </ul>
                  )}
                  {snapshotFeedback.removedSubdomains.length > 0 && (
                    <ul className="mb-1 flex flex-col gap-1">
                      {snapshotFeedback.removedSubdomains.map((host) => (
                        <li key={`removed-${host}`} className="flex items-center gap-2 font-mono text-xs text-[var(--text-primary)]">
                          <span className="rounded-full bg-[var(--danger-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            CAÍDO
                          </span>
                          {host}
                        </li>
                      ))}
                    </ul>
                  )}
                  {snapshotFeedback.dnsChanges.map((change) => (
                    <p key={`dns-${change.type}`} className="text-xs text-[var(--text-secondary)]">
                      <span className="font-mono font-semibold text-[var(--accent-600)]">
                        {change.type}
                      </span>
                      {change.added.length > 0 && (
                        <span className="ml-1 font-semibold text-[var(--success-500)]">
                          +{change.added.join(', ')}
                        </span>
                      )}
                      {change.removed.length > 0 && (
                        <span className="ml-1 font-semibold text-[var(--danger-500)]">
                          −{change.removed.join(', ')}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn-secondary"
              aria-label="Copiar enlace para compartir el recon"
            >
              {copiedLink ? '¡Copiado!' : 'Copiar enlace'}
            </button>
            <button
              type="button"
              onClick={handleExportKit}
              className="btn btn-primary"
              aria-label="Exportar kit de auditoría en Markdown"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
              Exportar kit de auditoría
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
