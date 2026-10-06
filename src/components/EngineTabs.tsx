import { countDorksByEngine, getEngines } from '../data/dorks'

interface EngineTabsProps {
  selectedEngine: string
  onSelectEngine: (engineId: string) => void
}

export function EngineTabs({ selectedEngine, onSelectEngine }: EngineTabsProps) {
  const engines = getEngines()
  const counts = countDorksByEngine()

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Motores de búsqueda"
    >
      {engines.map((engine) => {
        const isActive = engine.id === selectedEngine
        return (
          <button
            key={engine.id}
            role="tab"
            aria-selected={isActive}
            data-testid="engine-tab"
            onClick={() => onSelectEngine(engine.id)}
            className={`category-pill shrink-0 ${isActive ? 'active' : ''}`}
            style={
              isActive
                ? {
                    background: `linear-gradient(135deg, ${engine.color}, ${engine.color}cc)`,
                    borderColor: 'transparent',
                  }
                : undefined
            }
            title={engine.description}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: isActive ? 'currentColor' : engine.color }}
              aria-hidden="true"
            />
            {engine.name}
            <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              {counts[engine.id] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
