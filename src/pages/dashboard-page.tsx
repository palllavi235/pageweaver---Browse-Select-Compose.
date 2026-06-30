import { ArrowRight, Clock3, Cloud, Copy, FileCheck2, FilePlus2, FolderOpen, Pencil, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleAuthButton } from '@/components/auth-button'
import { DriveFileCard } from '@/components/drive-file-card'
import { DocumentPreview } from '@/components/pdf-card'
import { Badge, Button, Card, Dialog, Input, OverflowMenu, Progress } from '@/components/ui'
import { useAuthStore } from '@/store/use-auth-store'
import { useLibraryStore } from '@/store/use-library-store'
import { useWorkspaceStore, type PageWeaverWorkspace } from '@/store/use-workspace-store'

function pageCount(workspace: PageWeaverWorkspace) {
  return workspace.groups.reduce((total, group) => total + group.pages.length, 0)
}

function relativeDay(value: number) {
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
    Math.round((value - Date.now()) / 86_400_000),
    'day',
  )
}

export function DashboardPage() {
  const session = useAuthStore((state) => state.session)
  const userId = session?.user.id
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)
  const switchWorkspace = useWorkspaceStore((state) => state.switchWorkspace)
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace)
  const duplicateWorkspace = useWorkspaceStore((state) => state.duplicateWorkspace)
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace)
  const toggleWorkspaceFavorite = useWorkspaceStore((state) => state.toggleWorkspaceFavorite)
  const accounts = useLibraryStore((state) => state.accounts)
  const generated = useLibraryStore((state) => state.generated)
  const recordOpened = useLibraryStore((state) => state.recordOpened)
  const navigate = useNavigate()
  const [renameTarget, setRenameTarget] = useState<PageWeaverWorkspace | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PageWeaverWorkspace | null>(null)
  const recentWorkspaces = [...workspaces].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 4)
  const recentDriveFiles = useMemo(() => (userId ? accounts[userId]?.recent ?? [] : []), [accounts, userId])
  const generatedCount = useMemo(() => (userId ? generated.filter((record) => record.userId === userId).length : 0), [generated, userId])
  const today = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())
  const greeting = session?.user.name ? `Good morning, ${session.user.name}.` : 'Welcome to PageWeaver'

  const openWorkspace = (workspaceId: string) => {
    switchWorkspace(workspaceId)
    navigate('/app/composer')
  }

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
    <div className="page-shell py-7 sm:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-leather">{today}</p>
          <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{greeting}</h2>
          <p className="mt-2 text-sm text-muted">Pick up where you left off, or start weaving something new.</p>
        </div>
        <Button onClick={() => { createWorkspace(); navigate('/app/composer') }}><Plus className="size-4" /> New composition</Button>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="flex min-h-36 flex-col justify-between p-5 md:col-span-1">
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-[#eee3d2] text-leather"><Cloud className="size-5" /></span>
            <Badge tone={session ? 'success' : 'neutral'}>{session ? 'Connected' : 'Not connected'}</Badge>
          </div>
          <div>
            <p className="font-semibold">Google Drive</p>
            {session ? <p className="mt-1 truncate text-xs text-muted">{session.user.email}</p> : <div className="mt-3"><GoogleAuthButton compact /></div>}
          </div>
        </Card>
        <Link to="/app/drive" className="group">
          <Card className="flex h-full min-h-36 flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e1e8dc] text-success"><FolderOpen className="size-5" /></span>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-semibold">Browse PDFs</p>
                <p className="mt-1 text-xs text-muted">Explore your document library</p>
              </div>
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </div>
          </Card>
        </Link>
        <Card className="flex min-h-36 flex-col justify-between p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#eadfd8] p-2.5 text-danger"><FilePlus2 className="size-5" /></span>
          <div>
            <p className="font-semibold">Upload from device</p>
            <p className="mt-1 text-xs text-muted">Local files are coming soon</p>
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold">Recent workspaces</h3>
          </div>
          <Link to="/app/composer" className="text-sm font-semibold text-leather hover:underline">Open composer</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {recentWorkspaces.map((workspace) => (
            <Card
              className="group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
              key={workspace.id}
            >
              <div className="flex -space-x-5">
                {(['tan', 'sage', 'clay'] as const).map((tone, index) => (
                  <div key={tone} className="rounded-lg border-2 border-surface shadow-sm" style={{ zIndex: 3 - index }}>
                    <DocumentPreview compact page={index + 1} tone={tone} />
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold group-hover:text-leather">{workspace.name}</h3>
                <p className="mt-1 text-xs text-muted">{pageCount(workspace)} pages · Edited {relativeDay(workspace.updatedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button onClick={() => openWorkspace(workspace.id)} size="sm" variant="secondary">
                  Open
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
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold">Recently opened</h3>
            <p className="mt-1 text-xs text-muted">Only PDFs opened by the current Google account appear here.</p>
          </div>
          <Link to="/app/drive" className="text-sm font-semibold text-leather">Browse all <ArrowRight className="ml-1 inline size-4" /></Link>
        </div>
        {session && recentDriveFiles.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
            {recentDriveFiles.slice(0, 4).map((file) => (
              <DriveFileCard
                file={file}
                key={file.id}
                onOpen={() => userId && recordOpened(userId, file)}
              />
            ))}
          </div>
        ) : (
          <Card className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eee3d2] text-leather">
              <Clock3 className="size-5" />
            </span>
            <div>
              <h4 className="font-semibold">{session ? 'No PDFs opened yet' : 'Connect to see your recent PDFs'}</h4>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                {session
                  ? 'Open a PDF from your Drive library and it will appear here for this account only.'
                  : 'PageWeaver does not show document names from another account on the Overview page.'}
              </p>
            </div>
          </Card>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h3 className="font-display text-2xl font-semibold">Private activity</h3>
        </div>
        <Card className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e1e8dc] text-success"><ShieldCheck className="size-5" /></span>
            <div><p className="text-sm font-semibold">Account scoped</p><p className="text-xs text-muted">No cross-user recents</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#eee3d2] text-leather"><Clock3 className="size-5" /></span>
            <div><p className="text-sm font-semibold">{recentDriveFiles.length} recent PDFs</p><p className="text-xs text-muted">For this account</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f3e7cb] text-gold"><FileCheck2 className="size-5" /></span>
            <div><p className="text-sm font-semibold">{generatedCount} generated PDFs</p><p className="text-xs text-muted">For this account</p></div>
          </div>
        </Card>
      </section>

      <Card className="mt-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eee3d2] text-leather"><Cloud className="size-5" /></div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Workspace storage</span>
            <span className="text-muted">Metadata only · no PDF bytes stored</span>
          </div>
          <Progress className="mt-3" value={8} />
        </div>
        <Button variant="secondary">Manage storage</Button>
      </Card>

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
    </div>
  )
}
