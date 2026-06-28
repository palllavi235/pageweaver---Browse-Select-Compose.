import { create } from 'zustand'
import type { DriveSort } from '@/features/drive/drive-service'

export type DriveView = 'all' | 'recent' | 'favorites' | 'generated'
export type FolderCrumb = { id: string; name: string }

type DriveState = {
  search: string
  sort: DriveSort
  view: DriveView
  folderPath: FolderCrumb[]
  pageToken: string | undefined
  pageHistory: string[]
  setSearch: (search: string) => void
  setSort: (sort: DriveSort) => void
  setView: (view: DriveView) => void
  enterFolder: (folder: FolderCrumb) => void
  goToFolder: (index: number) => void
  nextPage: (token: string) => void
  previousPage: () => void
  resetPagination: () => void
}

export const useDriveStore = create<DriveState>((set) => ({
  search: '',
  sort: 'modifiedTime desc',
  view: 'all',
  folderPath: [{ id: 'root', name: 'My Drive' }],
  pageToken: undefined,
  pageHistory: [],
  setSearch: (search) => set({ search, pageToken: undefined, pageHistory: [] }),
  setSort: (sort) => set({ sort, pageToken: undefined, pageHistory: [] }),
  setView: (view) => set({ view, search: '', pageToken: undefined, pageHistory: [] }),
  enterFolder: (folder) =>
    set((state) => ({
      folderPath: [...state.folderPath, folder],
      search: '',
      pageToken: undefined,
      pageHistory: [],
    })),
  goToFolder: (index) =>
    set((state) => ({
      folderPath: state.folderPath.slice(0, index + 1),
      search: '',
      pageToken: undefined,
      pageHistory: [],
    })),
  nextPage: (token) =>
    set((state) => ({
      pageHistory: [...state.pageHistory, state.pageToken ?? ''],
      pageToken: token,
    })),
  previousPage: () =>
    set((state) => {
      const pageHistory = [...state.pageHistory]
      const previous = pageHistory.pop()
      return { pageHistory, pageToken: previous || undefined }
    }),
  resetPagination: () => set({ pageToken: undefined, pageHistory: [] }),
}))
