import { create } from 'zustand'

export type ViewerFitMode = 'width' | 'page' | 'custom'
export type ViewerPaneId = 'a' | 'b'

export type ViewerPaneState = {
  fileId: string | null
  pageCount: number
  currentPage: number
  selectedPages: number[]
  selectionAnchor: number | null
  zoom: number
  fitMode: ViewerFitMode
  scrollTop: number
}

type ViewerState = ViewerPaneState & {
  activePaneId: ViewerPaneId
  splitView: boolean
  panes: Record<ViewerPaneId, ViewerPaneState>
  setActivePane: (paneId: ViewerPaneId) => void
  setSplitView: (enabled: boolean) => void
  closePane: (paneId: ViewerPaneId) => void
  openDocument: (fileId: string, paneId?: ViewerPaneId) => void
  setPageCount: (pageCount: number, paneId?: ViewerPaneId) => void
  setCurrentPage: (page: number, paneId?: ViewerPaneId) => void
  selectPage: (page: number, mode: 'single' | 'toggle' | 'range', paneId?: ViewerPaneId) => void
  setSelectedPages: (pages: number[], paneId?: ViewerPaneId) => void
  clearSelection: (paneId?: ViewerPaneId) => void
  setZoom: (zoom: number, paneId?: ViewerPaneId) => void
  setFitMode: (fitMode: ViewerFitMode, paneId?: ViewerPaneId) => void
  setScrollTop: (scrollTop: number, paneId?: ViewerPaneId) => void
}

const defaultPane: ViewerPaneState = {
  fileId: null,
  pageCount: 0,
  currentPage: 1,
  selectedPages: [],
  selectionAnchor: null,
  zoom: 1,
  fitMode: 'width',
  scrollTop: 0,
}

function getPaneId(state: ViewerState, paneId?: ViewerPaneId) {
  return paneId ?? state.activePaneId
}

function mirrorActivePane(panes: Record<ViewerPaneId, ViewerPaneState>, activePaneId: ViewerPaneId) {
  return panes[activePaneId]
}

function patchPane(
  state: ViewerState,
  paneId: ViewerPaneId,
  patch: Partial<ViewerPaneState>,
): Partial<ViewerState> {
  const panes = {
    ...state.panes,
    [paneId]: { ...state.panes[paneId], ...patch },
  }
  return {
    panes,
    ...(paneId === state.activePaneId ? mirrorActivePane(panes, state.activePaneId) : {}),
  }
}

export const useViewerStore = create<ViewerState>((set) => ({
  ...defaultPane,
  activePaneId: 'a',
  splitView: false,
  panes: { a: defaultPane, b: defaultPane },
  setActivePane: (activePaneId) =>
    set((state) => ({
      activePaneId,
      ...mirrorActivePane(state.panes, activePaneId),
    })),
  setSplitView: (splitView) =>
    set((state) => ({
      splitView,
      activePaneId: splitView ? state.activePaneId : 'a',
      ...(!splitView ? mirrorActivePane(state.panes, 'a') : {}),
    })),
  closePane: (paneId) =>
    set((state) => {
      const panes = { ...state.panes, [paneId]: defaultPane }
      const activePaneId = state.activePaneId === paneId ? 'a' : state.activePaneId
      return { panes, activePaneId, ...mirrorActivePane(panes, activePaneId) }
    }),
  openDocument: (fileId, providedPaneId) =>
    set((state) => {
      const paneId = getPaneId(state, providedPaneId)
      return patchPane(state, paneId, {
        fileId,
        pageCount: 0,
        currentPage: 1,
        selectedPages: [],
        selectionAnchor: null,
        zoom: 1,
        fitMode: 'width',
        scrollTop: 0,
      })
    }),
  setPageCount: (pageCount, providedPaneId) =>
    set((state) => patchPane(state, getPaneId(state, providedPaneId), { pageCount })),
  setCurrentPage: (currentPage, providedPaneId) =>
    set((state) => patchPane(state, getPaneId(state, providedPaneId), { currentPage })),
  selectPage: (page, mode, providedPaneId) =>
    set((state) => {
      const paneId = getPaneId(state, providedPaneId)
      const pane = state.panes[paneId]
      if (mode === 'range' && pane.selectionAnchor) {
        const start = Math.min(pane.selectionAnchor, page)
        const end = Math.max(pane.selectionAnchor, page)
        const range = Array.from({ length: end - start + 1 }, (_, index) => start + index)
        return patchPane(state, paneId, { selectedPages: range, currentPage: page })
      }
      if (mode === 'toggle') {
        const selectedPages = pane.selectedPages.includes(page)
          ? pane.selectedPages.filter((item) => item !== page)
          : [...pane.selectedPages, page].sort((a, b) => a - b)
        return patchPane(state, paneId, { selectedPages, selectionAnchor: page, currentPage: page })
      }
      return patchPane(state, paneId, { selectedPages: [page], selectionAnchor: page, currentPage: page })
    }),
  setSelectedPages: (selectedPages, providedPaneId) =>
    set((state) =>
      patchPane(state, getPaneId(state, providedPaneId), {
        selectedPages: [...new Set(selectedPages)].sort((a, b) => a - b),
        selectionAnchor: selectedPages.at(-1) ?? null,
      }),
    ),
  clearSelection: (providedPaneId) =>
    set((state) => patchPane(state, getPaneId(state, providedPaneId), { selectedPages: [], selectionAnchor: null })),
  setZoom: (zoom, providedPaneId) =>
    set((state) =>
      patchPane(state, getPaneId(state, providedPaneId), {
        zoom: Math.min(2.5, Math.max(0.4, zoom)),
        fitMode: 'custom',
      }),
    ),
  setFitMode: (fitMode, providedPaneId) =>
    set((state) => patchPane(state, getPaneId(state, providedPaneId), { fitMode })),
  setScrollTop: (scrollTop, providedPaneId) =>
    set((state) => patchPane(state, getPaneId(state, providedPaneId), { scrollTop })),
}))
