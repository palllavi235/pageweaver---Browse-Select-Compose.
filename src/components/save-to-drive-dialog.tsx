import { useEffect, useState } from 'react'
import { CheckCircle2, CloudUpload, ExternalLink } from 'lucide-react'
import type { GenerationResult } from '@/features/composer/types'
import {
  findFileWithName,
  normalizePdfFilename,
  uploadPdfToDrive,
} from '@/features/drive/drive-upload-service'
import { useAuthStore } from '@/store/use-auth-store'
import { useDriveUploadStore } from '@/store/use-drive-upload-store'
import { useLibraryStore } from '@/store/use-library-store'
import { Button, Dialog, Input, Progress, useToast } from './ui'
import { DriveFolderPicker } from './drive-folder-picker'

export function SaveToDriveDialog({
  open,
  onClose,
  result,
}: {
  open: boolean
  onClose: () => void
  result: GenerationResult
}) {
  const [filename, setFilename] = useState(result.filename)
  const [folder, setFolder] = useState({ id: 'root', name: 'My Drive' })
  const uploadStatus = useDriveUploadStore((state) => state.status)
  const uploadProgress = useDriveUploadStore((state) => state.progress)
  const uploadError = useDriveUploadStore((state) => state.error)
  const uploadedFile = useDriveUploadStore((state) => state.uploadedFile)
  const setUploadStatus = useDriveUploadStore((state) => state.setStatus)
  const setUploadProgress = useDriveUploadStore((state) => state.setProgress)
  const uploadSucceeded = useDriveUploadStore((state) => state.succeed)
  const uploadFailed = useDriveUploadStore((state) => state.fail)
  const resetUpload = useDriveUploadStore((state) => state.reset)
  const authorizeDriveUpload = useAuthStore((state) => state.authorizeDriveUpload)
  const updateGeneratedDriveFile = useLibraryStore((state) => state.updateGeneratedDriveFile)
  const showToast = useToast()
  const busy = uploadStatus === 'authorizing' || uploadStatus === 'uploading'

  useEffect(() => {
    if (!open) return
    setFilename(result.filename)
    setFolder({ id: 'root', name: 'My Drive' })
    resetUpload()
  }, [open, resetUpload, result.filename])

  const save = async () => {
    try {
      setUploadStatus('authorizing')
      await authorizeDriveUpload()
      const normalized = normalizePdfFilename(filename)
      const existing = await findFileWithName(folder.id, normalized)
      if (existing) {
        showToast('A file with this name exists. PageWeaver will create a separate copy.', 'info')
      }
      setUploadStatus('uploading')
      const blob = await fetch(result.blobUrl).then((response) => response.blob())
      const uploaded = await uploadPdfToDrive({
        blob,
        filename: normalized,
        folderId: folder.id,
        onProgress: setUploadProgress,
      })
      uploadSucceeded(uploaded)
      updateGeneratedDriveFile(result.historyId, uploaded.id, uploaded.webViewLink)
      showToast(`${uploaded.name} saved to Google Drive`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The PDF could not be saved to Drive.'
      uploadFailed(message)
      showToast(message, 'error')
    }
  }

  return (
    <Dialog open={open} onClose={busy ? () => undefined : onClose} title="Save to Google Drive">
      {uploadStatus === 'success' && uploadedFile ? (
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e4eee3] text-success">
            <CheckCircle2 className="size-6" />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold">Saved to Drive</h3>
          <p className="mt-2 text-sm text-muted">{uploadedFile.name}</p>
          <div className="mt-6 flex justify-center gap-2">
            {uploadedFile.webViewLink && (
              <a href={uploadedFile.webViewLink} rel="noreferrer" target="_blank">
                <Button variant="secondary"><ExternalLink className="size-4" /> Open in Drive</Button>
              </a>
            )}
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm leading-6 text-muted">
            PageWeaver uploads only this generated PDF after you confirm. Existing Drive files are never overwritten.
          </p>
          <div className="space-y-4">
            <Input
              label="File name"
              maxLength={180}
              onChange={(event) => setFilename(event.target.value)}
              value={filename}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Destination</p>
              <DriveFolderPicker onChange={setFolder} value={folder} />
              <p className="mt-2 text-xs text-muted">Selected: {folder.name}</p>
            </div>
          </div>
          {busy && (
            <div className="mt-5 rounded-xl bg-paper p-3">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-muted">
                  {uploadStatus === 'authorizing' ? 'Confirming Drive permission…' : 'Uploading PDF…'}
                </span>
                <span className="font-semibold">{uploadStatus === 'uploading' ? `${uploadProgress}%` : ''}</span>
              </div>
              <Progress value={uploadStatus === 'uploading' ? uploadProgress : 8} />
            </div>
          )}
          {uploadError && (
            <p className="mt-4 rounded-xl bg-[#f5e1dd] p-3 text-xs leading-5 text-danger" role="alert">
              {uploadError}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button disabled={busy} onClick={onClose} variant="secondary">Cancel</Button>
            <Button disabled={!filename.trim()} loading={busy} onClick={() => void save()}>
              <CloudUpload className="size-4" /> Confirm and save
            </Button>
          </div>
        </>
      )}
    </Dialog>
  )
}
