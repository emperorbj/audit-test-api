// Small pop-up messages ("User created.", "Can't reach the server...").
// Design kit pattern: global-toasts. They sit in a live region, so screen readers announce them.
//
// Anywhere in the app:   const toast = useToast();  toast.error('...')  /  toast.success('...')
// API errors are toasted automatically (see main.tsx), so most code never calls this.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Toast = { id: number; kind: 'success' | 'error'; text: string }
type ToastApi = { success: (text: string) => void; error: (text: string) => void }

const ToastContext = createContext<ToastApi | null>(null)

const SHOW_FOR_MS = 6000
let nextId = 1

// Lets code outside React (the React Query setup in main.tsx) show toasts too.
export const toastBridge: ToastApi = { success: () => {}, error: () => {} }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (kind: Toast['kind'], text: string) => {
      setToasts((all) => {
        if (all.some((t) => t.text === text)) return all // the same message is shown only once
        const id = nextId++
        setTimeout(() => remove(id), SHOW_FOR_MS)
        return [...all, { id, kind, text }]
      })
    },
    [remove],
  )

  const toastApi: ToastApi = useMemo(
    () => ({ success: (text) => show('success', text), error: (text) => show('error', text) }),
    [show],
  )
  useEffect(() => {
    toastBridge.success = toastApi.success
    toastBridge.error = toastApi.error
  }, [toastApi])

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="toaster" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span aria-hidden="true">{t.kind === 'success' ? '✓' : '!'}</span>
            <p>{t.text}</p>
            <button type="button" className="toast__close" onClick={() => remove(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
