import type { SharedRecon } from '../lib/shareLink'

// Vista de solo lectura de un recon recibido por enlace (#recon=...).

interface SharedReconViewProps {
  recon: SharedRecon
  onSaveToWorkspace: () => void
  onClose: () => void
  saved: boolean
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function SharedReconView({ recon, onSaveToWorkspace, onClose, saved }: SharedReconViewProps) {
  return (
    <div className="dork-card" data-testid="shared-recon-view">
      <div
        className="mb-4 rounded-lg border border-[var(--accent-500)] bg-[var(--accent-50)] px-3 py-2 text-sm text-[var(--text-primary)]"
        role="status"
      >
        Recon compartido por enlace — vista de solo lectura.
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-[var(--text-primary)]">
          {recon.domain}
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(recon.date)}</span>
      </div>

      <section aria-label="Subdominios compartidos" className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Subdominios
          <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
            {recon.subdomains.length} subdominios
          </span>
        </h4>
        {recon.subdomains.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Sin subdominios en el enlace.</p>
        ) : (
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
            {recon.subdomains.map((subdomain) => (
              <li key={subdomain} className="font-mono text-sm text-[var(--text-primary)]">
                {subdomain}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Registros DNS compartidos" className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Registros DNS</h4>
        {recon.dns.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Sin registros DNS en el enlace.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Tipo</th>
                  <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recon.dns.map((record, index) => (
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

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={onSaveToWorkspace} disabled={saved}>
          {saved ? 'Guardado en tu workspace' : 'Guardar en mi workspace'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
