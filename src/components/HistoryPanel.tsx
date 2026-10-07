import { getEngineById } from '../data/dorks'
import type { HistoryEntry } from '../hooks/useHistory'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
  onExport?: () => void
  onImport?: (json: string) => void
  importFeedback?: string | null
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel({ entries, onSelect, onClear, onExport, onImport, importFeedback }: HistoryPanelProps) {
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onImport) return
    onImport(await file.text())
  }

  return (
    <div className="dork-card" data-testid="history-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Historial de búsquedas
        </h3>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)]"
          >
            Limpiar historial
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Sin búsquedas recientes. Probá un dork y va a aparecer acá.
        </p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {entries.map((entry) => {
            const engine = getEngineById(entry.engine)
            return (
              <li key={`${entry.engine}-${entry.timestamp}`}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-left transition-colors hover:border-[var(--accent-500)]"
                  aria-label={`Re-ejecutar búsqueda: ${entry.query}`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: engine?.color ?? 'var(--text-tertiary)' }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--text-primary)]">
                    {entry.query}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                    {engine?.name ?? entry.engine} · {formatTime(entry.timestamp)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {(onExport || onImport) && (
        <div className="mt-4 border-t border-[var(--border-color)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="btn btn-secondary"
                aria-label="Exportar favoritos e historial"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                Exportar
              </button>
            )}
            {onImport && (
              <label className="btn btn-secondary cursor-pointer">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 16V4m0 0L8 8m4-4l4 4"
                  />
                </svg>
                Importar
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportFile}
                  aria-label="Importar favoritos e historial"
                />
              </label>
            )}
          </div>
          {importFeedback && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]" role="status">
              {importFeedback}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
