# Worklog — service-auth-adapters

## Slice 1 — Catalog + scaffolding

- Added catalog entries:
  - `better-auth`: `^1.6.20`
  - `@workos-inc/node`: `^10.4.0`
- Added packages:
  - `packages/auth-workos`
  - `packages/auth-better-auth`
- Catalog law:
  - Runtime provider deps are package-local via `catalog:`.
  - No dependency was added to `@netscript/service`.
  - `@prisma/client` catalog entry was not changed.
- Validation:
  - `deno check --unstable-kv packages/auth-workos/mod.ts packages/auth-better-auth/mod.ts` — PASS.
  - `deno task deps:latest` — PASS for the new provider pins; neither `better-auth` nor
    `@workos-inc/node` appeared in the behind list.
  - `deno task deps:audit` — NON-BLOCKING EXISTING ADVISORIES: reported existing `undici` and `vite`
    advisories outside this slice's new provider package graph.
- Lock hygiene:
  - `deno.lock` changed only to register the two new workspace members and their currently imported
    package dependencies.

