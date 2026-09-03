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
| None from the locked plan | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline focused tests | structured test wrapper on existing catalog/config tests | PASS (exit 0; 21/21) | Confirms a new RED assertion is needed. |
| RED app manifest regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/app/generators-config_test.ts` | EXPECTED FAIL (exit 1; 18 passed, 2 failure records) | `unresolvedCatalogImports` actual value is `[["zod", "catalog:"]]`, expected `[]`. |

Raw RED wrapper output:

```text
{"exitCode":1,"summary":{"passed":18,"failed":2,"ignored":0,"totalResults":20,"uniqueFailures":2},"failures":[{"message":"AssertionError: Values are not equal. [Diff] Actual / Expected - [[\"zod\", \"catalog:\"]] + []","tests":[{"name":"materializes production route dependencies instead of emitting catalog targets","file":"./packages/cli/src/kernel/templates/app/generators-config_test.ts","line":402}]}]}
```

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 6 / `quality:gate` | NOT_RUN | Pending GREEN | Required before final push. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Local `scaffold.runtime` | N/A (owner prohibited) | Implement brief ceiling | Hosted evidence remains pending. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh production build before codegen | FAIL (exit 1) | Raw output above | Expected RED reproduction. |
| Fresh production build after codegen | FAIL (exit 1) | Raw output above | Expected RED reproduction. |

## Handoff Notes

- Evaluator should inspect the explicit app target derivation, disposable Zod seed, exact two-build
  proof, immutable-head receipts, and hosted `scaffold.runtime` status first.
