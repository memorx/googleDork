import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { getDorksByEngine } from './data/dorks'

describe('App', () => {
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
    expect(tabs).toHaveLength(11)
    expect(screen.getByRole('tab', { name: /shodan/i })).toBeTruthy()
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
})
