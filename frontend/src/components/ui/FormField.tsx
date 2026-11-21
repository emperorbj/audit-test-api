// Label + control + hint + error, wired up for screen readers. Design kit: form-field.
//
// <FormField id="email" label="Email" error={errors.email?.message} required>
//   <input id="email" className="field" {...fieldProps('email', errors.email)} />
// </FormField>

import type { ReactNode } from 'react'

// Predictable error id, so the control can point at it with aria-describedby.
export const fieldErrorId = (id: string) => `${id}-error`
export const fieldHintId = (id: string) => `${id}-hint`

type Props = {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FormField({ id, label, error, hint, required, children }: Props) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
        {required && <span aria-hidden="true" className="form-field__required"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="form-field__error">{error}</p>
      ) : (
        hint && <p id={fieldHintId(id)} className="form-field__hint">{hint}</p>
      )}
    </div>
  )
}

// The accessibility attributes every control needs: invalid state + link to its message.
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? fieldErrorId(id) : hint ? fieldHintId(id) : undefined,
  }
}
