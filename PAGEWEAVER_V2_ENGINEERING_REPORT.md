# PageWeaver V2 Engineering Report

## Features completed

- Final document preview rendered from the existing worker-based generation pipeline.
- Metadata-only multi-workspace architecture under the existing workspace API.
- Project → Workspace → Groups domain model.
- Workspace switcher with search, favorites, rename, duplicate, delete, create, and switch.
- Dashboard recent workspaces and local activity timeline.
- Split Viewer A / Viewer B with independent selection, zoom, page, and file state.
- Drag selected viewer pages into the composer with insertion indicators.
- Workspace Outline Mode and Preview Mode.
- Advanced keyboard shortcuts and updated settings documentation.
- Corrected bundle budget script to evaluate the largest matching chunk.

## Architecture decisions

- The active workspace API was preserved to avoid rewriting composer and viewer features.
- Final preview reuses `generateWorkspacePdf` instead of duplicating PDF rendering logic.
- Split-view state is pane-based inside `useViewerStore`.
- Cross-document composition uses a small serializable drag payload and never transfers PDF bytes through drag data.
- Timeline data extends the existing local library store.

## Performance impact

- Preview generation is debounced and worker-backed.
- Preview pages are virtualized during continuous scroll.
- Split view reuses the shared PDF memory cache.
- Bundle budgets remain within configured limits.

## Memory impact

- No PDF bytes are persisted.
- Source PDFs remain in the bounded in-memory cache.
- Preview object URLs are revoked when replaced or unmounted.
- Workspace persistence stores metadata only.

## Privacy review

- Google Drive source files remain untouched.
- Drag/drop payloads contain only metadata and page numbers.
- Timeline records contain labels/details/timestamps only.
- Local workspace data does not include PDF bytes or generated file contents.

## Accessibility review

- Viewer and composer actions remain button-based and keyboard reachable.
- Existing dialog focus management and reduced-motion support continue to apply.
- Shortcuts are documented in Settings.
- Split view falls back to a single active pane on smaller screens.

## Verification

```bash
npm run lint
npm run build
npm run budget
```

All passed during the V2 implementation pass.

## Future extension recommendations

- Add automated tests for V2 store migration, workspace switching, pane isolation, and drag payload parsing.
- Add Playwright coverage for split view and workspace switcher flows.
- Expand cross-document composition into page-level insertion within existing groups.
- Add richer project management UI on top of the current project store model.

