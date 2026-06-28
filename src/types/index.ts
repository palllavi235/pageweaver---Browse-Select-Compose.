import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type PdfFile = {
  id: string
  title: string
  pages: number
  size: string
  updated: string
  tone: 'tan' | 'sage' | 'clay' | 'blue'
}
