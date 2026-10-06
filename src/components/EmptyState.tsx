interface EmptyStateProps {
  onClear: () => void
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-50)] text-[var(--accent-600)]">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">No se encontraron dorks</h3>
      <p className="mb-6 max-w-md text-[var(--text-secondary)]">
        Probá con otros términos de búsqueda o seleccioná otra categoría.
      </p>
      <button onClick={onClear} className="btn btn-primary">
        Limpiar filtros
      </button>
    </div>
  )
}
