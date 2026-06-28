# PageWeaver Architecture

PageWeaver is a client-first React application designed around fast PDF composition, Google Drive integration, and strict separation between server state, UI state, and temporary document bytes.

## Application layers

- `src/app` owns route registration and lazy route loading.
- `src/layouts` owns persistent application chrome.
- `src/pages` contains route-level compositions only.
- `src/components/ui` contains reusable design-system primitives.
- `src/components` contains product-aware shared components.
- `src/features` contains domain modules for auth, Drive, PDF viewing, and composition.
- `src/store` contains Zustand stores for client-only state.
- `src/providers` wires cross-cutting infrastructure.
- `src/hooks`, `src/utils`, `src/constants`, and `src/types` hold shared concerns.

## State model

TanStack Query owns Google Drive server state and cache invalidation. Zustand owns local UI/session state:

- auth session
- Drive browser view state
- PDF memory cache metadata
- generation state
- workspace composition state
- settings/preferences
- local library metadata

PDF bytes are intentionally kept outside React state. Opened source PDFs live in a bounded in-memory cache, and generated PDFs are exposed through object URLs that are revoked when superseded or cleared.

## V2 domain model

PageWeaver V2 introduces a hierarchy without replacing the original composer contract:

```text
Project
└── Workspace
    └── Page groups
```

`useWorkspaceStore` still exposes the active workspace as `title`, `groups`, `isDirty`, and the existing group mutation methods. Underneath, it now persists projects and multiple workspaces as metadata-only records. This keeps existing viewer/composer code stable while allowing workspace search, duplication, favorites, switching, and timeline-oriented product flows.

## Viewer model

`useViewerStore` now manages two independent panes: Viewer A and Viewer B. Each pane owns its own file id, page count, current page, selection, zoom, fit mode, and scroll metadata. The legacy single-view selectors are mirrored from the active pane so older route code can continue to work.

The viewer route renders one or two panes depending on split-view state. On smaller screens, it falls back to the active pane while preserving the inactive pane state.

## Preview pipeline

The final document preview intentionally reuses `generateWorkspacePdf(groups, onProgress)`. The preview hook generates a temporary PDF object URL from the active workspace and renders it with React PDF. That means preview and export are aligned through the same worker-based `pdf-lib` generation path instead of maintaining a second rendering implementation.

## Cross-document composition

Viewer thumbnails emit a typed `PageDragPayload` using the `application/x-pageweaver-pages` drag MIME type. The composer accepts that payload and inserts a new page group at the indicated drop position. This keeps the browser drag-and-drop protocol small, serializable, and independent of PDF bytes.

## Performance model

- Routes are lazy-loaded.
- The composer panel is lazy-loaded to keep drag-and-drop code out of the initial app shell.
- PDF.js rendering and pdf-lib generation run away from the main route code.
- The thumbnail rail uses fixed-height virtualization.
- Final document preview uses the existing worker generation path and virtualizes rendered preview pages.
- Split-view keeps PDF bytes in the shared in-memory cache and pane state in Zustand metadata.
- Drive queries are keyed by user, folder, view, search, sort, and page token.
- The bundle budget script guards the app shell, vendor chunks, workers, and CSS.

## Privacy model

This frontend build has no backend. Google access tokens are held in memory by the auth store. Workspace persistence stores document metadata only, not PDF bytes or thumbnails. Temporary PDF data is cleared on account changes, workspace clearing, and after successful generation.
