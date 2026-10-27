"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsUpDown,
  LuColumns3,
  LuRefreshCw,
  LuSearch,
} from "react-icons/lu";

export type SortDirection = "asc" | "desc";

export type TableSort = {
  id: string;
  direction: SortDirection;
};

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  accessor?: (row: T) => unknown;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  hideable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  width?: string;
  /** Used by client-side search. */
  searchable?: boolean;
};

export type DataTableAction<T> = {
  label: string;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  destructive?: boolean;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;

  // Search and toolbar
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  toolbar?: ReactNode;
  filters?: ReactNode;

  // Row actions and selection
  actions?: DataTableAction<T>[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  renderBulkActions?: (selectedRows: T[]) => ReactNode;

  // Sorting
  sorting?: TableSort | null;
  onSortingChange?: (sorting: TableSort | null) => void;
  manualSorting?: boolean;

  // Pagination (pageIndex is zero-based)
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  totalRows?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  manualPagination?: boolean;
  pageSizeOptions?: number[];

  // States
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;

  // Appearance
  density?: "compact" | "comfortable";
  onDensityChange?: (density: "compact" | "comfortable") => void;
  initialHiddenColumns?: string[];
  className?: string;
};

function getValue<T>(row: T, column: DataTableColumn<T>): unknown {
  return column.accessor ? column.accessor(row) : undefined;
}

function compareValues(a: unknown, b: unknown) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  toolbar,
  filters,
  actions = [],
  selectable = false,
  selectedRows,
  onSelectionChange,
  renderBulkActions,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  pageCount: controlledPageCount,
  totalRows,
  onPageChange,
  onPageSizeChange,
  manualPagination = false,
  pageSizeOptions = [10, 20, 50],
  loading = false,
  error,
  onRetry,
  emptyTitle = "No results found",
  emptyDescription = "There is no data to display yet.",
  density: controlledDensity,
  onDensityChange,
  initialHiddenColumns = [],
  className = "",
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalSorting, setInternalSorting] = useState<TableSort | null>(
    null,
  );
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(10);
  const [internalSelectedRows, setInternalSelectedRows] = useState<string[]>(
    [],
  );
  const [internalDensity, setInternalDensity] = useState<
    "compact" | "comfortable"
  >("comfortable");
  const [hiddenColumns, setHiddenColumns] =
    useState<string[]>(initialHiddenColumns);

  const search = searchValue ?? internalSearch;
  const sorting =
    controlledSorting === undefined ? internalSorting : controlledSorting;
  const pageIndex = controlledPageIndex ?? internalPageIndex;
  const pageSize = controlledPageSize ?? internalPageSize;
  const density = controlledDensity ?? internalDensity;
  const selected = selectedRows ?? internalSelectedRows;

  const setSearch = (value: string) => {
    if (searchValue === undefined) setInternalSearch(value);
    onSearchChange?.(value);
    if (controlledPageIndex === undefined) setInternalPageIndex(0);
    else onPageChange?.(0);
  };

  const setPage = (value: number) => {
    if (controlledPageIndex === undefined) {
      setInternalPageIndex(value);
    }
    onPageChange?.(value);
  };

  const setPageSize = (value: number) => {
    if (controlledPageSize === undefined) {
      setInternalPageSize(value);
    }
    if (controlledPageIndex === undefined) setInternalPageIndex(0);
    onPageSizeChange?.(value);
    onPageChange?.(0);
  };

  const setSelected = (ids: string[]) => {
    if (selectedRows === undefined) setInternalSelectedRows(ids);
    onSelectionChange?.(ids);
  };

  const setDensity = (value: "compact" | "comfortable") => {
    if (controlledDensity === undefined) setInternalDensity(value);
    onDensityChange?.(value);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    if (!manualSorting && sorting) {
      const column = columns.find((item) => item.id === sorting.id);

      if (column?.accessor) {
        result.sort((a, b) => {
          const comparison = compareValues(
            getValue(a, column),
            getValue(b, column),
          );

          return sorting.direction === "asc" ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, columns, sorting, manualSorting]);

  const filteredData = useMemo(() => {
    if (!search.trim() || onSearchChange) return processedData;

    const query = search.trim().toLowerCase();

    return processedData.filter((row) =>
      columns.some((column) => {
        if (!column.searchable || !column.accessor) return false;

        const value = getValue(row, column);
        return value != null && String(value).toLowerCase().includes(query);
      }),
    );
  }, [processedData, search, columns, onSearchChange]);

  const total = totalRows ?? filteredData.length;
  const calculatedPageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = controlledPageCount ?? calculatedPageCount;

  const visibleData = manualPagination
    ? filteredData
    : filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.includes(column.id),
  );

  const allPageSelected =
    visibleData.length > 0 &&
    visibleData.every((row) => selected.includes(getRowId(row)));

  const toggleAll = () => {
    const pageIds = visibleData.map(getRowId);
    setSelected(
      allPageSelected
        ? selected.filter((id) => !pageIds.includes(id))
        : [...new Set([...selected, ...pageIds])],
    );
  };

  const toggleRow = (id: string) => {
    setSelected(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  };

  const changeSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;

    const next: TableSort | null =
      sorting?.id !== column.id
        ? { id: column.id, direction: "asc" }
        : sorting.direction === "asc"
          ? { id: column.id, direction: "desc" }
          : null;

    if (controlledSorting === undefined) setInternalSorting(next);
    onSortingChange?.(next);
  };

  const selectedData = data.filter((row) => selected.includes(getRowId(row)));

  const cellPadding = density === "compact" ? "px-3 py-2" : "px-4 py-3";

  return (
    <section className={`min-w-0 space-y-3 ${className}`}>
      {(searchable || filters || toolbar || selected.length > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {searchable && (
              <label className="relative block min-w-0 sm:max-w-xs sm:flex-1">
                <LuSearch
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-ring"
                />
              </label>
            )}
            {filters}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selected.length > 0 && renderBulkActions?.(selectedData)}
            {toolbar}

            <details className="group relative">
              <summary
                className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-secondary"
                aria-label="Table settings"
              >
                <LuColumns3 className="size-4" />
                <span className="hidden sm:inline">View</span>
                <LuChevronDown className="size-3.5 text-muted" />
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-muted">
                  TOGGLE COLUMNS
                </p>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {columns
                    .filter((column) => column.hideable !== false)
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.includes(column.id)}
                          onChange={(event) =>
                            setHiddenColumns((current) =>
                              event.target.checked
                                ? current.filter((id) => id !== column.id)
                                : [...current, column.id],
                            )
                          }
                          className="accent-primary"
                        />
                        {column.header}
                      </label>
                    ))}
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    ROW DENSITY
                  </label>
                  <select
                    value={density}
                    onChange={(event) =>
                      setDensity(event.target.value as typeof density)
                    }
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-foreground">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-secondary"
            >
              <LuRefreshCw className="size-4" />
              Retry
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="bg-secondary/60">
              <tr className="border-b border-border">
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      checked={allPageSelected}
                      onChange={toggleAll}
                      className="accent-primary"
                    />
                  </th>
                )}

                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    style={{ width: column.width }}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${column.headerClassName ?? ""} ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => changeSort(column)}
                        className="inline-flex items-center gap-2 hover:text-foreground"
                      >
                        {column.header}
                        {sorting?.id === column.id ? (
                          <span aria-label={sorting.direction}>
                            {sorting.direction === "asc" ? "↑" : "↓"}
                          </span>
                        ) : (
                          <LuChevronsUpDown className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}

                {actions.length > 0 && (
                  <th className="w-12 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 6) }).map((_, row) => (
                  <tr key={`skeleton-${row}`}>
                    {selectable && (
                      <td className="px-4 py-4">
                        <div className="h-4 w-4 animate-pulse rounded bg-skeleton" />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td key={column.id} className={cellPadding}>
                        <div className="h-4 max-w-40 animate-pulse rounded bg-skeleton" />
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className={cellPadding}>
                        <div className="ml-auto h-4 w-8 animate-pulse rounded bg-skeleton" />
                      </td>
                    )}
                  </tr>
                ))
              ) : visibleData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length +
                      (selectable ? 1 : 0) +
                      (actions.length > 0 ? 1 : 0)
                    }
                    className="px-6 py-14 text-center"
                  >
                    <p className="font-medium text-foreground">{emptyTitle}</p>
                    <p className="mt-1 text-sm text-muted">
                      {emptyDescription}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleData.map((row) => {
                  const id = getRowId(row);

                  return (
                    <tr
                      key={id}
                      className="transition-colors hover:bg-secondary/40"
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={selected.includes(id)}
                            onChange={() => toggleRow(id)}
                            className="accent-primary"
                          />
                        </td>
                      )}

                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={`${cellPadding} text-foreground ${column.className ?? ""} ${
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : ""
                          }`}
                        >
                          {column.cell
                            ? column.cell(row)
                            : String(getValue(row, column) ?? "—")}
                        </td>
                      ))}

                      {actions.length > 0 && (
                        <td className="px-4 py-2 text-right">
                          <details className="group relative inline-block text-left">
                            <summary
                              aria-label="Row actions"
                              className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-secondary hover:text-foreground"
                            >
                              <LuChevronDown className="size-4" />
                            </summary>

                            <div className="absolute right-0 z-10 mt-1 min-w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                              {actions.map((action) => (
                                <button
                                  key={action.label}
                                  type="button"
                                  disabled={action.disabled?.(row)}
                                  onClick={(event) => {
                                    action.onClick(row);
                                    const details =
                                      event.currentTarget.closest("details");
                                    details?.removeAttribute("open");
                                  }}
                                  className={`block w-full rounded-md px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                                    action.destructive
                                      ? "text-destructive hover:bg-destructive/10"
                                      : "text-foreground hover:bg-secondary"
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </details>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {selected.length > 0 && selectable
              ? `${selected.length} selected · `
              : ""}
            {total === 0
              ? "No results"
              : `${pageIndex * pageSize + 1}–${Math.min(
                  (pageIndex + 1) * pageSize,
                  total,
                )} of ${total}`}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              Rows
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <span className="text-xs text-muted">
              Page {pageIndex + 1} of {pages}
            </span>

            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={pageIndex <= 0 || loading}
                onClick={() => setPage(Math.max(0, pageIndex - 1))}
                className="flex size-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LuChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={pageIndex >= pages - 1 || loading}
                onClick={() => setPage(Math.min(pages - 1, pageIndex + 1))}
                className="flex size-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LuChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
