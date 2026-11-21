// The login page. Form = react-hook-form + zod (design kit: rhf-zod-forms + form-field).

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import axios from 'axios'
import { useLogin } from '../api/queries'
import { friendlyError } from '../api/errors'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { FormField, describedBy } from '../components/ui/FormField'
import { HeroArt } from '../components/brand/HeroArt'
import { Logo } from '../components/brand/Logo'

// The rules for the form. The TypeScript type comes from the same schema.
const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginRequest = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Only go back to pages inside our app (never to another website).
  const next = searchParams.get('next')
  const goTo = next && next.startsWith('/') && !next.startsWith('//') ? next : '/investigations'

  if (user) return <Navigate to={goTo} replace />

  function onSubmit(values: LoginForm) {
    loginRequest.mutate(values, {
      onSuccess: (response) => {
        login(response)
        navigate(goTo, { replace: true })
      },
    })
  }

  // A wrong password is a 401: say it plainly. Anything else: the safe general message.
  const failed = loginRequest.error
  const failMessage = failed
    ? axios.isAxiosError(failed) && failed.response?.status === 401
      ? 'Incorrect email or password.'
      : friendlyError(failed)
    : null

  return (
    <main className="login">
      {/* Left: the brand side with the vector illustration (hidden on small screens) */}
      <section className="login__brand" aria-label="About Audit Agent">
        <Logo />
        <div className="login__art"><HeroArt /></div>
        <div className="login__pitch">
          <h2>Ask who did what. Get answers you can verify.</h2>
          <ul className="login__points">
            <li><span aria-hidden="true">✓</span> Every fact links to the original audit event</li>
            <li><span aria-hidden="true">✓</span> See each step the agent took, and repeat it</li>
            <li><span aria-hidden="true">✓</span> Export a report for your compliance review</li>
          </ul>
        </div>
      </section>

      {/* Right: the form */}
      <section className="login__form-side">
        <div className="login__card">
          <div className="login__mobile-logo"><Logo /></div>
          <h1>Welcome back</h1>
          <p className="muted">Log in to continue your investigations.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack">
            <FormField id="email" label="Email" error={errors.email?.message} required>
              <input
                id="email" type="email" autoComplete="username" className="field" required
                {...describedBy('email', errors.email?.message)}
                {...register('email')}
              />
            </FormField>

            <FormField id="password" label="Password" error={errors.password?.message} required>
              <input
                id="password" type="password" autoComplete="current-password" className="field" required
                {...describedBy('password', errors.password?.message)}
                {...register('password')}
              />
            </FormField>

            {failMessage && <p role="alert" className="form-error">{failMessage}</p>}

            <Button type="submit" busy={loginRequest.isPending} busyLabel="Logging in…">Log in</Button>
          </form>
          <p className="login__note muted small">Read-only access. The agent can only see what your role allows.</p>
        </div>
      </section>
    </main>
  )
}
