import { Clock3, FileText, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { DrivePdfFile } from '@/features/drive/drive-service'
import { formatBytes, formatRelativeDate } from '@/utils/format'
import { DocumentPreview } from './pdf-card'
import { IconButton, Tooltip } from './ui'
import { cn } from '@/utils/cn'

export function DriveFileCard({
  file,
  favorite = false,
  onOpen,
  onToggleFavorite,
}: {
  file: DrivePdfFile
  favorite?: boolean
  onOpen?: () => void
  onToggleFavorite?: () => void
}) {
  return (
    <motion.article className="group relative min-w-0" transition={{ duration: 0.2 }} whileHover={{ y: -3 }}>
      {onToggleFavorite && (
        <Tooltip label={favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <IconButton
            aria-label={favorite ? `Remove ${file.name} from favorites` : `Add ${file.name} to favorites`}
            aria-pressed={favorite}
            className="absolute right-2 top-2 z-10 size-9 border bg-surface/95 shadow-sm"
            onClick={onToggleFavorite}
          >
            <Star className={cn('size-4', favorite && 'fill-gold text-gold')} />
          </IconButton>
        </Tooltip>
      )}
      <Link onClick={onOpen} state={{ driveFile: file }} to={`/app/viewer/${file.id}`}>
        <DocumentPreview tone="tan" />
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-0.5 rounded-lg bg-[#f1e5d5] p-1.5 text-leather">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{file.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Clock3 className="size-3" />
              {formatRelativeDate(file.modifiedTime)} · {formatBytes(file.size)}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
