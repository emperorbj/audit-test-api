// The base modal. Design kit: dialog-shell (centre placement), with the reduced-motion
// variant the kit is missing (see ui.css).
//
// Built on the browser's own <dialog> element, which gives us for free:
//   - focus moves into the dialog, and the page behind can't be clicked or tabbed to
//   - Escape closes it
//   - focus returns to the button that opened it

import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Dialog({ open, onClose, title, description, children, footer, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Open/close the real <dialog> when `open` changes.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'dialog--wide' : ''}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose} // Escape key
      onClick={(e) => {
        if (e.target === ref.current) onClose() // a click on the dark backdrop
      }}
    >
      {open && (
        <div className="dialog__panel">
          <header className="dialog__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">×</button>
          </header>
          {description && <p id={descriptionId} className="dialog__description">{description}</p>}
          <div className="dialog__body">{children}</div>
          {footer && <footer className="dialog__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
