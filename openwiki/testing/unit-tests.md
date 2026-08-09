---
type: Testing
title: Unit tests
description: Vitest coverage for routing, migration, grid snap, contrast, and localStorage persist helpers.
tags: [testing, vitest]
timestamp: 2026-08-09T21:15:00Z
---

# What this is

InfoGraphic’s automated tests are **Vitest** unit tests over pure `src/lib/` helpers. There is no React component or browser E2E suite yet. Tests run as part of `pnpm run validate` (via `run-quality-checks.mjs`) and locally with `pnpm run test`.

# How to run

```bash
pnpm run test        # vitest run (CI / validate)
pnpm run test:watch  # vitest watch mode
pnpm run validate    # format + lint + typecheck + tests
```

Config lives in `vite.config.ts` (`test.environment: 'node'`, `include: ['src/**/*.test.ts']`). App `tsc` excludes `*.test.ts` (`tsconfig.app.json`).

# What is covered

| Area      | File                                 | Focus                                                        |
| --------- | ------------------------------------ | ------------------------------------------------------------ |
| Routing   | `src/lib/connection-routing.test.ts` | Same-side bottom lanes, explicit `lane`, riser offsets       |
| Migration | `src/lib/migrate.test.ts`            | Preserve risers/`lane`, default `legend`, legacy `from`/`to` |
| Grid      | `src/lib/grid.test.ts`               | Device/connection snap + canvas margin clamp                 |
| Persist   | `src/lib/persist.test.ts`            | localStorage round-trip + corrupt JSON                       |
| Contrast  | `src/lib/color-contrast.test.ts`     | Text contrast threshold                                      |

# What to watch out for

- Prefer testing **pure lib** paths. Editor/canvas interaction stays manual for alpha.
- Persist helpers use `globalThis.localStorage` so Node tests can stub storage without a `window`.
- When adding schema fields that `normalizeDocument` rebuilds, add a migrate test so offsets/metadata are not stripped (this already bit riser offsets once).

# Key source references

- `vite.config.ts` — Vitest config
- `run-quality-checks.mjs` — validate pipeline includes tests
- `src/lib/*.test.ts` — current suites
