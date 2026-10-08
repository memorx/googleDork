import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dork } from './data/dorks'
import {
  buildSearchUrl,
  getCategoriesByEngine,
  getDorksByEngine,
  getEngineById,
  getEngines,
  searchDorks,
} from './data/dorks'
import { CategoryFilter } from './components/CategoryFilter'
import { CommandPalette, type PalettePanel } from './components/CommandPalette'
import { DorkBuilder } from './components/DorkBuilder'
import { DorkCard } from './components/DorkCard'
import { EmptyState } from './components/EmptyState'
import { EngineTabs } from './components/EngineTabs'
import { EthicsBanner } from './components/EthicsBanner'
import { Header } from './components/Header'
import { HistoryPanel } from './components/HistoryPanel'
import { Playbooks } from './components/Playbooks'
import { ReconPanel } from './components/ReconPanel'
import { Recipes } from './components/Recipes'
import { Resources } from './components/Resources'
import { SearchBar } from './components/SearchBar'
import { SharedReconView } from './components/SharedReconView'
import { Stats } from './components/Stats'
import { Workspace } from './components/Workspace'
import { CYCLE_THEME_EVENT } from './components/ThemeToggle'
import { useFavorites } from './hooks/useFavorites'
import { useHistory, type HistoryEntry } from './hooks/useHistory'
import { useWorkspace } from './hooks/useWorkspace'
import { buildBackup, parseBackup } from './lib/dataTransfer'
import { downloadTextFile } from './lib/download'
import { dnsRecordsToMap, type ReconSnapshot } from './lib/reconDiff'
import { decodeReconShare, RECON_HASH_PREFIX, type SharedRecon } from './lib/shareLink'
import { buildUrlSearch, DEFAULT_ENGINE, parseUrlState } from './lib/urlState'

