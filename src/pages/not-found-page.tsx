import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  return <main className="paper-grid grid min-h-screen place-items-center bg-paper p-5"><div className="max-w-md text-center"><Brand className="mb-14 justify-center" /><div className="mx-auto grid size-16 place-items-center rounded-2xl border bg-surface text-leather shadow-soft"><FileQuestion className="size-7" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-leather">Error 404</p><h1 className="mt-3 font-display text-4xl font-semibold">This page slipped out of the binding.</h1><p className="mt-4 leading-7 text-muted">The page you’re looking for may have moved, or perhaps it was never part of this document.</p><Link to="/"><Button className="mt-7"><ArrowLeft className="size-4" /> Return home</Button></Link></div></main>
}
