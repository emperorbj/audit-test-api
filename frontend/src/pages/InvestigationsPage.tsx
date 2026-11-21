// Investigations: the list of saved investigations on the left, the open one on the right.

import { Link, NavLink, Outlet } from 'react-router'
import { useInvestigations } from '../api/queries'
import { canAsk, useCurrentUser } from '../auth/AuthContext'
import { formatUtc } from '../lib/format'

export function InvestigationsPage() {
  const user = useCurrentUser()
  const investigations = useInvestigations()

  return (
    <div className="split">
      <aside className="sidebar" aria-label="Investigations">
        {canAsk(user.role) && (
          <Link to="/investigations" className="btn btn--primary btn--md sidebar__new">+ New investigation</Link>
        )}
        <h2 className="sidebar__title">History</h2>

        {investigations.isPending && <p role="status" className="muted small">Loading…</p>}
        {investigations.data?.length === 0 && (
          <p className="muted small">No investigations yet.{canAsk(user.role) && ' Ask your first question.'}</p>
        )}
        <ul className="sidebar__list">
          {investigations.data?.map((investigation) => (
            <li key={investigation.id}>
              <NavLink to={`/investigations/${investigation.id}`} className="sidebar__item">
                <span className="sidebar__item-title">{investigation.title}</span>
                <span className="muted small">{formatUtc(investigation.created_at)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <section className="split__content">
        <Outlet />
      </section>
    </div>
  )
}
