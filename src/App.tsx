import { useMemo, useState } from 'react'
import { categories, dorks, searchDorks } from './data/dorks'
import { CategoryFilter } from './components/CategoryFilter'
import { DorkCard } from './components/DorkCard'
import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { Stats } from './components/Stats'

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

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-secondary)]">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--bg-primary)] pb-12 pt-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                Explorá el poder de las{' '}
                <span className="gradient-text">búsquedas avanzadas</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)]">
                Colección completa de Google Dorks organizados por categoría. Buscá, filtrá,
                copiá y probá cada operador directamente.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-3xl">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Stats filteredCount={filteredDorks.length} />
          </div>

          <div className="mb-8">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              counts={counts}
            />
          </div>

          {filteredDorks.length === 0 ? (
            <EmptyState onClear={handleClearFilters} />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  Mostrando <span className="font-semibold text-[var(--text-primary)]">{filteredDorks.length}</span>{' '}
                  {filteredDorks.length === 1 ? 'dork' : 'dorks'}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)]"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <section
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                aria-label="Listado de Google Dorks"
              >
                {filteredDorks.map((dork, index) => (
                  <DorkCard key={dork.id} dork={dork} index={index} />
                ))}
              </section>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-2 text-sm text-[var(--text-secondary)]">
            GoogleDork — Herramienta educativa para seguridad informática.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Usá estos dorks únicamente en sistemas propios o con autorización explícita.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
