import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listDriveFolder } from './drive-service'
import { useAuthStore } from '@/store/use-auth-store'
import { useDriveStore } from '@/store/use-drive-store'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export function useDriveFiles() {
  const authenticated = useAuthStore((state) => state.status === 'authenticated')
  const userId = useAuthStore((state) => state.session?.user.id)
  const search = useDriveStore((state) => state.search)
  const sort = useDriveStore((state) => state.sort)
  const pageToken = useDriveStore((state) => state.pageToken)
  const folderId = useDriveStore((state) => state.folderPath.at(-1)?.id ?? 'root')
  const view = useDriveStore((state) => state.view)
  const debouncedSearch = useDebouncedValue(search, 300)

  return useQuery({
    queryKey: ['drive', userId, 'folder', folderId, debouncedSearch, sort, pageToken],
    queryFn: ({ signal }) =>
      listDriveFolder({
        folderId,
        search: debouncedSearch,
        orderBy: sort,
        pageToken,
        signal,
      }),
    enabled: authenticated && view === 'all',
    placeholderData: keepPreviousData,
    staleTime: 45_000,
  })
}
