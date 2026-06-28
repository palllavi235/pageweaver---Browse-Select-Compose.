import { useEffect, useState } from 'react'
import { loadCachedPdf } from './pdf-cache-service'
import { usePdfCacheStore } from '@/store/use-pdf-cache-store'

export function usePdfBuffer(fileId: string | undefined) {
  const [loaded, setLoaded] = useState<{ fileId: string; data: ArrayBuffer }>()
  const entry = usePdfCacheStore((state) => (fileId ? state.entries[fileId] : undefined))

  useEffect(() => {
    if (!fileId) return
    const controller = new AbortController()
    void loadCachedPdf(fileId, { signal: controller.signal })
      .then((data) => setLoaded({ fileId, data: data.slice(0) }))
      .catch(() => undefined)
    return () => controller.abort()
  }, [fileId])

  const retry = async () => {
    if (!fileId) return
    const next = await loadCachedPdf(fileId, { force: true })
    setLoaded({ fileId, data: next.slice(0) })
  }
  const data = loaded && loaded.fileId === fileId ? loaded.data : undefined

  return {
    data,
    status: entry?.status ?? 'idle',
    progress: entry?.progress ?? 0,
    error: entry?.error,
    retry,
  }
}
