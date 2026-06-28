import { memo, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react'
import { Check } from 'lucide-react'
import { Page } from 'react-pdf'
import { cn } from '@/utils/cn'

const ITEM_HEIGHT = 174
const OVERSCAN = 3

type VirtualThumbnailListProps = {
  pageCount: number
  selectedPages: number[]
  currentPage: number
  onSelect: (page: number, mode: 'single' | 'toggle' | 'range') => void
  onPageDragStart?: (page: number, event: DragEvent<HTMLButtonElement>) => void
}

const Thumbnail = memo(function Thumbnail({
  page,
  selected,
  current,
  onSelect,
  onPageDragStart,
}: {
  page: number
  selected: boolean
  current: boolean
  onSelect: VirtualThumbnailListProps['onSelect']
  onPageDragStart?: VirtualThumbnailListProps['onPageDragStart']
}) {
  const handleClick = (event: MouseEvent) => {
    const mode = event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'single'
    onSelect(page, mode)
  }

  return (
    <button
      aria-label={`Page ${page}${selected ? ', selected' : ''}`}
      aria-pressed={selected}
      className="group block w-full text-left"
      draggable
      onDragStart={(event) => onPageDragStart?.(page, event)}
      onClick={handleClick}
      type="button"
    >
      <div className={cn('relative mx-auto w-[92px] overflow-hidden rounded-lg border bg-surface shadow-sm transition sm:w-[112px]', current && 'ring-2 ring-gold/30', selected && 'border-leather ring-2 ring-leather/25')}>
        <Page
          loading={<div className="aspect-[.707] animate-pulse bg-[#e8e0d3]" />}
          pageNumber={page}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          width={112}
        />
        {selected && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-leather text-white shadow-sm"><Check className="size-3" /></span>}
      </div>
      <span className="mt-1.5 block text-center text-[10px] text-muted">{page}</span>
    </button>
  )
})

export function VirtualThumbnailList({
  pageCount,
  selectedPages,
  currentPage,
  onSelect,
  onPageDragStart,
}: VirtualThumbnailListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(640)
  const selected = useMemo(() => new Set(selectedPages), [selectedPages])
  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(height / ITEM_HEIGHT) + OVERSCAN * 2
  const end = Math.min(pageCount, start + visibleCount)
  const visiblePages = Array.from({ length: end - start }, (_, index) => start + index + 1)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height))
    observer.observe(containerRef.current)
    setHeight(containerRef.current.clientHeight)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-label="PDF pages"
      className="scrollbar-thin h-full overflow-y-auto px-2 pb-3 sm:px-3"
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop)
      }}
      ref={containerRef}
    >
      <div style={{ height: pageCount * ITEM_HEIGHT, position: 'relative' }}>
        <div className="space-y-3" style={{ left: 0, position: 'absolute', right: 0, top: start * ITEM_HEIGHT }}>
          {visiblePages.map((page) => (
            <div key={page} style={{ height: ITEM_HEIGHT - 12 }}>
              <Thumbnail
                current={currentPage === page}
                onPageDragStart={onPageDragStart}
                onSelect={onSelect}
                page={page}
                selected={selected.has(page)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
