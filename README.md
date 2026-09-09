<p align="center">
  <img src="https://raw.githubusercontent.com/Dark-Avian-Labs/.github/refs/heads/main/banner.png" alt="Dark Avian Labs">
</p>

# InfoGraphic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Dark-Avian-Labs/InfoGraphic/ci.yml?style=flat-square&label=CI)](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/ci.yml)
[![PR](https://img.shields.io/github/actions/workflow/status/Dark-Avian-Labs/InfoGraphic/pr.yml?style=flat-square&label=PR)](https://github.com/Dark-Avian-Labs/InfoGraphic/actions/workflows/pr.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D26-339933?logo=node.js&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white&style=flat-square)](https://cursor.com)

Local-first homelab topology editor. Drag devices, wire ports, export SVG or PNG. Brand icons, VLAN colors, orthogonal routing. Everything runs in the browser — no backend, database, account, or `.env`.

## Gotchas

- Drafts autosave to `localStorage` (`infographic:document:v1`). Corrupt JSON falls back to the example homelab.
- Connections use `fromPortId` / `toPortId`. Legacy `from` / `to` node IDs migrate on load only if both nodes still exist; otherwise the edge is dropped silently.
- Export reads the **mounted SVG DOM**, not React state. PNG is 2× and fills from the canvas theme, not the app chrome.
- No environment variables. `pnpm dev` / `pnpm preview` is enough.

## License

MIT
