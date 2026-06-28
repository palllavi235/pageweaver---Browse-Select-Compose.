import {
  AlertTriangle,
  Check,
  ChevronDown,
  Info,
  LoaderCircle,
  MoreVertical,
  Search as SearchIcon,
  X,
} from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { LogoMark } from '@/components/logo-mark'
import { WovenPagesIllustration } from '@/components/illustrations'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ className, variant = 'primary', size = 'md', loading, children, disabled, type, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-leather text-white shadow-sm hover:bg-[#754c29]',
    secondary: 'border bg-surface text-ink hover:bg-[#f5eee2]',
    ghost: 'text-muted hover:bg-[#eee7da] hover:text-ink',
    danger: 'bg-danger text-white hover:bg-[#a94b40]',
  }
  const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-[15px]' }
  return (
    <button
      aria-busy={loading || undefined}
      className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45', variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      type={type ?? 'button'}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function IconButton({ className, children, 'aria-label': ariaLabel, type, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button aria-label={ariaLabel} className={cn('inline-flex size-10 items-center justify-center rounded-xl text-muted transition hover:bg-[#eee7da] hover:text-ink', className)} type={type ?? 'button'} {...props}>
      {children}
    </button>
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border bg-surface shadow-soft', className)} {...props} />
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
export function Input({ className, label, hint, id: providedId, ...props }: InputProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  return (
    <label htmlFor={id} className="block space-y-2 text-sm font-medium">
      {label && <span>{label}</span>}
      <input id={id} className={cn('h-11 w-full rounded-xl border bg-surface px-3.5 text-sm shadow-sm placeholder:text-[#aaa195] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20', className)} {...props} />
      {hint && <span className="block text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

export function Search({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('flex h-11 items-center gap-2.5 rounded-xl border bg-surface px-3.5 text-muted shadow-sm focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20', className)}>
      <SearchIcon className="size-4 shrink-0" />
      <input aria-label="Search" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-[#9c9388]" {...props} />
      <kbd className="hidden rounded-md border bg-paper px-1.5 py-0.5 text-[10px] sm:block">Ctrl K</kbd>
    </label>
  )
}

export function Badge({ children, className, tone = 'neutral' }: { children: ReactNode; className?: string; tone?: 'neutral' | 'gold' | 'success' | 'danger' }) {
  const tones = { neutral: 'bg-[#eee8dd] text-muted', gold: 'bg-[#f3e7cb] text-[#76591f]', success: 'bg-[#e4eee3] text-success', danger: 'bg-[#f5e1dd] text-danger' }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-[#e8e0d3]', className)} />
}

export function Loader({ label = 'Loading workspace' }: { label?: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center gap-4 text-sm text-muted"><LogoMark animated className="size-12 shadow-soft" /><span className="font-medium">{label}</span><span className="h-px w-16 overflow-hidden bg-line"><motion.span className="block h-full w-1/2 bg-leather" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }} /></span></div>
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return <div aria-label={`${Math.round(value)} percent`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(value)} className={cn('h-2 overflow-hidden rounded-full bg-[#e8e0d3]', className)} role="progressbar"><div className="h-full rounded-full bg-leather transition-all" style={{ width: `${Math.min(value, 100)}%` }} /></div>
}

export function Breadcrumb({ items }: { items: string[] }) {
  return <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">{items.map((item, index) => <span className={cn(index === items.length - 1 && 'font-medium text-ink')} key={item}>{index > 0 && <span className="mr-2 text-line">/</span>}{item}</span>)}</nav>
}

export function EmptyState({ icon: Icon = Info, title, description, action }: { icon?: typeof Info; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-surface p-8 text-center"><div className="relative mb-1 w-40"><WovenPagesIllustration /><span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl border bg-surface text-leather shadow-soft"><Icon className="size-4" /></span></div><h3 className="font-display text-xl font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}

export function ErrorState({ title = 'Something went awry', description }: { title?: string; description: string }) {
  return <EmptyState icon={AlertTriangle} title={title} description={description} />
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return <div className="inline-flex rounded-xl border bg-[#eee7da]/70 p-1" role="tablist">{tabs.map((tab) => <button aria-selected={active === tab} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition', active === tab && 'bg-surface text-ink shadow-sm')} key={tab} onClick={() => onChange(tab)} role="tab" type="button">{tab}</button>)}</div>
}

export function Dropdown({ label, items, onChange }: { label: string; items: string[]; onChange?: (value: string) => void }) {
  return <div className="relative"><select aria-label={label} className="h-10 appearance-none rounded-xl border bg-surface py-0 pl-3 pr-9 text-sm font-medium outline-none focus:ring-2 focus:ring-gold/20" onChange={(event) => onChange?.(event.target.value)}>{items.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted" /></div>
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group relative inline-flex">{children}<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">{label}</span></span>
}

export type OverflowMenuItem = {
  label: string
  icon?: ReactNode
  destructive?: boolean
  onSelect: () => void
}

export function OverflowMenu({ label = 'More actions', items }: { label?: string; items: OverflowMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <IconButton aria-expanded={open} aria-haspopup="menu" aria-label={label} className="size-8" onClick={() => setOpen((value) => !value)}>
        <MoreVertical className="size-4" />
      </IconButton>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 min-w-44 rounded-xl border bg-surface p-1 shadow-lift" role="menu">
          {items.map((item) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-[#eee7da]',
                item.destructive ? 'text-danger hover:bg-[#f5e1dd]' : 'text-ink',
              )}
              key={item.label}
              onClick={() => {
                item.onSelect()
                setOpen(false)
              }}
              role="menuitem"
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    window.requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(focusableSelector)
      ;(firstFocusable ?? panelRef.current)?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.button aria-label="Close dialog" className="absolute inset-0 bg-ink/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} type="button" />
          <motion.div
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: .97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .97, y: 10 }}
            ref={panelRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold" id={titleId}>{title}</h2>
              <IconButton aria-label="Close" onClick={onClose}><X className="size-5" /></IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const Modal = Dialog

type ToastTone = 'success' | 'error' | 'info'
type ToastMessage = { id: number; message: string; tone: ToastTone }
const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => undefined)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const dismiss = (id: number) => setToasts((items) => items.filter((item) => item.id !== id))
  const show = (message: string, tone: ToastTone = 'success') => { const id = Date.now(); setToasts((items) => [...items, { id, message, tone }]); window.setTimeout(() => dismiss(id), tone === 'error' ? 5000 : 3500) }
  return <ToastContext.Provider value={show}>{children}<div aria-live="polite" className="fixed bottom-5 right-5 z-[60] w-[min(360px,calc(100vw-2rem))] space-y-2"><AnimatePresence>{toasts.map((toast) => <motion.div key={toast.id} initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lift" role={toast.tone === 'error' ? 'alert' : 'status'}>{toast.tone === 'error' ? <AlertTriangle className="size-4 shrink-0 text-[#e8a99f]" /> : toast.tone === 'info' ? <Info className="size-4 shrink-0 text-[#dbc18c]" /> : <Check className="size-4 shrink-0 text-[#b9d8b7]" />}<span className="flex-1">{toast.message}</span><button aria-label="Dismiss notification" className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => dismiss(toast.id)} type="button"><X className="size-3.5" /></button></motion.div>)}</AnimatePresence></div></ToastContext.Provider>
}
export const useToast = () => useContext(ToastContext)
