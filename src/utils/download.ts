export function downloadBlobUrl(blobUrl: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function createDatedPdfFilename(date = new Date()) {
  const day = date.toISOString().slice(0, 10)
  return `PageWeaver-${day}.pdf`
}
