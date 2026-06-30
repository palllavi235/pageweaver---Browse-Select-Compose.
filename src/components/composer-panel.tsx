import { useEffect, useState, type CSSProperties, type DragEvent as ReactDragEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Download,
  CloudUpload,
  Files,
  GripVertical,
  Pencil,
  Rows3,
  PanelTop,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { PAGEWEAVER_PAGE_DRAG_MIME, type PageDragPayload, type WorkspacePageGroup } from '@/features/composer/types'
import { generateWorkspacePdf } from '@/features/composer/generation-service'
import { clearPdfCache } from '@/features/pdf/pdf-cache-service'
import { formatPageRange, parsePageRange } from '@/features/pdf/page-range'
import { useGenerationStore } from '@/store/use-generation-store'
import { useAuthStore } from '@/store/use-auth-store'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { createDatedPdfFilename, downloadBlobUrl } from '@/utils/download'
import { formatBytes, formatGenerationTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { getWorkspaceSummary } from '@/features/composer/workspace-summary'
import { DocumentPreview } from './pdf-card'
import { WorkspaceTitle } from './workspace-title'
import { useLibraryStore } from '@/store/use-library-store'
import { SaveToDriveDialog } from './save-to-drive-dialog'
import {
  Button,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  Progress,
  Tooltip,
  useToast,
} from './ui'

function SortableGroup({
  group,
  index,
  groupCount,
  active,
  onActivate,
  onDelete,
  onDuplicate,
  onEdit,
  onMove,
}: {
  group: WorkspacePageGroup
  index: number
  groupCount: number
  active: boolean
  onActivate: () => void
  onDelete: () => void
  onDuplicate: () => void
  onEdit: () => void
  onMove: (direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  })
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      className={cn(
        'group rounded-xl border bg-paper/60 p-2 shadow-sm',
        active && 'border-gold ring-2 ring-gold/15',
        isDragging && 'relative z-20 opacity-70 shadow-lift',
      )}
      onClick={onActivate}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center gap-2">
        <button
          aria-label={`Reorder ${group.sourceName}`}
          className="cursor-grab touch-none rounded-lg p-1 text-line hover:bg-[#e9dfcf] hover:text-leather active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        {group.thumbnailDataUrl ? <img alt="" className="h-20 w-14 rounded-lg border bg-surface object-cover shadow-sm" src={group.thumbnailDataUrl} /> : <DocumentPreview compact page={group.pages[0]} tone="tan" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{group.sourceName}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            Pages {formatPageRange(group.pages)} · {group.pages.length} total
          </p>
        </div>
        <div className="flex flex-col">
          <IconButton
            aria-label="Move group up"
            className="size-7"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-3.5" />
          </IconButton>
          <IconButton
            aria-label="Move group down"
            className="size-7"
            disabled={index === groupCount - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-3.5" />
          </IconButton>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end border-t pt-1">
        <IconButton aria-label="Edit page range" className="size-8" onClick={onEdit}><Pencil className="size-3.5" /></IconButton>
        <IconButton aria-label="Duplicate group" className="size-8" onClick={onDuplicate}><Copy className="size-3.5" /></IconButton>
        <IconButton aria-label="Remove group" className="size-8 text-danger hover:bg-[#f5e1dd]" onClick={onDelete}><Trash2 className="size-3.5" /></IconButton>
      </div>
    </div>
  )
}

export function ComposerPanel({ embedded = false }: { embedded?: boolean }) {
  const { groups, composerOpen, toggleComposer, reorderGroups, removeGroup, duplicateGroup, updateGroupPages, moveGroup, clearWorkspace, insertGroupAt, activeGroupId, setActiveGroupId, past, future, undo, redo, isDirty, updatedAt, markGenerated, workspaceViewMode, setWorkspaceViewMode } =
    useWorkspaceStore()
  const generation = useGenerationStore()
  const userId = useAuthStore((state) => state.session?.user.id)
  const addGenerated = useLibraryStore((state) => state.addGenerated)
  const addTimeline = useLibraryStore((state) => state.addTimeline)
  const showToast = useToast()
  const [deleteTarget, setDeleteTarget] = useState<WorkspacePageGroup>()
  const [editTarget, setEditTarget] = useState<WorkspacePageGroup>()
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string>()
  const [clearOpen, setClearOpen] = useState(false)
  const [saveToDriveOpen, setSaveToDriveOpen] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const summary = getWorkspaceSummary(groups)
  const totalPages = summary.pageCount
  const generating = generation.status === 'preparing' || generation.status === 'generating'
  const orderedPages = groups.flatMap((group) =>
    group.pages.map((page) => ({
      id: `${group.id}-${page}`,
      page,
      sourceName: group.sourceName,
      thumbnailDataUrl: group.thumbnailDataUrl,
    })),
  )

  useEffect(() => {
    if (isDirty && generation.status === 'success') generation.reset()
  }, [generation, isDirty, updatedAt])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      reorderGroups(String(active.id), String(over.id))
      generation.reset()
    }
  }

  const isPageDrag = (event: ReactDragEvent) => event.dataTransfer.types.includes(PAGEWEAVER_PAGE_DRAG_MIME)

  const handlePageDragOver = (event: ReactDragEvent, index = groups.length) => {
    if (!isPageDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDropIndex(index)
  }

  const handlePageDrop = (event: ReactDragEvent) => {
    if (!isPageDrag(event)) return
    event.preventDefault()
    const raw = event.dataTransfer.getData(PAGEWEAVER_PAGE_DRAG_MIME)
    setDropIndex(null)
    try {
      const payload = JSON.parse(raw) as PageDragPayload
      if (payload.type !== 'pageweaver-pages' || !payload.pages.length) return
      insertGroupAt(
        {
          sourceFileId: payload.sourceFileId,
          sourceName: payload.sourceName,
          sourceSize: payload.sourceSize,
          sourcePageCount: payload.sourcePageCount,
          pages: payload.pages,
          thumbnailDataUrl: payload.thumbnailDataUrl,
        },
        dropIndex ?? groups.length,
      )
      generation.reset()
      addTimeline({ kind: 'edited', label: payload.sourceName, detail: `${payload.pages.length} pages dropped into workspace` })
      showToast(`${payload.pages.length} page${payload.pages.length === 1 ? '' : 's'} dropped into your document`)
    } catch {
      showToast('Those pages could not be added', 'error')
    }
  }

  const handleGenerate = async () => {
    generation.start()
    const startedAt = performance.now()
    try {
      const bytes = await generateWorkspacePdf(groups, ({ progress, message }) => generation.update(progress, message))
      const filename = createDatedPdfFilename()
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      const historyId = crypto.randomUUID()
      generation.succeed({
        historyId,
        blobUrl,
        filename,
        pageCount: totalPages,
        durationMs: performance.now() - startedAt,
        bytes: bytes.byteLength,
      })
      addGenerated({
        id: historyId,
        userId,
        filename,
        pageCount: totalPages,
        bytes: bytes.byteLength,
        generatedAt: Date.now(),
      })
      markGenerated()
      clearPdfCache()
      showToast(`PDF generated — ${totalPages} pages`)
    } catch (error) {
      generation.fail(error instanceof Error ? error.message : 'PDF generation failed.')
      showToast('PDF generation failed', 'error')
    }
  }

  const handleClearWorkspace = () => {
    clearWorkspace()
    generation.reset()
    clearPdfCache()
    addTimeline({ kind: 'workspace', label: 'Current document cleared', detail: `${groups.length} groups removed` })
    setClearOpen(false)
  }

  const openEdit = (group: WorkspacePageGroup) => {
    setEditTarget(group)
    setEditValue(formatPageRange(group.pages))
    setEditError(undefined)
  }

  const saveEdit = () => {
    if (!editTarget) return
    const result = parsePageRange(editValue, editTarget.sourcePageCount)
    if (!result.valid) {
      setEditError(result.message)
      return
    }
    if (!result.pages.length) {
      setEditError('Choose at least one page.')
      return
    }
    updateGroupPages(editTarget.id, result.pages)
    addTimeline({ kind: 'edited', label: editTarget.sourceName, detail: `Selection changed to ${formatPageRange(result.pages)}` })
    setEditTarget(undefined)
    generation.reset()
  }

  const content = (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="min-w-0">
          <WorkspaceTitle compact />
          <p className="mt-0.5 text-xs text-muted">{summary.sourceCount} sources · {totalPages} pages{isDirty ? ' · Changes not generated' : ''}</p>
        </div>
        <div className="flex items-center">
          <Tooltip label="Undo (Ctrl/⌘ Z)"><IconButton aria-label="Undo workspace change" className="size-8" disabled={!past.length} onClick={() => { undo(); generation.reset() }}><Undo2 className="size-4" /></IconButton></Tooltip>
          <Tooltip label="Redo (Ctrl/⌘ Shift Z)"><IconButton aria-label="Redo workspace change" className="size-8" disabled={!future.length} onClick={() => { redo(); generation.reset() }}><Redo2 className="size-4" /></IconButton></Tooltip>
          <div className="mx-1 hidden rounded-xl border bg-paper/60 p-0.5 sm:flex">
            <Tooltip label="Outline mode"><IconButton aria-label="Outline mode" className={cn('size-7', workspaceViewMode === 'outline' && 'bg-surface text-leather shadow-sm')} onClick={() => setWorkspaceViewMode('outline')}><Rows3 className="size-3.5" /></IconButton></Tooltip>
            <Tooltip label="Preview mode"><IconButton aria-label="Preview mode" className={cn('size-7', workspaceViewMode === 'preview' && 'bg-surface text-leather shadow-sm')} onClick={() => setWorkspaceViewMode('preview')}><PanelTop className="size-3.5" /></IconButton></Tooltip>
          </div>
          {groups.length > 0 && <Button className="mr-1" onClick={() => setClearOpen(true)} size="sm" variant="ghost">Clear</Button>}
          {!embedded && <IconButton aria-label="Close composer" onClick={toggleComposer}><X className="size-5" /></IconButton>}
        </div>
      </div>

      <div
        className={cn(
          'scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3 transition',
          dropIndex !== null && 'bg-[#f7efe2]',
        )}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
          setDropIndex(null)
        }}
        onDragOver={(event) => handlePageDragOver(event)}
        onDrop={handlePageDrop}
      >
        {!groups.length ? (
          <div className={cn('rounded-2xl', dropIndex !== null && 'ring-2 ring-gold/30')}>
            <EmptyState
              icon={Files}
              title="Your document is open"
              description="Select or drag pages from either viewer and they’ll appear here as a movable source group."
            />
          </div>
        ) : workspaceViewMode === 'preview' ? (
          <div className="grid grid-cols-2 gap-2">
            {orderedPages.map((item, index) => (
              <button
                className="group rounded-xl border bg-paper/60 p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                key={item.id}
                type="button"
              >
                {item.thumbnailDataUrl ? (
                  <img alt="" className="mx-auto h-24 w-16 rounded-lg border bg-surface object-cover shadow-sm" src={item.thumbnailDataUrl} />
                ) : (
                  <DocumentPreview compact page={item.page} tone="tan" />
                )}
                <p className="mt-2 truncate text-xs font-semibold">Page {index + 1}</p>
                <p className="truncate text-[10px] text-muted">{item.sourceName} · source {item.page}</p>
              </button>
            ))}
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
            <SortableContext items={groups.map((group) => group.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {dropIndex === 0 && <div className="h-1 rounded-full bg-gold shadow-soft" />}
                {groups.map((group, index) => (
                  <div key={group.id} onDragOver={(event) => handlePageDragOver(event, index + 1)}>
                    <SortableGroup
                      active={activeGroupId === group.id}
                      group={group}
                      groupCount={groups.length}
                      index={index}
                      onDelete={() => setDeleteTarget(group)}
                      onDuplicate={() => { duplicateGroup(group.id); generation.reset() }}
                      onEdit={() => openEdit(group)}
                      onMove={(direction) => { moveGroup(group.id, direction); generation.reset() }}
                      onActivate={() => setActiveGroupId(group.id)}
                    />
                    {dropIndex === index + 1 && <div className="mt-2 h-1 rounded-full bg-gold shadow-soft" />}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t bg-paper/50 p-4">
        {generating && <div className="mb-4"><div className="mb-2 flex justify-between text-xs"><span className="text-muted">{generation.message}</span><span className="font-semibold">{generation.progress}%</span></div><Progress value={generation.progress} /></div>}
        {generation.status === 'error' && <p className="mb-3 rounded-xl bg-[#f5e1dd] p-3 text-xs leading-5 text-danger">{generation.error}</p>}
        {generation.result ? (
          <div className="rounded-xl border bg-surface p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-4" /> PDF ready</div>
            <p className="mt-2 text-xs text-muted">{generation.result.pageCount} pages · {formatBytes(generation.result.bytes)} · {formatGenerationTime(generation.result.durationMs)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => downloadBlobUrl(generation.result!.blobUrl, generation.result!.filename)} variant="secondary">
                <Download className="size-4" /> Download
              </Button>
              <Button onClick={() => setSaveToDriveOpen(true)}>
                <CloudUpload className="size-4" /> Save to Drive
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm"><div><span className="block text-xs text-muted">Estimated output</span><span className="font-semibold">{totalPages} pages</span></div><div className="text-right"><span className="block text-xs text-muted">Estimated size</span><span className="font-semibold">{summary.estimatedBytes ? formatBytes(summary.estimatedBytes) : 'Calculated on export'}</span></div></div>
            <Button className="w-full" disabled={!groups.length || generating} loading={generating} onClick={() => void handleGenerate()}>Generate PDF</Button>
          </>
        )}
      </div>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(undefined)} title="Remove page group?">
        <p className="text-sm leading-6 text-muted">This removes the selected pages from your current document. The source PDF stays untouched.</p>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={() => setDeleteTarget(undefined)} variant="secondary">Cancel</Button><Button onClick={() => { if (deleteTarget) removeGroup(deleteTarget.id); setDeleteTarget(undefined); generation.reset() }} variant="danger">Remove group</Button></div>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(undefined)} title="Edit page range">
        <Input label="Pages" hint={`Use commas and ranges from 1 to ${editTarget?.sourcePageCount ?? 1}.`} onChange={(event) => setEditValue(event.target.value)} placeholder="1-10, 15, 20-24" value={editValue} />
        {editError && <p className="mt-2 text-xs text-danger">{editError}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button onClick={() => setEditTarget(undefined)} variant="secondary">Cancel</Button><Button onClick={saveEdit}>Save selection</Button></div>
      </Dialog>

      <Dialog open={clearOpen} onClose={() => setClearOpen(false)} title="Clear current document?">
        <p className="text-sm leading-6 text-muted">All {groups.length} page groups will be removed. Your source PDFs will not be changed.</p>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={() => setClearOpen(false)} variant="secondary">Cancel</Button><Button onClick={handleClearWorkspace} variant="danger">Clear document</Button></div>
      </Dialog>
      {generation.result && (
        <SaveToDriveDialog
          onClose={() => setSaveToDriveOpen(false)}
          open={saveToDriveOpen}
          result={generation.result}
        />
      )}
    </div>
  )

  if (embedded) return <aside className="h-full overflow-hidden rounded-2xl border shadow-soft">{content}</aside>
  return (
    <AnimatePresence>
      {composerOpen && (
        <div className="fixed inset-0 z-40">
          <motion.button aria-label="Close composer" className="absolute inset-0 bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={toggleComposer} />
          <motion.aside className="absolute inset-y-0 right-0 w-full max-w-[410px] border-l shadow-lift" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>{content}</motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
