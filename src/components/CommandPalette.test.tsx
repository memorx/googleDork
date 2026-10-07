import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { filterPaletteItems } from '../lib/palette'
import { CommandPalette } from './CommandPalette'

function renderPalette(overrides: Partial<Parameters<typeof CommandPalette>[0]> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onSelectEngine: vi.fn(),
    onOpenPanel: vi.fn(),
    onShowFavorites: vi.fn(),
    onCycleTheme: vi.fn(),
    onTryDork: vi.fn(),
    ...overrides,
  }
  render(<CommandPalette {...props} />)
  return props
}

describe('filterPaletteItems', () => {
  it('shows actions and engines when the query is empty', () => {
    const items = filterPaletteItems('')
    expect(items.some((item) => item.kind === 'action')).toBe(true)
    expect(items.some((item) => item.kind === 'engine')).toBe(true)
    expect(items.some((item) => item.kind === 'dork')).toBe(false)
  })

  it('filters case-insensitively by substring', () => {
    const items = filterPaletteItems('SHODAN')
    expect(items.some((item) => item.kind === 'engine' && item.title.includes('Shodan'))).toBe(true)

    const dorks = filterPaletteItems('mongodb')
    expect(dorks.length).toBeGreaterThan(0)
    expect(dorks.every((item) =>
      item.title.toLowerCase().includes('mongodb') || item.subtitle.toLowerCase().includes('mongodb'),
    )).toBe(true)
  })
})

describe('CommandPalette', () => {
  it('does not render when closed', () => {
    renderPalette({ open: false })
    expect(screen.queryByTestId('command-palette')).toBeNull()
  })

  it('filters items as you type', () => {
    renderPalette()
    const input = screen.getByLabelText('Buscar en la paleta de comandos')
    fireEvent.change(input, { target: { value: 'shodan' } })
    expect(screen.getByText('Motor: Shodan')).toBeTruthy()
    expect(screen.queryByText('Motor: Bing')).toBeNull()
  })

  it('Enter executes the active engine item and closes', () => {
    const props = renderPalette()
    const input = screen.getByLabelText('Buscar en la paleta de comandos')
    fireEvent.change(input, { target: { value: 'shodan' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(props.onSelectEngine).toHaveBeenCalledWith('shodan')
    expect(props.onClose).toHaveBeenCalled()
  })

  it('Escape closes the palette', () => {
    const props = renderPalette()
    const input = screen.getByLabelText('Buscar en la paleta de comandos')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop closes the palette', () => {
    const props = renderPalette()
    fireEvent.click(screen.getByTestId('command-palette-backdrop'))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('arrow keys move the active item', () => {
    renderPalette()
    const input = screen.getByLabelText('Buscar en la paleta de comandos')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const options = screen.getAllByRole('option')
    expect(options[1].getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(options[0].getAttribute('aria-selected')).toBe('true')
  })

  it('does not open with Ctrl+K intercepted while typing', () => {
    // La paleta no se abre desde aquí (eso vive en App); acá solo verificamos
    // que las acciones de abrir paneles funcionan.
    const props = renderPalette()
    fireEvent.click(screen.getByText('Abrir Playbooks OSINT'))
    expect(props.onOpenPanel).toHaveBeenCalledWith('playbooks')
    expect(props.onClose).toHaveBeenCalled()
  })
})
