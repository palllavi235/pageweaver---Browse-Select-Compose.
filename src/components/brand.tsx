import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { LogoMark } from './logo-mark'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark />
      {!compact && <span className="font-display text-xl font-bold tracking-[-0.02em]">PageWeaver</span>}
    </Link>
  )
}
