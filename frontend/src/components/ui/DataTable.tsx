// A titled table with search, sortable columns and paging. Design kit: data-table.
// Search, sort and paging happen in the browser (fine for users, a few hundred rows).
// For server-paged data (the activity log), pass pageSize={0} and add a "Load more" below.

import { useMemo, useState, type ReactNode } from 'react'

export type Column<Row> = {
  key: string
  header: string
  render: (row: Row) => ReactNode
  sortValue?: (row: Row) => string | number // give this to make the column sortable
}

type Props<Row> = {
  title: string
  rows: Row[]
  columns: Column<Row>[]
  rowKey: (row: Row) => string | number
  searchText?: (row: Row) => string // give this to show a search box
  emptyText: string
  pageSize?: number // 0 = no paging
}

export function DataTable<Row>({
  title, rows, columns, rowKey, searchText, emptyText, pageSize = 20,
}: Props<Row>) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null)
  const [page, setPage] = useState(0)

  const visibleRows = useMemo(() => {
    let result = rows
    if (searchText && query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((row) => searchText(row).toLowerCase().includes(q))
    }
    const column = columns.find((c) => c.key === sort?.key)
    if (column?.sortValue && sort) {
      const value = column.sortValue
      result = [...result].sort((a, b) => {
        const order = value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0
        return sort.direction === 'ascending' ? order : -order
      })
    }
    return result
  }, [rows, query, sort, columns, searchText])

  const pageCount = pageSize ? Math.max(1, Math.ceil(visibleRows.length / pageSize)) : 1
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = pageSize
    ? visibleRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : visibleRows

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key === key && current.direction === 'ascending'
        ? { key, direction: 'descending' }
        : { key, direction: 'ascending' },
    )
  }

  const searchId = `${title.replace(/\s+/g, '-').toLowerCase()}-search`

  return (
    <div className="data-table">
      {searchText && (
        <div className="data-table__search">
          <label htmlFor={searchId} className="sr-only">Search {title}</label>
          <input
            id={searchId}
            type="search"
            className="field"
            placeholder="Search…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
          />
        </div>
      )}

      <div className="data-table__scroll">
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sort?.key === column.key ? sort.direction : undefined}
                >
                  {column.sortValue ? (
                    <button type="button" className="data-table__sort" onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <span aria-hidden="true">
                        {sort?.key === column.key ? (sort.direction === 'ascending' ? ' ▲' : ' ▼') : ' ↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty">{emptyText}</td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && pageCount > 1 && (
        <nav className="data-table__pages" aria-label={`${title} pages`}>
          <button type="button" className="btn btn--secondary btn--sm" disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
            ← Prev
          </button>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button type="button" className="btn btn--secondary btn--sm" disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)} aria-label="Next page">
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
