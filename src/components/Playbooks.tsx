import { useState } from 'react'
import { buildSearchUrl, getDorks, getEngineById } from '../data/dorks'
import { playbooks, type Playbook } from '../data/playbooks'
import { getRecipeById } from '../data/recipes'
import { usePlaybookProgress } from '../hooks/usePlaybookProgress'

interface PlaybooksProps {
  onTry: (engineId: string, query: string) => void
  onSelectEngine: (engineId: string) => void
}

interface PlaybookCardProps extends PlaybooksProps {
  playbook: Playbook
  done: number[]
  onToggleStep: (stepIndex: number) => void
  onReset: () => void
}

function PlaybookCard({ playbook, done, onToggleStep, onReset, onTry, onSelectEngine }: PlaybookCardProps) {
  const [expanded, setExpanded] = useState(false)
  const total = playbook.steps.length

  return (
    <article className="dork-card" data-testid="playbook-card">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          {playbook.icon && (
            <span className="text-2xl" role="img" aria-hidden="true">
              {playbook.icon}
            </span>
          )}
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-[var(--text-primary)]">{playbook.name}</h4>
            <p className="truncate text-sm text-[var(--text-secondary)]">{playbook.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
            {done.length}/{total}
          </span>
          <svg
            className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4">
          <ol className="flex flex-col gap-3">
            {playbook.steps.map((step, index) => {
              const checked = done.includes(index)
              const recipe = step.recipeId ? getRecipeById(step.recipeId) : undefined
              const dork = step.dorkId ? getDorks().find((candidate) => candidate.id === step.dorkId) : undefined
              const engine = step.engineId ? getEngineById(step.engineId) : undefined
              return (
                <li
                  key={index}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleStep(index)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-500)]"
                      aria-label={`Marcar paso: ${step.title}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          checked
                            ? 'text-[var(--text-tertiary)] line-through'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{step.description}</p>
                      {(recipe || dork || engine) && (
                        <div className="mt-2">
                          {recipe && (
                            <button
                              type="button"
                              onClick={() => {
                                window.open(
                                  buildSearchUrl(recipe.engine, recipe.query),
                                  '_blank',
                                  'noopener,noreferrer',
                                )
                                onTry(recipe.engine, recipe.query)
                              }}
                              className="btn btn-secondary"
                              aria-label={`Probar receta: ${recipe.name}`}
                            >
                              Probar receta
                            </button>
                          )}
                          {dork && (
                            <button
                              type="button"
                              onClick={() => {
                                window.open(
                                  buildSearchUrl(dork.engine, dork.example),
                                  '_blank',
                                  'noopener,noreferrer',
                                )
                                onTry(dork.engine, dork.example)
                              }}
                              className="btn btn-secondary"
                              aria-label={`Probar dork: ${dork.operator}`}
                            >
                              Probar dork
                            </button>
                          )}
                          {engine && (
                            <button
                              type="button"
                              onClick={() => onSelectEngine(engine.id)}
                              className="btn btn-secondary"
                              aria-label={`Ir al motor ${engine.name}`}
                            >
                              Ir al motor
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)]"
              aria-label={`Reiniciar progreso de ${playbook.name}`}
            >
              Reiniciar progreso
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export function Playbooks({ onTry, onSelectEngine }: PlaybooksProps) {
  const { progress, toggleStep, resetPlaybook } = usePlaybookProgress()
  return (
    <div data-testid="playbooks-panel">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Playbooks OSINT</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Metodologías paso a paso con checklist: primero lo pasivo, después lo demás. El progreso
          se guarda en tu navegador.
        </p>
      </div>
      <section className="grid gap-6" aria-label="Listado de playbooks">
        {playbooks.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            playbook={playbook}
            done={progress[playbook.id] ?? []}
            onToggleStep={(stepIndex) => toggleStep(playbook.id, stepIndex)}
            onReset={() => resetPlaybook(playbook.id)}
            onTry={onTry}
            onSelectEngine={onSelectEngine}
          />
        ))}
      </section>
    </div>
  )
}
