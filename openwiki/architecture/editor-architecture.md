---
type: Architecture Overview
title: Editor architecture
description: How the App shell, the useDocumentEditor state hook, and the SVG canvas fit together in InfoGraphic.
tags: [architecture, react, editor, svg]
timestamp: 2026-08-09T21:15:00Z
---

# What this is

InfoGraphic is a single-page, client-only React app. There is no backend, router, or account — the whole app is a shell around one in-memory document that the user edits visually or as raw JSON, then exports to SVG/PNG. The open document is also **autosaved to `localStorage`** (`src/lib/persist.ts`) so a refresh restores the last draft.

The three layers are:

1. **App shell** (`src/App.tsx`) — header actions, sidebar tabs, pickers, export wiring, and autosave.
2. **Editor state** (`src/hooks/useDocumentEditor.ts`) — the single source of truth for the document and all mutations.
3. **Rendering** (`src/components/InfographicCanvas.tsx`) — a pure SVG view of the document plus interaction overlays.

The [document model](/openwiki/domain/document-model.md) defines the shape everything operates on.

# Where to start

`src/main.tsx` mounts `<App />` inside a `ThemeProvider` (app chrome theme, distinct from the canvas theme). `App` restores `loadPersistedDocument()` when present, otherwise `src/data/example-homelab.ts`:

```19:22:src/App.tsx
  const canvasTheme = useCanvasTheme();
  const [initialDocument] = useState(() => loadPersistedDocument() ?? exampleHomelab);
  const editor = useDocumentEditor(initialDocument);
  const canvasRef = useRef<HTMLDivElement>(null);
```

Follow `editor.*` calls from `App.tsx` into `useDocumentEditor` to see how each UI action mutates state. Document changes debounce (~50ms) into `persistDocument`, and `pagehide` / `beforeunload` flush the latest draft.

# Editor state (single source of truth)

`useDocumentEditor(initial)` owns the `document` plus selection/mode state (`selectedNodeId`, `selectedGroupId`, `selectedConnectionId`, `mode`, `pendingPortId`). Every mutation goes through one `patch` helper that re-normalizes after each change:

```32:34:src/hooks/useDocumentEditor.ts
  const patch = useCallback((updater: (doc: InfographicDocument) => InfographicDocument) => {
    setDocument((prev) => normalizeDocument(updater(prev)))
  }, [])
```

This means **every edit re-runs `normalizeDocument`** (see [document model](/openwiki/domain/document-model.md)), so defaults, port migration, and orphan-connection pruning are always applied — callers never have to fix up the document themselves.

Notable behaviors:

- **Cascading deletes**: `deleteNode` also drops connections referencing that node's ports; `removePort` / `setPortBank` drop connections on removed ports; `deleteGroup` clears `groupId` on member nodes.
- **Group moves drag members**: `moveGroup` shifts all nodes whose `groupId` matches by the same delta.
- **Connect mode is two-click**: `handlePortClick` only acts when `mode === 'connect'`; the first click sets `pendingPortId`, the second calls `addConnection` (which de-dupes A↔B pairs and ignores self-links). While pending, the canvas draws a rubber-band that uses `routeConnection` when snapped to a hover port.
- **Selectable panels**: devices, clusters, connections, device lists, and the legend each have selection + Design-sidebar editors. Legend edits mutate shared `vlans` / `connectionTypes`.
- **Grid snapping**: moves/resizes snap through `src/lib/grid.ts` (`snapPointToDeviceGrid`, `snapToDeviceGrid`); connection lanes/risers snap via `snapLaneY` / `snapLaneX`. The canvas **background** shows only the device grid (the finer connection grid is snap-only).

The hook returns a flat API object consumed almost entirely by `App` and `PropertiesPanel`. `setDocument` is aliased to `loadDocument` (which resets selection) so external loads always go through normalization.

# App shell

`App.tsx` wires the hook to the UI:

- **Header actions** — add device (opens `DevicePicker`), add cluster (`editor.addGroup`), toggle connect mode, load example, export SVG/PNG.
- **Sidebar** — a `design` tab renders `PropertiesPanel` (edits the current selection); a `json` tab renders a `<textarea>` whose contents are applied via `parseDocument` on **Apply JSON**. Opening the JSON tab snapshots the live document into the textarea.
- **Global Esc** — a `keydown` listener clears pending connections and all selections.
- **Pickers** — `DevicePicker` (generic silhouettes → `addDevice`) and `IconPicker` (Simple Icons slug → `updateNode({ brandIcon })`).

Export reads the live `<svg>` out of the canvas DOM (`canvasRef.current?.querySelector("svg")`) and hands it to `downloadSvg` / `downloadPng` in `src/lib/export.ts`. PNG rasterizes the serialized SVG onto a 2× `<canvas>` with a fixed light background — so PNG export is always light regardless of the on-screen canvas theme.

# Rendering

`InfographicCanvas` is a controlled, mostly-pure SVG component. It takes the `document`, selection state, `mode`, and callbacks; it holds only a `svgRef`. Per render it derives, via `useMemo`:

- `routedConnections` — each connection routed through `routeConnection` (orthogonal path + lane), paired with its resolved `ConnectionType` and stroke color.
- `laneGuides` / `portWireColors` — visible routing lanes and per-port wire colors.

Draw order matters and is deliberate: background grid → title → group boxes → group select layer → connection **visuals** (+ rubber-band) → node cards → connection **hit targets** → group overlays → **device lists / legend** (on top so they stay draggable). Visuals draw under devices; interaction/hit layers draw on top (and only in `select` mode, except the connect preview). See the [document model](/openwiki/domain/document-model.md) for the routing/lane math.

Two independent theme axes exist: the **app chrome** theme (`src/context/ThemeContext.tsx`, DAL design system) and the **canvas** theme (`useCanvasTheme` + `canvasThemeStyle` in `src/lib/canvas-theme.ts`), toggled by the in-canvas light/dark button. They are separate on purpose — the exported diagram's look is controlled by the canvas theme, not the app.

# What to watch out for

- **Never mutate `document` directly** — always go through the hook's mutators so `normalizeDocument` runs and connections stay consistent.
- **Export depends on the rendered DOM**, not on state: if the `<svg>` isn't mounted (`canvasRef`), export is a no-op. `prepareSvgForExport` bakes computed paints and strips interaction chrome (`data-export-ignore`).
- **Connect mode vs select mode** gate different overlays; interaction layers (`GroupSelectLayer`, connection hit targets, `GroupOverlay`) render only in `select` mode.
- **PNG fill** uses the canvas `--canvas-bg` (including dark mode), not a hard-coded light color.

# Key source references

- `src/main.tsx` — mount + `ThemeProvider`
- `src/App.tsx` — shell, sidebar tabs, export wiring, pickers, autosave
- `src/hooks/useDocumentEditor.ts` — state + all mutations
- `src/components/InfographicCanvas.tsx` — SVG render + interaction layering + rubber-band
- `src/lib/export.ts` — SVG/PNG export
- `src/lib/persist.ts` — localStorage draft
- `src/lib/canvas-theme.ts`, `src/hooks/useCanvasTheme.ts` — canvas theme tokens
