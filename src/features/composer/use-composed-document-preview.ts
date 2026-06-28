import { useEffect, useMemo, useRef, useState } from 'react'
import type { WorkspacePageGroup } from './types'
import { generateWorkspacePdf } from './generation-service'

type PreviewState = {
  status: 'idle' | 'preparing' | 'ready' | 'error'
  blobUrl: string | null
  progress: number
  message: string
  error: string | null
  bytes: number
}

const INITIAL_STATE: PreviewState = {
  status: 'idle',
  blobUrl: null,
  progress: 0,
  message: '',
  error: null,
  bytes: 0,
}

function createWorkspaceSignature(groups: WorkspacePageGroup[]) {
  return groups
    .map((group) => `${group.id}:${group.sourceFileId}:${group.pages.join(',')}`)
    .join('|')
}

export function useComposedDocumentPreview(groups: WorkspacePageGroup[], updatedAt: number) {
  const [state, setState] = useState<PreviewState>(INITIAL_STATE)
  const currentUrlRef = useRef<string | null>(null)
  const requestRef = useRef(0)
  const signature = useMemo(() => createWorkspaceSignature(groups), [groups])

  useEffect(() => {
    if (!groups.length) {
      requestRef.current += 1
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
      setState(INITIAL_STATE)
      return
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId
    const timer = window.setTimeout(() => {
      setState((previous) => ({
        ...previous,
        status: 'preparing',
        progress: 4,
        message: 'Preparing live preview…',
        error: null,
      }))

      void generateWorkspacePdf(groups, ({ progress, message }) => {
        if (requestRef.current !== requestId) return
        setState((previous) => ({
          ...previous,
          status: 'preparing',
          progress,
          message: message.replaceAll('â€¦', '…'),
        }))
      })
        .then((bytes) => {
          if (requestRef.current !== requestId) return
          const nextUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
          const previousUrl = currentUrlRef.current
          currentUrlRef.current = nextUrl
          if (previousUrl) URL.revokeObjectURL(previousUrl)
          setState({
            status: 'ready',
            blobUrl: nextUrl,
            progress: 100,
            message: 'Preview ready',
            error: null,
            bytes: bytes.byteLength,
          })
        })
        .catch((error) => {
          if (requestRef.current !== requestId) return
          setState((previous) => ({
            ...previous,
            status: 'error',
            progress: 0,
            message: '',
            error: error instanceof Error ? error.message : 'The document preview could not be rendered.',
          }))
        })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [groups, signature, updatedAt])

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
    }
  }, [])

  return state
}
