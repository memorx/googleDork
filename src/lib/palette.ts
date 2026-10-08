import { dorks, getEngines } from '../data/dorks'
import { getRecipes } from '../data/recipes'

// Elementos buscables de la paleta de comandos: acciones, motores, recetas y dorks.

export type PalettePanel = 'builder' | 'recipes' | 'history' | 'recon' | 'playbooks' | 'resources' | 'workspace'

export type PaletteItem =
  | { kind: 'action'; id: string; title: string; subtitle: string; action: PalettePanel | 'favorites' | 'theme' }
  | { kind: 'engine'; id: string; title: string; subtitle: string; engineId: string }
  | { kind: 'recipe'; id: string; title: string; subtitle: string; recipeId: string }
  | { kind: 'dork'; id: string; title: string; subtitle: string; dorkId: string }

export const PALETTE_ACTIONS: PaletteItem[] = [
  { kind: 'action', id: 'action-builder', title: 'Abrir Constructor de dorks', subtitle: 'Acción', action: 'builder' },
  { kind: 'action', id: 'action-recipes', title: 'Abrir Recetas', subtitle: 'Acción', action: 'recipes' },
  { kind: 'action', id: 'action-history', title: 'Abrir Historial', subtitle: 'Acción', action: 'history' },
  { kind: 'action', id: 'action-recon', title: 'Abrir Recon de objetivo', subtitle: 'Acción', action: 'recon' },
  { kind: 'action', id: 'action-workspace', title: 'Abrir Workspace de auditoría', subtitle: 'Acción', action: 'workspace' },
  { kind: 'action', id: 'action-playbooks', title: 'Abrir Playbooks OSINT', subtitle: 'Acción', action: 'playbooks' },
  { kind: 'action', id: 'action-resources', title: 'Abrir Recursos OSINT', subtitle: 'Acción', action: 'resources' },
  { kind: 'action', id: 'action-favorites', title: 'Ir a Favoritos', subtitle: 'Acción', action: 'favorites' },
  { kind: 'action', id: 'action-theme', title: 'Cambiar tema (claro / oscuro / hacker)', subtitle: 'Acción', action: 'theme' },
]

const ENGINE_ITEMS: PaletteItem[] = getEngines().map((engine) => ({
  kind: 'engine',
  id: `engine-${engine.id}`,
  title: `Motor: ${engine.name}`,
  subtitle: engine.description,
  engineId: engine.id,
}))

const RECIPE_ITEMS: PaletteItem[] = getRecipes().map((recipe) => ({
  kind: 'recipe',
  id: `recipe-${recipe.id}`,
  title: `Receta: ${recipe.name}`,
  subtitle: recipe.description,
  recipeId: recipe.id,
}))

const DORK_ITEMS: PaletteItem[] = dorks.map((dork) => ({
  kind: 'dork',
  id: `dork-${dork.id}`,
  title: `${dork.operator} — ${dork.description}`,
  subtitle: dork.example,
  dorkId: dork.id,
}))

const ALL_ITEMS = [...PALETTE_ACTIONS, ...ENGINE_ITEMS, ...RECIPE_ITEMS, ...DORK_ITEMS]

/** Filtra la paleta por substring case-insensitive. Sin query: acciones y motores. */
export function filterPaletteItems(query: string): PaletteItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...PALETTE_ACTIONS, ...ENGINE_ITEMS]
  return ALL_ITEMS.filter(
    (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
  ).slice(0, 30)
}
