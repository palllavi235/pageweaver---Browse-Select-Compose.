import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import type { WorkspacePageGroup } from '@/features/composer/types'

const STORAGE_KEY = 'pageweaver:workspace:v2'
const LEGACY_STORAGE_KEY = 'pageweaver:workspace:v1'
const DEFAULT_PROJECT_NAME = 'Personal library'
const DEFAULT_TITLE = 'Untitled composition'
const HISTORY_LIMIT = 50

type AddGroupInput = Omit<WorkspacePageGroup, 'id' | 'createdAt'>
type WorkspaceSnapshot = { title: string; groups: WorkspacePageGroup[] }

export type PageWeaverProject = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type PageWeaverWorkspace = {
  id: string
  projectId: string
  name: string
  groups: WorkspacePageGroup[]
  isFavorite: boolean
  isDirty: boolean
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
}

export type WorkspaceViewMode = 'outline' | 'preview'

type PersistedWorkspace = Omit<PageWeaverWorkspace, 'groups'> & {
  groups: Array<Omit<WorkspacePageGroup, 'thumbnailDataUrl'>>
}

type PersistedWorkspaceV2 = {
  version: 2
  activeProjectId: string
  activeWorkspaceId: string
  projects: PageWeaverProject[]
  workspaces: PersistedWorkspace[]
}

type LegacyPersistedWorkspace = {
  version: 1
  title: string
  groups: Array<Omit<WorkspacePageGroup, 'thumbnailDataUrl'>>
  isDirty: boolean
  updatedAt: number
}

type LoadedWorkspaceState = {
  projects: PageWeaverProject[]
  workspaces: PageWeaverWorkspace[]
  activeProjectId: string
  activeWorkspaceId: string
}

type WorkspaceState = LoadedWorkspaceState & {
  composerOpen: boolean
  sidebarOpen: boolean
  title: string
  groups: WorkspacePageGroup[]
  activeGroupId: string | null
  past: WorkspaceSnapshot[]
  future: WorkspaceSnapshot[]
  isDirty: boolean
  updatedAt: number
  workspaceSearch: string
  workspaceViewMode: WorkspaceViewMode
  toggleComposer: () => void
  setComposerOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setActiveGroupId: (id: string | null) => void
  setWorkspaceSearch: (search: string) => void
  setWorkspaceViewMode: (mode: WorkspaceViewMode) => void
  createProject: (name?: string) => string
  renameProject: (id: string, name: string) => void
  createWorkspace: (name?: string, projectId?: string) => string
  renameWorkspace: (id: string, name: string) => void
  duplicateWorkspace: (id?: string) => string
  deleteWorkspace: (id: string) => void
  switchWorkspace: (id: string) => void
  toggleWorkspaceFavorite: (id: string) => void
  setTitle: (title: string) => void
  addGroup: (group: AddGroupInput) => string
  insertGroupAt: (group: AddGroupInput, index: number) => string
  removeGroup: (id: string) => void
  duplicateGroup: (id: string) => void
  updateGroupPages: (id: string, pages: number[]) => void
  reorderGroups: (activeId: string, overId: string) => void
  moveGroup: (id: string, direction: -1 | 1) => void
  clearWorkspace: () => void
  resetWorkspace: () => void
  undo: () => void
  redo: () => void
  markGenerated: () => void
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function createDefaultLoadedState(): LoadedWorkspaceState {
  const now = Date.now()
  const projectId = createId('project')
  const workspaceId = createId('workspace')
  return {
    activeProjectId: projectId,
    activeWorkspaceId: workspaceId,
    projects: [{ id: projectId, name: DEFAULT_PROJECT_NAME, createdAt: now, updatedAt: now }],
    workspaces: [
      {
        id: workspaceId,
        projectId,
        name: DEFAULT_TITLE,
        groups: [],
        isFavorite: false,
        isDirty: false,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
      },
    ],
  }
}

function normalizeName(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

function sanitizeGroups(groups: WorkspacePageGroup[]) {
  return groups.map(({ thumbnailDataUrl, ...group }) => {
    void thumbnailDataUrl
    return group
  })
}

function migrateLegacyWorkspace(parsed: Partial<LegacyPersistedWorkspace>): LoadedWorkspaceState {
  const now = Date.now()
  const projectId = createId('project')
  const workspaceId = createId('workspace')
  const title = normalizeName(parsed.title, DEFAULT_TITLE)
  return {
    activeProjectId: projectId,
    activeWorkspaceId: workspaceId,
    projects: [{ id: projectId, name: DEFAULT_PROJECT_NAME, createdAt: now, updatedAt: now }],
    workspaces: [
      {
        id: workspaceId,
        projectId,
        name: title,
        groups: Array.isArray(parsed.groups) ? parsed.groups as WorkspacePageGroup[] : [],
        isFavorite: false,
        isDirty: Boolean(parsed.isDirty),
        createdAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
        lastOpenedAt: now,
      },
    ],
  }
}

function loadPersistedWorkspace(): LoadedWorkspaceState {
  if (typeof window === 'undefined') return createDefaultLoadedState()
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Partial<PersistedWorkspaceV2>
    if (
      parsed.version === 2 &&
      Array.isArray(parsed.projects) &&
      Array.isArray(parsed.workspaces) &&
      parsed.projects.length &&
      parsed.workspaces.length
    ) {
      const workspaces = parsed.workspaces.map((workspace) => ({
        ...workspace,
        groups: workspace.groups as WorkspacePageGroup[],
      }))
      const activeWorkspace = workspaces.find((workspace) => workspace.id === parsed.activeWorkspaceId) ?? workspaces[0]
      const activeProject = parsed.projects.find((project) => project.id === activeWorkspace.projectId) ?? parsed.projects[0]
      return {
        projects: parsed.projects,
        workspaces,
        activeProjectId: activeProject.id,
        activeWorkspaceId: activeWorkspace.id,
      }
    }
  } catch {
    // Fall through to legacy migration/default state.
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? '') as Partial<LegacyPersistedWorkspace>
    if (legacy.version === 1) return migrateLegacyWorkspace(legacy)
  } catch {
    // Fall through to default state.
  }

  return createDefaultLoadedState()
}

