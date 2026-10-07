import { useMemo, useRef, useState } from 'react'
import { buildSearchUrl, getEngines } from '../data/dorks'
import { copyText } from '../lib/clipboard'
import { buildQuery, getOperatorsForEngine, type BuilderCondition } from '../lib/dorkBuilder'

const FREE_TEXT = 'free'

interface ConditionRow extends BuilderCondition {
  id: number
}

interface DorkBuilderProps {
  initialEngine: string
  onTry: (engineId: string, query: string) => void
}

function firstCondition(engineId: string, id: number): ConditionRow {
  return { id, operator: getOperatorsForEngine(engineId)[0] ?? null, value: '' }
}

export function DorkBuilder({ initialEngine, onTry }: DorkBuilderProps) {
  const [engineId, setEngineId] = useState(initialEngine)
  const nextId = useRef(2)
  const [conditions, setConditions] = useState<ConditionRow[]>([
    firstCondition(initialEngine, 1),
  ])
  const [copied, setCopied] = useState(false)

  const engines = getEngines()
  const operators = useMemo(() => getOperatorsForEngine(engineId), [engineId])
  const query = useMemo(() => buildQuery(conditions), [conditions])

  const handleEngineChange = (newEngineId: string) => {
    setEngineId(newEngineId)
    setConditions([firstCondition(newEngineId, nextId.current++)])
  }

  const updateCondition = (id: number, patch: Partial<ConditionRow>) => {
    setConditions((prev) =>
      prev.map((condition) => (condition.id === id ? { ...condition, ...patch } : condition)),
    )
  }

  const addCondition = () => {
    setConditions((prev) => [...prev, { id: nextId.current++, operator: null, value: '' }])
  }

  const removeCondition = (id: number) => {
    setConditions((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev))
  }

  const handleCopy = async () => {
    if (!query) return
    await copyText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTry = () => {
    if (!query) return
    window.open(buildSearchUrl(engineId, query), '_blank', 'noopener,noreferrer')
    onTry(engineId, query)
  }

  return (
    <div className="dork-card" data-testid="dork-builder">
      <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
        Constructor de dorks
      </h3>

      <div className="mb-4">
        <label
          htmlFor="builder-engine"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
        >
          Motor
        </label>
        <select
          id="builder-engine"
          value={engineId}
          onChange={(e) => handleEngineChange(e.target.value)}
          className="field-input"
          aria-label="Motor del constructor"
        >
          {engines.map((engine) => (
            <option key={engine.id} value={engine.id}>
              {engine.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex flex-col gap-2 sm:flex-row">
            <select
              value={condition.operator ?? FREE_TEXT}
              onChange={(e) =>
                updateCondition(condition.id, {
                  operator: e.target.value === FREE_TEXT ? null : e.target.value,
                })
              }
              className="field-input sm:w-48 sm:shrink-0"
              aria-label={`Operador de la condición ${index + 1}`}
            >
              {operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
              <option value={FREE_TEXT}>Texto libre</option>
            </select>
            <input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
              className="field-input flex-1"
              placeholder="Valor…"
              aria-label={`Valor de la condición ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeCondition(condition.id)}
              disabled={conditions.length === 1}
              className="btn btn-secondary shrink-0 px-3 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Quitar condición ${index + 1}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addCondition} className="btn btn-secondary mb-4">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar condición
      </button>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Query generado
        </p>
        <div className="dork-code" data-testid="builder-preview">
          {query || 'Completá un valor para ver el query…'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!query}
          className={`btn flex-1 disabled:cursor-not-allowed disabled:opacity-40 ${copied ? 'btn-secondary' : 'btn-primary'}`}
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={handleTry}
          disabled={!query}
          className="btn btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Probar query generado"
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
    </div>
  )
}
