import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { IconButton } from './ui'

export function WorkspaceTitle({ compact = false }: { compact?: boolean }) {
  const title = useWorkspaceStore((state) => state.title)
  const setTitle = useWorkspaceStore((state) => state.setTitle)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)

  const save = () => {
    setTitle(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <form className="flex min-w-0 items-center gap-1" onSubmit={(event) => { event.preventDefault(); save() }}>
        <input
          aria-label="Workspace name"
          autoFocus
          className="min-w-0 flex-1 rounded-lg border bg-surface px-2 py-1 font-display text-lg font-semibold outline-none focus:ring-2 focus:ring-gold/30"
          maxLength={80}
          onBlur={save}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
        <IconButton aria-label="Save workspace name" className="size-8" type="submit"><Check className="size-4" /></IconButton>
      </form>
    )
  }

  return (
    <button
      className="group flex min-w-0 items-center gap-2 text-left"
      onClick={() => { setValue(title); setEditing(true) }}
      type="button"
    >
      <span className={`truncate font-display font-semibold ${compact ? 'text-lg' : 'text-3xl sm:text-4xl'}`}>{title}</span>
      <Pencil className="size-3.5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  )
}
