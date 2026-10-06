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
