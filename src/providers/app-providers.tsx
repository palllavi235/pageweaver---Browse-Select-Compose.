import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui'
import { useAuthStore } from '@/store/use-auth-store'
import { clearPdfCache } from '@/features/pdf/pdf-cache-service'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { useGenerationStore } from '@/store/use-generation-store'
import { useDriveUploadStore } from '@/store/use-drive-upload-store'
import { useLibraryStore } from '@/store/use-library-store'
import { useSettingsStore } from '@/store/use-settings-store'
import { ErrorBoundary } from '@/components/error-boundary'

function SessionBoundary({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  const userId = useAuthStore((state) => state.session?.user.id)
  const previousUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (previousUserId.current && previousUserId.current !== userId) {
      queryClient.clear()
      clearPdfCache()
      useWorkspaceStore.getState().resetWorkspace()
      useGenerationStore.getState().reset()
      useDriveUploadStore.getState().reset()
      useLibraryStore.getState().clearAll()
    }
    previousUserId.current = userId
  }, [queryClient, userId])

  return children
}

function PreferenceBoundary({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)
  const density = useSettingsStore((state) => state.density)
  const reduceMotion = useSettingsStore((state) => state.reduceMotion)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolvedTheme = theme === 'system' ? (media.matches ? 'ink' : 'paper') : theme
      document.documentElement.dataset.theme = resolvedTheme
      document.documentElement.dataset.density = density
      document.documentElement.dataset.reduceMotion = String(reduceMotion)
    }

    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [density, reduceMotion, theme])

  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } } }))
  return <ErrorBoundary><QueryClientProvider client={queryClient}><ToastProvider><PreferenceBoundary><SessionBoundary queryClient={queryClient}>{children}</SessionBoundary></PreferenceBoundary></ToastProvider></QueryClientProvider></ErrorBoundary>
}
