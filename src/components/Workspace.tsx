import { useState } from 'react'
import type { ExternalImportFeedback, NoteSeverity, Project, Target, WorkspaceApi } from '../hooks/useWorkspace'
import { isDiffEmpty } from '../lib/reconDiff'

// Panel "Workspace de auditoría": proyectos con objetivos, notas de hallazgos
// con severidad, hosts importados de herramientas externas y último escaneo.

const SEVERITY_META: Record<NoteSeverity, { label: string; color: string }> = {
  info: { label: 'Info', color: 'var(--accent-500)' },
  low: { label: 'Baja', color: 'var(--success-500)' },
  medium: { label: 'Media', color: 'var(--warning-500)' },
  high: { label: 'Alta', color: 'var(--danger-500)' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

function SeverityBadge({ severity }: { severity: NoteSeverity }) {
  const meta = SEVERITY_META[severity]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ color: meta.color, border: `1px solid ${meta.color}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}

/** Botón de eliminar en dos pasos: primer click pide confirmación. */
function ConfirmDelete({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        className="btn btn-secondary"
        aria-label={armed ? confirmLabel : label}
        onClick={() => {
          if (armed) {
            onConfirm()
            setArmed(false)
          } else {
            setArmed(true)
          }
        }}
      >
        {armed ? '¿Confirmar?' : 'Eliminar'}
      </button>
      {armed && (
        <button type="button" className="btn btn-secondary" onClick={() => setArmed(false)}>
          Cancelar
        </button>
      )}
    </span>
  )
}

function DiffSummary({ target }: { target: Target }) {
  if (!target.snapshot) {
    return <p className="text-sm text-[var(--text-secondary)]">Sin escaneos guardados todavía.</p>
  }
  const diff = target.lastDiff
  return (
    <div className="text-sm text-[var(--text-secondary)]">
      <p>
        Último escaneo: {formatDate(target.snapshot.date)} — {target.snapshot.subdomains.length}{' '}
        subdominios, {Object.keys(target.snapshot.dns).length} tipos DNS.
      </p>
      {diff && (
        <p className="mt-1">
          {isDiffEmpty(diff) ? (
            'Sin cambios contra el escaneo anterior.'
          ) : (
            <>
              {diff.addedSubdomains.length > 0 && (
                <span className="mr-2 font-semibold text-[var(--success-500)]">
                  +{diff.addedSubdomains.length} subdominios nuevos
                </span>
              )}
              {diff.removedSubdomains.length > 0 && (
                <span className="mr-2 font-semibold text-[var(--danger-500)]">
                  −{diff.removedSubdomains.length} caídos
                </span>
              )}
              {diff.dnsChanges.length > 0 && (
                <span className="font-semibold text-[var(--warning-500)]">
                  {diff.dnsChanges.length} cambios DNS
                </span>
              )}
            </>
          )}
        </p>
      )}
    </div>
  )
}

interface TargetCardProps {
  project: Project
  target: Target
  workspace: WorkspaceApi
  onOpenRecon: (domain: string) => void
}

function TargetCard({ project, target, workspace, onOpenRecon }: TargetCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSeverity, setNoteSeverity] = useState<NoteSeverity>('info')
  const [importText, setImportText] = useState('')
  const [importFeedback, setImportFeedback] = useState<ExternalImportFeedback | null>(null)

  const handleAddNote = () => {
    if (!workspace.addNote(project.id, target.id, noteText, noteSeverity)) return
    setNoteText('')
    setNoteSeverity('info')
  }

  const handleImport = () => {
    const feedback = workspace.importExternalHosts(project.id, target.id, importText)
    setImportFeedback(feedback)
    if (feedback.added > 0) setImportText('')
  }

  return (
    <li className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3" data-testid="target-card">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left font-mono text-sm font-semibold text-[var(--text-primary)]"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Contraer' : 'Expandir'} objetivo ${target.domain}`}
        >
          {expanded ? '▾' : '▸'} {target.domain}
          {target.notes.length > 0 && (
            <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-normal text-[var(--text-secondary)]">
              {target.notes.length} notas
            </span>
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onOpenRecon(target.domain)}>
          Abrir en Recon
        </button>
        <ConfirmDelete
          label={`Eliminar objetivo ${target.domain}`}
          confirmLabel={`Confirmar eliminación del objetivo ${target.domain}`}
          onConfirm={() => workspace.removeTarget(project.id, target.id)}
        />
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-4 border-t border-[var(--border-color)] pt-3">
          <section aria-label={`Último escaneo de ${target.domain}`}>
            <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Último escaneo
            </h5>
            <DiffSummary target={target} />
            {(target.snapshot?.subdomains.length || target.externalHosts.length > 0) && (
              <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-2">
                {(target.snapshot?.subdomains ?? []).map((host) => (
                  <li key={host} className="font-mono text-xs text-[var(--text-primary)]">
                    {host}
                  </li>
                ))}
                {target.externalHosts.map((host) => (
                  <li key={`ext-${host}`} className="flex items-center gap-2 font-mono text-xs text-[var(--text-primary)]">
                    {host}
                    <span className="rounded-full bg-[var(--accent-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      externo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label={`Notas de ${target.domain}`}>
            <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Notas de hallazgos
            </h5>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNote()
                }}
                placeholder="Hallazgo observado…"
                className="field-input flex-1"
                aria-label={`Texto de la nota para ${target.domain}`}
              />
              <select
                value={noteSeverity}
                onChange={(e) => setNoteSeverity(e.target.value as NoteSeverity)}
                className="field-input"
                aria-label={`Severidad de la nota para ${target.domain}`}
              >
                {(Object.keys(SEVERITY_META) as NoteSeverity[]).map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_META[severity].label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary shrink-0"
                onClick={handleAddNote}
                aria-label={`Agregar nota a ${target.domain}`}
              >
                Agregar nota
              </button>
            </div>
            {target.notes.length > 0 && (
              <ul className="mt-2 flex flex-col gap-2">
                {target.notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2"
                  >
                    <SeverityBadge severity={note.severity} />
                    <span className="min-w-0 flex-1 break-words text-sm text-[var(--text-primary)]">
                      {note.text}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                      {formatDate(note.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-sm font-medium text-[var(--danger-500)] hover:underline"
                      onClick={() => workspace.removeNote(project.id, target.id, note.id)}
                      aria-label={`Eliminar nota: ${note.text}`}
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label={`Importar resultados externos para ${target.domain}`}>
            <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Importar resultados externos
            </h5>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'Pegá output de subfinder/amass (un host por línea) o nmap -oG:\nHost: 203.0.113.10 () Ports: 80/open/tcp//http///'}
              className="field-input min-h-20 w-full font-mono text-xs"
              aria-label={`Resultados de herramientas externas para ${target.domain}`}
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleImport}
                aria-label={`Importar hosts externos a ${target.domain}`}
              >
                Importar hosts
              </button>
              {importFeedback && (
                <p className="text-sm text-[var(--text-secondary)]" role="status">
                  {importFeedback.added} hosts importados, {importFeedback.ignored} ignorados
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </li>
  )
}

function ProjectCard({ project, workspace, onOpenRecon }: { project: Project; workspace: WorkspaceApi; onOpenRecon: (domain: string) => void }) {
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(project.name)
  const [targetInput, setTargetInput] = useState('')
  const [targetError, setTargetError] = useState<string | null>(null)

  const handleRename = () => {
    workspace.renameProject(project.id, nameInput)
    setRenaming(false)
  }

  const handleAddTarget = () => {
    const target = workspace.addTarget(project.id, targetInput)
    if (!target) {
      setTargetError('Ingresá un dominio válido, por ejemplo: ejemplo.com')
      return
    }
    setTargetError(null)
    setTargetInput('')
  }

  return (
    <li className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4" data-testid="project-card">
      <div className="flex flex-wrap items-center gap-2">
        {renaming ? (
          <>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="field-input min-w-0 flex-1"
              aria-label={`Nuevo nombre del proyecto ${project.name}`}
            />
            <button type="button" className="btn btn-primary" onClick={handleRename}>
              Guardar
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setRenaming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <h4 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--text-primary)]">
              {project.name}
              <span className="ml-2 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-normal text-[var(--text-secondary)]">
                {project.targets.length} objetivos
              </span>
            </h4>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setNameInput(project.name)
                setRenaming(true)
              }}
              aria-label={`Renombrar proyecto ${project.name}`}
            >
              Renombrar
            </button>
            <ConfirmDelete
              label={`Eliminar proyecto ${project.name}`}
              confirmLabel={`Confirmar eliminación del proyecto ${project.name}`}
              onConfirm={() => workspace.deleteProject(project.id)}
            />
          </>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddTarget()
          }}
          placeholder="ejemplo.com"
          className="field-input flex-1"
          aria-label={`Dominio del objetivo para ${project.name}`}
        />
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={handleAddTarget}
          aria-label={`Agregar objetivo a ${project.name}`}
        >
          Agregar objetivo
        </button>
      </div>
      {targetError && (
        <p className="mt-2 text-sm text-[var(--danger-500)]" role="alert">
          {targetError}
        </p>
      )}

      {project.targets.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {project.targets.map((target) => (
            <TargetCard
              key={target.id}
              project={project}
              target={target}
              workspace={workspace}
              onOpenRecon={onOpenRecon}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Workspace({ workspace, onOpenRecon }: { workspace: WorkspaceApi; onOpenRecon: (domain: string) => void }) {
  const [nameInput, setNameInput] = useState('')

  const handleCreate = () => {
    if (!workspace.createProject(nameInput)) return
    setNameInput('')
  }

  return (
    <div className="dork-card" data-testid="workspace-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Workspace de auditoría</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Organizá tus auditorías en proyectos: objetivos, notas de hallazgos con severidad,
          snapshots de recon con diff entre escaneos e importación de subfinder, amass o nmap.
          Todo se guarda localmente en tu navegador.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          placeholder="Nombre del proyecto (ej: Auditoría ACME Q1)"
          className="field-input flex-1"
          aria-label="Nombre del proyecto nuevo"
        />
        <button type="button" className="btn btn-primary shrink-0" onClick={handleCreate}>
          Crear proyecto
        </button>
      </div>

      {workspace.projects.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Sin proyectos todavía. Creá uno para empezar a registrar objetivos y hallazgos.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {workspace.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              workspace={workspace}
              onOpenRecon={onOpenRecon}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
