import type { Category } from '../data/dorks'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  counts: Record<string, number>
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory, counts }: CategoryFilterProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-[var(--text-secondary)]">Filtrar por categoría</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        <button
          onClick={() => onSelectCategory(null)}
          className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
          aria-pressed={selectedCategory === null}
        >
          Todas
          <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
            {total}
          </span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
            aria-pressed={selectedCategory === category.id}
          >
            {category.sensitive && (
              <span
                className="inline-flex text-[var(--warning-500)]"
                title="Categoría sensible: usá estos dorks solo en sistemas propios o con autorización explícita."
                role="img"
                aria-label="Categoría sensible"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </span>
            )}
            {category.name}
            <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              {counts[category.id] || 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
