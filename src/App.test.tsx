import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { dorks } from './data/dorks'

describe('App', () => {
  it('renders the header and dork count', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /googledork/i })).toBeTruthy()
    expect(screen.getByText(/dorks totales/i)).toBeTruthy()
  })

  it('renders all dork cards initially', () => {
    render(<App />)
    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBe(dorks.length)
  })

  it('filters dorks by search query', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'site:' } })

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThan(dorks.length)
  })

  it('filters dorks by category', () => {
    render(<App />)
    const categoryButton = screen.getByRole('button', { name: /Búsqueda básica/i })
    fireEvent.click(categoryButton)

    const cards = screen.getAllByTestId('dork-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThan(dorks.length)
  })

  it('shows empty state when no results match', () => {
    render(<App />)
    const searchInput = screen.getByLabelText('Buscar dorks')
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } })

    expect(screen.queryAllByTestId('dork-card')).toHaveLength(0)
    expect(screen.getByText('No se encontraron dorks')).toBeTruthy()
  })
})
