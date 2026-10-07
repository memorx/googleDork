import { useState } from 'react'
import { buildSearchUrl, getEngineById } from '../data/dorks'
import { recipes, type Recipe } from '../data/recipes'
import { copyText } from '../lib/clipboard'

interface RecipesProps {
  onTry: (engineId: string, query: string) => void
}

interface RecipeCardProps {
  recipe: Recipe
  onTry: (engineId: string, query: string) => void
}

function RecipeCard({ recipe, onTry }: RecipeCardProps) {
  const [copied, setCopied] = useState(false)
  const engine = getEngineById(recipe.engine)

  const handleCopy = async () => {
    await copyText(recipe.query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTry = () => {
    window.open(buildSearchUrl(recipe.engine, recipe.query), '_blank', 'noopener,noreferrer')
    onTry(recipe.engine, recipe.query)
  }

  return (
    <article className="dork-card flex flex-col" data-testid="recipe-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">{recipe.name}</h4>
        <div className="flex shrink-0 items-center gap-1.5">
          {recipe.sensitive && (
            <span
              className="text-[var(--warning-500)]"
              title="Receta sensible: usala solo en sistemas propios o con autorización."
              role="img"
              aria-label="Receta sensible"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
          )}
          {engine && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: engine.color }}
            >
              {engine.name}
            </span>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm text-[var(--text-secondary)]">{recipe.description}</p>

      <ol className="mb-4 flex list-decimal flex-col gap-1 pl-5 text-sm text-[var(--text-secondary)]">
        {recipe.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Query final
        </p>
        <div className="dork-code">{recipe.query}</div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`btn flex-1 ${copied ? 'btn-secondary' : 'btn-primary'}`}
          aria-label={`Copiar query de la receta ${recipe.name}`}
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ¡Copiado!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleTry}
          className="btn btn-secondary flex-1"
          aria-label={`Probar receta ${recipe.name} en ${engine?.name ?? 'el buscador'}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Probar
        </button>
      </div>
    </article>
  )
}

export function Recipes({ onTry }: RecipesProps) {
  return (
    <div data-testid="recipes-panel">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recetas de dorks</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Combinaciones completas de operadores, explicadas paso a paso y listas para copiar o probar.
        </p>
      </div>
      <section className="grid gap-6 sm:grid-cols-2" aria-label="Listado de recetas">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onTry={onTry} />
        ))}
      </section>
    </div>
  )
}
