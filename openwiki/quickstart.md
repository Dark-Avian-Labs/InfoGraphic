---
type: Repository Overview
title: Quickstart
description: Entrypoint for InfoGraphic — a local-first homelab/network topology infographic editor built with React and Vite.
tags: [quickstart, overview]
timestamp: 2026-08-09T21:15:00Z
---

# What this is

**InfoGraphic** is a local-first editor that turns a homelab / network topology description into a shareable SVG (or PNG) diagram. It ships a visual editor (drag devices, wire ports, group clusters, edit legend/device lists) plus a raw JSON tab over the same document model, and exports vector/raster output. There is no backend, database, router, or account — everything runs in the browser, with **localStorage autosave** of the open diagram.

Primary audience: the owner drawing homelab diagrams; agents changing the editor, document schema, or rendering.

# Stack and layout

| Area            | Tech / path                                                     |
| --------------- | --------------------------------------------------------------- |
| App             | React 19 + TypeScript, `src/`                                   |
| Build           | Vite 8 + Tailwind CSS 4 (`@tailwindcss/vite`)                   |
| State           | `useDocumentEditor` hook (`src/hooks/useDocumentEditor.ts`)     |
| Rendering       | SVG canvas (`src/components/InfographicCanvas.tsx`)             |
| Icons           | `@icons-pack/react-simple-icons` + `simple-icons`               |
| Persist         | `src/lib/persist.ts` (browser `localStorage` only)              |
| Quality gate    | oxfmt + oxlint + `tsc -b` + Vitest via `run-quality-checks.mjs` |
| Releases        | semantic-release (`.releaserc.json`)                            |
| Package manager | pnpm 11+                                                        |
| Runtime         | Node ≥ 26                                                       |

High-level tree:

- `src/main.tsx` → `src/App.tsx` — editor shell (header actions, sidebar, canvas, pickers, autosave)
- `src/hooks/useDocumentEditor.ts` — all document mutations and selection state
- `src/lib/` — document parse/serialize, migration, ports, grid, routing, export, persist, catalogs
- `src/components/` — canvas, node cards, connection lines, panels, pickers, modals
- `src/data/example-homelab.ts` — the document loaded when no local draft exists
- `src/types.ts` — the `InfographicDocument` schema
- `.github/workflows/{pr,ci}.yml` — PR checks and semantic-release CI

# How to run

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm run build    # tsc -b && vite build
pnpm run validate # oxfmt --check + oxlint + tsc -b + vitest
pnpm run test     # vitest only
```

On first visit the app loads `example-homelab`; afterward it restores the last local draft. Edit via the **Design** sidebar or the **JSON** tab, then **Export SVG** / **Export PNG**.

# Build and release

- **`pnpm run validate`** runs format check (`oxfmt --check`), lint (`oxlint`), typecheck (`tsc -b`), and unit tests (`vitest run`) via `run-quality-checks.mjs`. It exits non-zero if any step fails.
- **Releases** use semantic-release (Track A) with the Angular preset (`.releaserc.json`). It runs on `main`, bumps `package.json` (no npm publish — `npmPublish: false`), and commits `build(release): <version> [skip ci]`. `chore` and `ci` commits also trigger a patch release.

# Concept map

- [Editor architecture](/openwiki/architecture/editor-architecture.md) — App shell, the `useDocumentEditor` state hook, SVG canvas, autosave, and interaction.
- [Document model](/openwiki/domain/document-model.md) — the `InfographicDocument` schema, ports/banks, connections, routing, and JSON normalization/migration.
- [Unit tests](/openwiki/testing/unit-tests.md) — Vitest coverage for routing, migrate, grid, persist, and contrast.

# Agent gotchas

- **Single source of truth**: all document edits go through `useDocumentEditor`; every mutation re-runs `normalizeDocument` (`src/lib/migrate.ts`), so callers never fix up the document by hand. New connection fields must be copied in `migrateConnection` or they are stripped on every edit.
- **Ports, not nodes, connect**: connections reference `fromPortId` / `toPortId`. Legacy `from` / `to` node IDs auto-migrate on load; deleting a node or port also removes its connections.
- **`normalizeDocument` fills defaults**: missing `width`/`height`, empty `vlans`/`groups`, default `legend` position, and default ports/port-banks per device kind are injected on load.
- **Two theme axes**: the app chrome theme (`ThemeContext`) is separate from the exported-diagram **canvas** theme (`useCanvasTheme`). PNG export uses the live canvas background (including dark).
- **Export reads the DOM**, not state: it serializes the mounted `<svg>` (baking computed paints, stripping interaction chrome), so nothing exports if the canvas isn't rendered.
- **Autosave** writes the document to `localStorage` (`infographic:document:v1`) after every change; no server, no accounts.
- **No env / no backend**: purely local; nothing to configure.

# Backlog

| Area                       | Anchor                                                                                    | Reason                                                |
| -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Canvas components          | `src/components/NodeCard.tsx`, `ConnectionLine.tsx`, `GroupInteraction.tsx`, `Legend.tsx` | Per-element SVG/interaction detail not yet documented |
| Icon catalog & brand icons | `src/lib/icon-catalog.ts`, `src/lib/brand-icons.tsx`                                      | Simple Icons loading / lazy catalog                   |
| Component / E2E tests      | (none)                                                                                    | Only lib unit tests so far                            |
