import { categories, dorks } from '../data/dorks'

interface StatsProps {
  filteredCount: number
}

export function Stats({ filteredCount }: StatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="stat-card">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-50)] text-[var(--accent-600)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{dorks.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Dorks totales</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--warning-50)] text-[var(--warning-500)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{categories.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Categorías</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--success-50)] text-[var(--success-500)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{filteredCount}</p>
          <p className="text-sm text-[var(--text-secondary)]">Dorks visibles</p>
        </div>
      </div>
    </div>
  )
}
