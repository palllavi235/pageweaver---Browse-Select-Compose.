import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

type LogoMarkProps = {
  className?: string
  animated?: boolean
  monochrome?: boolean
}

export function LogoMark({ className, animated = false, monochrome = false }: LogoMarkProps) {
  const Sheet = animated ? motion.path : 'path'
  return (
    <svg
      aria-hidden="true"
      className={cn('size-9', className)}
      fill="none"
      viewBox="0 0 48 48"
    >
      <rect fill={monochrome ? 'currentColor' : '#775035'} height="48" rx="14" width="48" />
      <Sheet
        animate={animated ? { y: [0, -1.5, 0] } : undefined}
        d="M12 13.5C12 12.12 13.12 11 14.5 11H29l7 7v15.5c0 1.38-1.12 2.5-2.5 2.5h-19a2.5 2.5 0 0 1-2.5-2.5v-20Z"
        fill={monochrome ? '#775035' : '#FFFDF8'}
        opacity=".96"
        transition={animated ? { duration: 1.8, ease: 'easeInOut', repeat: Infinity } : undefined}
      />
      <path d="M29 11v5a2 2 0 0 0 2 2h5" fill={monochrome ? 'currentColor' : '#D5BC8A'} opacity=".85" />
      <Sheet
        animate={animated ? { x: [0, 1.2, 0] } : undefined}
        d="M16 20.5c5-3.6 10.9 3.9 16 0v4.25c-5.1 3.9-11-3.55-16 0V20.5Z"
        fill={monochrome ? 'currentColor' : '#B49359'}
        opacity=".92"
        transition={animated ? { duration: 1.8, ease: 'easeInOut', repeat: Infinity } : undefined}
      />
      <Sheet
        animate={animated ? { x: [0, -1.2, 0] } : undefined}
        d="M16 25.2c5-3.65 10.9 3.85 16 0v4.2c-5.1 3.9-11-3.5-16 0v-4.2Z"
        fill={monochrome ? 'currentColor' : '#775035'}
        opacity=".9"
        transition={animated ? { duration: 1.8, delay: 0.18, ease: 'easeInOut', repeat: Infinity } : undefined}
      />
      <path d="M18 33h12" stroke={monochrome ? 'currentColor' : '#D7C7AD'} strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}
