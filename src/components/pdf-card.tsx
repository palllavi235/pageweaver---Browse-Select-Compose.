import { Clock3, FileText, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { PdfFile } from '@/types'
import { Badge, IconButton } from './ui'
import { cn } from '@/utils/cn'

const toneStyles = {
  tan: 'bg-[#e8d8be] text-[#77512f]',
  sage: 'bg-[#dce4d4] text-[#546c50]',
  clay: 'bg-[#ead4cd] text-[#8f5549]',
  blue: 'bg-[#d9e0e4] text-[#506b78]',
}

export function DocumentPreview({ tone, page = 1, compact = false }: { tone: PdfFile['tone']; page?: number; compact?: boolean }) {
  return <div className={cn('relative overflow-hidden rounded-xl border border-white/70 shadow-sm', toneStyles[tone], compact ? 'h-20 w-14' : 'aspect-[4/3] w-full')}>
    <div className="absolute inset-x-[15%] top-[12%] h-[76%] rounded-[3px] bg-surface/90 p-[9%] shadow-sm">
      <div className="h-[5%] w-3/4 rounded bg-current opacity-60" />
      <div className="mt-[14%] space-y-[9%]"><div className="h-px bg-current opacity-20" /><div className="h-px bg-current opacity-20" /><div className="h-px w-4/5 bg-current opacity-20" /></div>
      <span className="absolute bottom-[8%] right-[10%] text-[8px] opacity-60">{page}</span>
    </div>
  </div>
}

export function PdfCard({ file }: { file: PdfFile }) {
  return <motion.article whileHover={{ y: -3 }} transition={{ duration: .2 }} className="group min-w-0">
    <Link to={`/app/viewer/${file.id}`} className="block">
      <DocumentPreview tone={file.tone} />
      <div className="mt-3 flex items-start gap-2">
        <span className="mt-0.5 rounded-lg bg-[#f1e5d5] p-1.5 text-leather"><FileText className="size-4" /></span>
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{file.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3" />{file.updated} · {file.pages} pages</p></div>
        <IconButton aria-label={`More options for ${file.title}`} className="size-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="size-4" /></IconButton>
      </div>
    </Link>
  </motion.article>
}

export function ProjectCard({ title, pages, updated }: { title: string; pages: number; updated: string }) {
  return <Link to="/app/composer" className="group flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex -space-x-5">{(['tan', 'sage', 'clay'] as const).map((tone, index) => <div key={tone} className="rounded-lg border-2 border-surface shadow-sm" style={{ zIndex: 3 - index }}><DocumentPreview compact page={index + 1} tone={tone} /></div>)}</div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold group-hover:text-leather">{title}</h3><p className="mt-1 text-xs text-muted">{pages} pages · Edited {updated}</p></div><Badge>{pages}p</Badge></Link>
}
