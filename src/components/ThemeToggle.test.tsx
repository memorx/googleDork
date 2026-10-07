import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('cicla claro → oscuro → hacker → claro', () => {
    render(<ThemeToggle />)
    const root = document.documentElement
    expect(root.getAttribute('data-theme')).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo oscuro/i }))
    expect(root.getAttribute('data-theme')).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo hacker/i }))
    expect(root.getAttribute('data-theme')).toBe('hacker')

    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo claro/i }))
    expect(root.getAttribute('data-theme')).toBe('light')
  })

  it('persiste cada tema en localStorage', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo oscuro/i }))
    expect(localStorage.setItem).toHaveBeenCalledWith('googledork-theme', 'dark')

    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo hacker/i }))
    expect(localStorage.setItem).toHaveBeenCalledWith('googledork-theme', 'hacker')
  })

  it('aplica el tema hacker guardado al montar', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('hacker')
    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('hacker')
    expect(screen.getByRole('button', { name: /cambiar a modo claro/i })).toBeTruthy()
  })

  it('ignora valores guardados desconocidos y cae en el tema claro', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('neon')
    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
