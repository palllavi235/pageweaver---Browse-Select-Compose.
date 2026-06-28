import type { WorkspacePageGroup } from './types'
import { loadCachedPdf } from '@/features/pdf/pdf-cache-service'

type GenerationProgress = { progress: number; message: string }

export async function generateWorkspacePdf(
  groups: WorkspacePageGroup[],
  onProgress: (progress: GenerationProgress) => void,
): Promise<Uint8Array> {
  if (!groups.length) throw new Error('Add at least one page group before generating a PDF.')
  if (groups.some((group) => group.pages.length === 0)) throw new Error('Every page group must contain at least one page.')

  const fileIds = [...new Set(groups.map((group) => group.sourceFileId))]
  const sources: Array<{ fileId: string; data: ArrayBuffer }> = []
  for (const [index, fileId] of fileIds.entries()) {
    const data = await loadCachedPdf(fileId)
    sources.push({ fileId, data: data.slice(0) })
    onProgress({
      progress: Math.round(((index + 1) / fileIds.length) * 10),
      message: `Preparing source ${index + 1} of ${fileIds.length}…`,
    })
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./pdf-generation.worker.ts', import.meta.url), { type: 'module' })
    const cleanup = () => worker.terminate()
    worker.onerror = () => {
      cleanup()
      reject(new Error('The background PDF engine stopped unexpectedly.'))
    }
    worker.onmessage = (event: MessageEvent<
      | { type: 'progress'; progress: number; message: string }
      | { type: 'success'; data: ArrayBuffer }
      | { type: 'error'; message: string }
    >) => {
      if (event.data.type === 'progress') onProgress(event.data)
      if (event.data.type === 'success') {
        cleanup()
        resolve(new Uint8Array(event.data.data))
      }
      if (event.data.type === 'error') {
        cleanup()
        reject(new Error(event.data.message))
      }
    }
    worker.postMessage(
      {
        type: 'generate',
        groups: groups.map(({ sourceFileId, pages }) => ({ sourceFileId, pages })),
        sources,
        title: `PageWeaver composition — ${new Date().toLocaleDateString()}`,
      },
      sources.map((source) => source.data),
    )
  })
}
