"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PageItem = number | "ellipsis";

interface PropertiesPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageItems(page: number, totalPages: number): PageItem[] {
  const candidates = new Set(
    [1, totalPages, page - 1, page, page + 1].filter(
      (n) => n >= 1 && n <= totalPages,
    ),
  );
  const sorted = [...candidates].sort((a, b) => a - b);

  const items: PageItem[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) items.push("ellipsis");
    items.push(n);
    prev = n;
  }
  return items;
}

export function PropertiesPagination({
  page,
  totalPages,
  onPageChange,
}: PropertiesPaginationProps) {
  const items = getPageItems(page, totalPages);
  const btnBase =
    "min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <nav
      aria-label="Property pages"
      className="mt-8 flex items-center justify-center gap-1 flex-wrap"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${btnBase} inline-flex items-center gap-1 border border-border hover:bg-/30`}
      >
        <FiChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="px-2 text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${btnBase} ${
              item === page
                ? "bg-violet-600 text-white"
                : "border border-border hover:bg-muted"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`${btnBase} inline-flex items-center gap-1 border border-border hover:bg-muted`}
      >
        <span className="hidden sm:inline">Next</span>
        <FiChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
