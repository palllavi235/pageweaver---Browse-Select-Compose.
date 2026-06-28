import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export function WovenPagesIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn('h-auto w-full', className)} fill="none" viewBox="0 0 320 220">
      <ellipse cx="160" cy="192" fill="#5D422C" opacity=".08" rx="112" ry="13" />
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}>
        <path d="m81 51 94-23 35 141-94 23z" fill="#E5D8C4" stroke="#CDBA99" strokeWidth="2" />
        <path d="m112 37 94 13-20 145-94-13z" fill="#F4EEDF" stroke="#D7C6A8" strokeWidth="2" />
        <path d="M129 37h105v146H129z" fill="#FFFDF8" stroke="#D7C6A8" strokeWidth="2" />
        <path d="M151 70h58M151 86h46M151 131h58M151 146h50" stroke="#C5B69F" strokeLinecap="round" strokeWidth="4" />
        <path d="M92 108c45-31 81 35 128 2" stroke="#A17A49" strokeLinecap="round" strokeWidth="9" />
        <path d="M95 124c43-30 78 34 122 3" stroke="#775035" strokeLinecap="round" strokeWidth="9" />
      </motion.g>
    </svg>
  )
}

export function LibraryIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn('h-auto w-full', className)} fill="none" viewBox="0 0 320 210">
      <path d="M48 179h224" stroke="#BFAF99" strokeLinecap="round" strokeWidth="3" />
      <path d="M69 54h39v125H69z" fill="#8B6040" rx="4" />
      <path d="M108 70h32v109h-32z" fill="#D0B47B" rx="4" />
      <path d="M140 43h43v136h-43z" fill="#F7F0E3" stroke="#D4C2A4" strokeWidth="2" rx="4" />
      <path d="M183 62h35v117h-35z" fill="#87907A" rx="4" />
      <path d="m218 71 28-5 20 113h-28z" fill="#B37A68" rx="4" />
      <path d="M78 72v87M151 61v99M192 81v79" stroke="#FFF8EB" strokeLinecap="round" strokeWidth="3" opacity=".65" />
      <path d="M114 86h20M114 95h20M225 87l20-4" stroke="#76543B" strokeLinecap="round" strokeWidth="3" opacity=".55" />
    </svg>
  )
}
