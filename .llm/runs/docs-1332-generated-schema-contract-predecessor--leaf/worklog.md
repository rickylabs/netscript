# Worklog: generated database schema contract predecessor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1332-generated-schema-contract-predecessor--leaf` |
| Branch | `docs/1332-generated-schema-contract-predecessor` |
| Archetype | N/A — docs-only leaf |
| Scope overlays | `SCOPE-docs.md`; responsive browser validation |

## Design

Recorded before implementation files per `workflow/run-loop.md` §3b.

### Public Surface

- Root task `docs:contract-derivation` — deterministic docs regression verdict.
- `docs/site/index.vto` — optional predecessor, correct SDK/query/page construction, and landing-page claims.
- `docs/site/explanation/contracts.md` — authoritative explanation of DB-less and DB-backed type flow.
- Database, route, server, builder, and service pages — bidirectional navigation to the generated-schema step.

### Domain Vocabulary

- Generated CRUD barrel — `<Model>Schema`, `<Model>CreateInput`, `<Model>UpdateInput`.
- Persistence shape — generated column types/nullability and private storage fields.
- Versioned API schema — narrowed/extended public boundary owned by contracts.
- Root alias / contracts alias — independent `@database/zod` import-map entries with different relative targets.
- Contract derivation fixture — temp workspace that compiles a contract member through its own import map.
- Query factory — contract-derived actions, cache keys, and server cache access.

### Ports

- `writeCrudZodBarrel` — real generated export producer.
- `generateDenoJson` and the scaffold contract path — real alias producers.
- `deno doc` / `deno why` — public API and dependency provenance inspection.
- `deno check --unstable-kv` — compile proof for contract and Fresh/SDK snippets.
- Playwright CLI — rendered responsive/semantic evidence.

### Constants

- `DATABASE_ZOD_ALIAS` — `@database/zod`.
- `ROOT_ZOD_TARGET` — `./database/<engine>/schema/.generated/zod/crud.ts`.
- `CONTRACTS_ZOD_TARGET` — `../database/<engine>/schema/.generated/zod/crud.ts`.
- `CRUD_EXPORT_SUFFIXES` — `Schema`, `CreateInput`, `UpdateInput`.
- Required PR labels — `type:docs`, `area:docs`, `area:database`, `priority:p1`, `status:impl`, `ci:skip-e2e`, `ci:skip-scaffold`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1.1 | Prove branch identity, scope, and executable plan | Git/base checks; live issue/PR read | run-dir artifacts |
| 1.2 | Prove generated contract derivation and both aliases | `docs:contract-derivation`; scoped TS wrappers | `.llm/tools/docs/check-docs-contract-derivation*.ts`, `deno.json`, run dir |
| 1.3 | Prove optional predecessor diagram parity | `diagrams:render`; `diagrams:check` | Mermaid, SVG, homepage diagram text, run dir |
| 1.4 | Prove homepage DB and SDK/Fresh flow | scratch pre-fix FAIL/post-fix PASS; site build | `docs/site/index.vto`, scratch evidence, run dir |
| 1.5 | Prove both contract origin paths | `docs:contract-derivation`; docs gates | `docs/site/explanation/contracts.md`, run dir |
| 1.6 | Prove omission and relation composition | `docs:contract-derivation` | `docs/site/explanation/contracts.md`, fixture if needed, run dir |
| 1.7 | Prove bidirectional navigation | docs/site link gates | database/route/server/builders/services docs, run dir |
| 1.8 | Prove release-ready implementation evidence | full gate sweep, Playwright matrix, lock hashes | run evidence, PR body, run dir |

### Deferred Scope

- Site-wide snippet extraction and census — issue #1374.
- Framework behavior or export changes — separate package/CLI work if ever required.
- IMPL-EVAL, ready-review transition, rebase on leaf L3, and merge — supervisor-owned.

### Contributor Path

Run `deno task docs:contract-derivation` after modifying the documented generated-schema path; edit
the focused fixture when the intentionally supported generator contract changes, and use the docs
pages' existing examples as the only prose source rather than duplicating generator rules elsewhere.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-10T09:24:21+02:00 | 1.1 | bootstrap | Clean requested branch verified at exact `origin/main` baseline; live issue read; no existing head PR. |
| 2026-08-10T09:24:21+02:00 | 1.1 | plan gate | Owner brief carries locked plan v2 and prior separate PLAN-EVAL correction; implementation session does not self-evaluate. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Treat owner brief as approved implementation contract | It explicitly supplies locked decisions, slices, gates, and a prior PLAN-EVAL correction. | Owner brief; harness evaluator-separation rule |
| Use docs overlay without package archetype | No framework source/export behavior changes are authorized. | `SCOPE-docs.md`; owner hard constraints |
| Keep PR draft through handoff | Separate IMPL-EVAL and supervisor sequencing are still required. | Owner brief; `netscript-pr` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None at bootstrap | — | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch/base | `git fetch origin && git status --short --branch`; `git rev-parse`; `git merge-base` | PASS | Branch clean; HEAD, merge-base, and `origin/main` all `da40fbfe3…`. |
| Live issue | GitHub issue fetch #1332 | PASS | Eight acceptance boxes and milestone 0.0.6 confirmed. |
| Existing PR | GitHub PR search by head branch | PASS | No PR exists before slice 1.1. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-19 | N/A | docs-only scope | No package/plugin source. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Framework runtime | N/A | owner hard constraint | No behavior change. |
| Browser | NOT_RUN | planned slice 1.8 | Homepage must be built first. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated contract module | NOT_RUN | planned slice 1.2 | Must resolve through `contracts/deno.json`. |
| Homepage SDK/Fresh module | NOT_RUN | planned slice 1.4 | Requires pre-fix and post-fix evidence. |

## Handoff Notes

- Evaluator should inspect the load-bearing contracts-member resolution in slice 1.2 first.
- This implementation agent will not write an IMPL-EVAL verdict or advance `status:impl`.
