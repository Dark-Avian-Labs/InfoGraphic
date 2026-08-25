# InfoGraphic

## Org standards

CI/README/validate conventions live in AppBase [`docs/org-standards/`](../AppBase/docs/org-standards/). This repo is **semantic-release Track A** (version → validate → discord-status; no deploy yet). It does **not** follow the AppBase design system.

## Overview

Local-first homelab/network diagram editor. Fully static: no backend, database, accounts, or `.env`. Drafts autosave to browser `localStorage`. See `README.md` for scripts.

## Document edits

All mutations go through `useDocumentEditor`. Every load and every edit re-runs `normalizeDocument` (`src/lib/migrate.ts`). Never mutate `document` directly. New connection fields must be copied in `migrateConnection` or they are stripped on the next edit. Same for port routing fields (`lane`, `fromRiserOffset`, `toRiserOffset`) in `migratePort`.

Connections use `fromPortId` / `toPortId`. Legacy `from` / `to` node IDs migrate on load only if both nodes still exist; otherwise the edge is dropped silently. Port geometry is computed, not stored.

Deleting a node/port/bank prunes connections. Deleting a group clears member `groupId`. Moving a group shifts members by the same delta.

## Persist and export

localStorage key `infographic:document:v1` (~50 ms debounce). Corrupt JSON falls back to the example homelab. Export reads the **mounted SVG DOM**, not React state; it strips `[data-export-ignore]`, lane/riser guides, and resize handles. PNG is 2× and fills from live `--canvas-bg` (canvas theme, not app chrome).
