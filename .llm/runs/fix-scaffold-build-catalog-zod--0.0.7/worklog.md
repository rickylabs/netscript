# Worklog: scaffold Fresh production build catalog resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-build-catalog-zod--0.0.7` |
| Branch | `fix/scaffold-build-catalog-zod` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- Existing `netscript-dev init` command; no command, option, exported symbol, or entrypoint changes.
- Generated outputs: app `deno.json` and database `schema/.generated/zod/crud.ts`.

### Domain Vocabulary

- App production import target — an app import-map value Fresh/Vite can load during client and SSR builds.
- Seeded database contract — disposable build-time Zod schemas replaced by database codegen.
- Existing Archetype-6 spine remains unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced. Relevant vertical feature is the existing local/maintainer init
  flow; no feature catalog or command ownership changes.

### Ports

- Existing `ScaffolderPort` and `FileSystemPort` own generated file writes/directories.
- Existing `TemplatePort` remains injected; no new port or external dependency.

### Constants

- `SCAFFOLD_WORKSPACE_CATALOG.zod` — single generated-workspace Zod range authority.
- `SCAFFOLD_APP_IMPORTS.zod` — explicit production-resolvable materialization of that authority.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Lock research, design, and PLAN-EVAL N/A | Plan checklist/manual evidence | Run artifacts |
| 1 | RED: forbid unresolved catalog targets in generated app imports | Structured focused test exits 1 | app config test + run artifacts |
| 2 | GREEN: materialize Zod target and seed pre-codegen Zod entrypoint | Focused tests + exact consumer builds + requested local gates | CLI constants, database scaffolder/tests, run artifacts |

### Deferred Scope

- Upstream Fresh/Deno loader support for workspace catalogs — unnecessary for valid generated output.
- Hosted `scaffold.runtime` — no local runtime lease; CI/evaluator evidence pending.
- PR #1945 modification — it remains the post-merge locking gate.

### Contributor Path

Add an external Fresh app dependency in `scaffold-app-catalog.ts`, materialize its npm target in
`SCAFFOLD_APP_IMPORTS`, and extend the parsed-manifest semantic test. Add pre-codegen database
entrypoints through `DatabaseScaffolder` only when generated consumers already import them.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | 0 | Bootstrap | Read issue #1971, requested skills, harness contracts, doctrine, and explicit baseline. |
| 2026-09-03 | 0 | Reproduction | Exact init exited 0; created 210 files and 47 directories. |
| 2026-09-03 | 0 | Reproduction | Immediate build exited 1 on missing `schema/.generated/zod/crud.ts`. |
| 2026-09-03 | 0 | Reproduction | Standalone SQLite codegen exited 0. |
| 2026-09-03 | 0 | Reproduction | Post-codegen build exited 1 on literal `catalog:` during SSR. |
| 2026-09-03 | 0 | Contract | Native Deno resolves installed Zod; `@deno/loader` 0.4.0 returns literal `catalog:`. |
| 2026-09-03 | 0 | Plan gate | `PLAN-EVAL: N/A` — exact reproduction fully determines contract, scope, alternatives, and gates. |
| 2026-09-03 | 1 | RED | Added parsed-manifest regression; structured wrapper exited 1 with literal `[["zod", "catalog:"]]`. |
| 2026-09-03 | 1 | Commit | Pushed RED as `0fa3f6e564747a737cd0683071af7124d642e010`. |
| 2026-09-03 | 2 | GREEN | Materialized app Zod target from the workspace catalog and seeded the pre-codegen Zod contract. |
| 2026-09-03 | 2 | Drift repair | Extended exact-file seed cleanup after Prisma rejected the first non-empty generated directory. |
| 2026-09-03 | 2 | Consumer proof | Exact clean init/build/codegen/build sequence exited `0/0/0/0`. |
| 2026-09-03 | 3 | Hosted feedback | e2e-cli run 33706833254 failed all tiers on TS2339 for emitted `Deno.errors.DirectoryNotEmpty`. |
| 2026-09-03 | 3 | Corrective RED | Emitted-script typecheck reproduced the same TS2339; focused wrapper exited 1. |
| 2026-09-03 | 3 | Corrective GREEN | Recursive Zod-directory removal with only `NotFound` benign; emitted-script test passed. |
| 2026-09-03 | 3 | Static consumer proof | Exact `scaffold.service` suite exited 0; 5/5 gates passed. |

