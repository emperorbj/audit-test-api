// The frame around every page after login: a floating "island" nav bar on top, the page below.
//
// Nav bar: logo on the left, page links in the middle (the current page sits on a raised pill),
// and the user menu on the right (name, role, theme, log out).

import { NavLink, Outlet } from 'react-router'
import { useAuth, useCurrentUser } from '../../auth/AuthContext'
import { Logo } from '../brand/Logo'
import { UserMenu } from './UserMenu'

export function AppLayout() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const isAdmin = user.role === 'org_admin'

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="island">
        <span className="island__brand"><Logo /></span>

        <nav aria-label="Main" className="island__nav">
          <NavLink to="/investigations" className="island__link">Investigations</NavLink>
          {isAdmin && <NavLink to="/users" className="island__link">Users</NavLink>}
          {isAdmin && <NavLink to="/activity" className="island__link">Activity log</NavLink>}
        </nav>

        <div className="island__end">
          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>
      <div id="main" className="app__main">
        <Outlet />
      </div>
    </div>
  )
}
