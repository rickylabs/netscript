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
| 2026-08-10T09:37:42+02:00 | 1.2 | first fixture run | Direct static imports reached 22 existing CLI `isolatedDeclarations` diagnostics before the fixture executed; no package source was changed. |
| 2026-08-10T09:37:42+02:00 | 1.2 | fixture | Kept the new tool statically checked, loaded unchanged real emitters in a runtime probe, and compiled root plus contracts-member consumers with `--unstable-kv`. |
| 2026-08-10T09:37:42+02:00 | 1.2 | negative controls | Root alias move, contracts alias move, and `ProductCreateInput` rename each exited 1 with the expected module/export error. |
| 2026-08-10T09:37:42+02:00 | 1.2 | reconcile | Live PR #1441 remains draft and mergeable at slice-1.1 head; only the implementation agent's slice comment is new, issue #1332 remains open, and `status:impl` remains correct. |
| 2026-08-10T09:45:07+02:00 | 1.3 | diagram | Added a visually optional DB model → `db generate` / `@database/zod` predecessor while keeping the DB-less contract path direct. |
| 2026-08-10T09:45:07+02:00 | 1.3 | parity | Regenerated the committed SVG; all 16 Mermaid sources match their committed SVGs and homepage source-format passes. |
| 2026-08-10T09:45:07+02:00 | 1.3 | reconcile | PR #1441 discussion contains only this implementation agent's slice 1.1 and 1.2 comments; no external findings require action. |
| 2026-08-10T09:56:21+02:00 | 1.4 | API proof | `deno doc` confirmed the client/factory action surface and `db generate --help` confirmed `--db` plus `--project-root`. |
| 2026-08-10T09:56:21+02:00 | 1.4 | pre-fix control | Current `.withRoute()`-only chain exited 1 with exactly two TS2345 errors: `SearchParamValue` is not assignable to `number \| undefined`. |
| 2026-08-10T09:56:21+02:00 | 1.4 | corrected chain | The same assembled SDK/Fresh module with coercing `.withSearchParams(...)` exited 0; the service implementation module also exited 0. |
| 2026-08-10T09:56:21+02:00 | 1.4 | rendered homepage | Optional Tab 0 is first, tab 3 constructs the scaffold-shaped SDK factory before `definePage`, and the homepage build/rendered-output gate passes. |
| 2026-08-10T09:56:21+02:00 | 1.4 | reconcile | PR #1441 discussion contains only this implementation agent's slice 1.1–1.3 comments; no external findings require action. |
| 2026-08-10T10:02:23+02:00 | 1.5 | origin framing | Separated the normal DB-backed generated predecessor from the valid DB-less authored origin while keeping the versioned contract as the public boundary. |
| 2026-08-10T10:02:23+02:00 | 1.5 | claims | Removed the five absolute no-generation/hand-authored-first claims and added a back-link to the database generation step. |
| 2026-08-10T10:02:23+02:00 | 1.5 | reconcile | PR #1441 discussion contains only this implementation agent's slice 1.1–1.4 comments; no external findings require action. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Treat owner brief as approved implementation contract | It explicitly supplies locked decisions, slices, gates, and a prior PLAN-EVAL correction. | Owner brief; harness evaluator-separation rule |
| Use docs overlay without package archetype | No framework source/export behavior changes are authorized. | `SCOPE-docs.md`; owner hard constraints |
| Keep PR draft through handoff | Separate IMPL-EVAL and supervisor sequencing are still required. | Owner brief; `netscript-pr` |
| Runtime-load the real scaffold emitters | Root declaration mode exposes unrelated pre-existing CLI diagnostics; the generated probe executes unchanged sources while scoped checks still type-check both new committed TS files. | First `docs:contract-derivation` run; `drift.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None at bootstrap | — | yes |
| Transitive CLI declaration diagnostics require a runtime emitter probe | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch/base | `git fetch origin && git status --short --branch`; `git rev-parse`; `git merge-base` | PASS | Branch clean; HEAD, merge-base, and `origin/main` all `da40fbfe3…`. |
| Live issue | GitHub issue fetch #1332 | PASS | Eight acceptance boxes and milestone 0.0.6 confirmed. |
| Existing PR | GitHub PR search by head branch | PASS | No PR exists before slice 1.1. |
| Derivation gate | `rtk proxy deno task docs:contract-derivation` | PASS | 4/4 tests; root and contracts-member compile exits 0. |
| Scoped check | `run-deno-check.ts` over both new TS files | PASS | 2 files, 1 batch, 0 failed, 0 diagnostics. |
| Scoped lint | `run-deno-lint.ts` over both new TS files | PASS | 2 files, 1 batch, 0 findings. |
| Scoped format | `run-deno-fmt.ts` over both new TS files | PASS | 2 files, 1 batch, 0 findings after scoped write. |
| API inspection | `deno doc --filter writeCrudZodBarrel`; `generateDenoJson`; `scaffoldContracts` | PASS | Real signatures and source definitions confirmed. |
| Dependency provenance | `rtk proxy deno task deps:why zod` | PASS | `sourceUsed: true`; 167 source hits; not removable. |
| Lock equality | `git diff --exit-code -- deno.lock docs/site/deno.lock`; `git hash-object ...` | PASS | No diff; expected `a541d408…` and `311255423…`. |
| Diagram render | `deno task diagrams:render` from `docs/site/` | PASS | Rendered 16 diagrams; only `contract-flow.svg` changed for this slice. |
| Diagram parity | `deno task diagrams:check` from `docs/site/` | PASS | All 16 committed SVGs match Mermaid sources. |
| Site source format | `deno task check:source-format` from `docs/site/` | PASS | `Docs source format: OK`. |
| Homepage pre-fix | `deno check --unstable-kv --config .llm/tmp/docs-1332-homepage/deno.json .llm/tmp/docs-1332-homepage/pre-fix.tsx` | EXPECTED FAIL | Exit 1; exactly two TS2345 search/contract input mismatches. |
| Homepage post-fix | same command with `post-fix.tsx` | PASS | Exit 0; coercion resolves `ctx.search.limit` to `number`. |
| Homepage service | same scratch config with `service.ts` | PASS | Exit 0; implemented contract handler and `defineService` compile. |
| Site build | `deno task build` from `docs/site/` | PASS | 617 files generated; homepage semantics and 220 rendered HTML files pass. |
| Docs accuracy | `rtk proxy deno task docs:accuracy` | PASS | 192 published source pages and documented dialect/import constraints pass. |
| Fixture scoped wrappers | check/lint/fmt roots for both derivation fixture TS files | PASS | 2 files; 0 diagnostics, rules, or format findings. |
| Contracts framing build | `deno task build` from `docs/site/` | PASS | 617 files; rendered homepage semantics and 220 HTML files pass. |
| Contracts framing links | `deno task check:links` from `docs/site/` | PASS | 32,773 internal links across 220 pages resolve. |

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
| Generated root alias | PASS | positive compile plus root-alias negative exit 1 | Real root emitter target is load-bearing. |
| Generated contract module | PASS | positive compile plus contracts-alias/barrel negatives exit 1 | Resolves through generated `contracts/deno.json`, not the root import map. |
| Homepage diagram | PASS | `diagrams:check`; updated `alt` and caption | Both DB-backed and direct DB-less origins are described. |
| Homepage SDK/Fresh module | PASS | pre-fix exit 1; post-fix and service exits 0 | Compiled through current package entrypoint modules; server-only cache call is explicit. |

## Snippet Proofs

| Snippet | Source page:line | Exact proving command | Result |
| --- | --- | --- | --- |
| Homepage optional database derivation + contract | `docs/site/index.vto:56`, `:61` | `rtk proxy deno task docs:contract-derivation` | PASS; contract member compiles through generated `contracts/deno.json`. |
| Homepage service handler/bootstrap | `docs/site/index.vto:66` | `deno check --unstable-kv --config .llm/tmp/docs-1332-homepage/deno.json .llm/tmp/docs-1332-homepage/service.ts` | PASS; exit 0. |
| Homepage page before search coercion | `docs/site/index.vto:71` (same assembled chain without `.withSearchParams`) | `deno check --unstable-kv --config .llm/tmp/docs-1332-homepage/deno.json .llm/tmp/docs-1332-homepage/pre-fix.tsx` | EXPECTED FAIL; exit 1, two TS2345 errors. |
| Homepage SDK factory + corrected page | `docs/site/index.vto:71` | `deno check --unstable-kv --config .llm/tmp/docs-1332-homepage/deno.json .llm/tmp/docs-1332-homepage/post-fix.tsx` | PASS; exit 0. |

## Handoff Notes

- Evaluator should inspect the load-bearing contracts-member resolution and three command-level
  negative exits in slice 1.2 first.
- This implementation agent will not write an IMPL-EVAL verdict or advance `status:impl`.
