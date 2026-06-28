import { create } from 'zustand'
import type { DrivePdfFile } from '@/features/drive/drive-service'

const STORAGE_KEY = 'pageweaver:library:v1'

export type GeneratedDocumentRecord = {
  id: string
  filename: string
  pageCount: number
  bytes: number
  generatedAt: number
  driveFileId?: string
  driveWebViewLink?: string
}

export type TimelineRecord = {
  id: string
  kind: 'opened' | 'generated' | 'edited' | 'workspace'
  label: string
  detail: string
  at: number
}

type AccountLibrary = {
  favorites: DrivePdfFile[]
  recent: DrivePdfFile[]
}

type LibraryState = {
  accounts: Record<string, AccountLibrary>
  generated: GeneratedDocumentRecord[]
  timeline: TimelineRecord[]
  toggleFavorite: (userId: string, file: DrivePdfFile) => void
  recordOpened: (userId: string, file: DrivePdfFile) => void
  addGenerated: (record: GeneratedDocumentRecord) => void
  addTimeline: (record: Omit<TimelineRecord, 'id' | 'at'> & { at?: number }) => void
  updateGeneratedDriveFile: (id: string, driveFileId: string, driveWebViewLink?: string) => void
  clearAccount: (userId: string) => void
  clearAll: () => void
}

function loadLibrary() {
  if (typeof window === 'undefined') return { accounts: {}, generated: [], timeline: [] }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as {
      accounts?: Record<string, AccountLibrary>
      generated?: GeneratedDocumentRecord[]
      timeline?: TimelineRecord[]
    }
    return {
      accounts: parsed.accounts ?? {},
      generated: Array.isArray(parsed.generated) ? parsed.generated : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
    }
  } catch {
    return { accounts: {}, generated: [], timeline: [] }
  }
}

const initial = loadLibrary()

export const useLibraryStore = create<LibraryState>((set) => ({
  ...initial,
  toggleFavorite: (userId, file) =>
    set((state) => {
      const account = state.accounts[userId] ?? { favorites: [], recent: [] }
      const exists = account.favorites.some((item) => item.id === file.id)
      const favorites = exists
        ? account.favorites.filter((item) => item.id !== file.id)
        : [file, ...account.favorites]
      return { accounts: { ...state.accounts, [userId]: { ...account, favorites } } }
    }),
  recordOpened: (userId, file) =>
    set((state) => {
      const account = state.accounts[userId] ?? { favorites: [], recent: [] }
      const recent = [file, ...account.recent.filter((item) => item.id !== file.id)].slice(0, 12)
      const timeline = [
        { id: crypto.randomUUID(), kind: 'opened' as const, label: file.name, detail: 'Opened from Google Drive', at: Date.now() },
        ...state.timeline,
      ].slice(0, 40)
      return { accounts: { ...state.accounts, [userId]: { ...account, recent } }, timeline }
    }),
  addGenerated: (record) =>
    set((state) => {
      const timelineRecord: TimelineRecord = {
        id: crypto.randomUUID(),
        kind: 'generated',
        label: record.filename,
        detail: `${record.pageCount} pages generated`,
        at: record.generatedAt,
      }
      return {
        generated: [record, ...state.generated].slice(0, 20),
        timeline: [timelineRecord, ...state.timeline].slice(0, 40),
      }
    }),
  addTimeline: (record) =>
    set((state) => {
      const timelineRecord: TimelineRecord = {
        id: crypto.randomUUID(),
        at: record.at ?? Date.now(),
        kind: record.kind,
        label: record.label,
        detail: record.detail,
      }
      return { timeline: [timelineRecord, ...state.timeline].slice(0, 40) }
    }),
  updateGeneratedDriveFile: (id, driveFileId, driveWebViewLink) =>
    set((state) => ({
      generated: state.generated.map((record) =>
        record.id === id ? { ...record, driveFileId, driveWebViewLink } : record,
      ),
    })),
  clearAccount: (userId) =>
    set((state) => {
      const accounts = { ...state.accounts }
      delete accounts[userId]
      return { accounts }
    }),
  clearAll: () => set({ accounts: {}, generated: [], timeline: [] }),
}))

let libraryTimer: number | undefined
useLibraryStore.subscribe((state, previous) => {
  if (typeof window === 'undefined') return
  if (state.accounts === previous.accounts && state.generated === previous.generated && state.timeline === previous.timeline) return
  window.clearTimeout(libraryTimer)
  libraryTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts: state.accounts, generated: state.generated, timeline: state.timeline }))
  }, 120)
})
