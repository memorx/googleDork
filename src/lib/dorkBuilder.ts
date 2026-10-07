import { getDorksByEngine } from '../data/dorks'

export interface BuilderCondition {
  /** Operador del motor (p.ej. "site:") o null para texto libre */
  operator: string | null
  value: string
}

/**
 * Operadores disponibles para un motor: los operadores de sus dorks
 * que terminan en ":", sin duplicados y en orden de aparición.
 */
export function getOperatorsForEngine(engineId: string): string[] {
  const seen = new Set<string>()
  for (const dork of getDorksByEngine(engineId)) {
    const operator = dork.operator.trim()
    if (operator.endsWith(':')) {
      seen.add(operator)
    }
  }
  return [...seen]
}

/**
 * Combina las condiciones en un query: "operador" + valor para operadores,
 * el valor tal cual para texto libre. Ignora condiciones sin valor.
 */
export function buildQuery(conditions: BuilderCondition[]): string {
  return conditions
    .map((condition) => ({
      operator: condition.operator?.trim() ?? '',
      value: condition.value.trim(),
    }))
    .filter((condition) => condition.value !== '')
    .map((condition) => (condition.operator ? `${condition.operator}${condition.value}` : condition.value))
    .join(' ')
}
