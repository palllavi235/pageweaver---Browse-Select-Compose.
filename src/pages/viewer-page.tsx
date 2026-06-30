import { ChevronLeft, Download, FileWarning, RefreshCw, SplitSquareHorizontal, X } from 'lucide-react'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { GoogleAuthButton } from '@/components/auth-button'
import { Badge, Button, EmptyState, ErrorState, IconButton, Progress, useToast } from '@/components/ui'
import { getDrivePdfMetadata, type DrivePdfFile } from '@/features/drive/drive-service'
import { PdfDocumentViewer } from '@/features/pdf/pdf-document-viewer'
import { usePdfBuffer } from '@/features/pdf/use-pdf-buffer'
import { useAuthStore } from '@/store/use-auth-store'
import { useViewerStore, type ViewerPaneId } from '@/store/use-viewer-store'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { useGenerationStore } from '@/store/use-generation-store'
import { formatBytes } from '@/utils/format'
import { downloadBlobUrl } from '@/utils/download'
import { cn } from '@/utils/cn'

type ViewerLocationState = { driveFile?: DrivePdfFile } | null

function ViewerPane({
  paneId,
  fileId,
  initialFile,
  active,
  responsiveHidden,
}: {
  paneId: ViewerPaneId
  fileId: string | null
  initialFile?: DrivePdfFile
  active: boolean
  responsiveHidden: boolean
}) {
  const authenticated = useAuthStore((state) => state.status === 'authenticated')
  const userId = useAuthStore((state) => state.session?.user.id)
  const setActivePane = useViewerStore((state) => state.setActivePane)
  const closePane = useViewerStore((state) => state.closePane)
  const pane = useViewerStore((state) => state.panes[paneId])
  const addGroup = useWorkspaceStore((state) => state.addGroup)
  const setComposerOpen = useWorkspaceStore((state) => state.setComposerOpen)
  const resetGeneration = useGenerationStore((state) => state.reset)
  const showToast = useToast()
  const pdf = usePdfBuffer(authenticated && fileId ? fileId : undefined)
  const metadata = useQuery({
    queryKey: ['drive', userId, 'file', fileId],
    queryFn: ({ signal }) => getDrivePdfMetadata(fileId!, signal),
    enabled: authenticated && Boolean(fileId),
    initialData: initialFile?.id === fileId ? initialFile : undefined,
    staleTime: 5 * 60_000,
  })
  const file = metadata.data

  const addSelection = (thumbnailDataUrl?: string) => {
    if (!file || !pane.selectedPages.length) return
    addGroup({
      sourceFileId: file.id,
      sourceName: file.name,
      sourceSize: file.size,
      sourcePageCount: pane.pageCount,
      pages: pane.selectedPages,
      thumbnailDataUrl,
    })
    resetGeneration()
    setComposerOpen(true)
    showToast(`${pane.selectedPages.length} pages added from Viewer ${paneId.toUpperCase()}`)
  }

  const downloadSource = () => {
    if (!pdf.data || !file) return
    const url = URL.createObjectURL(new Blob([pdf.data], { type: 'application/pdf' }))
    downloadBlobUrl(url, file.name)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section
      className={cn(
        'min-h-0 flex-col overflow-hidden border bg-surface',
        responsiveHidden ? 'hidden xl:flex' : 'flex',
        active && 'ring-2 ring-gold/25',
      )}
      onFocus={() => setActivePane(paneId)}
    >
      <div className="flex min-h-14 items-center gap-2 border-b bg-surface px-3 py-2">
        <button
          className={cn(
            'rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-[0.14em]',
            active ? 'bg-[#f3e7cb] text-leather' : 'bg-paper text-muted',
          )}
          onClick={() => setActivePane(paneId)}
          type="button"
        >
          Viewer {paneId.toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file?.name ?? (fileId ? 'Loading document…' : 'No PDF selected')}</p>
          <p className="text-[11px] text-muted">{file ? formatBytes(file.size) : fileId ? 'Google Drive' : 'Choose this pane, then open a PDF from Drive'}</p>
        </div>
        <Badge tone={pane.selectedPages.length ? 'gold' : 'neutral'}>{pane.selectedPages.length} selected</Badge>
        <IconButton aria-label={`Download Viewer ${paneId.toUpperCase()} source PDF`} disabled={!pdf.data} onClick={downloadSource}>
          <Download className="size-4" />
        </IconButton>
        {paneId === 'b' && (
          <IconButton aria-label="Close Viewer B" onClick={() => closePane('b')}>
            <X className="size-4" />
          </IconButton>
        )}
      </div>

      {!fileId ? (
        <div className="grid flex-1 place-items-center p-8">
          <EmptyState
            icon={SplitSquareHorizontal}
            title={`Viewer ${paneId.toUpperCase()} is ready`}
            description="Select this pane, return to Drive, and open another PDF to compare documents side-by-side."
            action={<Link to="/app/drive"><Button variant="secondary">Open Drive browser</Button></Link>}
          />
        </div>
      ) : metadata.isError ? (
        <div className="page-shell py-10">
          <ErrorState description={metadata.error instanceof Error ? metadata.error.message : 'The file metadata could not be loaded.'} />
        </div>
      ) : pdf.status === 'error' ? (
        <div className="page-shell py-10">
          <EmptyState
            icon={FileWarning}
            title="This PDF could not be opened"
            description={pdf.error ?? 'Check your connection and try again.'}
            action={<Button onClick={() => void pdf.retry()}><RefreshCw className="size-4" /> Retry</Button>}
          />
        </div>
      ) : !pdf.data ? (
        <div className="grid flex-1 place-items-center p-8">
          <div className="w-full max-w-sm text-center">
            <p className="font-display text-xl font-semibold">Downloading PDF</p>
            <p className="mt-2 text-sm text-muted">Only this document is being downloaded.</p>
            <Progress className="mt-5" value={pdf.progress} />
            <p className="mt-2 text-xs text-muted">{pdf.progress || 0}%</p>
          </div>
        </div>
      ) : (
        <PdfDocumentViewer
          data={pdf.data}
          onAddSelection={addSelection}
          paneId={paneId}
          sourceFile={file ? { id: file.id, name: file.name, size: file.size } : undefined}
        />
      )}
    </section>
  )
}

