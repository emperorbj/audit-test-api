// Turn any failed request into a short, plain message that is safe to show the user.
//
// This is the "guard" the design kit asks for (global-toasts gap): raw technical text,
// stack traces or LLM output never reach the screen. Only our own backend's short
// messages for 400/409 (e.g. "Email already in use") are passed through.

import axios from 'axios'

export function friendlyError(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Something went wrong. Please try again.'
  if (!error.response) return "Can't reach the server. Check your connection and try again."

  const status = error.response.status
  const detail = error.response.data?.detail

  switch (status) {
    case 400:
    case 409:
      return typeof detail === 'string' && detail.length < 160
        ? detail
        : 'The request was not accepted. Please check and try again.'
    case 401:
      return 'Your session has ended. Please log in again.'
    case 403:
      return "You don't have permission to do that."
    case 404:
      return "That item wasn't found. It may have been removed."
    case 422:
      return 'Some of the information is not valid. Please check the form.'
    case 504:
      return 'The agent took too long. Try a narrower question (a shorter time range or one person).'
    case 502:
      return 'The agent could not answer this time. Please try again.'
    default:
      return 'Something went wrong on our side. Please try again.'
  }
}
