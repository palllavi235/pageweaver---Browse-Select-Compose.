export type ExportQuality = 'screen' | 'print' | 'press'

export const PAGEWEAVER_PAGE_DRAG_MIME = 'application/x-pageweaver-pages'

export type WorkspacePageGroup = {
  id: string
  sourceFileId: string
  sourceName: string
  sourceSize?: string
  sourcePageCount: number
  pages: number[]
  thumbnailDataUrl?: string
  createdAt: number
}

export type PageDragPayload = {
  type: 'pageweaver-pages'
  sourceFileId: string
  sourceName: string
  sourceSize?: string
  sourcePageCount: number
  pages: number[]
  thumbnailDataUrl?: string
  originPaneId?: 'a' | 'b'
}

export type GenerationResult = {
  historyId: string
  blobUrl: string
  filename: string
  pageCount: number
  durationMs: number
  bytes: number
}
