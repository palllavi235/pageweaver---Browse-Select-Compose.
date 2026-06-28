import { useAuthStore } from '@/store/use-auth-store'

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files'

export type DrivePdfFile = {
  id: string
  name: string
  mimeType: 'application/pdf'
  size?: string
  modifiedTime: string
  thumbnailLink?: string
  iconLink?: string
  webViewLink?: string
  capabilities?: { canDownload?: boolean }
  parents?: string[]
}

export type DriveFilePage = {
  files: DrivePdfFile[]
  nextPageToken?: string
}

export type DriveFolder = {
  id: string
  name: string
  mimeType: 'application/vnd.google-apps.folder'
  modifiedTime: string
  parents?: string[]
}

export type DriveFolderPage = {
  files: DrivePdfFile[]
  folders: DriveFolder[]
  nextPageToken?: string
}

export type DriveSort = 'modifiedTime desc' | 'name' | 'quotaBytesUsed desc'

export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'DriveApiError'
  }
}

function escapeDriveQuery(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

export async function listDrivePdfs(options: {
  search?: string
  orderBy?: DriveSort
  pageToken?: string
  signal?: AbortSignal
}): Promise<DriveFilePage> {
  const token = useAuthStore.getState().getValidAccessToken()
  const query = ["mimeType = 'application/pdf'", 'trashed = false']
  if (options.search?.trim()) query.push(`name contains '${escapeDriveQuery(options.search.trim())}'`)

  const params = new URLSearchParams({
    q: query.join(' and '),
    orderBy: options.orderBy ?? 'modifiedTime desc',
    pageSize: '40',
    spaces: 'drive',
    corpora: 'user',
    fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink,capabilities(canDownload))',
  })
  if (options.pageToken) params.set('pageToken', options.pageToken)

  const response = await fetch(`${DRIVE_API_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
  })

  if (response.status === 401) {
    useAuthStore.setState({ status: 'error', session: null, error: 'Your Google session expired. Please sign in again.' })
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new DriveApiError(detail?.error?.message ?? 'Google Drive could not be loaded.', response.status)
  }
  return (await response.json()) as DriveFilePage
}

export async function listDriveFolder(options: {
  folderId: string
  search?: string
  orderBy?: DriveSort
  pageToken?: string
  signal?: AbortSignal
}): Promise<DriveFolderPage> {
  const token = useAuthStore.getState().getValidAccessToken()
  const query = [
    "(mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.folder')",
    'trashed = false',
  ]
  if (options.search?.trim()) {
    query.push(`name contains '${escapeDriveQuery(options.search.trim())}'`)
  } else {
    query.push(`'${escapeDriveQuery(options.folderId)}' in parents`)
  }

  const params = new URLSearchParams({
    q: query.join(' and '),
    orderBy: options.orderBy ?? 'modifiedTime desc',
    pageSize: '40',
    spaces: 'drive',
    corpora: 'user',
    fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink,parents,capabilities(canDownload))',
  })
  if (options.pageToken) params.set('pageToken', options.pageToken)

  const response = await fetch(`${DRIVE_API_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
  })
  if (response.status === 401) {
    useAuthStore.setState({
      status: 'error',
      session: null,
      error: 'Your Google session expired. Sign in again to continue from your locally saved workspace.',
    })
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new DriveApiError(detail?.error?.message ?? 'This Drive folder could not be loaded.', response.status)
  }

  const payload = (await response.json()) as {
    files: Array<DrivePdfFile | DriveFolder>
    nextPageToken?: string
  }
  return {
    files: payload.files.filter((item): item is DrivePdfFile => item.mimeType === 'application/pdf'),
    folders: payload.files.filter(
      (item): item is DriveFolder => item.mimeType === 'application/vnd.google-apps.folder',
    ),
    nextPageToken: payload.nextPageToken,
  }
}

export async function downloadDrivePdf(
  fileId: string,
  options?: { signal?: AbortSignal; onProgress?: (progress: number) => void },
): Promise<ArrayBuffer> {
  const token = useAuthStore.getState().getValidAccessToken()
  const response = await fetch(`${DRIVE_API_URL}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: options?.signal,
  })
  if (!response.ok) throw new DriveApiError('This PDF could not be downloaded from Google Drive.', response.status)

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (!response.body || !contentLength) {
    const buffer = await response.arrayBuffer()
    options?.onProgress?.(100)
    return buffer
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    options?.onProgress?.(Math.round((received / contentLength) * 100))
  }
  const combined = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }
  return combined.buffer
}

export async function getDrivePdfMetadata(fileId: string, signal?: AbortSignal): Promise<DrivePdfFile> {
  const token = useAuthStore.getState().getValidAccessToken()
  const fields = 'id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink,capabilities(canDownload)'
  const response = await fetch(
    `${DRIVE_API_URL}/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal },
  )
  if (!response.ok) throw new DriveApiError('This PDF could not be found in Google Drive.', response.status)
  return (await response.json()) as DrivePdfFile
}
