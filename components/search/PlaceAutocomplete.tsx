'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Input, Label } from '@/components/ui/Field'

export interface PlaceValue {
  name: string
  lat: number
  lng: number
}

interface GeocodeResult {
  label: string
  approximateName: string
  lat: number
  lng: number
}

export function PlaceAutocomplete({
  label,
  placeholder,
  name,
  defaultValue,
  onChange,
  required,
}: {
  label: string
  placeholder?: string
  name: string
  defaultValue?: PlaceValue | null
  onChange?: (value: PlaceValue | null) => void
  required?: boolean
}) {
  const [query, setQuery] = useState(defaultValue?.name ?? '')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PlaceValue | null>(defaultValue ?? null)
  const listId = useId()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (selected && query === selected.name) return
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function select(result: GeocodeResult) {
    const value: PlaceValue = { name: result.approximateName, lat: result.lat, lng: result.lng }
    setSelected(value)
    setQuery(value.name)
    setOpen(false)
    onChange?.(value)
  }

  return (
    <div className="relative">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={`${name}Name`}
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
          onChange?.(null)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      <input type="hidden" name={`${name}Lat`} value={selected?.lat ?? ''} />
      <input type="hidden" name={`${name}Lng`} value={selected?.lng ?? ''} />

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-ink-300/30 bg-surface shadow-card"
        >
          {results.map((r, i) => (
            <li key={i} role="option" aria-selected={selected?.name === r.approximateName}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(r)}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-neutral"
              >
                <span className="block font-medium text-brand-dark">{r.approximateName}</span>
                <span className="block text-xs text-ink-500">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
