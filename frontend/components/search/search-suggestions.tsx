type Props = {
  suggestions: string[]
  onSelect: (value: string) => void
}

export function SearchSuggestions({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <ul className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-border bg-background/95 shadow-lg z-10">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
  )
}
