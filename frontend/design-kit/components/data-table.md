---
id: data-table
name: Data Table (search, sort, paginate)
type: component
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/shared/data-table.tsx:10-187
    note: column defs with render/sort, searchText(row), pageSize, minWidth, emptyText, aria-sort
  - type: source_code
    path: components/ui/pagination.tsx:37-63
    note: labelled pagination with ellipsis
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [table, data, search, pagination]
related: []
framework: react
variants: []
states: [empty, sorted-asc, sorted-desc, paged]
accessibility: Table labelled by its title (aria-labelledby); sortable headers expose aria-sort; pagination controls labelled.
---

# Data Table

## Purpose
A titled table with built-in search, sortable columns, pagination and an empty state.

## Anatomy and variants
- **Columns:** `render`, optional `sort`, and header and cell classes.
- **Options:** `pageSize`, and `minWidth` for horizontal scrolling.
- **Parts:** a SearchInput, with an optional Cmd/Ctrl+F shortcut, and Pagination.

## States and behavior
- **States:** empty (shows `emptyText`), sorted ascending or descending, and paged.
- **Behaviour:** filtering, sorting and paging all happen in the browser.

## Accessibility
- The title labels the table.
- Sortable headers expose `aria-sort`.
- Pagination controls are labelled.

## Usage guidance
**Use when:** small to medium datasets held in memory.
**Avoid when:** server-paged data. That isn't supported yet.

## Differences across source projects
Single source project so far.

## Review notes
- **Required before approval:** the extraction classes this as an *improvement to a common pattern*. Server-side paging and sorting should be added before it becomes a standard.
- **Merged in:** the project pattern `table-search-sort-page`.
