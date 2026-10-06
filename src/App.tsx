import { useMemo, useState } from 'react'
import { categories, dorks, searchDorks } from './data/dorks'
import { CategoryFilter } from './components/CategoryFilter'
import { DorkCard } from './components/DorkCard'
import { SearchBar } from './components/SearchBar'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const counts = useMemo(() => {
    return categories.reduce(
      (acc, category) => {
        acc[category.id] = dorks.filter((dork) => dork.category === category.id).length
        return acc
      },
      {} as Record<string, number>,
    )
  }, [])

  const filteredDorks = useMemo(() => {
    return searchDorks(searchQuery, selectedCategory || undefined)
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                GoogleDork
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Panel para explorar, buscar y probar Google Dorks organizados por categoría.
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {filteredDorks.length} de {dorks.length} dorks
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>

        <section className="mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </section>

        {filteredDorks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-lg text-slate-600 dark:text-slate-300">No se encontraron dorks.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Probá con otra búsqueda o categoría.
            </p>
          </div>
        ) : (
          <section
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Listado de Google Dorks"
          >
            {filteredDorks.map((dork) => (
              <DorkCard key={dork.id} dork={dork} />
            ))}
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          Usá estos dorks solo en sistemas que te pertenezcan o con autorización explícita.
        </div>
      </footer>
    </div>
  )
}

export default App
