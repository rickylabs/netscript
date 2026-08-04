# Worklog: scaffold QueryClient seam

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-scaffold-queryclient-seam-1287--1287` |
| Branch | `fix/scaffold-queryclient-seam-1287` |
| Archetype | `2 - Integration Package` |
| Scope overlays | `frontend + docs + scaffold` |

## Design

### Public Surface

- `createNetScriptQueryClient(): QueryClient` — truthful concrete factory contract.
- `QueryClientPort` — narrow, upstream-derived injection contract for SDK internals.

### Domain Vocabulary

- `QueryClient` — full TanStack client required by prefetch and dehydration.
- `QueryClientPort` — selected client capabilities required by collections and query factories.

### Ports

- `QueryClientPort` — narrow consumer dependency; derived from the implementation contract to prevent drift.

### Constants

- Existing query cache defaults remain unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness contract and draft | plan-gate + draft PR | `.llm/runs/...` |
| 2 | RED type and scaffold contracts | focused tests fail | SDK fixture, CLI E2E test |
| 3 | Structural type seam and generated check | focused tests pass | SDK factory/port, CLI gate |
| 4 | Documentation and consumer proof | fresh scaffold check | docs, evidence artifacts |

### Deferred Scope

- Remaining #1278 inventory — independent repository-wide soundness work.

### Contributor Path

Add capabilities to narrow query-client consumers by selecting methods from TanStack `QueryClient`;
never hand-copy generic method signatures.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-05 | 1 | research | Confirmed factory type erasure and missing `apps` gate coverage. |
| 2026-08-05 | 2 | RED type contract | TS2740 proved the factory result was not assignable to `QueryClient`; TS2551 proved `prefetchQuery` was erased. |
| 2026-08-05 | 2 | RED scaffold contract | Expected `deno task check`; actual duplicated command omitted `apps`. |
| 2026-08-05 | 3 | implementation | Factory now returns `QueryClient`; narrow port derives its methods; generated gate delegates to the workspace task. |
| 2026-08-05 | 3 | focused GREEN | SDK type fixture, SDK query-client test, and scaffold gate regression pass. |
| 2026-08-05 | 4 | fresh consumer proof | Generated 218-file Postgres/service workspace, ran normal DB codegen, and checked 24 artefacts including the showcase with zero diagnostics. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Structural fix | Runtime already is a concrete client; erased typing creates both failures. | issue #1287 + source |
| Generated task is gate authority | It owns all workspace member globs, including `apps`. | generated workspace contract |
| D6 composed evaluation | Owner milestone ruling. | dispatch |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| None | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| RED type contract | `deno check --unstable-kv tests/type-fixtures/sdk-assignability_type.ts` | PASS | Failed before implementation with TS2740 and TS2551; passes after. |
| RED scaffold contract | focused `scaffold-gates_test.ts` | PASS | Failed before gate change because the command omitted `apps`; passes after. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Type surface | PASS | `packages/sdk/tests/type-fixtures/sdk-assignability_type.ts` | Concrete assignment and `prefetchQuery` compile. |
| Scaffold output | PASS | `evidence/fresh-scaffold-check.md` | Workspace task checked the generated showcase with zero diagnostics. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Fresh scaffold check | PASS | `evidence/fresh-scaffold-check.md` | Fresh Postgres/service scaffold; normal DB generation prerequisite; no source edits. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh catalog showcase | PASS | SHA-256 and compiler artefact list in evidence | Uncast factory-to-dehydration boundary compiled. |

## Handoff Notes

- Inspect the factory return type, upstream-derived port, and generated `deno task check` gate first.
