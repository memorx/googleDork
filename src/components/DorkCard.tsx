import { useState } from 'react'
import type { Dork } from '../data/dorks'
import { buildSearchUrl, getEngineById } from '../data/dorks'

interface DorkCardProps {
  dork: Dork
  index: number
}

export function DorkCard({ dork, index }: DorkCardProps) {
  const [copied, setCopied] = useState(false)
  const engine = getEngineById(dork.engine)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dork.example)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = dork.example
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTry = () => {
    window.open(buildSearchUrl(dork.engine, dork.example), '_blank', 'noopener,noreferrer')
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
          <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-medium text-[var(--text-tertiary)]">
            #{dork.id}
          </span>
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
              Copiado
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
