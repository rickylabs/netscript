# Worklog: CLI auth-session typed credential transport

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-auth-session-typed-transport--1352` |
| Branch | `feat/cli-auth-session-typed-transport` |
| Archetype | `6 - CLI Tooling`; constrained by SDK `2 - Universal Library` |
| Scope overlays | `none` |

## Design

### Public Surface

- No package export changes.
- Existing `createAuthPluginCommand` dependency object gains optional application context resolution.
- Existing `AuthSessionHttpPort` gains optional per-request typed context below the package export map.

### Domain Vocabulary

- `AuthSessionClientContext` — caller-owned capability that can resolve an access token.
- `AuthSessionRequestOptions` — optional typed context passed from command application code to the
  session HTTP port.

### Ports

- `AuthSessionHttpPort` — exact-URL list/revoke transport boundary; accepts request options without
  owning credential storage.
- auth command context resolver — application composition seam invoked once per direct command.

### Constants

- No new public finite vocabulary. A module-local canonical bearer contribution owns the
  `authorization` header and direct-only cache declaration.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Audit, decision record, PLAN-EVAL | independent PLAN-EVAL | `.llm/runs/feat-cli-auth-session-typed-transport--1352/**` |
| 1 | Typed context contract and exact-URL bearer preparation | focused auth tests; CLI check | `auth-types.ts`, `auth-session-client.ts`, `auth-session-client_test.ts` |
| 2 | Application resolver wiring and regression/import proofs | focused auth tests; complete CLI-owned tests | `auth-plugin-command.ts`, `auth-plugin-command_test.ts` |
| 3 | Merge-readiness evidence and independent IMPL-EVAL | all user-specified gates | run artifacts and PR metadata only |

### Deferred Scope

- Public explicit-origin SDK transport — separate issue/review needed.
- Cookie/session/CORS/`__Host-`/environment convenience — auth pack scope.
- Default dead localhost URL — #1243.
- SDK contribution diagnostics, tracing, and locale work — #1927, #1921, #1922.

### Contributor Path

Add credential behavior by defining or reusing a public `SdkClientContribution`, inject its typed
context from application composition, and keep endpoint mechanics behind an existing port adapter.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | 0 | audit | Re-baselined live #1352 and #1915; rows 1 and 3-7 SHIPPED, row 2 PARTIAL. |
| 2026-09-02 | 0 | design | Locked narrow public-descriptor migration; no SDK widening. |
| 2026-09-02 | 0 | PLAN-EVAL | Independent Claude Fable 5 medium session returned PASS; direct public `prepare` composition is sanctioned with honest transport facts and a redaction regression test. |
| 2026-09-02 | 1 | implementation | `FetchAuthSessionHttp` retained exact URL ownership and now applies the public auth-core bearer's typed header patch using honest URL-derived transport facts. |
| 2026-09-02 | 1 | focused gate | Adapter tests passed 3/3; CLI check passed 916 files in 8 batches. |
| 2026-09-02 | 2 | implementation | Application command dependency resolves optional caller-owned auth context once per direct list/revoke call and passes it through the session port. |
| 2026-09-02 | 2 | test gate | Focused auth tests passed 14/14; full package-owned CLI suite passed 1233/1233. |
| 2026-09-02 | 3 | merge-readiness | Doc, publish, JSDoc, quality, architecture, lock, and source-boundary evidence collected; lint/fmt wrapper baseline mismatch logged as drift. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exact-URL fetch remains in CLI adapter | Public SDK transport is discovery-only | `research.md`, `plan.md` D1 |
| Bearer preparation uses public auth-core contribution | Avoid duplicated security/policy logic | `plan.md` D2, doctrine A1/A4 |
| Caller context is optional and explicit | Preserve compatibility and absence semantics | `plan.md` D3/D4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` is unavailable on this host, so focused raw read-only commands are used | minor | yes |
| Mandated CLI lint/fmt wrappers select a root-config-excluded tree and an isolated E2E fixture | baseline gate defect | yes |
| A frozen check exposed one transient lock entry; the package import-map attempt and lock entry were reverted | minor, resolved | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate Claude Fable 5 session `0a21b6d5-3914-41b8-8e75-b78617e78574` | PASS | `plan-eval.md`; all eight checklist rows PASS |
| CLI doc lint baseline | `deno task doc:lint --root packages/cli --pretty` | PASS | exit 0, 0 diagnostics |
| CLI doc lint final | `deno task doc:lint --root packages/cli --pretty` | PASS | exit 0, 0 diagnostics; A/B delta 0 |
| CLI structured check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | exit 0; 916 selected, 8 batches, 0 failed batches, 0 diagnostics |
| Mandated CLI lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | BASELINE_BLOCKED | exit 2; 0 lint diagnostics. Root `deno.json` excludes `packages/cli/`; isolated desktop fixture then cannot resolve its catalog. Relevant configs are byte-identical to `origin/main`. |
| Changed-file lint | `deno lint --no-config --rules-tags=recommended,jsr --rules-include=no-process-global,no-node-globals <5 changed TS files>` | PASS | exit 0; 5 checked, 0 diagnostics |
| Mandated CLI fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | BASELINE_BLOCKED | exit 2; 0 format findings. Root `deno.json` excludes `packages/cli/`; isolated fixture is outside the workspace. Relevant configs are byte-identical to `origin/main`. |
| Changed-file format | `deno fmt --check --no-config --single-quote --line-width 100 <5 changed TS files>` | PASS | exit 0; 5 checked |
| JSDoc examples | `deno task docs:jsdoc-examples` | PASS | exit 0; 357 checked, 0 failures; deferred `unboundName=116`, `typeError=14` |
| Quality gate | `deno task quality:gate` | PASS | exit 0; repository scanner found 0 findings and architecture subgate passed |
| Architecture gate | `deno task arch:check` | PASS | exit 0; no doctrine failures |
| Source boundaries | focused import/source inspection | PASS | no SDK internal, service, or auth-core server import in adapter; no constrained concurrent-owner paths touched |
| Lock hygiene | SHA-256 plus baseline diff | PASS | `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; diff from `37452f11f` is empty |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-3 typed public boundary | PASS | check, doc lint A/B, public SDK `deno doc` | no package export changes; auth-core SDK surface remains three symbols |
| F-5/F-6 documentation and publish | PASS | doc lint and package dry-run | no README/public-export carrier moved |
| F-7 quality and structure | PASS | changed-file lint/fmt plus quality/arch gates | mandated wrapper configuration drift is separately recorded |
| F-10 CLI behavior | PASS | focused and package-owned tests | exact URLs and existing parser behavior preserved |
| F-19 secrets | PASS | random credential redaction test and direct-only declaration | credential absent from thrown error; no ambient lookup |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Adapter behavior | PASS | `auth-session-client_test.ts` | exit 0; 3 passed, 0 failed |
| Focused auth behavior | PASS | structured runner over adapter + command tests | exit 0; 14 passed, 0 failed |
| Full package-owned CLI | PASS | structured runner over `packages/cli`, excluding prohibited E2E tree | exit 0; 1233 passed, 0 failed, 0 ignored |
| Aspire/Docker/browser/e2e | N/A | user prohibition | intentionally not run |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CLI publish dry-run | PASS | `deno publish --dry-run --allow-dirty` from `packages/cli` | exit 0; 646 files; 7 pre-existing dynamic-import analysis warnings; success marker present |

## Handoff Notes

- Independently verify the final seven-row classification and the exact row-2 wording: application
  code supplies typed context, credentials use the canonical public SDK contribution protocol, and
  the CLI has no server-only import; the exact HTTP request remains CLI-owned because the public SDK
  transport has no exact-origin facility.
- Treat the lint/fmt wrapper exit 2 as a disclosed baseline tool/configuration defect only if the
  unchanged-config and clean changed-file evidence is sufficient; otherwise return a blocking
  IMPL-EVAL verdict rather than rewriting repository-wide lint/fmt ownership in this slice.
