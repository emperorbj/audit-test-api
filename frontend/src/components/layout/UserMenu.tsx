// The avatar button in the top bar and its small menu: who you are, theme, log out.
// Keyboard: Enter/Space opens it, Escape closes it and returns focus to the button.
// A click anywhere outside also closes it.

import { useEffect, useRef, useState } from 'react'
import type { User } from '../../api/types'

const ROLE_NAMES = { org_admin: 'Org Admin', investigator: 'Investigator', viewer: 'Viewer' }

// "Ada Mensah" -> "AM"
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

type Props = { user: User; onLogout: () => void }

export function UserMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.className === 'dark')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on a click outside, or on Escape.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggleTheme() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.className = next
    setDark(!dark)
  }

  return (
    <div className="user-menu" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        onClick={() => setOpen(!open)}
      >
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="user-menu__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="user-menu__panel">
          <div className="user-menu__who">
            <span className="avatar avatar--lg" aria-hidden="true">{initials(user.name)}</span>
            <div>
              <p className="user-menu__name">{user.name}</p>
              <p className="user-menu__email">{user.email}</p>
            </div>
          </div>
          <p className="user-menu__role">{ROLE_NAMES[user.role]}</p>
          <div className="user-menu__divider" />
          <button type="button" className="user-menu__item" onClick={toggleTheme}>
            <span>Dark theme</span>
            <span className={`switch ${dark ? 'switch--on' : ''}`} aria-hidden="true"><span /></span>
            <span className="sr-only">{dark ? 'on' : 'off'}</span>
          </button>
          <button type="button" className="user-menu__item" onClick={onLogout}>Log out</button>
        </div>
      )}
    </div>
  )
}
