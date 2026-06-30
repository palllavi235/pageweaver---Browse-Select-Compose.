import { ArrowRight, Check, FileStack, Layers3, MousePointer2, MoveHorizontal, Play, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { Button, Card } from '@/components/ui'
import { DocumentPreview } from '@/components/pdf-card'
import { GoogleAuthButton } from '@/components/auth-button'

const features = [
  { icon: MousePointer2, title: 'Choose visually', text: 'Browse page thumbnails and select exactly what belongs in your document.' },
  { icon: MoveHorizontal, title: 'Arrange naturally', text: 'Pull pages from many sources, then reorder everything with a simple drag.' },
  { icon: Zap, title: 'Export in moments', text: 'Generate one polished PDF without the split-extract-merge ritual.' },
]

export function LandingPage() {
  return <div className="min-h-screen overflow-x-hidden bg-paper">
    <header className="page-shell flex h-20 items-center justify-between">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex"><a href="#how">How it works</a><a href="#features">Features</a><Link to="/about">About</Link></nav>
      <div className="flex items-center gap-2"><div className="hidden sm:block"><GoogleAuthButton compact redirectTo="/app" /></div><Link to="/app"><Button variant="secondary">Open workspace <ArrowRight className="size-4" /></Button></Link></div>
    </header>
    <main>
      <section className="page-shell relative grid min-h-[760px] items-center gap-14 py-16 lg:grid-cols-[.9fr_1.1fr] lg:py-24">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs font-semibold text-leather shadow-sm"><Sparkles className="size-3.5" /> A calmer way to compose PDFs</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[72px]">Weave pages into one <em className="font-normal text-leather">seamless</em> document.</motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="mt-7 max-w-xl text-lg leading-8 text-muted">Select pages from all your PDFs, arrange them visually, and create the document you need without downloading, splitting, or starting over.</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }} className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/app"><Button size="lg" className="w-full sm:w-auto">Start weaving <ArrowRight className="size-4" /></Button></Link><a href="#how"><Button size="lg" variant="secondary"><Play className="size-4 fill-current" /> See how it works</Button></a></motion.div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="size-4 text-success" /> Your files stay private and in your control.</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: .96, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: .15, duration: .55 }} className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-20 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative rounded-[28px] border bg-[#f1eadf] p-3 shadow-lift sm:p-5">
            <div className="flex items-center justify-between px-2 pb-4"><div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-[#d5a79c]" /><span className="size-2.5 rounded-full bg-[#ddc58e]" /><span className="size-2.5 rounded-full bg-[#a9c1a6]" /></div><span className="text-[11px] font-semibold text-muted">My study pack</span><span className="text-[10px] text-muted">8 pages</span></div>
            <div className="grid min-h-[460px] grid-cols-[1fr_110px] gap-3 sm:grid-cols-[1fr_180px]">
              <div className="paper-grid rounded-2xl border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold"><FileStack className="size-4 text-leather" /> Source documents</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(['tan', 'sage', 'clay', 'blue', 'sage', 'tan'] as const).map((tone, index) => <motion.div key={index} whileHover={{ y: -3 }}><DocumentPreview tone={tone} page={index * 4 + 3} /></motion.div>)}</div>
              </div>
              <div className="rounded-2xl border bg-surface p-2 sm:p-3"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted">Current document</p><div className="space-y-2">{(['sage', 'clay', 'blue'] as const).map((tone, index) => <div className="flex items-center gap-2 rounded-lg border bg-paper p-1.5" key={tone}><span className="text-line">::</span><DocumentPreview compact tone={tone} page={index + 8} /><span className="hidden text-[10px] font-semibold sm:block">Page {index + 1}</span></div>)}</div><button className="mt-3 w-full rounded-lg bg-leather py-2 text-[10px] font-bold text-white">Generate PDF</button></div>
            </div>
          </div>
        </motion.div>
      </section>
      <section id="how" className="scroll-mt-20 border-y bg-surface py-24">
        <div className="page-shell"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-leather">A better workflow</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">From scattered pages to finished work.</h2><p className="mt-5 text-muted">The familiar canvas experience, thoughtfully designed for documents.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <Card key={title} className="relative overflow-hidden p-7"><span className="absolute right-5 top-3 font-display text-6xl text-[#eee5d7]">0{index + 1}</span><div className="relative grid size-11 place-items-center rounded-xl bg-[#eee3d2] text-leather"><Icon className="size-5" /></div><h3 className="relative mt-6 font-display text-2xl font-semibold">{title}</h3><p className="relative mt-3 text-sm leading-6 text-muted">{text}</p></Card>)}</div>
        </div>
      </section>
      <section id="features" className="page-shell scroll-mt-20 py-24"><div className="grid items-center gap-14 rounded-[32px] bg-ink px-6 py-14 text-white shadow-lift sm:px-12 lg:grid-cols-2 lg:p-16"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#d5b36c]">Designed for focus</p><h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Your documents deserve a proper workspace.</h2><p className="mt-5 max-w-xl leading-7 text-[#c8c1b8]">PageWeaver keeps source material, selected pages, and final order visible in one calm, considered space.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{['Visual page selection', 'Effortless reordering', 'Drive-native workflow', 'Private by design'].map((item) => <p key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-[#cfb06b]" />{item}</p>)}</div></div><div className="grid grid-cols-2 gap-3"><Card className="border-white/10 bg-white/5 p-5 text-white"><Layers3 className="size-6 text-[#cfb06b]" /><p className="mt-8 font-display text-2xl">One canvas</p><p className="mt-2 text-sm text-[#c8c1b8]">Every source, side by side.</p></Card><Card className="mt-8 border-white/10 bg-white/5 p-5 text-white"><Zap className="size-6 text-[#cfb06b]" /><p className="mt-8 font-display text-2xl">Instant feel</p><p className="mt-2 text-sm text-[#c8c1b8]">Built for long documents.</p></Card></div></div></section>
    </main>
    <footer className="border-t"><div className="page-shell flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between"><Brand /><p className="text-xs text-muted">© 2026 PageWeaver. Made for better documents.</p><div className="flex gap-5 text-xs font-medium text-muted"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div></footer>
  </div>
}
