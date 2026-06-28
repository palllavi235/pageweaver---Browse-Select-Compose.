import { Bell, Files, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { IconButton, Search, Tooltip } from './ui'
import { useWorkspaceStore } from '@/store/use-workspace-store'

const pageTitles: Record<string, string> = {
  '/app': 'Overview',
  '/app/drive': 'Drive browser',
  '/app/composer': 'Output composer',
  '/app/settings': 'Settings',
}

export function Topbar() {
  const location = useLocation()
  const setSidebarOpen = useWorkspaceStore((state) => state.setSidebarOpen)
  const toggleComposer = useWorkspaceStore((state) => state.toggleComposer)
  const pageCount = useWorkspaceStore((state) =>
    state.groups.reduce((total, group) => total + group.pages.length, 0),
  )
  const isDirty = useWorkspaceStore((state) => state.isDirty)
  const title = location.pathname.startsWith('/app/viewer') ? 'PDF viewer' : pageTitles[location.pathname] ?? 'Workspace'

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b bg-paper/95 px-4 backdrop-blur-md sm:px-6">
      <IconButton aria-label="Open navigation" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="size-5" /></IconButton>
      <h1 className="hidden font-display text-xl font-semibold sm:block">{title}</h1>
      <Search className="ml-auto w-full max-w-sm" placeholder="Search your workspace…" />
      <Tooltip label="Notifications"><IconButton aria-label="Notifications" className="hidden sm:inline-flex"><Bell className="size-5" /></IconButton></Tooltip>
      <button onClick={toggleComposer} className="relative inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-sm transition hover:bg-[#f5eee2]">
        <Files className="size-4 text-leather" /><span className="hidden md:inline">Current document</span>
        <span className="grid size-5 place-items-center rounded-full bg-leather text-[10px] text-white">{pageCount}</span>
        {isDirty && <span aria-label="Document has changes not yet generated" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-paper bg-gold" />}
      </button>
    </header>
  )
}
