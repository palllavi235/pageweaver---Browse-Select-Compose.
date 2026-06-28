import { Files, FolderOpen, LayoutDashboard, Settings } from 'lucide-react'
import type { NavItem } from '@/types'

export const appNavigation: NavItem[] = [
  { label: 'Overview', href: '/app', icon: LayoutDashboard },
  { label: 'Drive browser', href: '/app/drive', icon: FolderOpen },
  { label: 'Current document', href: '/app/composer', icon: Files },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]
