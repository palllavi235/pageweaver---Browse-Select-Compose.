import { create } from 'zustand'

export type PdfLoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  progress: number
  error?: string
  bytes?: number
}

type PdfCacheState = {
  entries: Record<string, PdfLoadState>
  setEntry: (fileId: string, entry: PdfLoadState) => void
  removeEntry: (fileId: string) => void
  reset: () => void
}

export const usePdfCacheStore = create<PdfCacheState>((set) => ({
  entries: {},
  setEntry: (fileId, entry) => set((state) => ({ entries: { ...state.entries, [fileId]: entry } })),
  removeEntry: (fileId) =>
    set((state) => {
      const entries = { ...state.entries }
      delete entries[fileId]
      return { entries }
    }),
  reset: () => set({ entries: {} }),
}))
