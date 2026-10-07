import { useState } from 'react'
import type { Dork } from '../data/dorks'
import { buildSearchUrl, getEngineById } from '../data/dorks'
import { copyText } from '../lib/clipboard'

interface DorkCardProps {
  dork: Dork
  index: number
  isFavorite?: boolean
  onToggleFavorite?: (dorkId: string) => void
  onTry?: (dork: Dork) => void
}

export function DorkCard({ dork, index, isFavorite = false, onToggleFavorite, onTry }: DorkCardProps) {
  const [copied, setCopied] = useState(false)
  const [copiedOperator, setCopiedOperator] = useState(false)
  const engine = getEngineById(dork.engine)

  const handleCopy = async () => {
    await copyText(dork.example)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyOperator = async () => {
    await copyText(dork.operator)
    setCopiedOperator(true)
    setTimeout(() => setCopiedOperator(false), 2000)
  }

  const handleTry = () => {
    window.open(buildSearchUrl(dork.engine, dork.example), '_blank', 'noopener,noreferrer')
    onTry?.(dork)
  }

  return (
    <article
      className="dork-card gradient-border animate-fade-in flex flex-col"
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
      data-testid="dork-card"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-50)] text-[var(--accent-600)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </span>
          <h3 className="break-all font-mono text-lg font-semibold text-[var(--text-primary)]">
            {dork.operator}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite?.(dork.id)}
              className="rounded-md p-1 transition-colors hover:bg-[var(--bg-tertiary)]"
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              aria-pressed={isFavorite}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg
                className={`h-5 w-5 ${isFavorite ? 'text-[var(--warning-500)]' : 'text-[var(--text-tertiary)]'}`}
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
            <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-medium text-[var(--text-tertiary)]">
              #{dork.id}
            </span>
          </div>
          {engine && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: engine.color }}
            >
              {engine.name}
            </span>
          )}
        </div>
      </div>

      <p className="mb-4 flex-grow text-[var(--text-secondary)]">{dork.description}</p>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Ejemplo
        </p>
        <div className="dork-code group cursor-pointer" onClick={handleCopy} role="button" tabIndex={0}>
          {dork.example}
          <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <svg className="h-4 w-4 text-[var(--accent-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Para qué sirve
        </p>
        <p className="text-sm text-[var(--text-secondary)]">{dork.usage}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className={`btn flex-1 ${copied ? 'btn-secondary' : 'btn-primary'}`}
          aria-label="Copiar ejemplo"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ¡Copiado!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar
            </>
          )}
        </button>
        <button
          onClick={handleCopyOperator}
          className="btn btn-secondary"
          aria-label="Copiar operador"
          title="Copiar solo el operador"
        >
          {copiedOperator ? (
            '¡Copiado!'
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Operador
            </>
          )}
        </button>
        <button
          onClick={handleTry}
          className="btn btn-secondary flex-1"
          aria-label={`Probar en ${engine?.name ?? 'el buscador'}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Probar
        </button>
      </div>
    </article>
  )
}
