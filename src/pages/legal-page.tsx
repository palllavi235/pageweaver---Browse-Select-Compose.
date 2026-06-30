import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Brand } from '@/components/brand'
import { Button, Card } from '@/components/ui'

const content = {
  privacy: {
    title: 'Privacy',
    updated: 'Last updated June 30, 2026',
    paragraphs: [
      'PageWeaver is designed around local-first document composition. Source PDF bytes are used in memory for viewing and generation, not stored in browser persistence.',
      'Google Drive access is used to browse PDFs you choose to open. Generated PDFs are uploaded to Drive only after you explicitly confirm that action.',
      'Local history is scoped to the signed-in account where possible. Shared browsers should still use Sign out when switching users.',
    ],
  },
  terms: {
    title: 'Terms',
    updated: 'Last updated June 30, 2026',
    paragraphs: [
      'PageWeaver helps you select, arrange, and generate PDF documents from files you are allowed to access.',
      'You remain responsible for the documents you open, compose, download, and upload through the application.',
      'This placeholder terms page is intentionally simple and should be replaced with full legal terms before a public launch.',
    ],
  },
}

export function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const page = content[type]

  return (
    <div className="min-h-screen bg-paper">
      <header className="page-shell flex h-20 items-center justify-between">
        <Brand />
        <Link to="/">
          <Button variant="secondary"><ArrowLeft className="size-4" /> Back home</Button>
        </Link>
      </header>
      <main className="page-shell py-12 sm:py-16">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e1e8dc] text-success"><ShieldCheck className="size-5" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-leather">{page.updated}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{page.title}</h1>
          <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
            {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </Card>
      </main>
    </div>
  )
}
