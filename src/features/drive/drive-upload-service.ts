import { useAuthStore } from '@/store/use-auth-store'

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

export type UploadedDriveFile = {
  id: string
  name: string
  size?: string
  webViewLink?: string
  modifiedTime?: string
}

export function normalizePdfFilename(value: string) {
  const trimmed = value.trim().replace(/[\\/:*?"<>|]/g, '-')
  if (!trimmed) return 'PageWeaver-document.pdf'
  return trimmed.toLocaleLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`
}

export async function findFileWithName(folderId: string, filename: string) {
  const token = useAuthStore.getState().getValidAccessToken()
  const escapedName = filename.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
  const escapedFolder = folderId.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
  const params = new URLSearchParams({
    q: `name = '${escapedName}' and '${escapedFolder}' in parents and trashed = false`,
    fields: 'files(id,name,webViewLink)',
    pageSize: '1',
  })
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('PageWeaver could not check the destination folder.')
  const result = (await response.json()) as { files?: UploadedDriveFile[] }
  return result.files?.[0]
}

export async function uploadPdfToDrive(options: {
  blob: Blob
  filename: string
  folderId: string
  onProgress: (progress: number) => void
}): Promise<UploadedDriveFile> {
  const token = useAuthStore.getState().getValidAccessToken()
  const metadata = {
    name: normalizePdfFilename(options.filename),
    mimeType: 'application/pdf',
    parents: [options.folderId],
    appProperties: { createdBy: 'PageWeaver' },
  }
  const params = new URLSearchParams({
    uploadType: 'resumable',
    fields: 'id,name,size,webViewLink,modifiedTime',
    supportsAllDrives: 'true',
  })
  const initiation = await fetch(`${DRIVE_UPLOAD_URL}?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/pdf',
      'X-Upload-Content-Length': String(options.blob.size),
    },
    body: JSON.stringify(metadata),
  })
  if (!initiation.ok) {
    const detail = (await initiation.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(detail?.error?.message ?? 'Google Drive could not start the upload.')
  }
  const sessionUrl = initiation.headers.get('Location')
  if (!sessionUrl) throw new Error('Google Drive did not return an upload session.')

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', sessionUrl)
    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.setRequestHeader('Content-Type', 'application/pdf')
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error('The upload was interrupted. Your local PDF is still available.'))
    request.onabort = () => reject(new Error('The upload was cancelled.'))
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        options.onProgress(100)
        try {
          resolve(JSON.parse(request.responseText) as UploadedDriveFile)
        } catch {
          reject(new Error('Drive saved the file but returned an unreadable response.'))
        }
        return
      }
      let message = 'Google Drive could not save this PDF.'
      try {
        message = (JSON.parse(request.responseText) as { error?: { message?: string } }).error?.message ?? message
      } catch {
        // Keep the user-friendly fallback.
      }
      reject(new Error(message))
    }
    request.send(options.blob)
  })
}
