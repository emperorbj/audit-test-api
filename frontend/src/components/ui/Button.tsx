// The one button used everywhere.
// variant: primary (main action), secondary (outline), ghost (quiet), danger (destructive).
// busy: shows busyLabel and disables the button, so a request can't be sent twice.

import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
  busy?: boolean
  busyLabel?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  busy = false,
  busyLabel,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  )
}
