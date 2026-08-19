# InfoGraphic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/ci.yml/badge.svg)](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/ci.yml)
[![PR](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/pr.yml/badge.svg)](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/pr.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D26-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white)](https://cursor.com)

A local-first editor that turns a homelab or network topology into a shareable SVG or PNG diagram. Drag devices, wire ports, group clusters, or edit the same document as JSON. Brand icons, VLAN colors, and orthogonal routing keep the map readable. Everything runs in the browser. No backend, database, or account.

Inspired by detailed homelab maps like [this example](https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fqabah1o620a91.png).

## Features

- Visual editor with a **Design** sidebar and optional **JSON** tab
- Drag & drop device placement, resizable clusters, and port-to-port connections (orthogonal routing with draggable lanes/risers)
- Editable legend and device-list panels; localStorage autosave
- Brand icons via the searchable [Simple Icons](https://simpleicons.org) catalog
- SVG and 2× PNG export
- Fully local. No backend, database, or accounts

## Requirements

- Node.js 26+
- pnpm 11+

## Quick start

1. `pnpm install`
2. `pnpm dev` (or `pnpm run build` && `pnpm preview`)

Open [http://localhost:5173](http://localhost:5173). The app loads an example homelab document you can edit in the left panel; the SVG preview updates live on the right.

## Examples

```bash
pnpm dev      # http://localhost:5173
pnpm preview  # serve the production build locally
```

## Environment

No environment variables or secrets are required — the app is fully local.

## Scripts

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `pnpm run validate`  | Format check, lint, typecheck, and unit tests.     |
| `pnpm run test`      | Run Vitest unit tests.                             |
| `pnpm dev`           | Start the Vite dev server.                         |
| `pnpm run build`     | Typecheck (`tsc -b`) and production build.         |
| `pnpm preview`       | Serve the production build locally.                |
| `pnpm run format`    | Format with oxfmt.                                 |
| `pnpm run lint`      | Lint with oxlint.                                  |
| `pnpm run typecheck` | Type-check with the TypeScript project references. |

## Development

Agent-oriented docs: [openwiki/quickstart.md](openwiki/quickstart.md).
Org engineering standards: AppBase `docs/org-standards/`.

## Editor

The app is a visual editor with a **Design** sidebar and optional **JSON** tab.

| Feature           | How to use                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Drag & drop**   | Select a device on the canvas and drag to reposition                                                        |
| **Add device**    | Header → **Add device** → pick a generic silhouette (router, switch, server, NAS, VM, cloud, endpoint, IoT) |
| **Brand icon**    | Select a device → **Choose icon** in the sidebar (searchable Simple Icons catalog)                          |
| **Network ports** | Each device has ports on its edges; add/edit/remove in the sidebar (+T/+R/+B/+L)                            |
| **Connect ports** | **Connect ports** in the header → click port A → click port B (Esc cancels)                                 |

Connections are stored as `fromPortId` / `toPortId`. Legacy `from` / `to` node IDs in JSON are auto-migrated on load.

### Port schema

```json
{
  "ports": [
    { "id": "pfsense-wan", "label": "WAN", "side": "top", "row": 0, "col": 0 },
    { "id": "pfsense-lan", "label": "LAN", "side": "bottom", "row": 0, "col": 0 }
  ]
}
```

`row` and `col` are grid indices in the port bank on that side (`top` or `bottom`).

## Export

- **Export SVG** — vector output, ideal for further editing
- **Export PNG** — raster export at 2× resolution

## Document schema

Infographics are defined as JSON with these main sections:

| Section           | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `vlans`           | Color-coded network segments (Trust, Guest, Servers, IoT, etc.) |
| `connectionTypes` | Line styles: ethernet, fiber, trunk, proxy, VPN                 |
| `groups`          | Dashed or solid containers for clusters / zones                 |
| `nodes`           | Devices, servers, VMs with IPs, specs, and brand icons          |
| `connections`     | Edges between node IDs                                          |
| `deviceLists`     | Compact vertical lists (e.g. IoT devices)                       |

### Brand icons

Set `brandIcon` on nodes or `icon` on services/devices using [Simple Icons](https://simpleicons.org) slugs:

```json
{
  "label": "pve-01",
  "brandIcon": "proxmox",
  "services": [
    { "icon": "docker", "name": "Docker" },
    { "icon": "grafana", "name": "Grafana" }
  ]
}
```

### Node positioning

Nodes use absolute `x` / `y` coordinates within the canvas (`width` × `height`). Groups are decorative overlays — position nodes inside them manually for v1.

## Roadmap ideas

- Visual group/zone editing
- Auto-layout (ELK / Dagre)
- Connection type picker when linking ports
- Import from UniFi, Proxmox, or Docker APIs
- Templates gallery

## License

MIT
