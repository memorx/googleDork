import { useState } from 'react'
import type { Dork } from '../data/dorks'

interface DorkCardProps {
  dork: Dork
}

export function DorkCard({ dork }: DorkCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dork.example)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
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
    window.open(`https://www.google.com/search?q=${encodeURIComponent(dork.example)}`, '_blank')
  }

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
      data-testid="dork-card"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="break-all font-mono text-lg font-semibold text-indigo-600 dark:text-indigo-400">
          {dork.operator}
        </h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {dork.id}
        </span>
      </div>

      <p className="mb-4 text-slate-700 dark:text-slate-200">{dork.description}</p>

      <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
        <p className="mb-1 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Ejemplo</p>
        <code className="block break-all font-mono text-sm text-slate-800 dark:text-slate-200">
          {dork.example}
        </code>
      </div>

      <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{dork.usage}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label="Probar en Google"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Probar en Google
        </button>
      </div>
    </article>
  )
}
