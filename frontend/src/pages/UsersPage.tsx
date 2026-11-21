// Users (Org Admins only, scope US-09): see everyone, add a user, change a role,
// deactivate or reactivate someone.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser, useUpdateUser, useUsers } from '../api/queries'
import { friendlyError } from '../api/errors'
import type { User } from '../api/types'
import { useCurrentUser } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Dialog } from '../components/ui/Dialog'
import { FormField, describedBy } from '../components/ui/FormField'

const ROLES = [
  { value: 'org_admin', label: 'Org Admin', help: 'Everything, including users and the activity log' },
  { value: 'investigator', label: 'Investigator', help: 'Ask questions and read investigations' },
  { value: 'viewer', label: 'Viewer', help: 'Read investigations only' },
] as const
const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role

const roleSchema = z.enum(['org_admin', 'investigator', 'viewer'])

// ---------- Add user ----------

const newUserSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(200),
  email: z.email('Enter a valid email address'),
  role: roleSchema,
  password: z.string().min(8, 'At least 8 characters').max(200),
})
type NewUserValues = z.infer<typeof newUserSchema>

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createUser = useCreateUser()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'investigator' },
  })

  function close() {
    reset()
    createUser.reset()
    onClose()
  }

  function onSubmit(values: NewUserValues) {
    createUser.mutate(values, { onSuccess: close })
  }

  return (
    <Dialog open={open} onClose={close} title="Add a user"
      description="They can log in straight away with this email and password.">
      <form id="add-user" onSubmit={handleSubmit(onSubmit)} noValidate className="stack">
        <FormField id="new-name" label="Name" error={errors.name?.message} required>
          <input id="new-name" className="field" required {...describedBy('new-name', errors.name?.message)} {...register('name')} />
        </FormField>
        <FormField id="new-email" label="Email" error={errors.email?.message} required>
          <input id="new-email" type="email" className="field" required autoComplete="off"
            {...describedBy('new-email', errors.email?.message)} {...register('email')} />
        </FormField>
        <FormField id="new-role" label="Role" error={errors.role?.message} required>
          <select id="new-role" className="field" required {...describedBy('new-role', errors.role?.message)} {...register('role')}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}: {r.help}</option>)}
          </select>
        </FormField>
        <FormField id="new-password" label="Temporary password" error={errors.password?.message}
          hint="At least 8 characters. Share it with them securely." required>
          <input id="new-password" type="password" className="field" required autoComplete="new-password"
            {...describedBy('new-password', errors.password?.message, 'hint')} {...register('password')} />
        </FormField>
      </form>
      <div className="dialog__footer">
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" form="add-user" busy={createUser.isPending} busyLabel="Adding…">Add user</Button>
      </div>
    </Dialog>
  )
}

// ---------- Edit user ----------

const editSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(200),
  role: roleSchema,
})
type EditValues = z.infer<typeof editSchema>

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const me = useCurrentUser()
  const updateUser = useUpdateUser()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const isMe = user.id === me.id
  const { register, handleSubmit, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, role: user.role },
  })

  function onSubmit(values: EditValues) {
    updateUser.mutate({ id: user.id, changes: values }, { onSuccess: onClose })
  }

  function setActive(isActive: boolean) {
    updateUser.mutate({ id: user.id, changes: { is_active: isActive } }, { onSuccess: onClose })
  }

  // Deactivating someone gets its own confirmation (design kit: destructive action dialog).
  if (confirmDeactivate) {
    return (
      <Dialog open onClose={() => setConfirmDeactivate(false)} title={`Deactivate ${user.name}?`}
        description="They will be logged out and can't log in until you reactivate them. Their investigations stay.">
        <div className="dialog__footer">
          <Button variant="secondary" onClick={() => setConfirmDeactivate(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setActive(false)} busy={updateUser.isPending} busyLabel="Deactivating…">
            Deactivate
          </Button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog open onClose={onClose} title={`Edit ${user.name}`} description={user.email}>
      <form id="edit-user" onSubmit={handleSubmit(onSubmit)} noValidate className="stack">
        <FormField id="edit-name" label="Name" error={errors.name?.message} required>
          <input id="edit-name" className="field" required {...describedBy('edit-name', errors.name?.message)} {...register('name')} />
        </FormField>
        <FormField id="edit-role" label="Role" error={errors.role?.message}
          hint={isMe ? "You can't remove your own admin role." : undefined} required>
          <select id="edit-role" className="field" disabled={isMe}
            {...describedBy('edit-role', errors.role?.message, isMe ? 'hint' : undefined)} {...register('role')}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}: {r.help}</option>)}
          </select>
        </FormField>
      </form>
      <div className="dialog__footer dialog__footer--split">
        {!isMe && (user.is_active ? (
          <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>Deactivate…</Button>
        ) : (
          <Button variant="ghost" onClick={() => setActive(true)} busy={updateUser.isPending}>Reactivate</Button>
        ))}
        <span className="spacer" />
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="edit-user" busy={updateUser.isPending} busyLabel="Saving…">Save</Button>
      </div>
    </Dialog>
  )
}

// ---------- The page ----------

export function UsersPage() {
  const users = useUsers()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => u.name, sortValue: (u) => u.name.toLowerCase() },
    { key: 'email', header: 'Email', render: (u) => u.email, sortValue: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => roleLabel(u.role), sortValue: (u) => u.role },
    {
      key: 'status', header: 'Status', sortValue: (u) => (u.is_active ? 0 : 1),
      render: (u) => (u.is_active ? 'Active' : <span className="muted">Deactivated</span>),
    },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <Button variant="secondary" size="sm" onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}>Edit</Button>
      ),
    },
  ]

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Users</h1>
          <p className="muted">Who can use the agent, and what they may do.</p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add user</Button>
      </header>

      {users.isPending && <p role="status" className="muted">Loading users…</p>}
      {users.isError && <p role="alert" className="form-error">{friendlyError(users.error)}</p>}
      {users.data && (
        <DataTable
          title="Users"
          rows={users.data}
          columns={columns}
          rowKey={(u) => u.id}
          searchText={(u) => `${u.name} ${u.email} ${roleLabel(u.role)}`}
          emptyText="No users match your search."
        />
      )}

      <AddUserDialog open={adding} onClose={() => setAdding(false)} />
      {editing && <EditUserDialog key={editing.id} user={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
