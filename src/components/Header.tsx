import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenPalette?: () => void
}

export function Header({ onOpenPalette }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="logo-badge flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-inverse)] shadow-lg">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              Google<span className="gradient-text">Dork</span>
            </h1>
            <p className="hidden text-xs text-[var(--text-tertiary)] sm:block">
              Panel de dorks multi-motor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="btn btn-secondary"
              aria-label="Abrir paleta de comandos"
              title="Paleta de comandos (Ctrl K)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <kbd className="hidden rounded border border-[var(--border-strong)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)] sm:inline">
                Ctrl K
              </kbd>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
