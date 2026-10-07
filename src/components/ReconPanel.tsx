import { useState } from 'react'
import { buildSearchUrl, getEngineById } from '../data/dorks'
import { copyText } from '../lib/clipboard'
import { downloadTextFile } from '../lib/download'
import {
  buildAuditMarkdown,
  fetchDnsRecords,
  fetchSubdomains,
  generateReconSections,
  isValidDomain,
  normalizeDomain,
  type DnsRecord,
  type ReconSection,
} from '../lib/recon'

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; data: T }

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

export function ReconPanel() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ domain: string; sections: ReconSection[] } | null>(null)
  const [subdomains, setSubdomains] = useState<FetchState<string[]>>({ status: 'idle' })
  const [dns, setDns] = useState<FetchState<DnsRecord[]>>({ status: 'idle' })
  const [copiedList, setCopiedList] = useState(false)

  const handleAnalyze = () => {
    if (!isValidDomain(input)) {
      setError('Ingresá un dominio válido, por ejemplo: ejemplo.com')
      setResult(null)
      return
    }
    const domain = normalizeDomain(input)
    setError(null)
    setResult({ domain, sections: generateReconSections(domain) })

    setSubdomains({ status: 'loading' })
    fetchSubdomains(domain)
      .then((list) => setSubdomains({ status: 'done', data: list }))
      .catch(() => setSubdomains({ status: 'error' }))

    setDns({ status: 'loading' })
    fetchDnsRecords(domain)
      .then((records) => setDns({ status: 'done', data: records }))
      .catch(() => setDns({ status: 'error' }))
  }

  const handleCopySubdomains = async () => {
    if (subdomains.status !== 'done') return
    await copyText(subdomains.data.join('\n'))
    setCopiedList(true)
    setTimeout(() => setCopiedList(false), 2000)
  }

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

  return (
    <div className="dork-card" data-testid="recon-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recon de objetivo</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Reconocimiento pasivo sobre un dominio: queries pre-rellenadas por motor, subdominios vía
          crt.sh y registros DNS vía dns.google. Usalo solo sobre dominios propios o autorizados.
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
                      engineId={section.engineId}
                      label={query.label}
                      query={query.query}
                    />
                  ))}
                </ul>
              </section>
            )
          })}

          <div className="flex justify-end">
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
