import { LogOut, Plus, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { appNavigation } from '@/constants/navigation'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { Brand } from './brand'
import { Button, Dialog, IconButton } from './ui'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/use-auth-store'
import { GoogleAuthButton } from './auth-button'
import { WorkspaceSwitcher } from './workspace-switcher'

function SidebarContent() {
  const setSidebarOpen = useWorkspaceStore((state) => state.setSidebarOpen)
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setConfirmSignOut(false)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between px-5">
        <Brand />
        <IconButton aria-label="Close navigation" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="size-5" /></IconButton>
      </div>
      <div className="px-4 pt-3">
        <Button className="w-full justify-start" onClick={() => { createWorkspace(); setSidebarOpen(false) }}><Plus className="size-4" /> New composition</Button>
      </div>
      <div className="mt-4 px-3">
        <WorkspaceSwitcher compact />
      </div>
      <nav className="mt-6 space-y-1 px-3">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Workspace</p>
        {appNavigation.map(({ href, icon: Icon, label }) => (
          <NavLink key={href} to={href} end={href === '/app'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-[#eee7da] hover:text-ink', isActive && 'bg-[#e9dfcf] text-leather')}>
            <Icon className="size-[18px]" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t p-3">
        {session ? (
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-[#eee7da]" onClick={() => setConfirmSignOut(true)} type="button"><LogOut className="size-[18px]" />Sign out</button>
        ) : <GoogleAuthButton className="w-full" compact />}
      </div>
      <Dialog open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out?">
        <p className="text-sm leading-6 text-muted">
          PageWeaver will disconnect Google Drive for this browser. Local workspace metadata remains on this device.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setConfirmSignOut(false)} variant="secondary">Cancel</Button>
          <Button onClick={() => void handleSignOut()} variant="danger"><LogOut className="size-4" /> Sign out</Button>
        </div>
      </Dialog>
    </div>
  )
}

export function Sidebar() {
  const open = useWorkspaceStore((state) => state.sidebarOpen)
  const setOpen = useWorkspaceStore((state) => state.setSidebarOpen)
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-paper lg:block"><SidebarContent /></aside>
      <AnimatePresence>{open && <div className="fixed inset-0 z-50 lg:hidden"><motion.button aria-label="Close navigation" className="absolute inset-0 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} /><motion.aside className="absolute inset-y-0 left-0 w-[min(88vw,320px)] border-r bg-paper shadow-lift" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}><SidebarContent /></motion.aside></div>}</AnimatePresence>
    </>
  )
}
