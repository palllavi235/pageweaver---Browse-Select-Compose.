import { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/use-workspace-store'
import { useGenerationStore } from '@/store/use-generation-store'
import { useToast } from '@/components/ui'

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'))
}

export function useWorkspaceShortcuts() {
  const showToast = useToast()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      const command = event.metaKey || event.ctrlKey
      const state = useWorkspaceStore.getState()

      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          if (!state.future.length) return
          state.redo()
          showToast('Redid workspace change', 'info')
        } else {
          if (!state.past.length) return
          state.undo()
          showToast('Undid workspace change', 'info')
        }
        useGenerationStore.getState().reset()
      }
      if (command && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        if (!state.future.length) return
        state.redo()
        useGenerationStore.getState().reset()
        showToast('Redid workspace change', 'info')
      }
      if (command && event.key.toLowerCase() === 'd' && state.activeGroupId) {
        event.preventDefault()
        state.duplicateGroup(state.activeGroupId)
        useGenerationStore.getState().reset()
        showToast('Page group duplicated')
      }
      if (command && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[aria-label="Search"]')?.focus()
      }
      if (command && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[aria-label="Search workspaces"]')?.focus()
      }
      if (command && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        state.setWorkspaceViewMode(state.workspaceViewMode === 'outline' ? 'preview' : 'outline')
        showToast(`Workspace ${state.workspaceViewMode === 'outline' ? 'preview' : 'outline'} mode`, 'info')
      }
      if (event.key === 'Delete' && state.activeGroupId) {
        event.preventDefault()
        state.removeGroup(state.activeGroupId)
        useGenerationStore.getState().reset()
        showToast('Removed active page group', 'info')
      }
      if (event.key === 'ArrowUp' && state.activeGroupId) {
        event.preventDefault()
        state.moveGroup(state.activeGroupId, -1)
        useGenerationStore.getState().reset()
      }
      if (event.key === 'ArrowDown' && state.activeGroupId) {
        event.preventDefault()
        state.moveGroup(state.activeGroupId, 1)
        useGenerationStore.getState().reset()
      }
      if (event.key === ' ' && state.activeGroupId) {
        event.preventDefault()
        state.setWorkspaceViewMode(state.workspaceViewMode === 'outline' ? 'preview' : 'outline')
      }
      if (event.key === 'Escape' && state.composerOpen) state.setComposerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showToast])
}
