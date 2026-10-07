import { useEffect, useMemo, useRef, useState } from 'react'
import { dorks, getEngineById, type Dork } from '../data/dorks'
import { copyText } from '../lib/clipboard'
import { filterPaletteItems, type PaletteItem, type PalettePanel } from '../lib/palette'

export type { PalettePanel }

const KIND_BADGES: Record<PaletteItem['kind'], string> = {
  action: 'Acción',
  engine: 'Motor',
  recipe: 'Receta',
  dork: 'Dork',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onSelectEngine: (engineId: string) => void
  onOpenPanel: (panel: PalettePanel) => void
  onShowFavorites: () => void
  onCycleTheme: () => void
  onTryDork: (dork: Dork) => void
}

export function CommandPalette({
  open,
  onClose,
  onSelectEngine,
  onOpenPanel,
  onShowFavorites,
  onCycleTheme,
  onTryDork,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  // Reset al abrir: patrón de estado derivado durante el render
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }
  const listRef = useRef<HTMLUListElement | null>(null)
  const items = useMemo(() => filterPaletteItems(query), [query])

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]')
    if (active instanceof HTMLElement && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (!open) return null

  const execute = (item: PaletteItem) => {
    switch (item.kind) {
      case 'action':
        if (item.action === 'favorites') onShowFavorites()
        else if (item.action === 'theme') onCycleTheme()
        else onOpenPanel(item.action)
        break
      case 'engine':
        onSelectEngine(item.engineId)
        break
      case 'recipe':
        onOpenPanel('recipes')
        break
      case 'dork': {
        const dork = dorks.find((candidate) => candidate.id === item.dorkId)
        if (dork) {
          void copyText(dork.example)
          onTryDork(dork)
        }
        break
      }
    }
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (items.length === 0 ? 0 : (prev - 1 + items.length) % items.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[activeIndex]
      if (item) execute(item)
    } else if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="command-palette-backdrop"
    >
      <div
        role="dialog"
        aria-label="Paleta de comandos"
        aria-modal="true"
        data-testid="command-palette"
        className="mt-20 w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-xl)]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-[var(--border-color)] p-3">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="Buscar dorks, motores, recetas o acciones…"
            className="field-input"
            aria-label="Buscar en la paleta de comandos"
          />
        </div>
        <ul ref={listRef} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[var(--text-secondary)]">
              Sin resultados para «{query}»
            </li>
          )}
          {items.map((item, index) => {
            const engine = item.kind === 'engine' ? getEngineById(item.engineId) : undefined
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  data-active={index === activeIndex}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                    index === activeIndex ? 'bg-[var(--accent-50)]' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-secondary)]">
                      {item.subtitle}
                    </span>
                  </span>
                  {engine && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: engine.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="shrink-0 rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]">
                    {KIND_BADGES[item.kind]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center gap-3 border-t border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
          <span>↑↓ navegar</span>
          <span>Enter ejecutar</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