function snapshot(state: WorkspaceState): WorkspaceSnapshot {
  return { title: state.title, groups: state.groups }
}

function syncActiveWorkspace(
  state: WorkspaceState,
  changes: Partial<Pick<WorkspaceState, 'title' | 'groups' | 'activeGroupId' | 'isDirty' | 'updatedAt'>>,
) {
  const now = changes.updatedAt ?? Date.now()
  const nextTitle = changes.title ?? state.title
  const nextGroups = changes.groups ?? state.groups
  const nextDirty = changes.isDirty ?? state.isDirty
  return {
    ...changes,
    workspaces: state.workspaces.map((workspace) =>
      workspace.id === state.activeWorkspaceId
        ? { ...workspace, name: nextTitle, groups: nextGroups, isDirty: nextDirty, updatedAt: now }
        : workspace,
    ),
    updatedAt: now,
  }
}

function commit(
  state: WorkspaceState,
  changes: Partial<Pick<WorkspaceState, 'title' | 'groups' | 'activeGroupId'>>,
) {
  return syncActiveWorkspace(state, {
    ...changes,
    isDirty: true,
    updatedAt: Date.now(),
  })
}

function withHistory(
  state: WorkspaceState,
  changes: Partial<Pick<WorkspaceState, 'title' | 'groups' | 'activeGroupId'>>,
) {
  return {
    ...commit(state, changes),
    past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

const loaded = loadPersistedWorkspace()
const activeWorkspace =
  loaded.workspaces.find((workspace) => workspace.id === loaded.activeWorkspaceId) ?? loaded.workspaces[0]

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...loaded,
  composerOpen: false,
  sidebarOpen: false,
  title: activeWorkspace.name,
  groups: activeWorkspace.groups,
  activeGroupId: null,
  past: [],
  future: [],
  isDirty: activeWorkspace.isDirty,
  updatedAt: activeWorkspace.updatedAt,
  workspaceSearch: '',
  workspaceViewMode: 'outline',
  toggleComposer: () => set((state) => ({ composerOpen: !state.composerOpen })),
  setComposerOpen: (composerOpen) => set({ composerOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveGroupId: (activeGroupId) => set({ activeGroupId }),
  setWorkspaceSearch: (workspaceSearch) => set({ workspaceSearch }),
  setWorkspaceViewMode: (workspaceViewMode) => set({ workspaceViewMode }),
  createProject: (name = 'New project') => {
    const id = createId('project')
    const now = Date.now()
    set((state) => ({
      activeProjectId: id,
      projects: [...state.projects, { id, name: normalizeName(name, 'New project'), createdAt: now, updatedAt: now }],
      updatedAt: now,
    }))
    return id
  },
  renameProject: (id, name) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, name: normalizeName(name, project.name), updatedAt: Date.now() } : project,
      ),
      updatedAt: Date.now(),
    })),
  createWorkspace: (name = DEFAULT_TITLE, projectId) => {
    const id = createId('workspace')
    const now = Date.now()
    const targetProjectId = projectId ?? get().activeProjectId
    const workspace: PageWeaverWorkspace = {
      id,
      projectId: targetProjectId,
      name: normalizeName(name, DEFAULT_TITLE),
      groups: [],
      isFavorite: false,
      isDirty: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
      activeProjectId: targetProjectId,
      activeWorkspaceId: id,
      title: workspace.name,
      groups: [],
      activeGroupId: null,
      past: [],
      future: [],
      isDirty: false,
      updatedAt: now,
    }))
    return id
  },
  renameWorkspace: (id, name) =>
    set((state) => {
      const workspace = state.workspaces.find((item) => item.id === id)
      if (!workspace) return state
      const normalized = normalizeName(name, workspace.name)
      const now = Date.now()
      return {
        workspaces: state.workspaces.map((item) =>
          item.id === id ? { ...item, name: normalized, updatedAt: now } : item,
        ),
        ...(state.activeWorkspaceId === id ? { title: normalized, updatedAt: now } : { updatedAt: now }),
      }
    }),
  duplicateWorkspace: (id) => {
    const state = get()
    const source = state.workspaces.find((workspace) => workspace.id === (id ?? state.activeWorkspaceId))
    if (!source) return state.activeWorkspaceId
    const now = Date.now()
    const nextId = createId('workspace')
    const copy: PageWeaverWorkspace = {
      ...source,
      id: nextId,
      name: `${source.name} copy`,
      groups: source.groups.map((group) => ({ ...group, id: createId('group'), createdAt: now })),
      isDirty: true,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }
    set((current) => ({
      workspaces: [...current.workspaces, copy],
      activeProjectId: copy.projectId,
      activeWorkspaceId: copy.id,
      title: copy.name,
      groups: copy.groups,
      activeGroupId: null,
      past: [],
      future: [],
      isDirty: copy.isDirty,
      updatedAt: now,
    }))
    return nextId
  },
  deleteWorkspace: (id) =>
    set((state) => {
      if (state.workspaces.length <= 1) {
        const now = Date.now()
        return syncActiveWorkspace(state, {
          title: DEFAULT_TITLE,
          groups: [],
          activeGroupId: null,
          isDirty: false,
          updatedAt: now,
        })
      }
      const remaining = state.workspaces.filter((workspace) => workspace.id !== id)
      const nextActive = state.activeWorkspaceId === id
        ? remaining.find((workspace) => workspace.projectId === state.activeProjectId) ?? remaining[0]
        : state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)
      if (!nextActive) return state
      const now = Date.now()
      return {
        workspaces: remaining,
        activeProjectId: nextActive.projectId,
        activeWorkspaceId: nextActive.id,
        title: nextActive.name,
        groups: nextActive.groups,
        activeGroupId: null,
        past: [],
        future: [],
        isDirty: nextActive.isDirty,
        updatedAt: now,
      }
    }),
  switchWorkspace: (id) =>
    set((state) => {
      const workspace = state.workspaces.find((item) => item.id === id)
      if (!workspace || workspace.id === state.activeWorkspaceId) return state
      const now = Date.now()
      return {
        workspaces: state.workspaces.map((item) =>
          item.id === id ? { ...item, lastOpenedAt: now } : item,
        ),
        activeProjectId: workspace.projectId,
        activeWorkspaceId: workspace.id,
        title: workspace.name,
        groups: workspace.groups,
        activeGroupId: null,
        past: [],
        future: [],
        isDirty: workspace.isDirty,
        updatedAt: now,
      }
    }),
  toggleWorkspaceFavorite: (id) =>
    set((state) => ({
      workspaces: state.workspaces.map((workspace) =>
        workspace.id === id ? { ...workspace, isFavorite: !workspace.isFavorite, updatedAt: Date.now() } : workspace,
      ),
      updatedAt: Date.now(),
    })),
  setTitle: (title) =>
    set((state) => {
      const normalized = normalizeName(title, DEFAULT_TITLE)
      return normalized === state.title ? state : withHistory(state, { title: normalized })
    }),
  addGroup: (group) => {
    const id = createId('group')
    set((state) =>
      withHistory(state, {
        groups: [...state.groups, { ...group, id, createdAt: Date.now() }],
        activeGroupId: id,
      }),
    )
    return id
  },
  insertGroupAt: (group, index) => {
    const id = createId('group')
    set((state) => {
      const groups = [...state.groups]
      groups.splice(Math.min(Math.max(index, 0), groups.length), 0, { ...group, id, createdAt: Date.now() })
      return withHistory(state, { groups, activeGroupId: id })
    })
    return id
  },
  removeGroup: (id) =>
    set((state) =>
      withHistory(state, {
        groups: state.groups.filter((group) => group.id !== id),
        activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
      }),
    ),
  duplicateGroup: (id) =>
    set((state) => {
      const index = state.groups.findIndex((group) => group.id === id)
      if (index < 0) return state
      const newId = createId('group')
      const groups = [...state.groups]
      groups.splice(index + 1, 0, {
        ...state.groups[index],
        id: newId,
        createdAt: Date.now(),
      })
      return withHistory(state, { groups, activeGroupId: newId })
    }),
  updateGroupPages: (id, pages) =>
    set((state) =>
      withHistory(state, {
        groups: state.groups.map((group) => (group.id === id ? { ...group, pages } : group)),
      }),
    ),
  reorderGroups: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.groups.findIndex((group) => group.id === activeId)
      const newIndex = state.groups.findIndex((group) => group.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return state
      return withHistory(state, { groups: arrayMove(state.groups, oldIndex, newIndex), activeGroupId: activeId })
    }),
  moveGroup: (id, direction) =>
    set((state) => {
      const index = state.groups.findIndex((group) => group.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= state.groups.length) return state
      return withHistory(state, { groups: arrayMove(state.groups, index, nextIndex), activeGroupId: id })
    }),
  clearWorkspace: () =>
    set((state) => withHistory(state, { groups: [], activeGroupId: null })),
  resetWorkspace: () => {
    const next = createDefaultLoadedState()
    const workspace = next.workspaces[0]
    set({
      ...next,
      title: workspace.name,
      groups: workspace.groups,
      activeGroupId: null,
      past: [],
      future: [],
      isDirty: false,
      updatedAt: workspace.updatedAt,
      workspaceSearch: '',
      workspaceViewMode: 'outline',
    })
  },
  undo: () =>
    set((state) => {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        ...syncActiveWorkspace(state, {
          ...previous,
          activeGroupId: null,
          isDirty: true,
          updatedAt: Date.now(),
        }),
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
      }
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0]
      if (!next) return state
      return {
        ...syncActiveWorkspace(state, {
          ...next,
          activeGroupId: null,
          isDirty: true,
          updatedAt: Date.now(),
        }),
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
      }
    }),
  markGenerated: () =>
    set((state) => syncActiveWorkspace(state, { isDirty: false, updatedAt: Date.now() })),
}))

let persistTimer: number | undefined
useWorkspaceStore.subscribe((state, previous) => {
  if (state.updatedAt === previous.updatedAt || typeof window === 'undefined') return
  window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    const value: PersistedWorkspaceV2 = {
      version: 2,
      activeProjectId: state.activeProjectId,
      activeWorkspaceId: state.activeWorkspaceId,
      projects: state.projects,
      workspaces: state.workspaces.map((workspace) => ({
        ...workspace,
        groups: sanitizeGroups(workspace.groups),
      })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, 120)
})
