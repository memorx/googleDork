import { resources } from '../data/resources'

export function Resources() {
  return (
    <div data-testid="resources-panel">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recursos OSINT</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Enlaces curados para aprender y profundizar: bases de dorks, frameworks, documentación y
          metodología.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Listado de recursos">
        {resources.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="dork-card flex flex-col gap-2"
            data-testid="resource-card"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-[var(--text-primary)]">{resource.name}</h4>
              <span className="shrink-0 rounded-md bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-medium text-[var(--text-tertiary)]">
                {resource.category}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{resource.description}</p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-600)]">
              Visitar
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </span>
          </a>
        ))}
      </section>
    </div>
  )
}
