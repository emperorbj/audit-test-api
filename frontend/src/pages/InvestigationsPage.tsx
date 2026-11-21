// Investigations: the history list on the left, the open investigation on the right.

import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { useInvestigations } from '../api/queries'
import type { Investigation } from '../api/types'
import { canAsk, useCurrentUser } from '../auth/AuthContext'
import { formatRelative, formatUtc, isToday } from '../lib/format'

function HistoryGroup({ title, items }: { title: string; items: Investigation[] }) {
  if (items.length === 0) return null
  return (
    <div className="history__group">
      <h3 className="history__label">{title}</h3>
      <ul className="history__list">
        {items.map((investigation) => (
          <li key={investigation.id}>
            <NavLink to={`/investigations/${investigation.id}`} className="history__item"
              title={`${investigation.title} · ${formatUtc(investigation.created_at)}`}>
              <span className="history__title">{investigation.title}</span>
              <span className="history__time">{formatRelative(investigation.created_at)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InvestigationsPage() {
  const user = useCurrentUser()
  const investigations = useInvestigations()
  const [search, setSearch] = useState('')

  const all = investigations.data ?? []
  const shown = search.trim()
    ? all.filter((i) => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : all

  return (
    <div className="split">
      <aside className="sidebar" aria-label="Investigations">
        <div className="sidebar__head">
          <h2 className="sidebar__heading">Investigations</h2>
          {canAsk(user.role) && (
            <Link to="/investigations" className="btn btn--secondary btn--sm" aria-label="New investigation">
              <span aria-hidden="true">+</span> New
            </Link>
          )}
        </div>

        <label htmlFor="history-search" className="sr-only">Search investigations</label>
        <input id="history-search" type="search" className="field field--sm sidebar__search"
          placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />

        <nav className="history" aria-label="Investigation history">
          {investigations.isPending && <p role="status" className="history__empty">Loading…</p>}
          {investigations.data && all.length === 0 && (
            <p className="history__empty">No investigations yet.</p>
          )}
          {investigations.data && all.length > 0 && shown.length === 0 && (
            <p className="history__empty">Nothing matches “{search}”.</p>
          )}
          <HistoryGroup title="Today" items={shown.filter((i) => isToday(i.created_at))} />
          <HistoryGroup title="Earlier" items={shown.filter((i) => !isToday(i.created_at))} />
        </nav>
      </aside>

      <section className="split__content">
        <Outlet />
      </section>
    </div>
  )
}
