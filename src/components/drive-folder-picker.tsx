import { ChevronLeft, ChevronRight, Folder } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listDriveFolder } from '@/features/drive/drive-service'
import { Button, ErrorState, Skeleton } from './ui'

type FolderChoice = { id: string; name: string }

export function DriveFolderPicker({
  value,
  onChange,
}: {
  value: FolderChoice
  onChange: (folder: FolderChoice) => void
}) {
  const [path, setPath] = useState<FolderChoice[]>([{ id: 'root', name: 'My Drive' }])
  const current = path.at(-1)!
  const query = useQuery({
    queryKey: ['drive', 'folder-picker', current.id],
    queryFn: ({ signal }) => listDriveFolder({ folderId: current.id, orderBy: 'name', signal }),
    staleTime: 60_000,
  })

  return (
    <div className="rounded-xl border bg-paper/50">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-1 text-xs font-medium">
          {path.length > 1 && (
            <button
              aria-label="Go to parent folder"
              className="rounded p-1 text-muted hover:bg-[#e9dfcf]"
              onClick={() => setPath((items) => items.slice(0, -1))}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <span className="truncate">{current.name}</span>
        </div>
        <Button onClick={() => onChange(current)} size="sm" variant={value.id === current.id ? 'primary' : 'secondary'}>
          {value.id === current.id ? 'Selected' : 'Choose folder'}
        </Button>
      </div>
      <div className="scrollbar-thin h-44 overflow-y-auto p-2">
        {query.isLoading ? <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div> :
          query.isError ? <ErrorState description="Drive folders could not be loaded." /> :
            query.data?.folders.length ? <div className="space-y-1">{query.data.folders.map((folder) => (
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-[#e9dfcf]"
                key={folder.id}
                onClick={() => setPath((items) => [...items, { id: folder.id, name: folder.name }])}
                type="button"
              >
                <Folder className="size-4 text-leather" />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <ChevronRight className="size-3.5 text-muted" />
              </button>
            ))}</div> : <p className="grid h-full place-items-center text-xs text-muted">No subfolders here.</p>}
      </div>
    </div>
  )
}
