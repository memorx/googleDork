import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspace, WORKSPACE_KEY } from './useWorkspace'

describe('useWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useWorkspace())
    expect(result.current.projects).toEqual([])
  })

  it('creates, renames and deletes projects, persisting to localStorage', () => {
    const { result } = renderHook(() => useWorkspace())

    let projectId = ''
    act(() => {
      projectId = result.current.createProject('  Auditoría ACME  ')!.id
    })
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].name).toBe('Auditoría ACME')
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      WORKSPACE_KEY,
      JSON.stringify(result.current.projects),
    )

    act(() => result.current.renameProject(projectId, 'Auditoría Q1'))
    expect(result.current.projects[0].name).toBe('Auditoría Q1')

    act(() => result.current.deleteProject(projectId))
    expect(result.current.projects).toEqual([])
  })

  it('rejects empty project names', () => {
    const { result } = renderHook(() => useWorkspace())
    act(() => {
      expect(result.current.createProject('   ')).toBeNull()
    })
    expect(result.current.projects).toEqual([])
  })

  it('adds targets with domain validation and removes them', () => {
    const { result } = renderHook(() => useWorkspace())
    let projectId = ''
    act(() => {
      projectId = result.current.createProject('P1')!.id
    })

    act(() => {
      expect(result.current.addTarget(projectId, 'no es un dominio')).toBeNull()
    })
    expect(result.current.projects[0].targets).toEqual([])

    let targetId = ''
    act(() => {
      targetId = result.current.addTarget(projectId, 'https://Example.com/path')!.id
    })
    expect(result.current.projects[0].targets).toHaveLength(1)
    expect(result.current.projects[0].targets[0].domain).toBe('example.com')

    act(() => result.current.removeTarget(projectId, targetId))
    expect(result.current.projects[0].targets).toEqual([])
  })

  it('adds and removes notes with severity', () => {
    const { result } = renderHook(() => useWorkspace())
    let projectId = ''
    let targetId = ''
    act(() => {
      projectId = result.current.createProject('P1')!.id
      targetId = result.current.addTarget(projectId, 'example.com')!.id
    })

    act(() => {
      expect(result.current.addNote(projectId, targetId, '   ', 'high')).toBeNull()
    })

    let noteId = ''
    act(() => {
      noteId = result.current.addNote(projectId, targetId, 'Panel admin expuesto', 'high')!.id
    })
    const notes = result.current.projects[0].targets[0].notes
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ text: 'Panel admin expuesto', severity: 'high' })

    act(() => result.current.removeNote(projectId, targetId, noteId))
    expect(result.current.projects[0].targets[0].notes).toEqual([])
  })

  it('saveSnapshot returns null on first save and a diff on the second', () => {
    const { result } = renderHook(() => useWorkspace())
    let projectId = ''
    let targetId = ''
    act(() => {
      projectId = result.current.createProject('P1')!.id
      targetId = result.current.addTarget(projectId, 'example.com')!.id
    })

    act(() => {
      const diff = result.current.saveSnapshot(projectId, targetId, {
        date: '2026-01-01T00:00:00.000Z',
        subdomains: ['www.example.com'],
        dns: { A: ['1.1.1.1'] },
      })
      expect(diff).toBeNull()
    })
    expect(result.current.projects[0].targets[0].snapshot?.subdomains).toEqual(['www.example.com'])

    act(() => {
      const diff = result.current.saveSnapshot(projectId, targetId, {
        date: '2026-02-01T00:00:00.000Z',
        subdomains: ['www.example.com', 'api.example.com'],
        dns: { A: ['2.2.2.2'] },
      })
      expect(diff).toEqual({
        addedSubdomains: ['api.example.com'],
        removedSubdomains: [],
        dnsChanges: [{ type: 'A', added: ['2.2.2.2'], removed: ['1.1.1.1'] }],
      })
    })
    expect(result.current.projects[0].targets[0].lastDiff?.addedSubdomains).toEqual([
      'api.example.com',
    ])
  })

  it('imports external hosts, merging and skipping known ones', () => {
    const { result } = renderHook(() => useWorkspace())
    let projectId = ''
    let targetId = ''
    act(() => {
      projectId = result.current.createProject('P1')!.id
      targetId = result.current.addTarget(projectId, 'example.com')!.id
    })
    act(() => {
      result.current.saveSnapshot(projectId, targetId, {
        date: '2026-01-01T00:00:00.000Z',
        subdomains: ['www.example.com'],
        dns: {},
      })
    })

    let feedback = { added: 0, ignored: 0 }
    act(() => {
      feedback = result.current.importExternalHosts(
        projectId,
        targetId,
        'www.example.com\napi.example.com\notro.org\nHost: 203.0.113.5 () Ports: 80/open/tcp//http///',
      )
    })
    // www ya estaba en el snapshot, api es nuevo, otro.org y la IP se ignoran
    expect(feedback).toEqual({ added: 1, ignored: 3 })
    expect(result.current.projects[0].targets[0].externalHosts).toEqual(['api.example.com'])

    act(() => {
      feedback = result.current.importExternalHosts(projectId, targetId, 'api.example.com')
    })
    expect(feedback).toEqual({ added: 0, ignored: 1 })
  })

  it('finds targets by domain across projects', () => {
    const { result } = renderHook(() => useWorkspace())
    act(() => {
      const project = result.current.createProject('P1')!
      result.current.addTarget(project.id, 'example.com')
    })

    expect(result.current.findTargetByDomain('https://EXAMPLE.com/')).toMatchObject({
      project: { name: 'P1' },
      target: { domain: 'example.com' },
    })
    expect(result.current.findTargetByDomain('otro.com')).toBeNull()
  })

  it('loads stored projects on init and ignores malformed data', () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce(
      JSON.stringify([
        {
          id: 'p1',
          name: 'Guardado',
          createdAt: '2026-01-01T00:00:00.000Z',
          targets: [
            {
              id: 't1',
              domain: 'example.com',
              addedAt: '2026-01-01T00:00:00.000Z',
              notes: [],
              externalHosts: ['api.example.com'],
            },
          ],
        },
        { basura: true },
      ]),
    )
    const { result } = renderHook(() => useWorkspace())
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].targets[0].externalHosts).toEqual(['api.example.com'])
  })
})
