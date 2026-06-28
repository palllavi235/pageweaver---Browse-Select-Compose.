import { create } from 'zustand'
import type { GenerationResult } from '@/features/composer/types'

type GenerationState = {
  status: 'idle' | 'preparing' | 'generating' | 'success' | 'error'
  progress: number
  message: string
  result: GenerationResult | null
  error: string | null
  start: () => void
  update: (progress: number, message: string) => void
  succeed: (result: GenerationResult) => void
  fail: (error: string) => void
  reset: () => void
}

function revokeResultUrl(result: GenerationResult | null) {
  if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl)
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  status: 'idle',
  progress: 0,
  message: '',
  result: null,
  error: null,
  start: () => {
    revokeResultUrl(get().result)
    set({ status: 'preparing', progress: 0, message: 'Preparing source documents…', result: null, error: null })
  },
  update: (progress, message) => set({ status: 'generating', progress, message }),
  succeed: (result) => set({ status: 'success', progress: 100, message: 'Your PDF is ready.', result, error: null }),
  fail: (error) => set({ status: 'error', progress: 0, message: '', error }),
  reset: () => {
    revokeResultUrl(get().result)
    set({ status: 'idle', progress: 0, message: '', result: null, error: null })
  },
}))
