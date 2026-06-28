/// <reference lib="webworker" />

import { PDFDocument } from 'pdf-lib'

type WorkerGroup = {
  sourceFileId: string
  pages: number[]
}

type GenerateMessage = {
  type: 'generate'
  groups: WorkerGroup[]
  sources: Array<{ fileId: string; data: ArrayBuffer }>
  title: string
}

type WorkerResponse =
  | { type: 'progress'; progress: number; message: string }
  | { type: 'success'; data: ArrayBuffer }
  | { type: 'error'; message: string }

const worker = self as unknown as DedicatedWorkerGlobalScope

worker.onmessage = async (event: MessageEvent<GenerateMessage>) => {
  if (event.data.type !== 'generate') return
  try {
    const output = await PDFDocument.create()
    output.setTitle(event.data.title)
    output.setProducer('PageWeaver')
    output.setCreator('PageWeaver')
    output.setCreationDate(new Date())

    const sources = new Map<string, PDFDocument>()
    for (const [index, source] of event.data.sources.entries()) {
      sources.set(source.fileId, await PDFDocument.load(source.data, { updateMetadata: false }))
      worker.postMessage({
        type: 'progress',
        progress: 10 + Math.round(((index + 1) / event.data.sources.length) * 20),
        message: 'Reading source documents…',
      } satisfies WorkerResponse)
    }

    const totalPages = event.data.groups.reduce((total, group) => total + group.pages.length, 0)
    let completed = 0
    for (const group of event.data.groups) {
      const source = sources.get(group.sourceFileId)
      if (!source) throw new Error('A source PDF is no longer available.')
      const indices = group.pages.map((page) => page - 1)
      if (indices.some((index) => index < 0 || index >= source.getPageCount())) {
        throw new Error('A selected page is outside its source document.')
      }
      const copied = await output.copyPages(source, indices)
      for (const page of copied) {
        output.addPage(page)
        completed += 1
        worker.postMessage({
          type: 'progress',
          progress: 30 + Math.round((completed / totalPages) * 60),
          message: `Weaving page ${completed} of ${totalPages}…`,
        } satisfies WorkerResponse)
      }
    }

    const bytes = await output.save({ addDefaultPage: false, useObjectStreams: true })
    const transferable = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    worker.postMessage({ type: 'success', data: transferable } satisfies WorkerResponse, [transferable])
  } catch (error) {
    worker.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'PDF generation failed.',
    } satisfies WorkerResponse)
  }
}

export {}
