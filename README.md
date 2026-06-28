# PageWeaver

PageWeaver is a production-oriented React application for composing selected pages from multiple Google Drive PDFs into one seamless document. It includes Google OAuth, Drive discovery, lazy PDF rendering, virtualized page selection, grouped composition, live final-document preview, split-view comparison, background PDF generation, Google Drive save-back, and download.

The visual identity, color tokens, typography, spacing, motion, and component rules are documented in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## Run locally

```bash
npm install
npm run dev
```

Create a local environment file first:

```bash
Copy-Item .env.example .env.local
```

Then set `VITE_GOOGLE_CLIENT_ID` to a Google OAuth 2.0 Web application client ID.

```bash
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
npm run budget
npm run format:check
```

## Architecture

- `src/app` owns routing and app-level composition.
- `src/components/ui` is the reusable design system. Product-aware components live one level above it.
- `src/features` contains domain modules for Drive, PDF viewing, and composition. Future API hooks, workers, schemas, and feature-specific UI belong here.
- `src/pages` contains thin route-level compositions loaded with route-based code splitting.
- `src/layouts` defines persistent application chrome.
- `src/providers` centralizes infrastructure such as TanStack Query and notifications.
- `src/services` contains API clients and stable query-key factories.
- `src/store` contains short-lived client state. Server state should remain in TanStack Query.
- `src/types`, `src/constants`, `src/hooks`, and `src/utils` hold genuinely shared concerns.

## Core workflow and performance

Routes are lazy-loaded, heavy PDF and drag-and-drop dependencies are isolated into separate build chunks, and transient workspace state uses focused Zustand stores. PDFs download only when opened, share in-flight requests, and live in a bounded six-file/200 MB memory cache outside React state. The thumbnail rail and composed-document preview use virtualization. PDF.js rasterization and `pdf-lib` output generation run in dedicated workers.

## V2 workspace model

PageWeaver now models composition as:

```text
Project → Workspace → Page groups
```

Projects and workspaces persist metadata only: names, group order, page selections, timestamps, dirty state, favorites, and recent activity. Source PDF bytes and generated object URLs are not persisted.

V2 also adds:

- Live final-document preview using the same generation pipeline as export.
- Multiple local workspaces with create, switch, rename, duplicate, delete, favorite, and search.
- Split Viewer A / Viewer B mode with independent PDF state.
- Drag selected pages from a viewer into the workspace.
- Outline and Preview modes in the composer.
- Workspace timeline metadata.
- Expanded professional keyboard shortcuts.

## Google Cloud setup

1. Create or select a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen and add test users while the app is in testing.
4. Create an OAuth 2.0 Client ID with application type **Web application**.
5. Add `http://localhost:5173` and `http://127.0.0.1:5173` as authorized JavaScript origins.
6. Put the client ID in `.env.local` as `VITE_GOOGLE_CLIENT_ID`.

The app requests `openid`, `email`, `profile`, and `drive.readonly`. Production use of the Drive-wide read-only scope may require Google OAuth verification and, depending on distribution and data handling, a security assessment.

See [`CONTINUATION_REPORT.md`](./CONTINUATION_REPORT.md) for implementation details and handoff notes.

Additional production handoff docs:

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`PERFORMANCE_BUDGET.md`](./PERFORMANCE_BUDGET.md)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- [`PRODUCTION_READINESS_REPORT.md`](./PRODUCTION_READINESS_REPORT.md)
