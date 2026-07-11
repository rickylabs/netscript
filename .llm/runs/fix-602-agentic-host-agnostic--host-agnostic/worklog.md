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
- Existing `wsl()`, `wslCd()`, launcher streaming, token capture, and token login behavior, now host-agnostic.

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
| 1 | Prove host-agnostic command planning and suite-wide routing | Full agentic tests, scoped check/fmt, WSL dry-run | `lib/agentic-lib.ts`, adjacent test, `codex/launch-codex-slice.ts`, `github/gh-token.ts`, `README.md`, run artifacts |

### Deferred Scope

- Cross-user Linux execution and distro selection are intentionally excluded.

### Contributor Path

Add or change WSL-bound execution only through the shared command-plan builder and `wsl()`/`wslCd()`;
pin host-specific argv in the adjacent unit test.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-11 | 1 | plan | Research and Design checkpoint complete; awaiting PLAN-EVAL. |
| 2026-07-11 | 1 | plan revision | First PLAN-EVAL found streaming and stdin call sites missed by the initial audit; scope and D1 expanded before implementation. |
| 2026-07-11 | 1 | plan gate | Separate Claude Opus cycle 2 returned `PASS`; implementation gate opened. |
| 2026-07-11 | 1 | implement | Added the host plan and routed buffered, captured, streaming, stdin, and dry-run consumers through it. |
| 2026-07-11 | 1 | gate | Full tests, scoped check/fmt, constructor audit, lock hygiene, and native-WSL dry-run passed. |
| 2026-07-11 | 1 | slice review | Supervisor reviewed the full diff: Windows argv stays exact; Linux cwd/user semantics are explicit; brief, git-safety, route-identity, one-sender, LF, and token-stdin flows are unchanged. |

### Post-slice reconcile

- Issue #602 remains open and is closed by PR #614 via `Closes #602`; parent #601 is reference-only.
- PR #614 carries `type:fix`, `area:cli`, `ci:skip-e2e`, beta.6 milestone, and one lifecycle status.
- Requested `status:in-progress` is absent from `.github/labels.yml`; the lifecycle-valid status
  advances from `status:plan-eval` to `status:impl-eval` for evaluation.

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Full unit suite | `deno test --no-lock -A .llm/tools/agentic/` | PASS | 209 passed, 0 failed |
| Type check | scoped `run-deno-check.ts` | PASS | 89 files, 0 findings |
| Format | scoped `run-deno-fmt.ts` | PASS | 89 files, 0 findings |
| Raw constructor audit | search direct `wsl.exe` execution constructors | PASS | no matches outside shared plan construction |
| Lock hygiene | `git diff -- deno.lock` | PASS | no output / unchanged |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Native WSL dry-run | PASS | `WSL_EXE_ON_PATH=NONE`; `DRY-RUN ok`; branch `fix/602-agentic-host-agnostic`, upstream `NONE`; rendered local `bash -lc` with worktree cwd | PATH excluded `/mnt/c` and scratch shim directories |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Windows execution | PASS | pure tests assert exact legacy `wsl.exe` argv with and without `--cd` | no Windows process spawned |
| Linux execution | PASS | pure tests + native dry-run | cwd maps to `Deno.Command.cwd`; mismatch diagnostic tested |

## Handoff Notes

- Inspect `buildWslCommand`/`resolveWslCommand` first, then verify every process consumer uses the plan.
- Confirm the native-WSL proof exercises git safety with no `wsl.exe` available on PATH.
