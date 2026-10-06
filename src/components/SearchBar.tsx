import { useState, type FormEvent } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar dorks...' }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onChange(inputValue)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <label htmlFor="dork-search" className="sr-only">
        Buscar dorks
      </label>
      <div className="relative">
        <input
          id="dork-search"
          type="search"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            onChange(e.target.value)
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-11 text-base shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          aria-label="Buscar dorks"
        />
        <svg
          className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
      </div>
    </form>
  )
}
