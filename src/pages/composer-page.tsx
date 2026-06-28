import { FileOutput, Info, Layers3 } from 'lucide-react'
import { ComposerPanel } from '@/components/composer-panel'
import { Card, Badge } from '@/components/ui'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { WorkspaceTitle } from '@/components/workspace-title'
import { getWorkspaceSummary } from '@/features/composer/workspace-summary'
import { formatBytes } from '@/utils/format'
import { ComposedDocumentPreview } from '@/features/composer/composed-document-preview'

export function ComposerPage() {
  const groups = useWorkspaceStore((state) => state.groups)
  const isDirty = useWorkspaceStore((state) => state.isDirty)
  const updatedAt = useWorkspaceStore((state) => state.updatedAt)
  const summary = getWorkspaceSummary(groups)
  const pageCount = summary.pageCount
  return <div className="page-shell py-7 sm:py-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><Badge tone={isDirty ? 'gold' : 'success'}>{isDirty ? 'Changes not generated' : 'Up to date'}</Badge><span className="text-xs text-muted">Saved locally at {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}</span></div><WorkspaceTitle /><p className="mt-2 text-sm text-muted">Arrange selected pages and prepare your final document.</p></div></div>
    <div className="mt-7 grid min-h-[650px] gap-5 xl:grid-cols-[1fr_390px]"><ComposedDocumentPreview groups={groups} updatedAt={updatedAt} /><div className="h-[650px]"><ComposerPanel embedded /></div></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Card className="flex items-center gap-3 p-4"><span className="rounded-xl bg-[#eee3d2] p-2.5 text-leather"><Layers3 className="size-5" /></span><div><p className="text-xs text-muted">Selected pages</p><p className="font-semibold">{pageCount} pages</p></div></Card><Card className="flex items-center gap-3 p-4"><span className="rounded-xl bg-[#e1e8dc] p-2.5 text-success"><FileOutput className="size-5" /></span><div><p className="text-xs text-muted">Estimated document</p><p className="font-semibold">{summary.estimatedBytes ? formatBytes(summary.estimatedBytes) : `${summary.sourceCount} sources`}</p></div></Card><Card className="flex items-center gap-3 p-4"><Info className="size-5 text-gold" /><p className="text-xs leading-5 text-muted">Generation runs in the background and preserves each source page’s dimensions.</p></Card></div>
  </div>
}
