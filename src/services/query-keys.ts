export const queryKeys = {
  drive: {
    all: ['drive'] as const,
    files: (folderId: string) => ['drive', 'files', folderId] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (documentId: string) => ['documents', documentId] as const,
  },
}
