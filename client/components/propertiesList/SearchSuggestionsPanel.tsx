"use client";

interface SearchSuggestionsPanelProps {
  id: string;
  suggestions: string[];
  activeIndex: number;
  isLoading: boolean;
  query: string;
  onSelect: (suggestion: string) => void;
  onHover: (index: number) => void;
}

const PANEL_BASE =
  "absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md";

export function SearchSuggestionsPanel({
  id,
  suggestions,
  activeIndex,
  isLoading,
  query,
  onSelect,
  onHover,
}: SearchSuggestionsPanelProps) {
  if (suggestions.length === 0) {
    return (
      <div
        id={id}
        role="status"
        aria-live="polite"
        className={`${PANEL_BASE} px-3 py-2.5 text-sm text-muted`}
      >
        {isLoading ? (
          "Searching…"
        ) : (
          <>
            No matches for{" "}
            <span className="font-medium text-foreground">“{query}”</span>
          </>
        )}
      </div>
    );
  }

  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Suggestions"
      aria-busy={isLoading}
      className={`${PANEL_BASE} max-h-72 overflow-y-auto p-1 transition-opacity ${
        isLoading ? "opacity-60" : "opacity-100"
      }`}
    >
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={`${suggestion}-${index}`}
            id={`${id}-${index}`}
            role="option"
            aria-selected={isActive}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(suggestion)}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
              isActive ? "bg-secondary" : ""
            }`}
          >
            {highlightMatch(suggestion, query)}
          </li>
        );
      })}
    </ul>
  );
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;

  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-foreground">
        {text.slice(index, index + q.length)}
      </span>
      {text.slice(index + q.length)}
    </>
  );
}
