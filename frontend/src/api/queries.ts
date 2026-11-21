// Every backend call the app makes, as React Query hooks.
//
// useQuery    = READ data (cached, refetched when needed)
// useMutation = CHANGE something (create, update, ask a question)
//
// Query keys (the arrays like ['investigations']) name each piece of cached data.
// After a change we "invalidate" the matching key, so React Query fetches it again.

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  ActivityPage,
  AuditEvent,
  Investigation,
  InvestigationDetail,
  LoginResponse,
  Message,
  Role,
  User,
} from './types'

// ---------- Auth ----------

export function useLogin() {
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      (await api.post<LoginResponse>('/auth/login', body)).data,
    meta: { skipToast: true }, // the login form shows its own error
  })
}

// ---------- Investigations ----------

export function useInvestigations() {
  return useQuery({
    queryKey: ['investigations'],
    queryFn: async () => (await api.get<Investigation[]>('/investigations')).data,
  })
}

export function useInvestigation(id: string) {
  return useQuery({
    queryKey: ['investigations', id],
    queryFn: async () => (await api.get<InvestigationDetail>(`/investigations/${id}`)).data,
  })
}

async function askQuestion(investigationId: string, question: string) {
  return (await api.post<Message[]>(`/investigations/${investigationId}/messages`, { question }))
    .data
}

// Ask a question in an existing investigation. Waits for the agent (can take minutes).
export function useAskQuestion(investigationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (question: string) => askQuestion(investigationId, question),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investigations', investigationId] }),
  })
}

// Start a new investigation from its first question: create it, then ask.
// If asking fails, the error carries the new investigation's id so we can still open it.
export class AskFailedError extends Error {
  investigationId: string
  reason: unknown // the original error from the ask request

  constructor(investigationId: string, reason: unknown) {
    super('Asking the agent failed')
    this.investigationId = investigationId
    this.reason = reason
  }
}

export function useStartInvestigation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (question: string) => {
      const title = question.length > 80 ? `${question.slice(0, 77)}...` : question
      const investigation = (await api.post<Investigation>('/investigations', { title })).data
      try {
        await askQuestion(investigation.id, question)
      } catch (error) {
        throw new AskFailedError(investigation.id, error)
      }
      return investigation
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['investigations'] }),
    meta: { skipToast: true }, // the page handles its errors (see NewInvestigationPage)
  })
}

// ---------- Audit events (citations) ----------

export function auditEventQuery(eventId: string) {
  return {
    queryKey: ['audit-event', eventId],
    queryFn: async () => (await api.get<AuditEvent>(`/audit-logs/${eventId}`)).data,
    staleTime: Infinity, // an audit event never changes
  }
}

export function useAuditEvent(eventId: string | null) {
  return useQuery({ ...auditEventQuery(eventId ?? ''), enabled: eventId !== null })
}

// ---------- Users (Org Admins only) ----------

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
    enabled,
  })
}

export type NewUser = { email: string; name: string; role: Role; password: string }

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewUser) => (await api.post<User>('/users', body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    meta: { successMessage: 'User created.' },
  })
}

export type UserChanges = { name?: string; role?: Role; is_active?: boolean }

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: UserChanges }) =>
      (await api.patch<User>(`/users/${id}`, changes)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    meta: { successMessage: 'User updated.' },
  })
}

// ---------- Agent activity log (Org Admins only) ----------

// Cursor paging: each page gives next_cursor; "Load more" asks for the page after it.
export function useActivityLog(kind: string) {
  return useInfiniteQuery({
    queryKey: ['activity-log', kind],
    queryFn: async ({ pageParam }) =>
      (
        await api.get<ActivityPage>('/activity-log', {
          params: { limit: 50, cursor: pageParam ?? undefined, kind: kind || undefined },
        })
      ).data,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  })
}