export function ViewerPage() {
  const { id } = useParams()
  const location = useLocation()
  const locationState = location.state as ViewerLocationState
  const authenticated = useAuthStore((state) => state.status === 'authenticated')
  const activePaneId = useViewerStore((state) => state.activePaneId)
  const splitView = useViewerStore((state) => state.splitView)
  const panes = useViewerStore((state) => state.panes)
  const openDocument = useViewerStore((state) => state.openDocument)
  const setActivePane = useViewerStore((state) => state.setActivePane)
  const setSplitView = useViewerStore((state) => state.setSplitView)

  useEffect(() => {
    if (id) openDocument(id, useViewerStore.getState().activePaneId)
  }, [id, openDocument])

  if (!authenticated) {
    return <div className="page-shell py-10"><EmptyState title="Sign in to open this PDF" description="PageWeaver needs read-only Drive access before it can download and display this document." action={<GoogleAuthButton />} /></div>
  }

  if (!id && !panes.a.fileId) return <div className="page-shell py-10"><ErrorState description="This document link is incomplete." /></div>

  return (
    <div className="flex h-[calc(100vh-72px)] min-h-[620px] flex-col">
      <div className="flex min-h-16 flex-wrap items-center gap-2 border-b bg-surface px-3 py-2 sm:px-5">
        <Link to="/app/drive"><IconButton aria-label="Back to drive"><ChevronLeft className="size-5" /></IconButton></Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Professional viewer</p>
          <p className="text-[11px] text-muted">Use Viewer A and Viewer B to compare PDFs without losing selections.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border bg-paper/60 p-1">
          {(['a', 'b'] as const).map((paneId) => (
            <button
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                activePaneId === paneId ? 'bg-surface text-leather shadow-sm' : 'text-muted hover:text-ink',
              )}
              key={paneId}
              onClick={() => setActivePane(paneId)}
              type="button"
            >
              Viewer {paneId.toUpperCase()}
            </button>
          ))}
        </div>
        <Button onClick={() => setSplitView(!splitView)} size="sm" variant={splitView ? 'primary' : 'secondary'}>
          <SplitSquareHorizontal className="size-4" /> {splitView ? 'Split on' : 'Split view'}
        </Button>
      </div>

      <div className={cn('min-h-0 flex-1 gap-3 bg-paper p-3', splitView ? 'grid xl:grid-cols-2' : 'grid grid-cols-1')}>
        <ViewerPane
          active={activePaneId === 'a'}
          fileId={panes.a.fileId}
          initialFile={locationState?.driveFile}
          paneId="a"
          responsiveHidden={splitView && activePaneId !== 'a'}
        />
        {splitView && (
          <ViewerPane
            active={activePaneId === 'b'}
            fileId={panes.b.fileId}
            initialFile={locationState?.driveFile}
            paneId="b"
            responsiveHidden={activePaneId !== 'b'}
          />
        )}
      </div>
    </div>
  )
}
