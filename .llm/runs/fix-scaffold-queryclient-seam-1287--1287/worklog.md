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
| RED type contract | pending | NOT_RUN | Before implementation. |
| RED scaffold contract | pending | NOT_RUN | Before gate change. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Type surface | PENDING_SCRIPT | pending | — |
| Scaffold output | PENDING_SCRIPT | pending | — |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Fresh scaffold check | NOT_RUN | pending | Artifact evidence required. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh catalog showcase | NOT_RUN | pending | Must type-check unedited. |

## Handoff Notes

- Inspect the factory return type, upstream-derived port, and generated `deno task check` gate first.
