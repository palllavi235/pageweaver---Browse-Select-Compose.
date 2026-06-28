import { lazy, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ConnectivityBanner } from '@/components/connectivity-banner'
import { useWorkspaceShortcuts } from '@/hooks/use-workspace-shortcuts'

const ComposerPanel = lazy(() =>
  import('@/components/composer-panel').then((module) => ({ default: module.ComposerPanel })),
)

export function AppLayout() {
  useWorkspaceShortcuts()
  return <div className="min-h-screen bg-paper"><a className="sr-only z-[100] rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4" href="#main-content">Skip to workspace</a><Sidebar /><div className="lg:pl-64"><ConnectivityBanner /><Topbar /><main id="main-content" tabIndex={-1}><Outlet /></main></div><Suspense fallback={null}><ComposerPanel /></Suspense></div>
}
