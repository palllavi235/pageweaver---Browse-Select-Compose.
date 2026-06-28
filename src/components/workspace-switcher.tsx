import { useMemo, useState } from 'react'
import { Copy, FolderKanban, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { Badge, Button, Dialog, IconButton, Input, OverflowMenu, Tooltip } from '@/components/ui'
import { useWorkspaceStore, type PageWeaverWorkspace } from '@/store/use-workspace-store'
import { cn } from '@/utils/cn'

function workspacePageCount(workspace: PageWeaverWorkspace) {
  return workspace.groups.reduce((total, group) => total + group.pages.length, 0)
}

function formatEditedAt(value: number) {
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
    Math.round((value - Date.now()) / 86_400_000),
    'day',
  )
}

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    activeProjectId,
    activeWorkspaceId,
    projects,
    workspaces,
    workspaceSearch,
    setWorkspaceSearch,
    createWorkspace,
    switchWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    renameWorkspace,
    toggleWorkspaceFavorite,
  } = useWorkspaceStore()
  const [renameTarget, setRenameTarget] = useState<PageWeaverWorkspace | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PageWeaverWorkspace | null>(null)
  const activeProject = projects.find((project) => project.id === activeProjectId)
  const filteredWorkspaces = useMemo(() => {
    const query = workspaceSearch.trim().toLowerCase()
    return workspaces
      .filter((workspace) => workspace.projectId === activeProjectId)
      .filter((workspace) => !query || workspace.name.toLowerCase().includes(query))
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.lastOpenedAt - a.lastOpenedAt)
  }, [activeProjectId, workspaceSearch, workspaces])

  const openRename = (workspace: PageWeaverWorkspace) => {
    setRenameTarget(workspace)
    setRenameValue(workspace.name)
  }

  const saveRename = () => {
    if (!renameTarget) return
    renameWorkspace(renameTarget.id, renameValue)
    setRenameTarget(null)
  }

  return (
    <section className={cn('rounded-2xl border bg-surface/60 p-3', compact && 'border-none bg-transparent p-0')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            <FolderKanban className="size-3.5" /> {activeProject?.name ?? 'Project'}
          </p>
          <p className="mt-1 text-[11px] text-muted">{workspaces.length} workspace{workspaces.length === 1 ? '' : 's'}</p>
        </div>
        <Tooltip label="Create workspace">
          <IconButton aria-label="Create workspace" className="size-8" onClick={() => createWorkspace()}>
            <Plus className="size-4" />
          </IconButton>
        </Tooltip>
      </div>

      <label className="mb-3 flex h-9 items-center gap-2 rounded-xl border bg-surface px-2.5 text-muted">
        <Search className="size-3.5" />
        <input
          aria-label="Search workspaces"
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          onChange={(event) => setWorkspaceSearch(event.target.value)}
          placeholder="Search workspaces"
          value={workspaceSearch}
        />
      </label>

      <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {filteredWorkspaces.map((workspace) => {
          const active = workspace.id === activeWorkspaceId
          return (
            <div
              className={cn(
                'group rounded-xl border bg-surface p-2 transition hover:border-gold/50',
                active && 'border-gold bg-[#f7efe2] ring-2 ring-gold/15',
              )}
              key={workspace.id}
            >
              <div className="flex items-start gap-2">
                <button className="min-w-0 flex-1 text-left" onClick={() => switchWorkspace(workspace.id)} type="button">
                  <p className="truncate text-sm font-semibold">{workspace.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {workspacePageCount(workspace)} pages · Edited {formatEditedAt(workspace.updatedAt)}
                  </p>
                </button>
                {active && <Badge tone="gold">Open</Badge>}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                <Button disabled={active} onClick={() => switchWorkspace(workspace.id)} size="sm" variant="secondary">
                  {active ? 'Opened' : 'Open'}
                </Button>
                <OverflowMenu
                  label={`More actions for ${workspace.name}`}
                  items={[
                    {
                      label: workspace.isFavorite ? 'Unfavorite' : 'Favorite',
                      icon: <Star className="size-4" fill={workspace.isFavorite ? 'currentColor' : 'none'} />,
                      onSelect: () => toggleWorkspaceFavorite(workspace.id),
                    },
                    { label: 'Rename', icon: <Pencil className="size-4" />, onSelect: () => openRename(workspace) },
                    { label: 'Duplicate', icon: <Copy className="size-4" />, onSelect: () => duplicateWorkspace(workspace.id) },
                    { label: 'Delete', icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => setDeleteTarget(workspace) },
                  ]}
                />
              </div>
            </div>
          )
        })}
        {!filteredWorkspaces.length && (
          <p className="rounded-xl border border-dashed bg-paper/60 p-3 text-xs leading-5 text-muted">
            No workspaces match that search.
          </p>
        )}
      </div>

      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} title="Rename workspace">
        <Input label="Workspace name" maxLength={80} onChange={(event) => setRenameValue(event.target.value)} value={renameValue} />
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setRenameTarget(null)} variant="secondary">Cancel</Button>
          <Button onClick={saveRename}>Save name</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete workspace?">
        <p className="text-sm leading-6 text-muted">
          This removes the local workspace metadata for <span className="font-medium text-ink">{deleteTarget?.name}</span>.
          Source PDFs in Google Drive are never changed.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setDeleteTarget(null)} variant="secondary">Cancel</Button>
          <Button
            onClick={() => {
              if (deleteTarget) deleteWorkspace(deleteTarget.id)
              setDeleteTarget(null)
            }}
            variant="danger"
          >
            Delete workspace
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
