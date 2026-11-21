// The frame around every page after login: top bar with navigation, user and log out.

import { NavLink, Outlet } from 'react-router'
import { useAuth, useCurrentUser } from '../../auth/AuthContext'
import { Button } from '../ui/Button'
import { Logo } from '../brand/Logo'

const ROLE_NAMES = { org_admin: 'Org Admin', investigator: 'Investigator', viewer: 'Viewer' }

// "Ada Mensah" -> "AM"
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

function toggleTheme() {
  const html = document.documentElement
  html.className = html.className === 'dark' ? 'light' : 'dark'
}

export function AppLayout() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const isAdmin = user.role === 'org_admin'

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="topbar">
        <span className="topbar__brand"><Logo /></span>
        <nav aria-label="Main" className="topbar__nav">
          <NavLink to="/investigations">Investigations</NavLink>
          {isAdmin && <NavLink to="/users">Users</NavLink>}
          {isAdmin && <NavLink to="/activity">Activity log</NavLink>}
        </nav>
        <div className="topbar__user">
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <span className="topbar__who">
            <span>{user.name}</span>
            <span className="muted small">{ROLE_NAMES[user.role]}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Switch light or dark theme">
            ◐
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>Log out</Button>
        </div>
      </header>
      <div id="main" className="app__main">
        <Outlet />
      </div>
    </div>
  )
}
