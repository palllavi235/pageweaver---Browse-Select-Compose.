# PageWeaver Roadmap

## V2 completed scope

- Live final document preview from the real generation pipeline.
- Metadata-only Project → Workspace → Groups model.
- Multiple workspaces with search, create, switch, rename, duplicate, delete, and favorite.
- Split Viewer A / Viewer B mode with independent PDF state.
- Drag selected pages from viewers into the workspace.
- Workspace Outline Mode and Preview Mode.
- Timeline metadata for opened, generated, edited, and workspace activity.
- Advanced keyboard workflow.
- Performance guardrails and updated architecture documentation.

## V2 limitations

- Dragging directly inside rendered preview pages is not yet a full page-level editor.
- Cross-document drag currently creates a new inserted page group; deeper drop-inside-existing-group editing can be expanded from `insertGroupAt`.
- Projects have a default local project and store support; richer project management UI can be added without changing workspace persistence.
- Timeline is local metadata only.

## V3 ideas

- OCR-based full-text search.
- OneDrive and Dropbox integrations.
- AI-assisted page recommendations.
- AI-generated table of contents.
- Collaborative workspaces and shared projects.
- Comments and annotations.
- Mobile companion application.
- More granular page-level drag-and-drop inside final preview.
- Server-backed account sync, billing, teams, and audit logs.

