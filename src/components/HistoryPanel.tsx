import { getEngineById } from '../data/dorks'
import type { HistoryEntry } from '../hooks/useHistory'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel({ entries, onSelect, onClear }: HistoryPanelProps) {
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
    </div>
  )
}
