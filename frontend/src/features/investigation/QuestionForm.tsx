// The composer: where the user types a question for the agent.
// A text box with a small toolbar row inside it (a hint on the left, the Ask button on the right).

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { describedBy, fieldErrorId, fieldHintId } from '../../components/ui/FormField'

const questionSchema = z.object({
  question: z.string().trim().min(3, 'Type a question').max(4000, 'Keep the question under 4000 characters'),
})
type QuestionValues = z.infer<typeof questionSchema>

type Props = {
  onAsk: (question: string) => void
  busy: boolean
  placeholder?: string
  size?: 'large' | 'normal' // large on the start page
}

const HINT = 'Each question is answered on its own: include the person, resource or time range.'

export function QuestionForm({ onAsk, busy, placeholder, size = 'normal' }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
  })

  function onSubmit(values: QuestionValues) {
    onAsk(values.question)
    reset()
  }

  const error = errors.question?.message

  return (
    <form className={`composer composer--${size}`} onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="question" className="sr-only">Your question for the agent</label>
      <textarea
        id="question"
        className="composer__input"
        rows={size === 'large' ? 3 : 1}
        placeholder={placeholder ?? 'Ask about your audit logs…'}
        disabled={busy}
        {...describedBy('question', error, HINT)}
        {...register('question')}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter makes a new line (like most chat apps).
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(onSubmit)()
          }
        }}
      />
      <div className="composer__bar">
        {error ? (
          <p id={fieldErrorId('question')} role="alert" className="composer__error">{error}</p>
        ) : (
          <p id={fieldHintId('question')} className="composer__hint">{HINT}</p>
        )}
        <span className="composer__keys" aria-hidden="true"><kbd>Enter</kbd> to ask</span>
        <Button type="submit" size="sm" busy={busy} busyLabel="Investigating…">Ask</Button>
      </div>
    </form>
  )
}
