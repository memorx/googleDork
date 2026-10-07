import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { playbooks } from '../data/playbooks'
import { Playbooks } from './Playbooks'

function renderPlaybooks() {
  const onTry = vi.fn()
  const onSelectEngine = vi.fn()
  render(<Playbooks onTry={onTry} onSelectEngine={onSelectEngine} />)
  return { onTry, onSelectEngine }
}

describe('Playbooks', () => {
  it('lists all playbooks collapsed by default', () => {
    renderPlaybooks()
    expect(screen.getAllByTestId('playbook-card')).toHaveLength(playbooks.length)
    expect(screen.getByText('Recon de dominio completo')).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('expands a playbook and tracks checklist progress', () => {
    renderPlaybooks()
    const first = playbooks[0]
    fireEvent.click(screen.getByText('Recon de dominio completo'))
    const card = screen.getAllByTestId('playbook-card')[0]
    const checkboxes = within(card).getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(first.steps.length)

    fireEvent.click(checkboxes[0])
    expect(within(card).getByText(`1/${first.steps.length}`)).toBeTruthy()

    fireEvent.click(checkboxes[0])
    expect(within(card).getByText(`0/${first.steps.length}`)).toBeTruthy()
  })

  it('resets the progress of a playbook', () => {
    renderPlaybooks()
    const first = playbooks[0]
    fireEvent.click(screen.getByText('Recon de dominio completo'))
    const card = screen.getAllByTestId('playbook-card')[0]
    fireEvent.click(within(card).getAllByRole('checkbox')[0])
    fireEvent.click(within(card).getAllByRole('checkbox')[1])
    expect(within(card).getByText(`2/${first.steps.length}`)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: `Reiniciar progreso de ${first.name}` }))
    expect(within(card).getByText(`0/${first.steps.length}`)).toBeTruthy()
  })

  it('steps with engineId navigate to the engine tab', () => {
    const { onSelectEngine } = renderPlaybooks()
    fireEvent.click(screen.getByText('Recon de dominio completo'))
    fireEvent.click(screen.getAllByRole('button', { name: /Ir al motor Shodan/i })[0])
    expect(onSelectEngine).toHaveBeenCalledWith('shodan')
  })
})
