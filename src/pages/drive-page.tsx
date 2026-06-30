import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Folder,
  Grid2X2,
  List,
  RefreshCw,
  Star,
} from 'lucide-react'
import { useMemo } from 'react'
import { GoogleAuthButton } from '@/components/auth-button'
import { DriveFileCard } from '@/components/drive-file-card'
import {
  Button,
  Dropdown,
  EmptyState,
  ErrorState,
  IconButton,
  Search,
  Skeleton,
  Tabs,
} from '@/components/ui'
import { useDriveFiles } from '@/features/drive/use-drive-files'
import type { DrivePdfFile, DriveSort } from '@/features/drive/drive-service'
import { useAuthStore } from '@/store/use-auth-store'
import { useDriveStore, type DriveView } from '@/store/use-drive-store'
import { useGenerationStore } from '@/store/use-generation-store'
import { useLibraryStore } from '@/store/use-library-store'
import { downloadBlobUrl } from '@/utils/download'
import { formatBytes, formatRelativeDate } from '@/utils/format'

const sortLabels: Record<string, DriveSort> = {
  'Last modified': 'modifiedTime desc',
  Name: 'name',
  'File size': 'quotaBytesUsed desc',
}
const viewLabels: Record<DriveView, string> = {
  all: 'All PDFs',
  recent: 'Recent',
  favorites: 'Favorites',
  generated: 'Generated',
}
const labelViews = Object.fromEntries(
  Object.entries(viewLabels).map(([view, label]) => [label, view]),
) as Record<string, DriveView>

function DriveGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function GeneratedGrid({ userId }: { userId?: string }) {
  const allGenerated = useLibraryStore((state) => state.generated)
  const generated = useMemo(
    () => (userId ? allGenerated.filter((record) => record.userId === userId) : []),
    [allGenerated, userId],
  )
  const currentResult = useGenerationStore((state) => state.result)

  if (!generated.length) {
    return (
      <EmptyState
        icon={FileCheck2}
        title="No generated PDFs yet"
        description="Documents you generate will appear here as local history. PDF contents are never saved in browser storage."
      />
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {generated.map((record) => (
        <article className="rounded-2xl border bg-surface p-5 shadow-sm" key={record.id}>
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e4eee3] text-success">
              <FileCheck2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{record.filename}</h3>
              <p className="mt-1 text-xs text-muted">
                {record.pageCount} pages · {formatBytes(record.bytes)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                <Clock3 className="size-3" /> {formatRelativeDate(new Date(record.generatedAt).toISOString())}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {currentResult?.historyId === record.id && (
              <Button
                onClick={() => downloadBlobUrl(currentResult.blobUrl, currentResult.filename)}
                size="sm"
                variant="secondary"
              >
                <Download className="size-3.5" /> Download
              </Button>
            )}
            {record.driveWebViewLink && (
              <a href={record.driveWebViewLink} rel="noreferrer" target="_blank">
                <Button size="sm" variant="secondary">
                  <ExternalLink className="size-3.5" /> Open in Drive
                </Button>
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

export function DrivePage() {
  const authenticated = useAuthStore((state) => state.status === 'authenticated')
  const authError = useAuthStore((state) => state.error)
  const userId = useAuthStore((state) => state.session?.user.id)
  const {
    search,
    setSearch,
    setSort,
    view,
    setView,
    folderPath,
    enterFolder,
    goToFolder,
    nextPage,
    previousPage,
    pageHistory,
  } = useDriveStore()
  const query = useDriveFiles()
  const account = useLibraryStore((state) => (userId ? state.accounts[userId] : undefined))
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite)
  const recordOpened = useLibraryStore((state) => state.recordOpened)
  const favoriteIds = new Set(account?.favorites.map((file) => file.id) ?? [])
  const localFiles = view === 'recent' ? account?.recent ?? [] : account?.favorites ?? []
  const filteredLocalFiles = localFiles.filter((file) =>
    file.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  )

  const fileCard = (file: DrivePdfFile) => (
    <DriveFileCard
      favorite={favoriteIds.has(file.id)}
      file={file}
      key={file.id}
      onOpen={() => userId && recordOpened(userId, file)}
      onToggleFavorite={() => userId && toggleFavorite(userId, file)}
    />
  )

  return (
    <div className="page-shell py-7 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav aria-label="Drive folder" className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {folderPath.map((folder, index) => (
              <span className="flex items-center gap-1" key={folder.id}>
                {index > 0 && <span className="text-line">/</span>}
                <button
                  className={index === folderPath.length - 1 ? 'font-medium text-ink' : 'hover:text-leather'}
                  onClick={() => goToFolder(index)}
                  type="button"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>
          <h2 className="mt-3 font-display text-3xl font-semibold">Your PDF library</h2>
          <p className="mt-1 text-sm text-muted">Browse Drive folders or return to documents you use often.</p>
        </div>
        {authenticated ? (
          <Button onClick={() => void query.refetch()} variant="secondary">
            <RefreshCw className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        ) : (
          <GoogleAuthButton />
        )}
      </div>

      {!authenticated ? (
        <div className="mt-10">
          <EmptyState
            action={<div><GoogleAuthButton />{authError && <p className="mt-3 max-w-sm text-xs leading-5 text-danger" role="alert">{authError}</p>}</div>}
            icon={Folder}
            title="Connect your PDF library"
            description="Sign in with Google to securely browse PDF files in your Drive. PageWeaver requests read-only access."
          />
        </div>
      ) : (
        <>
          <div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center">
            <Search
              className="w-full xl:max-w-md"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={view === 'all' ? 'Search PDFs and folders across Drive…' : `Search ${viewLabels[view].toLowerCase()}…`}
              value={search}
            />
            <Tabs
              active={viewLabels[view]}
              onChange={(label) => setView(labelViews[label])}
              tabs={Object.values(viewLabels)}
            />
            {view === 'all' && (
              <div className="ml-auto flex items-center gap-2">
                <Dropdown
                  items={Object.keys(sortLabels)}
                  label="Sort files"
                  onChange={(label) => setSort(sortLabels[label])}
                />
                <div className="hidden rounded-xl border bg-surface p-1 sm:flex">
                  <IconButton aria-label="Grid view" className="size-8 bg-[#eee7da] text-ink"><Grid2X2 className="size-4" /></IconButton>
                  <IconButton aria-label="List view" className="size-8" disabled><List className="size-4" /></IconButton>
                </div>
              </div>
            )}
          </div>

          {view === 'all' && (
            <>
              <div className="mt-7 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {(query.data?.folders.length ?? 0) + (query.data?.files.length ?? 0)} items
                  {search ? ' across Drive' : ` in ${folderPath.at(-1)?.name}`}
                </p>
                {query.isFetching && <span className="text-xs text-muted">Refreshing…</span>}
              </div>
              <div className="mt-4">
                {query.isLoading ? (
                  <DriveGridSkeleton />
                ) : query.isError ? (
                  <ErrorState description={query.error instanceof Error ? query.error.message : 'Google Drive could not be loaded.'} />
                ) : query.data && (query.data.folders.length || query.data.files.length) ? (
                  <>
                    {query.data.folders.length > 0 && (
                      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {query.data.folders.map((folder) => (
                          <button
                            className="flex items-center gap-3 rounded-xl border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                            key={folder.id}
                            onClick={() => enterFolder({ id: folder.id, name: folder.name })}
                            type="button"
                          >
                            <span className="grid size-10 place-items-center rounded-xl bg-[#eee3d2] text-leather"><Folder className="size-5" /></span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{folder.name}</span>
                            <ChevronRight className="size-4 text-muted" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {query.data.files.map(fileCard)}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={FileSearch}
                    title={search ? 'No matching files' : 'This folder is empty'}
                    description={search ? 'Try another filename. Search looks across your entire Drive.' : 'This folder does not contain PDF files or subfolders.'}
                  />
                )}
              </div>
              {(query.data?.nextPageToken || pageHistory.length > 0) && (
                <div className="mt-10 flex justify-center gap-2">
                  <Button disabled={pageHistory.length === 0} onClick={previousPage} variant="secondary"><ChevronLeft className="size-4" /> Previous</Button>
                  <Button disabled={!query.data?.nextPageToken} onClick={() => query.data?.nextPageToken && nextPage(query.data.nextPageToken)} variant="secondary">Next <ChevronRight className="size-4" /></Button>
                </div>
              )}
            </>
          )}

          {(view === 'recent' || view === 'favorites') && (
            <div className="mt-7">
              {filteredLocalFiles.length ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredLocalFiles.map(fileCard)}
                </div>
              ) : (
                <EmptyState
                  icon={view === 'favorites' ? Star : Clock3}
                  title={view === 'favorites' ? 'No favorite PDFs' : 'No recently opened PDFs'}
                  description={view === 'favorites' ? 'Star PDFs in your library to keep important sources close.' : 'PDFs you open will appear here on this device.'}
                />
              )}
            </div>
          )}
          {view === 'generated' && <div className="mt-7"><GeneratedGrid userId={userId} /></div>}
        </>
      )}
    </div>
  )
}