function App() {
  const [searchQuery, setSearchQuery] = useState(() => parseUrlState(window.location.search).q ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    () => parseUrlState(window.location.search).cat ?? null,
  )
  const [selectedEngine, setSelectedEngine] = useState(() => {
    const engine = parseUrlState(window.location.search).engine
    return engine && getEngineById(engine) ? engine : DEFAULT_ENGINE
  })
  const [globalSearch, setGlobalSearch] = useState(() => parseUrlState(window.location.search).global)
  const [showFavorites, setShowFavorites] = useState(() => parseUrlState(window.location.search).fav)
  const [openPanel, setOpenPanel] = useState<PalettePanel | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [importFeedback, setImportFeedback] = useState<string | null>(null)
  const [reconDomain, setReconDomain] = useState<string | null>(null)
  const [sharedRecon, setSharedRecon] = useState<SharedRecon | null>(null)
  const [sharedReconError, setSharedReconError] = useState<string | null>(null)
  const [sharedSaved, setSharedSaved] = useState(false)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const { favorites, toggleFavorite, importFavorites, isFavorite } = useFavorites()
  const { entries: historyEntries, addToHistory, importHistory, clearHistory } = useHistory()
  const workspace = useWorkspace()

  // Recon compartido por enlace: #recon=... en el hash
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith(RECON_HASH_PREFIX)) return
    let cancelled = false
    decodeReconShare(hash)
      .then((recon) => {
        if (cancelled) return
        if (recon) {
          setSharedRecon(recon)
          window.scrollTo({ top: 0 })
        } else {
          setSharedReconError('El enlace de recon compartido está corrupto o incompleto.')
        }
      })
      .catch(() => {
        if (!cancelled) setSharedReconError('El enlace de recon compartido está corrupto o incompleto.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Deep links: la URL refleja el estado actual (sin recargar)
  useEffect(() => {
    const search = buildUrlSearch({
      engine: selectedEngine,
      query: searchQuery,
      category: selectedCategory,
      global: globalSearch,
      fav: showFavorites,
    })
    window.history.replaceState(null, '', search || window.location.pathname)
  }, [selectedEngine, searchQuery, selectedCategory, globalSearch, showFavorites])

  // Atajos de teclado: Ctrl+K abre la paleta, "/" enfoca el buscador,
  // flechas cambian de motor, Escape limpia
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchQuery('')
        return
      }
      const target = event.target as HTMLElement | null
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true
      if (isTyping) return

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
        return
      }

      if (event.key === '/') {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const direction = event.key === 'ArrowRight' ? 1 : -1
        setSelectedEngine((prev) => {
          const ids = getEngines().map((engine) => engine.id)
          const index = ids.indexOf(prev)
          return ids[(index + direction + ids.length) % ids.length] ?? prev
        })
        setSelectedCategory(null)
        setShowFavorites(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const engineCategories = useMemo(
    () => getCategoriesByEngine(selectedEngine),
    [selectedEngine],
  )

  const counts = useMemo(() => {
    const engineDorks = getDorksByEngine(selectedEngine)
    return engineCategories.reduce(
      (acc, category) => {
        acc[category.id] = engineDorks.filter((dork) => dork.category === category.id).length
        return acc
      },
      {} as Record<string, number>,
    )
  }, [selectedEngine, engineCategories])

  const filteredDorks = useMemo(() => {
    if (globalSearch) return searchDorks(searchQuery)
    return searchDorks(searchQuery, selectedCategory || undefined, selectedEngine)
  }, [searchQuery, selectedCategory, selectedEngine, globalSearch])

  const favoriteDorks = useMemo(() => {
    return searchDorks(searchQuery).filter((dork) => favorites.includes(dork.id))
  }, [searchQuery, favorites])

  const handleSelectEngine = (engineId: string) => {
    setSelectedEngine(engineId)
    setSelectedCategory(null)
    setShowFavorites(false)
    setGlobalSearch(false)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
  }

  const handleTryDork = (dork: Dork) => {
    addToHistory({ engine: dork.engine, query: dork.example })
  }

  const handleTryBuilderQuery = (engineId: string, query: string) => {
    addToHistory({ engine: engineId, query })
  }

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    window.open(buildSearchUrl(entry.engine, entry.query), '_blank', 'noopener,noreferrer')
  }

  const togglePanel = (panel: PalettePanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel))
  }

  const handleOpenPanel = (panel: PalettePanel) => {
    if (panel === 'recon') setReconDomain(null)
    setOpenPanel(panel)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShowFavorites = () => {
    setShowFavorites(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCycleTheme = () => {
    window.dispatchEvent(new Event(CYCLE_THEME_EVENT))
  }

  const handleOpenReconFromWorkspace = (domain: string) => {
    setReconDomain(domain)
    setOpenPanel('recon')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveSnapshot = (domain: string, snapshot: ReconSnapshot) => {
    const ref = workspace.findTargetByDomain(domain)
    if (!ref) return null
    return workspace.saveSnapshot(ref.project.id, ref.target.id, snapshot)
  }

  const handleReconExternalHosts = (domain: string) =>
    workspace.findTargetByDomain(domain)?.target.externalHosts ?? []

  const handleAddHostsToTarget = (domain: string, hosts: string[]) => {
    const ref = workspace.findTargetByDomain(domain)
    if (ref) workspace.importExternalHosts(ref.project.id, ref.target.id, hosts.join('\n'))
  }

  const handleSaveSharedToWorkspace = () => {
    if (!sharedRecon) return
    const snapshot: ReconSnapshot = {
      date: sharedRecon.date,
      subdomains: sharedRecon.subdomains,
      dns: dnsRecordsToMap(sharedRecon.dns),
    }
    const existing = workspace.findTargetByDomain(sharedRecon.domain)
    if (existing) {
      workspace.saveSnapshot(existing.project.id, existing.target.id, snapshot)
    } else {
      const project =
        workspace.projects[0] ?? workspace.createProject('Recon compartido') ?? null
      if (!project) return
      const target = workspace.addTarget(project.id, sharedRecon.domain)
      if (!target) return
      workspace.saveSnapshot(project.id, target.id, snapshot)
    }
    setSharedSaved(true)
  }

  const handleCloseSharedRecon = () => {
    setSharedRecon(null)
    setSharedReconError(null)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  const handleExportData = () => {
    const today = new Date().toISOString().slice(0, 10)
    downloadTextFile(`googledork-backup-${today}.json`, buildBackup(favorites, historyEntries), 'application/json')
  }

  const handleImportData = (json: string) => {
    const data = parseBackup(json)
    if (!data) {
      setImportFeedback('El archivo no es un respaldo válido de GoogleDork.')
      return
    }
    const addedFavorites = importFavorites(data.favorites)
    const addedHistory = importHistory(data.history)
    setImportFeedback(
      `Importación lista: ${addedFavorites} favorito(s) y ${addedHistory} búsqueda(s) nuevas.`,
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-secondary)]">
      <Header onOpenPalette={() => setPaletteOpen(true)} />
      <EthicsBanner />

      <main className="flex-1">
        {/* Engine tabs + favoritos */}
        <section className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <EngineTabs selectedEngine={selectedEngine} onSelectEngine={handleSelectEngine} />
              </div>
              <button
                type="button"
                onClick={() => setShowFavorites((prev) => !prev)}
                className={`category-pill shrink-0 ${showFavorites ? 'active' : ''}`}
                aria-pressed={showFavorites}
              >
                <svg
                  className="h-4 w-4"
                  fill={showFavorites ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                Favoritos
                <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {favorites.length}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--bg-primary)] pb-12 pt-10">
          <div className="hero-glow-bg absolute inset-0" />
          <div className="hero-glow-1 absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" />
          <div className="hero-glow-2 absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                Explorá el poder de las{' '}
                <span className="gradient-text">búsquedas avanzadas</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)]">
                Colección completa de dorks para 16 motores: Google, Bing, DuckDuckGo, Yandex,
                Shodan, Censys, GitHub, FOFA, ZoomEye, crt.sh, Wayback Machine, Netlas, GreyNoise,
                BinaryEdge, PublicWWW y SearXNG. Buscá, filtrá, copiá y probá cada operador
                directamente.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-3xl">
              <SearchBar value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />
              {!showFavorites && (
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={globalSearch}
                    onChange={(e) => {
                      setGlobalSearch(e.target.checked)
                      if (e.target.checked) setSelectedCategory(null)
                    }}
                    className="h-4 w-4 accent-[var(--accent-500)]"
                  />
                  Buscar en todos los motores
                </label>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => togglePanel('builder')}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'builder'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                Constructor de dorks
              </button>
              <button
                type="button"
                onClick={() => togglePanel('recipes')}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'recipes'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Recetas
              </button>
              <button
                type="button"
                onClick={() => {
                  setReconDomain(null)
                  togglePanel('recon')
                }}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'recon'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 12a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0zM12 8.25v3.75m0 0v3.75m0-3.75h3.75m-3.75 0H8.25"
                  />
                </svg>
                Recon de objetivo
              </button>
              <button
                type="button"
                onClick={() => togglePanel('workspace')}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'workspace'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  />
                </svg>
                Workspace
              </button>
              <button
                type="button"
                onClick={() => togglePanel('playbooks')}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'playbooks'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6M9 8h6M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"
                  />
                </svg>
                Playbooks
              </button>
              <button
                type="button"
                onClick={() => togglePanel('history')}
                className="btn btn-secondary"
                aria-expanded={openPanel === 'history'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Historial
                {historyEntries.length > 0 && (
                  <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {historyEntries.length}
                  </span>
                )}
              </button>
            </div>

            {sharedReconError && (
              <div className="mx-auto mt-6 max-w-3xl">
                <div
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--danger-500)] bg-[var(--danger-50)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  role="alert"
                >
                  {sharedReconError}
                  <button
                    type="button"
                    className="shrink-0 text-sm font-medium text-[var(--danger-500)] hover:underline"
                    onClick={handleCloseSharedRecon}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
            {sharedRecon && (
              <div className="mx-auto mt-6 max-w-4xl">
                <SharedReconView
                  recon={sharedRecon}
                  onSaveToWorkspace={handleSaveSharedToWorkspace}
                  onClose={handleCloseSharedRecon}
                  saved={sharedSaved}
                />
              </div>
            )}

            {openPanel === 'builder' && (
              <div className="mx-auto mt-6 max-w-3xl">
                <DorkBuilder initialEngine={selectedEngine} onTry={handleTryBuilderQuery} />
              </div>
            )}
            {openPanel === 'recipes' && (
              <div className="mx-auto mt-6 max-w-5xl">
                <Recipes onTry={handleTryBuilderQuery} />
              </div>
            )}
            {openPanel === 'recon' && (
              <div className="mx-auto mt-6 max-w-4xl">
                <ReconPanel
                  initialDomain={reconDomain ?? undefined}
                  isWorkspaceTarget={(domain) => workspace.findTargetByDomain(domain) !== null}
                  onSaveSnapshot={handleSaveSnapshot}
                  externalHosts={handleReconExternalHosts}
                  onAddHosts={handleAddHostsToTarget}
                />
              </div>
            )}
            {openPanel === 'workspace' && (
              <div className="mx-auto mt-6 max-w-4xl">
                <Workspace workspace={workspace} onOpenRecon={handleOpenReconFromWorkspace} />
              </div>
            )}
            {openPanel === 'playbooks' && (
              <div className="mx-auto mt-6 max-w-4xl">
                <Playbooks onTry={handleTryBuilderQuery} onSelectEngine={handleSelectEngine} />
              </div>
            )}
            {openPanel === 'resources' && (
              <div className="mx-auto mt-6 max-w-5xl">
                <Resources />
              </div>
            )}
            {openPanel === 'history' && (
              <div className="mx-auto mt-6 max-w-3xl">
                <HistoryPanel
                  entries={historyEntries}
                  onSelect={handleSelectHistoryEntry}
                  onClear={clearHistory}
                  onExport={handleExportData}
                  onImport={handleImportData}
                  importFeedback={importFeedback}
                />
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {showFavorites ? (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Tus favoritos{' '}
                  <span className="text-[var(--text-secondary)]">({favoriteDorks.length})</span>
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Dorks guardados de todos los motores.
                </p>
              </div>
              {favoriteDorks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--warning-50)] text-[var(--warning-500)]">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
                    Aún no tenés favoritos
                  </h3>
                  <p className="max-w-md text-[var(--text-secondary)]">
                    Tocá la estrella de cualquier dork para guardarlo acá.
                  </p>
                </div>
              ) : (
                <section
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  aria-label="Dorks favoritos"
                >
                  {favoriteDorks.map((dork, index) => (
                    <DorkCard
                      key={dork.id}
                      dork={dork}
                      index={index}
                      isFavorite={isFavorite(dork.id)}
                      onToggleFavorite={toggleFavorite}
                      onTry={handleTryDork}
                    />
                  ))}
                </section>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Stats
                  engineId={globalSearch ? null : selectedEngine}
                  filteredCount={filteredDorks.length}
                />
              </div>

              {!globalSearch && (
                <div className="mb-8">
                  <CategoryFilter
                    categories={engineCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    counts={counts}
                  />
                </div>
              )}

              {filteredDorks.length === 0 ? (
                <EmptyState onClear={handleClearFilters} />
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Mostrando{' '}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {filteredDorks.length}
                      </span>{' '}
                      {filteredDorks.length === 1 ? 'dork' : 'dorks'}
                      {globalSearch && ' en todos los motores'}
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
                    aria-label="Listado de dorks"
                  >
                    {filteredDorks.map((dork, index) => (
                      <DorkCard
                        key={dork.id}
                        dork={dork}
                        index={index}
                        isFavorite={isFavorite(dork.id)}
                        onToggleFavorite={toggleFavorite}
                        onTry={handleTryDork}
                      />
                    ))}
                  </section>
                </>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-2 text-sm text-[var(--text-secondary)]">
            GoogleDork — Herramienta educativa multi-motor para seguridad informática.
          </p>
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            Usá estos dorks únicamente en sistemas propios o con autorización explícita.
          </p>
          <button
            type="button"
            onClick={() => handleOpenPanel('resources')}
            className="text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] hover:underline"
          >
            Recursos OSINT
          </button>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectEngine={handleSelectEngine}
        onOpenPanel={handleOpenPanel}
        onShowFavorites={handleShowFavorites}
        onCycleTheme={handleCycleTheme}
        onTryDork={handleTryDork}
      />
    </div>
  )
}

export default App
