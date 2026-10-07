export interface UrlState {
  engine?: string
  q?: string
  cat?: string
  global: boolean
  fav: boolean
}

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search)
  return {
    engine: params.get('engine') ?? undefined,
    q: params.get('q') ?? undefined,
    cat: params.get('cat') ?? undefined,
    global: params.get('global') === '1',
    fav: params.get('fav') === '1',
  }
}

export interface AppUrlState {
  engine: string
  query: string
  category: string | null
  global: boolean
  fav: boolean
}

export const DEFAULT_ENGINE = 'google'

export function buildUrlSearch(state: AppUrlState): string {
  const params = new URLSearchParams()
  if (state.engine !== DEFAULT_ENGINE) params.set('engine', state.engine)
  if (state.query) params.set('q', state.query)
  if (state.category) params.set('cat', state.category)
  if (state.global) params.set('global', '1')
  if (state.fav) params.set('fav', '1')
  const search = params.toString()
  return search ? `?${search}` : ''
}