## Raw Reproduction Evidence

Scratch root: `.llm/tmp/design-route-prod-gate-causal/catalog-build-probe` (untracked by this run).

```text
$ deno run -A packages/cli/bin/netscript-dev.ts init catalog-build-probe ...
✅ Project scaffolded successfully in 0.3s
Created: 210 files, 47 directories
exit 0

$ (cd apps/catalog-build-probe-web && deno task build)
✗ Build failed in 4.60s
[deno] Could not load .../database/sqlite/schema/.generated/zod/crud.ts
(imported by ../../contracts/versions/v1/users.contract.ts):
Import 'file:///.../database/sqlite/schema/.generated/zod/crud.ts' failed, not found.
exit 1

$ (cd database/sqlite && DATABASE_URL='file:./sqlite.db' SQLITE_URI='file:./sqlite.db' deno task db:generate)
✔ Generated Prisma Client (7.10.0)
✔ Generated Prisma Zod Generator to ./schema/.generated/zod
exit 0

$ (cd apps/catalog-build-probe-web && deno task build)
vite v7.2.2 building ssr environment for production...
✓ 456 modules transformed.
✗ Build failed in 4.74s
error during build:
[vite:load-fallback] Could not load catalog: (imported by routes/examples/users/(_lib)/route-contract.ts): ENOENT: no such file or directory, open 'catalog:'
exit 1
```

Resolver differential from the generated app:

```text
deno file:///.../node_modules/.deno/zod@4.5.4/node_modules/zod/index.js
loader catalog:
exit 0
```

Generated app catalog inventory:

```json
{"appCatalogImports":[["zod","catalog:"]]}
```

The production route graph imports `zod` directly from
`routes/examples/users/(_lib)/route-contract.ts`; there are no other app `catalog:` values to test
for reachability.

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Explicit npm app target from workspace catalog authority | Accepted by both native Deno and Vite loader without a second range constant | Reproduction + plan D1 |
| Seed missing Zod barrel | The brief requires the immediate build to pass and init already uses a seeded Prisma-client lifecycle | Reproduction + plan D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Prisma rejects a non-empty seeded output directory | minor | Yes; resolved in GREEN implementation. |
| Root policy excludes CLI from requested lint/fmt wrappers | baseline | Yes; supplemental changed-file evidence recorded. |
| Generated cleanup referenced missing `Deno.errors.DirectoryNotEmpty` | minor | Yes; resolved in corrective slice 3. |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline focused tests | structured test wrapper on existing catalog/config tests | PASS (exit 0; 21/21) | Confirms a new RED assertion is needed. |
| RED app manifest regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/app/generators-config_test.ts` | EXPECTED FAIL (exit 1; 18 passed, 2 failure records) | `unresolvedCatalogImports` actual value is `[["zod", "catalog:"]]`, expected `[]`. |
| GREEN focused tests | structured wrapper on app config/catalog and database scaffolder/generator tests | PASS (exit 0; 35/35) | Covers explicit npm materialization, seed content, and exact cleanup contract. |
| Scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS (exit 0) | 979 files, 9 batches, zero diagnostics. |
| Scoped lint (exact requested) | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | BASELINE REFUSAL (exit 2) | Root config excludes `packages/cli/`; 979 selected, 233 processed, remainder dropped. |
| Changed-file lint supplement | `deno lint --no-config ... <six changed TS files>` | PASS (exit 0) | Checked all six changed files with recommended + JSR and root-added rules. |
| Scoped fmt (exact requested) | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | BASELINE REFUSAL (exit 2) | Root config excludes `packages/cli/`; zero parsed findings. |
| Changed-file fmt supplement | `deno fmt --check --no-config ... <six changed TS files>` | BASELINE FINDINGS (exit 1) | Only two pre-existing deltas outside changed lines, in catalog and DB-config files. |
| Repository check | `deno task check` | PASS (exit 0) | Desktop fixture: 15 reachable modules, 0 unmapped; 3,107 files checked in 26 batches. |
| Corrective RED emitted sample | structured wrapper on `scaffolder_test.ts` | EXPECTED FAIL (exit 1) | Exact TS2339: `DirectoryNotEmpty` does not exist on `typeof errors`. |
| Corrective GREEN focused tests | structured wrapper on app config/catalog and database scaffolder/generator tests | PASS (exit 0; 35/35) | Includes real `deno check --no-config --no-lock` of the emitted cleanup script. |
| Corrective scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS (exit 0) | 979 files, 9 batches, zero diagnostics. |
| Corrective changed-file fmt/lint | no-config checks on scaffolder source/test | PASS (exit 0/0) | Both changed TypeScript files checked. |

Raw RED wrapper output:

```text
{"exitCode":1,"summary":{"passed":18,"failed":2,"ignored":0,"totalResults":20,"uniqueFailures":2},"failures":[{"message":"AssertionError: Values are not equal. [Diff] Actual / Expected - [[\"zod\", \"catalog:\"]] + []","tests":[{"name":"materializes production route dependencies instead of emitting catalog targets","file":"./packages/cli/src/kernel/templates/app/generators-config_test.ts","line":402}]}]}
```

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 6 / `quality:gate` | PASS (exit 0) | Local command output | Quality census, catalog compliance, and doctrine gate completed. Existing warnings remain non-blocking. |
| Asset barrel | N/A | No asset/template carrier changed | Source writers/constants only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Local `scaffold.runtime` | N/A (owner prohibited) | Implement brief ceiling | Hosted evidence remains pending. |

### Corrective Static Scaffold Gate

```text
$ deno task e2e:cli run scaffold.service --format pretty
Running scaffold.service
> preflight.deno: Deno CLI is available
  PASSED
