import { WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function ConnectivityBanner() {
  const online = useOnlineStatus()
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          animate={{ height: 'auto', opacity: 1 }}
          className="flex items-center justify-center gap-2 overflow-hidden bg-ink px-4 py-2 text-center text-xs font-medium text-surface"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          role="status"
        >
          <WifiOff className="size-3.5" />
          You’re offline. Open documents remain available, but Drive actions will wait for a connection.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
