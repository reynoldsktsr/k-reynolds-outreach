"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface DataTableColumn<T> {
  /** Unique key for this column, also used as the React key. */
  key: string;
  header: string;
  /** Value used for sorting and for the text filter. Keep this cheap/pure. */
  accessor: (row: T) => string | number;
  /** Optional custom cell renderer. Falls back to `String(accessor(row))`. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  /** Renders a bulk-action bar above the table whenever 1+ rows are selected. */
  renderBulkActions?: (selectedIds: string[], clearSelection: () => void) => ReactNode;
}

type SortDirection = "asc" | "desc";

/**
 * Generic, reusable data table: client-side text search, sortable columns,
 * and pagination. Knows nothing about "businesses" or any other domain
 * shape - feed it a `columns` config (accessor + optional render per
 * column) and any array of rows.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  pageSize = 10,
  renderBulkActions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rows;
    return rows.filter((row) =>
      columns.some((column) => String(column.accessor(row)).toLowerCase().includes(trimmed)),
    );
  }, [rows, columns, query]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredRows;

    const sorted = [...filteredRows].sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [filteredRows, columns, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return;
    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  const pageRowIds = pagedRows.map(getRowId);

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="card overflow-hidden">
      {renderBulkActions && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-accent-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-accent-500/10">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">{selected.size} selected</span>
          {renderBulkActions(Array.from(selected), clearSelection)}
        </div>
      )}
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search table"
          className="input max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
            <tr>
              {renderBulkActions && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={pageRowIds.length > 0 && pageRowIds.every((id) => selected.has(id))}
                    onChange={() => toggleAllOnPage(pageRowIds)}
                  />
                </th>
              )}
              {columns.map((column) => {
                const isActive = sortKey === column.key;
                return (
                  <th key={column.key} scope="col" className={`px-4 py-3 font-medium ${column.className ?? ""}`}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="inline-flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        {column.header}
                        <span className="text-neutral-400 dark:text-neutral-500">
                          {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderBulkActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-neutral-500 dark:text-neutral-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr key={id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    {renderBulkActions && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 text-neutral-700 dark:text-neutral-300 ${column.className ?? ""}`}>
                        {column.render ? column.render(row) : String(column.accessor(row))}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {"–"}
          {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
