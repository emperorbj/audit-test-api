// The box where the user types a question for the agent.

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { describedBy, fieldErrorId } from '../../components/ui/FormField'

const questionSchema = z.object({
  question: z.string().trim().min(3, 'Type a question').max(4000, 'Keep the question under 4000 characters'),
})
type QuestionValues = z.infer<typeof questionSchema>

type Props = {
  onAsk: (question: string) => void
  busy: boolean
  placeholder?: string
}

const HINT = 'Each question is answered on its own, so include the person, resource or time range.'

export function QuestionForm({ onAsk, busy, placeholder }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
  })

  function onSubmit(values: QuestionValues) {
    onAsk(values.question)
    reset()
  }

  const error = errors.question?.message

  return (
    <form className="question-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="question" className="sr-only">Your question for the agent</label>
      <textarea
        id="question"
        className="field question-form__input"
        rows={2}
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
      <Button type="submit" busy={busy} busyLabel="Investigating…">Ask</Button>
      {error ? (
        <p id={fieldErrorId('question')} role="alert" className="form-field__error question-form__note">{error}</p>
      ) : (
        <p id="question-hint" className="form-field__hint question-form__note">{HINT}</p>
      )}
    </form>
  )
}
