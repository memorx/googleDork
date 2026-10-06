import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DorkCard } from './DorkCard'
import type { Dork } from '../data/dorks'

const mockDork: Dork = {
  id: 'site',
  operator: 'site:',
  description: 'Restringe la búsqueda a un dominio.',
  example: 'site:example.com',
  usage: 'Busca solo dentro del dominio indicado.',
  category: 'site-url',
}

describe('DorkCard', () => {
  it('renders dork information', () => {
    render(<DorkCard dork={mockDork} />)

    expect(screen.getByText('site:')).toBeTruthy()
    expect(screen.getByText('Restringe la búsqueda a un dominio.')).toBeTruthy()
    expect(screen.getByText('site:example.com')).toBeTruthy()
    expect(screen.getByText('Busca solo dentro del dominio indicado.')).toBeTruthy()
  })

  it('has a copy button', () => {
    render(<DorkCard dork={mockDork} />)
    expect(screen.getByRole('button', { name: /copiar/i })).toBeTruthy()
  })

  it('has a try button that opens Google', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<DorkCard dork={mockDork} />)

    const tryButton = screen.getByRole('button', { name: /probar en google/i })
    fireEvent.click(tryButton)

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/search?q=site%3Aexample.com',
      '_blank',
    )
    openSpy.mockRestore()
  })
})
