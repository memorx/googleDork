import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { buildSearchUrl, getDorksByEngine, searchDorks } from './data/dorks'
import { recipes } from './data/recipes'

describe('App', () => {
  afterEach(() => {
    // El efecto de deep links escribe el estado en la URL; la reseteamos entre tests
    window.history.replaceState(null, '', '/')
  })
  it('renders the header and engine stats', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /googledork/i })).toBeTruthy()
    expect(screen.getByText(/dorks en google/i)).toBeTruthy()
  })

  it('renders the Google dork cards by default', () => {
    render(<App />)
    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBe(getDorksByEngine('google').length)
  })

  it('renders a tab per engine', () => {
    render(<App />)
    const tabs = screen.getAllByTestId('engine-tab')
    expect(tabs).toHaveLength(16)
    expect(screen.getByRole('tab', { name: /shodan/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /netlas/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /searxng/i })).toBeTruthy()
  })

  it('switching engine tab updates the grid', () => {
    render(<App />)
    const shodanTab = screen.getByRole('tab', { name: /shodan/i })
    fireEvent.click(shodanTab)

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBe(getDorksByEngine('shodan').length)
    expect(screen.getByText(/dorks en shodan/i)).toBeTruthy()
  })

  it('switching engine resets the category filter but keeps the search text', () => {
    render(<App />)
    const categoryButton = screen.getByRole('button', { name: /Búsqueda básica/i })
    fireEvent.click(categoryButton)
    fireEvent.click(screen.getByRole('tab', { name: /shodan/i }))

    // La categoría de Google ya no aparece y se muestran todos los dorks de Shodan
    expect(screen.queryByRole('button', { name: /Búsqueda básica/i })).toBeNull()
    expect(screen.getAllByTestId('dork-card').length).toBe(getDorksByEngine('shodan').length)
  })

  it('filters dorks by search query', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'site:' } })

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThan(getDorksByEngine('google').length)
  })

  it('search works within the selected engine', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /shodan/i }))
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'mongodb' } })

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThan(getDorksByEngine('shodan').length)
    expect(screen.getAllByText(/mongodb/i).length).toBeGreaterThan(0)
  })

  it('filters dorks by category', () => {
    render(<App />)
    const categoryButton = screen.getByRole('button', { name: /Búsqueda básica/i })
    fireEvent.click(categoryButton)

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThan(getDorksByEngine('google').length)
  })

  it('shows empty state when no results match', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } })

    expect(screen.queryAllByTestId('dork-card')).toHaveLength(0)
    expect(screen.getByText('No se encontraron dorks')).toBeTruthy()
  })

  it('global search finds dorks across all engines', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'cassandra' } })

    // "cassandra" solo existe en Shodan: dentro de Google no hay resultados
    expect(screen.queryAllByTestId('dork-card')).toHaveLength(0)

    fireEvent.click(screen.getByLabelText('Buscar en todos los motores'))

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBe(searchDorks('cassandra').length)
    expect(cards.length).toBeGreaterThan(0)
    expect(screen.getByText('Shodan', { selector: 'span' })).toBeTruthy()
    expect(screen.getByText('Dorks en total')).toBeTruthy()
    // El filtro de categorías (por motor) se oculta en búsqueda global
    expect(screen.queryByRole('button', { name: /Búsqueda básica/i })).toBeNull()
  })

  it('marks a dork as favorite and shows it in the favorites view', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Agregar a favoritos' })[0])

    fireEvent.click(screen.getByRole('button', { name: /^favoritos/i }))

    expect(screen.getByText(/tus favoritos/i)).toBeTruthy()
    expect(screen.getAllByTestId('dork-card')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Quitar de favoritos' })).toBeTruthy()
  })

  it('shows an empty message in favorites view when there are none', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^favoritos/i }))

    expect(screen.getByText(/aún no tenés favoritos/i)).toBeTruthy()
  })

  it('pressing "/" focuses the search input', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '/' })

    expect(document.activeElement).toBe(screen.getByLabelText('Buscar dorks'))
  })

  it('arrow keys switch between engines', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(/dorks en bing/i)).toBeTruthy()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(/dorks en google/i)).toBeTruthy()
  })

  it('does not hijack keys while typing in an input', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    searchInput.focus()
    fireEvent.keyDown(searchInput, { key: 'ArrowRight' })

    expect(screen.getByText(/dorks en google/i)).toBeTruthy()
  })

  it('Escape clears the search query', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'site:' } })
    fireEvent.keyDown(window, { key: 'Escape' })

    expect((searchInput as HTMLInputElement).value).toBe('')
  })

  it('restores engine and query from URL params', () => {
    window.history.replaceState(null, '', '?engine=shodan&q=mongodb')
    try {
      render(<App />)
      expect(screen.getByText(/dorks en shodan/i)).toBeTruthy()
      expect(screen.getAllByTestId('dork-card')).toHaveLength(
        searchDorks('mongodb', undefined, 'shodan').length,
      )
      expect((screen.getByLabelText('Buscar dorks') as HTMLInputElement).value).toBe('mongodb')
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('records tried dorks in the history panel', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /probar en google/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /historial/i }))

    const panel = screen.getByTestId('history-panel')
    expect(panel).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /re-ejecutar búsqueda/i })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /limpiar historial/i }))
    expect(screen.queryAllByRole('button', { name: /re-ejecutar búsqueda/i })).toHaveLength(0)
    openSpy.mockRestore()
  })

  it('shows the ethics banner and lets the user collapse it', () => {
    render(<App />)
    expect(screen.getByTestId('ethics-banner')).toBeTruthy()
    expect(screen.getByText(/uso responsable/i)).toBeTruthy()
    expect(screen.getByText(/211 bis/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /ocultar aviso de uso responsable/i }))
    expect(screen.queryByTestId('ethics-banner')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /aviso de uso responsable/i }))
    expect(screen.getByTestId('ethics-banner')).toBeTruthy()
  })

  it('marks sensitive categories with a warning tooltip', () => {
    render(<App />)
    const securityButton = screen.getByRole('button', { name: /Seguridad \/ Google Hacking/i })
    expect(securityButton.textContent).toContain('Seguridad / Google Hacking')
    expect(
      screen.getAllByTitle(/categoría sensible/i).length,
    ).toBeGreaterThan(0)
  })

  it('opens the recipes panel and lists recipes with copy and try buttons', () => {    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Recetas' }))

    const panel = screen.getByTestId('recipes-panel')
    expect(panel).toBeTruthy()
    const cards = screen.getAllByTestId('recipe-card')
    expect(cards.length).toBe(recipes.length)
    expect(screen.getByText('Cámaras Axis abiertas en México')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /copiar query de la receta cámaras axis abiertas en méxico/i }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /probar receta cámaras axis abiertas en méxico en google/i }),
    ).toBeTruthy()
  })

  it('trying a recipe records it in the history', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Recetas' }))
    fireEvent.click(
      screen.getByRole('button', { name: /probar receta cámaras axis abiertas en méxico en google/i }),
    )
    expect(openSpy).toHaveBeenCalledWith(
      buildSearchUrl('google', 'inurl:axis-cgi/mjpg site:mx'),
      '_blank',
      'noopener,noreferrer',
    )

    fireEvent.click(screen.getByRole('button', { name: /^historial/i }))
    expect(screen.getAllByRole('button', { name: /re-ejecutar búsqueda/i })).toHaveLength(1)
    openSpy.mockRestore()
  })

  it('opens the recon panel and generates queries for a valid domain', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)
    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: /recon de objetivo/i }))

      const input = screen.getByLabelText('Dominio objetivo')
      fireEvent.change(input, { target: { value: 'not a domain!!' } })
      fireEvent.click(screen.getByRole('button', { name: 'Analizar' }))
      expect(screen.getByRole('alert').textContent).toContain('dominio válido')

      fireEvent.change(input, { target: { value: 'example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Analizar' }))

      expect(await screen.findByText('site:example.com filetype:pdf')).toBeTruthy()
      expect(screen.getByText('hostname:example.com')).toBeTruthy()
      expect(screen.getByText('"example.com" filename:.env')).toBeTruthy()
      expect(
        screen.getByRole('button', { name: /exportar kit de auditoría/i }),
      ).toBeTruthy()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens and closes the command palette with Ctrl+K', () => {
    render(<App />)
    expect(screen.queryByTestId('command-palette')).toBeNull()

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByTestId('command-palette')).toBeTruthy()

    const input = screen.getByLabelText('Buscar en la paleta de comandos')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByTestId('command-palette')).toBeNull()
  })

  it('does not toggle the palette with Ctrl+K while typing in an input', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    searchInput.focus()
    fireEvent.keyDown(searchInput, { key: 'k', ctrlKey: true })
    expect(screen.queryByTestId('command-palette')).toBeNull()
  })

  it('opens the playbooks panel and checks a step', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Playbooks' }))
    const panel = screen.getByTestId('playbooks-panel')
    expect(panel).toBeTruthy()
    expect(within(panel).getAllByTestId('playbook-card')).toHaveLength(4)

    fireEvent.click(within(panel).getByText('Recon de dominio completo'))
    fireEvent.click(within(panel).getAllByRole('checkbox')[0])
    expect(within(panel).getByText('1/7')).toBeTruthy()
  })

  it('shows export and import controls in the history panel', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^historial/i }))
    expect(screen.getByRole('button', { name: /exportar favoritos e historial/i })).toBeTruthy()
    expect(screen.getByLabelText(/importar favoritos e historial/i)).toBeTruthy()
  })

  it('opens the resources panel from the footer link', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Recursos OSINT' }))
    expect(screen.getByTestId('resources-panel')).toBeTruthy()
    expect(screen.getAllByTestId('resource-card').length).toBeGreaterThanOrEqual(8)
  })
})
