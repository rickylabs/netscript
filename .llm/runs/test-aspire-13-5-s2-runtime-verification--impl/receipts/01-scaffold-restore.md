# Slice 1 — scaffold and restore proof

## Scaffold

- Timestamp (completion): `2026-08-29T22:29:17.461Z`
- Command:
  `deno run -A packages/cli/bin/netscript-dev.ts init aspire-13-5-postgres --path .llm/tmp/aspire-13-5-s2 --db postgres --service --service-name users --service-port 3001 --editor none --ci --non-interactive --yes --no-git --force --json`
- Exit code: `0`
- Observed: local-source PostgreSQL project created at
  `.llm/tmp/aspire-13-5-s2/aspire-13-5-postgres`; 209 files, 46 directories, 3 Aspire resources.
- Raw output: [`01-scaffold.raw.txt`](./01-scaffold.raw.txt)

## Generated-only S1 train override

- Timestamp: between scaffold and restore, completed before `2026-08-29T22:30:12.623Z`.
- Edit: generated `aspire/aspire.config.json` only.
- Observed: SDK, PostgreSQL, and Redis changed to 13.5.3; Browsers changed to
  `13.5.3-preview.1.26425.3`.
- Evidence: [`01-generated-aspire-config.md`](./01-generated-aspire-config.md)
- Ownership note: PR #1727/S1 owns generator pins; this S2 branch does not edit `packages/cli`.

## Aspire restore

- Timestamp (completion): `2026-08-29T22:30:12.623Z`
- Command: `aspire restore --non-interactive --nologo` from the generated `aspire/` directory.
- Exit code: `0`
- Aspire CLI: `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688`
- Observed: SDK code restored successfully; elapsed `18.13 s`; regenerated
  `.aspire/modules/aspire.mts` (4,493,632 bytes).
- Raw output: [`01-aspire-restore.raw.txt`](./01-aspire-restore.raw.txt)
- Module/signature excerpt: [`01-restored-module-grep.raw.txt`](./01-restored-module-grep.raw.txt)

## AppHost TypeScript compile

### Before generated workspace dependency materialization

- Timestamp (completion): `2026-08-29T22:31:09.624Z`
- Command: `./node_modules/.bin/tsc --noEmit -p tsconfig.apphost.json`
- Exit code: `2`
- Observed: compile stopped on unresolved `zod` imports in generated `.helpers`; it did not report
  an Aspire health-check signature error.
- Raw output: [`01-tsc-noemit.raw.txt`](./01-tsc-noemit.raw.txt)

### Generated workspace dependency materialization

- Timestamp (completion): `2026-08-29T22:31:53.229Z`
- Command: `deno install` from the disposable generated project root.
- Exit code: `1`
- Observed: npm dependencies, including `zod`, were materialized; the full install then stopped on
  the expected pre-generation database import `database/postgres/schema/.generated/zod/crud.ts`.
- Raw output: [`01-generated-deno-install.raw.txt`](./01-generated-deno-install.raw.txt)

### After dependency materialization

- Timestamp (completion): `2026-08-29T22:32:09.341Z`
- Command: `./node_modules/.bin/tsc --noEmit -p tsconfig.apphost.json`
- Exit code: `0`
- Observed: 13.5.3 accepts the generated options-object calls
  `withHttpHealthCheck({ path, endpointName })`; elapsed `8.97 s`.
- Raw output: [`01-tsc-noemit-after-install.raw.txt`](./01-tsc-noemit-after-install.raw.txt)
