import { useEffect, useMemo, useState, type UIEvent } from 'react'
import { Document, Page, pdfjs, type DocumentProps } from 'react-pdf'
import { ArrowLeft, ArrowRight, FileText, Maximize2, Minus, Plus, Rows3 } from 'lucide-react'
import { Card, EmptyState, IconButton, Progress, Skeleton, Tooltip } from '@/components/ui'
import { useElementSize } from '@/hooks/use-element-size'
import { useComposedDocumentPreview } from './use-composed-document-preview'
import type { WorkspacePageGroup } from './types'
import { formatBytes } from '@/utils/format'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type PreviewFitMode = 'width' | 'page' | 'custom'

type ComposedDocumentPreviewProps = {
  groups: WorkspacePageGroup[]
  updatedAt: number
}

const OVERSCAN = 2

export function ComposedDocumentPreview({ groups, updatedAt }: ComposedDocumentPreviewProps) {
  const preview = useComposedDocumentPreview(groups, updatedAt)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [fitMode, setFitMode] = useState<PreviewFitMode>('width')
  const [scrollTop, setScrollTop] = useState(0)
  const { ref: viewportRef, width, height } = useElementSize<HTMLDivElement>()
  const file = useMemo(() => (preview.blobUrl ? { url: preview.blobUrl } : undefined), [preview.blobUrl])

  const pageWidth = useMemo(() => {
    const availableWidth = Math.max(280, width - 96)
    if (fitMode === 'page') return Math.min(availableWidth, Math.max(260, (height - 120) * 0.707))
    if (fitMode === 'custom') return Math.max(260, availableWidth * zoom)
    return availableWidth
  }, [fitMode, height, width, zoom])

  const itemHeight = Math.max(420, Math.round(pageWidth * 1.414 + 40))
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN)
  const visibleCount = Math.ceil(Math.max(1, height) / itemHeight) + OVERSCAN * 2
  const end = Math.min(pageCount, start + visibleCount)
  const visiblePages = Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index + 1)

  useEffect(() => {
    setPageCount(0)
    setCurrentPage(1)
    setScrollTop(0)
    viewportRef.current?.scrollTo({ top: 0 })
  }, [preview.blobUrl, viewportRef])

  const handleLoad: NonNullable<DocumentProps['onLoadSuccess']> = (document) => {
    setPageCount(document.numPages)
  }

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), Math.max(pageCount, 1))
    setCurrentPage(nextPage)
    viewportRef.current?.scrollTo({ top: (nextPage - 1) * itemHeight, behavior: 'smooth' })
  }

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const nextTop = event.currentTarget.scrollTop
    setScrollTop(nextTop)
    if (pageCount > 0) {
      setCurrentPage(Math.min(pageCount, Math.max(1, Math.round(nextTop / itemHeight) + 1)))
    }
  }

  if (!groups.length) {
    return (
      <Card className="paper-grid grid min-h-[520px] place-items-center overflow-hidden bg-[#eee7dc] p-6">
        <EmptyState
          icon={FileText}
          title="Start weaving your document"
          description="Open a PDF, select pages, and they will appear here as a live final-document preview."
        />
      </Card>
    )
  }

  return (
    <Card className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-leather">Final document preview</p>
          <p className="mt-1 text-xs text-muted">
            {preview.status === 'ready'
              ? `${pageCount || groups.reduce((total, group) => total + group.pages.length, 0)} pages · ${formatBytes(preview.bytes)}`
              : preview.status === 'error'
                ? 'Preview needs attention'
                : 'Updates from your current workspace state'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border bg-paper/60 p-1">
          <Tooltip label="Previous page">
            <IconButton aria-label="Previous preview page" className="size-8" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
              <ArrowLeft className="size-4" />
            </IconButton>
          </Tooltip>
          <span className="min-w-16 px-2 text-center text-xs font-semibold">{currentPage} / {pageCount || '—'}</span>
          <Tooltip label="Next page">
            <IconButton aria-label="Next preview page" className="size-8" disabled={!pageCount || currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)}>
              <ArrowRight className="size-4" />
            </IconButton>
          </Tooltip>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tooltip label="Zoom out">
            <IconButton aria-label="Zoom out preview" className="size-8" onClick={() => { setZoom((value) => Math.max(0.45, value - 0.1)); setFitMode('custom') }}>
              <Minus className="size-4" />
            </IconButton>
          </Tooltip>
          <span className="w-12 text-center text-xs font-semibold">{Math.round((fitMode === 'custom' ? zoom : 1) * 100)}%</span>
          <Tooltip label="Zoom in">
            <IconButton aria-label="Zoom in preview" className="size-8" onClick={() => { setZoom((value) => Math.min(2.5, value + 0.1)); setFitMode('custom') }}>
              <Plus className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label="Fit width">
            <IconButton aria-label="Fit preview width" className="size-8" onClick={() => setFitMode('width')}>
              <Rows3 className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label="Fit page">
            <IconButton aria-label="Fit preview page" className="size-8" onClick={() => setFitMode('page')}>
              <Maximize2 className="size-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {preview.status === 'error' ? (
        <div className="grid flex-1 place-items-center bg-paper p-8">
          <EmptyState
            icon={FileText}
            title="Preview could not be rendered"
            description={preview.error ?? 'Check your connection and source PDFs, then try again.'}
          />
        </div>
      ) : preview.status !== 'ready' || !file ? (
        <div className="grid flex-1 place-items-center bg-paper p-8">
          <div className="w-full max-w-sm text-center">
            <Skeleton className="mx-auto aspect-[.707] w-52" />
            <p className="mt-5 font-display text-xl font-semibold">Rendering live preview</p>
            <p className="mt-2 text-sm text-muted">{preview.message || 'Preparing source documents…'}</p>
            <Progress className="mt-5" value={preview.progress} />
          </div>
        </div>
      ) : (
        <Document
          className="min-h-0 flex-1"
          error={<div className="grid h-full place-items-center p-8 text-sm text-danger">The generated preview could not be opened.</div>}
          file={file}
          loading={<div className="grid h-full place-items-center p-8"><Skeleton className="aspect-[.707] w-64" /></div>}
          onLoadSuccess={handleLoad}
        >
          <div
            className="paper-grid h-full overflow-auto bg-[#e8e1d6]"
            onScroll={handleScroll}
            ref={viewportRef}
          >
            <div className="relative mx-auto" style={{ height: pageCount * itemHeight, minHeight: '100%', width: Math.max(pageWidth + 48, width || pageWidth + 48) }}>
              <div className="absolute left-0 right-0" style={{ top: start * itemHeight }}>
                {visiblePages.map((page) => (
                  <div className="flex justify-center px-6 py-5" key={page} style={{ minHeight: itemHeight }}>
                    <div>
                      <Page
                        className="overflow-hidden bg-surface shadow-lift"
                        loading={<div style={{ width: pageWidth }}><Skeleton className="aspect-[.707] w-full" /></div>}
                        pageNumber={page}
                        renderAnnotationLayer
                        renderTextLayer
                        width={pageWidth}
                      />
                      <p className="mt-2 text-center text-[11px] font-medium text-muted">Page {page}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Document>
      )}
    </Card>
  )
}
