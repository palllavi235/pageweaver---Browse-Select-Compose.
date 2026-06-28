import { create } from 'zustand'
import type { UploadedDriveFile } from '@/features/drive/drive-upload-service'

type DriveUploadState = {
  status: 'idle' | 'authorizing' | 'uploading' | 'success' | 'error'
  progress: number
  error: string | null
  uploadedFile: UploadedDriveFile | null
  setStatus: (status: DriveUploadState['status']) => void
  setProgress: (progress: number) => void
  succeed: (uploadedFile: UploadedDriveFile) => void
  fail: (error: string) => void
  reset: () => void
}

export const useDriveUploadStore = create<DriveUploadState>((set) => ({
  status: 'idle',
  progress: 0,
  error: null,
  uploadedFile: null,
  setStatus: (status) => set({ status, error: null }),
  setProgress: (progress) => set({ status: 'uploading', progress }),
  succeed: (uploadedFile) => set({ status: 'success', progress: 100, uploadedFile, error: null }),
  fail: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', progress: 0, error: null, uploadedFile: null }),
}))
