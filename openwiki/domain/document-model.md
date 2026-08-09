---
type: Domain Model
title: Document model
description: The InfographicDocument schema — vlans, connection types, groups, port-based nodes, connections, and how JSON is normalized/migrated on load.
tags: [domain, schema, ports, connections, migration]
timestamp: 2026-08-09T21:15:00Z
---

# What this is

Everything in InfoGraphic operates on one plain-object `InfographicDocument`. It is the value edited by [the editor](/openwiki/architecture/editor-architecture.md), rendered by the SVG canvas, round-tripped through the JSON tab, written to SVG/PNG on export, and autosaved via `src/lib/persist.ts`. The canonical type lives in `src/types.ts`.

```113:130:src/types.ts
export interface InfographicDocument {
  title: string
  width: number
  height: number
  vlans: Vlan[]
  connectionTypes: ConnectionType[]
  groups: InfographicGroup[]
  nodes: InfographicNode[]
  connections: InfographicConnection[]
  deviceLists?: DeviceList[]
  legend?: LegendPosition
}
```

# The pieces

| Section           | Purpose                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `vlans`           | Color-coded network segments (`id`, `name`, `color`, optional `subnet`). Nodes/groups/lists reference a VLAN by `vlanId` to inherit color. |
| `connectionTypes` | Line presets: `style` is `solid` \| `dashed` \| `double` \| `thick` \| `vpn`, with an optional `color`.                                    |
| `groups`          | Rectangular cluster/zone containers (`x/y/width/height`, optional `vlanId`, `color`, `dashed`). Nodes join via `groupId`.                  |
| `nodes`           | Devices — see below. Each has a `kind`, position/size, metadata, and a list of `ports`.                                                    |
| `connections`     | Edges between **ports** (`fromPortId` → `toPortId`), typed by `typeId`, with optional `color`, `label`, routing `lane`, and riser offsets. |
| `deviceLists`     | Optional compact vertical lists of names/icons (not full nodes); `x`/`y`/`width`/`vlanId` are editable.                                    |
| `legend`          | Optional `{ x, y }` for the VLAN/connection legend panel (defaults to top-right).                                                          |

`vlanById` and `connectionTypeById` (in `src/types.ts`) are the lookup helpers used throughout rendering.

# Nodes and ports

A node's `kind` is one of `router | switch | server | nas | vm | cloud | device | endpoint`. Nodes carry display metadata (`label`, `subtitle`, `ip`, `specs`, `services`, `brandIcon`) and, crucially, **ports** grouped into **port banks**.

- A `PortBank` describes a grid of ports on the `top` or `bottom` side: `{ side, rows: 1|2, columns }`.
- A `NetworkPort` is one jack: `{ id, label, side, row, col }`. Ports are what connections attach to — **connections reference ports, not nodes**.
- Defaults per device kind come from `defaultPortsForKind` / `defaultPortBanksForKind` in `src/lib/ports.ts` (e.g. a `switch` gets a 2×8 bottom bank; a `router` gets WAN ports on top + LAN on bottom).

Port **geometry** is computed, not stored: `getPortPosition` (in `src/lib/ports.ts`) centers each bank under the node using the port pitch constants (`PORT_CELL_W`, `PORT_GAP`) and grid math from `src/lib/grid.ts`. Node minimum size is derived from its banks (`minNodeDimensions`), so widening a bank can grow the node.

# Connections and routing

A connection is `{ id, fromPortId, toPortId, typeId, color?, label?, lane?, fromRiserOffset?, toRiserOffset? }`. The stroke color resolves in this order (`src/lib/connections.ts`): connection `color` → connection type `color` → `#1e293b` fallback.

Routing is orthogonal with a shared horizontal "lane" between the two ports, computed in `src/lib/connection-routing.ts`:

- `routeConnection` builds an orthogonal path (port → stub → optional horizontal jog → lane → lane → optional jog → stub → port). Lane Y is either the connection's explicit `lane` or a computed default snapped to the connection grid (same-side bottom ports route **below** both stubs).
- `fromRiserOffset` / `toRiserOffset` shift the vertical risers horizontally relative to each port stub (draggable in the editor).
- Parallel links between overlapping port ranges are fanned out by `laneStackOffset` so they don't overlap.
- Users can drag the horizontal lane (`updateConnectionLane` / `snapLaneY`) or each vertical riser (`updateConnectionRiser` / `snapLaneX`).
- Connect-mode rubber-band previews call the same `routeConnection` when snapped to a destination port.
- `pointsToRoundedPath` turns the point list into an SVG path with rounded corners.

# Normalization and migration (important)

`parseDocument` (`src/lib/document.ts`) validates only that `title`, `nodes`, and `connections` exist, then delegates to `normalizeDocument` (`src/lib/migrate.ts`). **`normalizeDocument` runs on every load and after every edit** (via the editor's `patch`), so it is the real guarantee of a well-formed document. It:

- fills document defaults — `width` 1600, `height` 1100, empty arrays for `vlans` / `connectionTypes` / `groups` / `deviceLists`, and a default `legend` position;
- ensures every node has ports and port banks, injecting kind defaults when absent, then snaps node dimensions;
- **migrates legacy shapes**: node-level connections (`{ from, to }` node IDs) are converted to port-level (`{ fromPortId, toPortId }`) by picking a sensible port on the facing side (`pickPortForPeer`); legacy port `offset` is migrated to `row`/`col` (`migratePort`);
- **copies connection routing fields** (`lane`, `fromRiserOffset`, `toRiserOffset`) — omitting a field here silently drops it on every edit;
- **prunes orphans**: connections whose endpoints can't be resolved are dropped.

`serializeDocument` is a plain `JSON.stringify(doc, null, 2)` — the JSON tab shows the already-normalized document. Autosave uses compact `JSON.stringify(doc)` via `src/lib/persist.ts`.

# What to watch out for

- **Ports are the join key.** Deleting a node/port or shrinking a bank invalidates connections; the editor prunes them, and `normalizeDocument` drops any that survive with dangling IDs.
- **Legacy `from`/`to` connections only migrate if both nodes exist** at load time — otherwise the connection is silently dropped.
- **Deprecated fields** remain for backward compatibility: `NetworkPort.offset` (migrated to `row`/`col`) and `pointsToPath` (use `pointsToRoundedPath`). Don't write new code against them.
- **`row`/`col` are grid indices**, not pixels — actual positions are derived at render time, so bank layout changes reflow ports automatically.

# Key source references

- `src/types.ts` — schema + lookup helpers
- `src/lib/document.ts` — `parseDocument` / `serializeDocument`
- `src/lib/migrate.ts` — `normalizeDocument`, connection migration, orphan pruning
- `src/lib/ports.ts` — port banks, kind defaults, geometry (`getPortPosition`)
- `src/lib/connection-routing.ts` — lane routing + rounded paths
- `src/lib/connections.ts` — stroke color + port wire color map
- `src/lib/grid.ts` — device/connection grid + lane/riser snapping
- `src/lib/persist.ts` — localStorage draft load/save
- `src/data/example-homelab.ts` — a full, valid reference document
