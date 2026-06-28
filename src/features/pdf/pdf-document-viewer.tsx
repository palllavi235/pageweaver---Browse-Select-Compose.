import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Document, Page, pdfjs, type DocumentProps } from 'react-pdf'
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, Rows3, SearchCheck } from 'lucide-react'
import { Button, IconButton, Input, Skeleton, Tooltip } from '@/components/ui'
import { useElementSize } from '@/hooks/use-element-size'
import { useViewerStore, type ViewerPaneId } from '@/store/use-viewer-store'
import { PAGEWEAVER_PAGE_DRAG_MIME, type PageDragPayload } from '@/features/composer/types'
import { cn } from '@/utils/cn'
import { formatPageRange, parsePageRange } from './page-range'
import { VirtualThumbnailList } from './virtual-thumbnail-list'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const PAGE_ASPECT_RATIO = 0.707
const PAGE_GAP = 28

type PdfDocumentViewerProps = {
  data: ArrayBuffer
  paneId?: ViewerPaneId
  sourceFile?: {
    id: string
    name: string
    size?: string
  }
  onDocumentReady?: (pageCount: number) => void
  onAddSelection: (thumbnailDataUrl?: string) => void
}

function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(page, 1), Math.max(pageCount, 1))
}

export function PdfDocumentViewer({ data, paneId = 'a', sourceFile, onDocumentReady, onAddSelection }: PdfDocumentViewerProps) {
  const pane = useViewerStore((state) => state.panes[paneId])
  const setPageCount = useViewerStore((state) => state.setPageCount)
  const setCurrentPage = useViewerStore((state) => state.setCurrentPage)
  const selectPage = useViewerStore((state) => state.selectPage)
  const setSelectedPages = useViewerStore((state) => state.setSelectedPages)
  const setZoom = useViewerStore((state) => state.setZoom)
  const setFitMode = useViewerStore((state) => state.setFitMode)
  const setScrollTop = useViewerStore((state) => state.setScrollTop)
  const { pageCount, currentPage, selectedPages, zoom, fitMode, scrollTop } = pane
  const [rangeInput, setRangeInput] = useState('')
  const [rangeError, setRangeError] = useState<string>()
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const skipNextPageScrollRef = useRef(false)
  const { ref: viewportRef, width: viewportWidth, height: viewportHeight } = useElementSize<HTMLDivElement>()
  const file = useMemo(() => ({ data: new Uint8Array(data.slice(0)) }), [data])

  useEffect(() => setRangeInput(formatPageRange(selectedPages)), [selectedPages])

  const handleLoad: NonNullable<DocumentProps['onLoadSuccess']> = (document) => {
    setPageCount(document.numPages, paneId)
    onDocumentReady?.(document.numPages)
  }

  const applyRange = (event: FormEvent) => {
    event.preventDefault()
    const result = parsePageRange(rangeInput, pageCount)
    if (!result.valid) {
      setRangeError(result.message)
      return
    }
    setRangeError(undefined)
    setSelectedPages(result.pages, paneId)
    if (result.pages[0]) setCurrentPage(result.pages[0], paneId)
  }

  const availableWidth = Math.max(280, viewportWidth - 80)
  const pageWidth =
    fitMode === 'page'
      ? Math.min(availableWidth, Math.max(280, (viewportHeight - 80) * PAGE_ASPECT_RATIO))
      : fitMode === 'width'
        ? availableWidth
        : availableWidth * zoom
  const estimatedPageHeight = Math.max(360, pageWidth / PAGE_ASPECT_RATIO)
  const virtualItemHeight = estimatedPageHeight + PAGE_GAP
  const renderStart = clampPage(Math.floor(scrollTop / virtualItemHeight), pageCount)
  const renderEnd = clampPage(Math.ceil((scrollTop + viewportHeight) / virtualItemHeight) + 2, pageCount)
  const visiblePages = pageCount
    ? Array.from({ length: renderEnd - renderStart + 1 }, (_, index) => renderStart + index)
    : []

  useEffect(() => {
    if (!pageCount || !viewportRef.current) return
    if (skipNextPageScrollRef.current) {
      skipNextPageScrollRef.current = false
      return
    }

    const nextTop = (currentPage - 1) * virtualItemHeight
    if (Math.abs(viewportRef.current.scrollTop - nextTop) > 8) {
      viewportRef.current.scrollTo({ top: nextTop, behavior: 'smooth' })
    }
  }, [currentPage, pageCount, virtualItemHeight, viewportRef])

  const goToPage = (page: number) => {
    if (!pageCount) return
    setCurrentPage(clampPage(page, pageCount), paneId)
  }

  const updateCurrentPageFromScroll = (nextScrollTop: number) => {
    if (!pageCount) return
    const nextPage = clampPage(
      Math.floor((nextScrollTop + viewportHeight * 0.35) / virtualItemHeight) + 1,
      pageCount,
    )
    if (nextPage !== currentPage) {
      skipNextPageScrollRef.current = true
      setCurrentPage(nextPage, paneId)
    }
  }

  const addSelection = () => {
    const source = previewCanvasRef.current
    if (!source) {
      onAddSelection()
      return
    }
    const width = 120
    const height = Math.max(1, Math.round((source.height / source.width) * width))
    const thumbnail = document.createElement('canvas')
    thumbnail.width = width
    thumbnail.height = height
    thumbnail.getContext('2d')?.drawImage(source, 0, 0, width, height)
    onAddSelection(thumbnail.toDataURL('image/jpeg', 0.68))
  }

  const handlePageDragStart = (page: number, event: DragEvent<HTMLButtonElement>) => {
    if (!sourceFile) return
    const pages = selectedPages.includes(page) ? selectedPages : [page]
    const payload: PageDragPayload = {
      type: 'pageweaver-pages',
      sourceFileId: sourceFile.id,
      sourceName: sourceFile.name,
      sourceSize: sourceFile.size,
      sourcePageCount: pageCount,
      pages,
      originPaneId: paneId,
    }
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(PAGEWEAVER_PAGE_DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.setData('text/plain', `${pages.length} PageWeaver page${pages.length === 1 ? '' : 's'}`)
  }

  return (
    <Document
      className="grid min-h-0 flex-1 grid-cols-[112px_1fr] sm:grid-cols-[158px_1fr]"
      error={<div className="grid place-items-center p-8 text-sm text-danger">This PDF is invalid or corrupted.</div>}
      file={file}
      loading={<div className="col-span-2 grid place-items-center p-10"><Skeleton className="aspect-[.707] w-72" /></div>}
      onLoadSuccess={handleLoad}
    >
      <aside className="flex min-h-0 flex-col border-r bg-paper">
        <div className="border-b p-2 sm:p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">Page range</p>
          <form onSubmit={applyRange}>
            <Input
              aria-invalid={Boolean(rangeError)}
              className="h-9 px-2 text-xs"
              onChange={(event) => setRangeInput(event.target.value)}
              placeholder="1-10, 15"
              value={rangeInput}
            />
            {rangeError && <p className="mt-1 text-[10px] leading-4 text-danger">{rangeError}</p>}
            <Button className="mt-2 w-full" size="sm" type="submit" variant="secondary">
              <SearchCheck className="size-3.5" /> Apply
            </Button>
          </form>
        </div>
        <div className="min-h-0 flex-1 pt-3">
          <VirtualThumbnailList
            currentPage={currentPage}
            onPageDragStart={handlePageDragStart}
            onSelect={(page, mode) => selectPage(page, mode, paneId)}
            pageCount={pageCount}
            selectedPages={selectedPages}
          />
        </div>
      </aside>
      <main
        aria-label="PDF document pages"
        className="paper-grid relative min-h-0 overflow-auto bg-[#e8e1d6]"
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'PageDown') {
            event.preventDefault()
            goToPage(currentPage + 1)
          }
          if (event.key === 'ArrowUp' || event.key === 'PageUp') {
            event.preventDefault()
            goToPage(currentPage - 1)
          }
          if (event.key === 'Home') {
            event.preventDefault()
            goToPage(1)
          }
          if (event.key === 'End') {
            event.preventDefault()
            goToPage(pageCount)
          }
        }}
        onScroll={(event) => {
          const nextScrollTop = event.currentTarget.scrollTop
          setScrollTop(nextScrollTop, paneId)
          updateCurrentPageFromScroll(nextScrollTop)
        }}
        ref={viewportRef}
        tabIndex={0}
      >
        <div className="relative mx-auto w-full" style={{ height: pageCount * virtualItemHeight + PAGE_GAP }}>
          {visiblePages.map((page) => (
            <div
              className="absolute left-0 right-0 flex justify-center px-5 sm:px-10"
              key={page}
              style={{ top: (page - 1) * virtualItemHeight }}
            >
              <Page
                canvasRef={page === currentPage ? previewCanvasRef : undefined}
                className={cn('overflow-hidden shadow-lift', page === currentPage && 'ring-2 ring-gold/40')}
                loading={<Skeleton className="aspect-[.707] w-[min(70vw,680px)]" />}
                pageNumber={page}
                renderAnnotationLayer
                renderTextLayer
                width={pageWidth}
              />
            </div>
          ))}
        </div>
        <div className="sticky bottom-4 z-10 mx-auto flex w-fit flex-wrap items-center justify-center gap-1 rounded-xl border bg-surface/95 p-1.5 shadow-soft backdrop-blur">
          <Tooltip label="Previous page">
            <IconButton aria-label="Previous page" className="size-8" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
              <ChevronLeft className="size-4" />
            </IconButton>
          </Tooltip>
          <span className="min-w-14 px-1 text-center text-xs font-semibold">{currentPage} / {pageCount}</span>
          <Tooltip label="Next page">
            <IconButton aria-label="Next page" className="size-8" disabled={currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)}>
              <ChevronRight className="size-4" />
            </IconButton>
          </Tooltip>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tooltip label="Zoom out"><IconButton aria-label="Zoom out" className="size-8" onClick={() => setZoom(zoom - 0.1, paneId)}><Minus className="size-4" /></IconButton></Tooltip>
          <span className="w-12 text-center text-xs font-semibold">{Math.round((fitMode === 'custom' ? zoom : 1) * 100)}%</span>
          <Tooltip label="Zoom in"><IconButton aria-label="Zoom in" className="size-8" onClick={() => setZoom(zoom + 0.1, paneId)}><Plus className="size-4" /></IconButton></Tooltip>
          <Tooltip label="Fit width"><IconButton aria-label="Fit width" className="size-8" onClick={() => setFitMode('width', paneId)}><Rows3 className="size-4" /></IconButton></Tooltip>
          <Tooltip label="Fit page"><IconButton aria-label="Fit page" className="size-8" onClick={() => setFitMode('page', paneId)}><Maximize2 className="size-4" /></IconButton></Tooltip>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button className="ml-1" disabled={!selectedPages.length} onClick={addSelection} size="sm">
            <Plus className="size-4" /> Add {selectedPages.length || ''} pages
          </Button>
        </div>
      </main>
    </Document>
  )
}
