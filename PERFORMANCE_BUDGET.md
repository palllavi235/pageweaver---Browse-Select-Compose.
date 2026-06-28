# Performance Budget

Run the production build and budget check before shipping performance-sensitive changes:

```bash
npm run build
npm run budget
```

Current budgets are defined in `scripts/check-bundle-budget.mjs`.

## Budgeted chunks

- App shell
- React vendor
- Motion vendor
- PDF route/vendor
- PDF.js worker
- PDF generation worker
- Drag-and-drop vendor
- Query/state vendor
- Base CSS

The PDF workers are intentionally larger than normal route chunks because they contain PDF parsing/generation libraries. Keep those libraries isolated from the app shell.

## Performance rules

- Do not import PDF or drag-and-drop libraries into global providers or base layouts unless they are lazy-loaded.
- Keep source PDF bytes outside React state.
- Use TanStack Query for Drive data and Zustand for local client state.
- Prefer component-level memoization only where it avoids real repeated rendering work.
- Preserve thumbnail virtualization for long PDFs.
- Re-run `npm run budget` after dependency changes.

