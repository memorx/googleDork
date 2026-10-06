import { categories } from '../data/dorks'

interface CategoryFilterProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  counts: Record<string, number>
}

export function CategoryFilter({ selectedCategory, onSelectCategory, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
      <button
        onClick={() => onSelectCategory(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selectedCategory === null
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
        aria-pressed={selectedCategory === null}
      >
        Todas ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === category.id
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-pressed={selectedCategory === category.id}
        >
          {category.name} ({counts[category.id] || 0})
        </button>
      ))}
    </div>
  )
}
