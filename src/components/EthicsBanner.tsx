import { useState } from 'react'

export function EthicsBanner() {
  const [expanded, setExpanded] = useState(true)

  if (!expanded) {
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-expanded={false}
          >
            <svg className="h-3.5 w-3.5 text-[var(--warning-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Aviso de uso responsable
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)]" data-testid="ethics-banner">
      <div className="mx-auto flex max-w-7xl items-start gap-3 border-l-4 border-[var(--warning-500)] px-4 py-2.5 sm:px-6 lg:px-8">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning-500)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="flex-1 text-xs text-[var(--text-secondary)] sm:text-sm">
          <span className="font-semibold text-[var(--text-primary)]">Uso responsable:</span> estos
          operadores sirven para auditar tus propios sistemas y para OSINT legítimo. Acceder a
          sistemas ajenos sin autorización es un delito (en México, art. 211 bis del Código Penal
          Federal).
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Ocultar aviso de uso responsable"
          aria-expanded={true}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
