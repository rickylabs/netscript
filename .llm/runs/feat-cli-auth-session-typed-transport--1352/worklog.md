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
| 1 | Typed context contract and exact-URL bearer preparation | focused auth tests; CLI check | `packages/cli/deno.json`, `auth-types.ts`, `auth-session-client.ts` |
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

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate Claude Fable 5 session `0a21b6d5-3914-41b8-8e75-b78617e78574` | PASS | `plan-eval.md`; all eight checklist rows PASS |
| CLI doc lint baseline | `deno task doc:lint --root packages/cli --pretty` | PASS | exit 0, 0 diagnostics |
| Remaining static gates | plan validation commands | NOT_RUN | implementation not started |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-3/F-5/F-6/F-7/F-10/F-19 | NOT_RUN | validation plan | after implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused auth behavior | NOT_RUN | planned focused test | no external services |
| Aspire/Docker/browser/e2e | N/A | user prohibition | intentionally not run |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CLI publish dry-run | NOT_RUN | planned | CLI is the only touched package |

## Handoff Notes

- Inspect `research.md` findings 1-6 and locked decisions D1-D4 first.
- PLAN-EVAL must decide whether direct use of the public contribution descriptor's `prepare` method
  is a sanctioned narrow migration. A negative answer stops implementation and reports rescope.
