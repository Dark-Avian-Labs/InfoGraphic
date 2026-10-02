<p align="center">
  <img src="https://raw.githubusercontent.com/Dark-Avian-Labs/.github/refs/heads/main/banner.png" alt="Dark Avian Labs">
</p>

# InfoGraphic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
![Node](https://img.shields.io/badge/Node-%3E%3D26-339933?logo=node.js&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white&style=flat-square)](https://cursor.com)

InfoGraphic turns a homelab or a small network into a diagram you can export. Drag devices onto a canvas, wire their ports, and leave with an SVG or a PNG when the rack photo is out of date.

It is for someone who wants the map on one screen, without standing up a server to draw it.

## Features

**Devices, ports, and wires.** You place the boxes, name the ports, and draw the connection from port to port. Orthogonal routing keeps a crowded rack readable. VLAN colors and connection styles do the same job for the legend.

**Brand icons.** Device marks come from the Simple Icons set, so a switch looks like the vendor you actually bought.

**The same document two ways.** The canvas and a JSON tab edit one diagram. The JSON is there when a bulk rename is faster than clicking.

**SVG and PNG.** Export reads the diagram on screen. The PNG is twice the resolution and fills from the canvas color, so the picture matches the map you were looking at.

## What you should know

Everything runs in the browser. There is no account, no database, and no server to sign in to. The draft autosaves in this browser only. Open the same files on another machine and you start from the example homelab, unless you exported and brought the file with you.

A saved draft that no longer parses falls back to that example. The broken copy is not repaired in place.

## Self-hosting

Node 26 or newer, and pnpm 12. There is no `.env`.

```
pnpm install
pnpm dev
pnpm run build
```

`dist` is a static site. Diagrams stay in the visitor's browser, so hosting it does not collect them and does not sync them either.

## License

MIT
