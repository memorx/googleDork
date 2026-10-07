import { useEffect, useState, type RefObject } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputRef?: RefObject<HTMLInputElement | null>
}

export function SearchBar({ value, onChange, placeholder = 'Buscar por operador, descripción o ejemplo...', inputRef }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className="relative w-full" role="search">
      <label htmlFor="dork-search" className="sr-only">
        Buscar dorks
      </label>
      <svg
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        id="dork-search"
        ref={inputRef}
        type="search"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        className="search-input"
        aria-label="Buscar dorks"
        aria-keyshortcuts="/"
        title="Atajo: / para enfocar, Escape para limpiar"
      />
      {!inputValue && (
        <kbd className="kbd" aria-hidden="true">
          /
        </kbd>
      )}
      {inputValue && (
        <button
          type="button"
          onClick={() => {
            setInputValue('')
            onChange('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Limpiar búsqueda"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