> scaffold.init: Scaffold generated project
  PASSED
> service.list: List generated services
  PASSED
> database.codegen: Generate database clients (standalone, no Aspire)
  PASSED
> generated.service-check: Type-check generated service workspace
  PASSED 14540ms
Summary: passed=5 failed=0 skipped=0
exit 0
```

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh production build before codegen | PASS (exit 0) | Exact clean GREEN scaffold below | Seeded Zod contract is reachable. |
| SQLite codegen | PASS (exit 0) | Exact clean GREEN scaffold below | Seed cleanup leaves Prisma output valid. |
| Fresh production build after codegen | PASS (exit 0) | Exact clean GREEN scaffold below | Real generated Zod barrel replaces the seed. |

Raw GREEN consumer output from the exact clean scratch path:

```text
$ deno run -A packages/cli/bin/netscript-dev.ts init catalog-build-probe ...
✅ Project scaffolded successfully in 0.1s
Created: 211 files, 48 directories
exit 0

$ (cd apps/catalog-build-probe-web && deno task build)
vite v7.2.2 building client environment for production...
✓ 526 modules transformed.
vite v7.2.2 building ssr environment for production...
✓ 964 modules transformed.
✓ built in 8.66s
exit 0

$ (cd database/sqlite && DATABASE_URL='file:./sqlite.db' SQLITE_URI='file:./sqlite.db' deno task db:generate)
Task db:clear-seeded-client deno run --allow-write=schema/.generated scripts/clear-seeded-client.ts
✔ Generated Prisma Client (7.10.0)
✔ Generated Prisma Zod Generator to ./schema/.generated/zod
exit 0

$ (cd apps/catalog-build-probe-web && deno task build)
vite v7.2.2 building client environment for production...
✓ 533 modules transformed.
vite v7.2.2 building ssr environment for production...
✓ 971 modules transformed.
✓ built in 8.86s
exit 0
```

Generated contract after codegen:

```json
{"appZod":"npm:zod@^4.4.3","rootZod":"^4.4.3","catalogAppImports":[]}
```

The post-codegen `crud.ts` is the real `@generated` re-export barrel, proving the disposable seed
was replaced rather than retained.

## Handoff Notes

- Evaluator should inspect the explicit app target derivation, bounded seed cleanup, exact
  two-build proof, emitted cleanup typecheck, immutable-head receipts, baseline lint/fmt exclusion,
  and hosted `scaffold.runtime` status first.
