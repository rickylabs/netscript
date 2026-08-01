# Worklog: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript plugin install` behavior only; no command spelling or exported API changes.
- `JsrPackageFileFetcher` remains the injected published-file read port.

### Domain Vocabulary

- Resolved package schema fragment — normalized published path plus bytes.
- Schema source ladder — package-resolved fragments when declared in metadata, otherwise copied
  plugin source.
- Declared schema — `manifest.capabilities.hasDatabaseMigrations === true`.

### Ports

- `JsrPackageFileFetcher` — existing testable external JSR file seam.
- `FileSystemPort` / `ScaffolderPort` — existing copied-source read and root-target write seams.

### Constants

- No new finite command IDs or extension axes. Database path components reuse `SCAFFOLD_DIRS` and
  current `.prisma` suffix policy.

### Archetype-6 Checkpoint

- Spine abstracts/type parameters: unchanged by this slice.
- Layer-2 abstracts: none introduced.
- Vertical feature: `public/features/plugins/install`; kernel policy adapter:
  `kernel/adapters/plugin/db-integration.ts`.
- Extension axes/registries: existing `DbEngineRegistry`; no new registry.
- Generated output: `database/<engine>/schema/plugins/<name>/<fragment>.prisma`.
- Composition/commands/permissions: unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove dependency installs resolve, prioritize, copy, and validate published schema fragments while local/no-DB/dry-run behavior remains intact. | focused tests + scoped wrappers + `quality:gate` + one-pass `scaffold.userland-install` | DB integration + tests; public install/JSR adapter + tests; userland suite; run artifacts |

### Deferred Scope

- `InstallSpec.prismaContract` consumer design — unused seam is not required for backward-compatible
  0.0.2 installation.
- Legacy generic placeholder generation — report the stale expectation, but do not redesign the
  maintainer scaffolder.

### Contributor Path

Add schema contributions under a plugin package's `database/**/*.prisma`, include them in publish
metadata, and declare `hasDatabaseMigrations`; the public install resolver discovers them without a
host-side plugin-name mapping.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | 1 | research | Baseline functional repro: zero copies/no target; 0.0.2 metadata mapping verified. |
| 2026-08-01 | 1 | design | Source ladder, declaration signal, error boundary, and gate set locked. |
| 2026-08-01 | 1 | plan gate | Canonical Qwen PLAN-EVAL launch failed authentication before an agentic turn; implementation remains stopped. |
| 2026-08-01 | 1 | owner waiver | Opus 5 supervisor retired the Qwen lane, supplied the independent PLAN-EVAL, and pre-approved the one-row replan. |
| 2026-08-01 | 1 | replan | Acceptance box 4 moved from the structurally local-path-only userland suite to a semantic JSR-shaped `installPlugin` integration test. D1–D5 unchanged. |
| 2026-08-01 | 1 | implementation | Added package metadata filtering/fetching at the public JSR edge and package-first copy/error policy in the kernel DB adapter. |
| 2026-08-01 | 1 | tests | Added package-precedence, filename, fail-loudly, no-DB/no-schema, slash-normalization, and semantic JSR install coverage. |
| 2026-08-01 | 1 | reconcile | Scope remains #1014 only; no manifest/export/dependency changes, no new debt, no PR/push actions. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Package metadata wins over copied placeholder | The published fragment is authoritative in dependency mode. | plan D3 / issue watch-for |
| Kernel owns target layout; public JSR edge owns network resolution | Preserves CLI layering and test seams. | doctrine A8/AP-25; plan D1–D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| No PR/push trail by owner instruction | minor process override | yes |
| Formal evaluator unavailable | significant process blocker | yes |
| Retired evaluator blocker superseded by owner waiver | significant process update | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 742 files, 7 batches, 0 occurrences. |
| Scoped lint | `run-deno-lint.ts --root packages/cli` | PASS | 742 files, 0 occurrences. |
| Requested broad fmt | `run-deno-fmt.ts --root packages/cli` | FAIL | One unrelated existing Markdown finding in `packages/cli/e2e/README.md`; preserved. |
| TS package fmt | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS | 742 files, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality / doctrine | PASS | `deno task quality:gate` exit 0 | No new quality findings; doctrine emitted existing WARN/INFO rows only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused plugin install tests | PASS | `46 passed (56 steps), 0 failed` | Exact requested kernel plugin + public plugin feature command. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Semantic JSR-shaped install integration | PASS | `install-plugin_test.ts`: real Saga model written to root schema; exact normalized JSR URL asserted | Approved substitute for box 4. |
| `scaffold.userland-install` | N/A | local-path hard-force in `plugin-install-gates.ts` | Cannot evidence dependency mode. |
| Published `scaffold.runtime --source jsr` | NOT_RUN | requires published 0.0.3 CLI fix | Release-train follow-up evidence. |

## Handoff Notes

- PLAN-EVAL should challenge D1–D5 and the userland suite's stale placeholder expectation first.
- The Opus 5 owner waiver supersedes the retired-lane blocker. The one-row replan is pre-approved;
  implementation may proceed without a second PLAN-EVAL.
- IMPL-EVAL should inspect package-first precedence, the JSR-only hard-failure boundary, and the
  honest exclusion of `scaffold.userland-install` from dependency-mode evidence.

## Acceptance Evidence

| Box | Change | Evidence line |
| --- | --- | --- |
| 1 | Resolve published `database/*.prisma` paths from `versionMetadata.files` through the injected fetcher. | Semantic test asserts two exact normalized JSR fetch URLs and real content. |
| 2 | Kernel writes resolved fragments to the unchanged engine/plugin target and preserves bare-schema naming. | `db-integration_test.ts`: named and bare filename tests PASS. |
| 3 | JSR dependency installs throw `ScaffoldValidationError` for DB-required, declared, zero-fragment packages; no-DB/no-schema remain no-ops. | Kernel boundary test plus install-flow rejection test PASS with searched paths. |
| 4 | Dependency-mode semantic install flow writes the real published fragment into root schema. | `install-plugin_test.ts` PASS; local-path-only userland suite explicitly excluded. |
