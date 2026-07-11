# Worklog: host-agnostic agentic WSL execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-602-agentic-host-agnostic--host-agnostic` |
| Branch | `fix/602-agentic-host-agnostic` |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Design

### Public Surface

- Pure host-aware WSL command-plan construction in `agentic-lib.ts`.
- Existing `wsl()`, `wslCd()`, and token resolution behavior, now host-agnostic.

### Domain Vocabulary

- Host OS — Linux selects local bash; Windows selects `wsl.exe`.
- Command plan — binary, argv, and optional cwd passed to `Deno.Command`.
- Current/requested user — identities that must match in local mode.

### Ports

- `Deno.Command` through existing `runBin`/capture helpers — process execution seam.
- Host OS and current username supplied to the pure builder — testability seam.

### Constants

- No new finite string vocabulary is required.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove host-agnostic command planning and suite-wide routing | Full agentic tests, scoped check/fmt, WSL dry-run | `lib/agentic-lib.ts`, adjacent test, `README.md`, run artifacts |

### Deferred Scope

- Cross-user Linux execution and distro selection are intentionally excluded.

### Contributor Path

Add or change WSL-bound execution only through the shared command-plan builder and `wsl()`/`wslCd()`;
pin host-specific argv in the adjacent unit test.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-11 | 1 | plan | Research and Design checkpoint complete; awaiting PLAN-EVAL. |

## Gate Results

Not run before PLAN-EVAL.
