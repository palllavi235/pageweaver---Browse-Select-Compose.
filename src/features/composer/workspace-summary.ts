import type { WorkspacePageGroup } from './types'

export function getWorkspaceSummary(groups: WorkspacePageGroup[]) {
  const pageCount = groups.reduce((total, group) => total + group.pages.length, 0)
  const sourceCount = new Set(groups.map((group) => group.sourceFileId)).size
  const estimatedBytes = groups.reduce((total, group) => {
    const sourceBytes = Number(group.sourceSize ?? 0)
    if (!sourceBytes || !group.sourcePageCount) return total
    return total + (sourceBytes / group.sourcePageCount) * group.pages.length
  }, 0)
  return { pageCount, sourceCount, estimatedBytes: Math.round(estimatedBytes) }
}
