import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  engine: 'google',
}

const mockShodanDork: Dork = {
  id: 'shodan-webcam',
  operator: 'webcam',
  description: 'Cámaras web detectadas por banner.',
  example: 'webcam country:MX',
  usage: 'Localiza cámaras IP expuestas.',
  category: 'shodan-camaras',
  engine: 'shodan',
}

describe('DorkCard', () => {
  it('renders dork information', () => {
    render(<DorkCard dork={mockDork} index={0} />)

    expect(screen.getByText('site:')).toBeTruthy()
    expect(screen.getByText('Restringe la búsqueda a un dominio.')).toBeTruthy()
    expect(screen.getByText('site:example.com')).toBeTruthy()
    expect(screen.getByText('Busca solo dentro del dominio indicado.')).toBeTruthy()
  })

  it('shows a badge with the engine name', () => {
    render(<DorkCard dork={mockShodanDork} index={0} />)
    expect(screen.getByText('Shodan')).toBeTruthy()
  })

  it('has a copy button', () => {
    render(<DorkCard dork={mockDork} index={0} />)
    expect(screen.getByRole('button', { name: 'Copiar ejemplo' })).toBeTruthy()
  })

  it('copies only the operator with feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<DorkCard dork={mockDork} index={0} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copiar operador' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('site:'))
    expect(await screen.findByText('¡Copiado!')).toBeTruthy()
  })

  it('has a favorite star that toggles', () => {
    const onToggleFavorite = vi.fn()
    render(<DorkCard dork={mockDork} index={0} isFavorite={false} onToggleFavorite={onToggleFavorite} />)

    const star = screen.getByRole('button', { name: 'Agregar a favoritos' })
    fireEvent.click(star)

    expect(onToggleFavorite).toHaveBeenCalledWith('site')
  })

  it('shows the pressed state when the dork is a favorite', () => {
    render(<DorkCard dork={mockDork} index={0} isFavorite />)
    const star = screen.getByRole('button', { name: 'Quitar de favoritos' })
    expect(star.getAttribute('aria-pressed')).toBe('true')
  })

  it('has a try button that opens Google', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<DorkCard dork={mockDork} index={0} />)

    const tryButton = screen.getByRole('button', { name: /probar en google/i })
    fireEvent.click(tryButton)

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/search?q=site%3Aexample.com',
      '_blank',
      'noopener,noreferrer',
    )
    openSpy.mockRestore()
  })

  it('try button of a Shodan dork opens shodan.io', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<DorkCard dork={mockShodanDork} index={0} />)

    const tryButton = screen.getByRole('button', { name: /probar en shodan/i })
    fireEvent.click(tryButton)

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.shodan.io/search?query=webcam%20country%3AMX',
      '_blank',
      'noopener,noreferrer',
    )
    openSpy.mockRestore()
  })
})
