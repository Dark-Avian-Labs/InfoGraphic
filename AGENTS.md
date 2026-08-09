# InfoGraphic

## Org standards

Dark Avian Labs engineering conventions (README shape, CI/PR runners, `pnpm run validate`, OpenWiki, release tracks) live in AppBase [`docs/org-standards/`](../AppBase/docs/org-standards/). This repo follows the **semantic-release** track (Track A): `.releaserc.json` + a `version` job in `ci.yml` that runs `pnpm exec semantic-release`. There is no deploy target yet, so CI is `version → validate → discord-status` (no SSH deploy).

Defaults: Node **26+**, pnpm **11.x**, `pnpm run validate` (oxfmt + oxlint + typecheck + Vitest), Blacksmith runners with `useblacksmith/checkout@v1` and `actions/setup-node@v7`.

### Quick reference

| Action             | Command                                                       |
| ------------------ | ------------------------------------------------------------- |
| Install deps       | `pnpm install`                                                |
| Dev server         | `pnpm dev` (Vite, default port 5173)                          |
| Validate           | `pnpm run validate` (format check + lint + typecheck + tests) |
| Test               | `pnpm run test` (Vitest)                                      |
| Format             | `pnpm run format` (oxfmt)                                     |
| Lint               | `pnpm run lint` (oxlint)                                      |
| Typecheck + build  | `pnpm build`                                                  |
| Preview prod build | `pnpm preview`                                                |

### Notes

- Fully local static React SPA — no backend, database, or `.env`. Diagram drafts autosave to browser `localStorage`.
- Quality gate is `pnpm run validate` (oxfmt `--check`, oxlint, `tsc -b`, `vitest run`) followed by `pnpm build` in CI.
- Releases are commit-driven (Angular convention). The `version` job needs the `CI_PAT` secret; `discord-status` needs `DISCORD_WEBHOOK` / `DISCORD_USERID`.

## OpenWiki

This repository has documentation located in the /openwiki directory.

Start here:

- [OpenWiki quickstart](openwiki/quickstart.md)

OpenWiki includes repository overview, architecture notes, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

When working in this repository, read the OpenWiki quickstart first, then follow its links to the relevant architecture, workflow, domain, operation, and testing notes.
