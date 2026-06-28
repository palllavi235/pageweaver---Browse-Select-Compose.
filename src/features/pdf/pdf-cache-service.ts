import { downloadDrivePdf } from '@/features/drive/drive-service'
import { usePdfCacheStore } from '@/store/use-pdf-cache-store'

type CacheEntry = {
  data: ArrayBuffer
  accessedAt: number
}

const MAX_CACHE_BYTES = 200 * 1024 * 1024
const MAX_CACHE_FILES = 6
const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<ArrayBuffer>>()
const controllers = new Map<string, AbortController>()

function cacheSize() {
  return [...cache.values()].reduce((total, entry) => total + entry.data.byteLength, 0)
}

export function getPdfCacheStats() {
  return {
    files: cache.size,
    bytes: cacheSize(),
    inFlight: inFlight.size,
    maxBytes: MAX_CACHE_BYTES,
    maxFiles: MAX_CACHE_FILES,
  }
}

function evictIfNeeded() {
  while (cache.size > MAX_CACHE_FILES || cacheSize() > MAX_CACHE_BYTES) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].accessedAt - b[1].accessedAt)[0]
    if (!oldest) return
    cache.delete(oldest[0])
    usePdfCacheStore.getState().removeEntry(oldest[0])
  }
}

export function getCachedPdf(fileId: string) {
  const entry = cache.get(fileId)
  if (!entry) return undefined
  entry.accessedAt = Date.now()
  return entry.data
}

export function loadCachedPdf(fileId: string, options?: { signal?: AbortSignal; force?: boolean }) {
  if (options?.force) {
    cache.delete(fileId)
    controllers.get(fileId)?.abort()
    controllers.delete(fileId)
    inFlight.delete(fileId)
  }
  const cached = getCachedPdf(fileId)
  if (cached) return Promise.resolve(cached)

  const existing = inFlight.get(fileId)
  if (existing) return existing

  const store = usePdfCacheStore.getState()
  store.setEntry(fileId, { status: 'loading', progress: 0 })
  const controller = new AbortController()
  const abort = () => controller.abort()
  options?.signal?.addEventListener('abort', abort, { once: true })
  controllers.set(fileId, controller)
  const request = downloadDrivePdf(fileId, {
    signal: controller.signal,
    onProgress: (progress) => {
      usePdfCacheStore.getState().setEntry(fileId, { status: 'loading', progress })
    },
  })
    .then((data) => {
      cache.set(fileId, { data, accessedAt: Date.now() })
      usePdfCacheStore.getState().setEntry(fileId, {
        status: 'ready',
        progress: 100,
        bytes: data.byteLength,
      })
      evictIfNeeded()
      return data
    })
    .catch((error: unknown) => {
      if ((error as { name?: string }).name !== 'AbortError') {
        usePdfCacheStore.getState().setEntry(fileId, {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'The PDF could not be loaded.',
        })
      }
      throw error
    })
    .finally(() => {
      inFlight.delete(fileId)
      controllers.delete(fileId)
      options?.signal?.removeEventListener('abort', abort)
    })

  inFlight.set(fileId, request)
  return request
}

export function clearPdfCache() {
  for (const controller of controllers.values()) controller.abort()
  cache.clear()
  inFlight.clear()
  controllers.clear()
  usePdfCacheStore.getState().reset()
}
