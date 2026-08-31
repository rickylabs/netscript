# Context Pack: #1452 Slice 1 — lazy KV primitive and scaffold adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-host-factory--1452` |
| Branch | `feat/kv-lazy-plugin-context` |
| Current phase | **ready-merge** (Slice 1 complete; Slice 2 deferred behind an architecture ruling) |
| Archetype | `2 — Integration`; `6 — CLI/Tooling` carrier |
| Scope overlays | none |

## Current State

**Corrected 2026-08-31.** This section was frozen at bootstrap and read "Implementation has not
started" long after Slice 1 shipped. Actual state:

Slice 1 is **implemented, Tier-A ACCEPTED, IMPL-EVAL PASS, and fully gated**. Immutable head
`b87fd92faf86bb2a616effc6c340568f7ddeaf96`, integrated onto `main` `eaea940be` at seam `8ab11ddee`.
PR #1820 is non-draft, `status:ready-merge`, `Refs #1452` **partial** with `closingIssuesReferences`
deliberately empty. Slice 2 (the host factory) remains deferred behind an architecture ruling.

The superseded bootstrap text is preserved in git history at `7bd87da5c`; it is not restated here.

## Completed

- Re-baselined branch/main/lock state and confirmed no remote branch.
- Confirmed the exact 69-line template reference class and public KV contracts.
- Confirmed Slice 2 remains decision-blocked and outside the ceiling.

## In Progress

- Nothing. Slice 1 is complete, gated, and evaluated; the PR is a surfaced merge candidate awaiting
  the coordinator. Slice 2 is deferred, not in progress.

## Next Steps

1. Coordinator merges PR #1820 at the exact evidence head. This lane does not merge.
2. Slice 2 stays blocked until the `@netscript/plugin` → `@netscript/kv` dependency-edge ruling, the
   db-resolver injection shape, and the undefined `appsettings` scope are decided.
3. Fold the evaluator's deferred finding — `SharedKvConfig` is only implicitly exported and
   `createLazyKv` is absent from the kv reference page — into Slice 2 or the docs sweep.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `createLazyKv(config?)` in KV application layer | plan LD-1/LD-2 | One new stable root export only |
| Template imports the primitive | plan LD-4 | No other host composition changes |
| PLAN-EVAL N/A | plan/worklog | Mechanical, fully specified Slice 1 only |
| Reviewer dispatch | superseded by coordinator order | The separate-session IMPL-EVAL was dispatched and returned `PASS`; the original "stop at draft Tier-A handoff" boundary no longer applies |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/kv/application/lazy-kv.ts` | new | `createLazyKv()` — the published lazy `WatchableKv` primitive |
| `packages/kv/application/mod.ts` | changed | re-export |
| `packages/kv/mod.ts` | changed | root export |
| `packages/kv/tests/lazy-kv_test.ts` | new | laziness proven by observation, not happy path |
| `packages/cli/src/kernel/assets/plugins/service-context.ts.template` | changed | 123 → 43 lines; delegates to the published primitive |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | regenerated | carrier, tool output |
| `packages/mcp/.../export-surface-corpus.generated.ts` | regenerated | carrier, tool output (+1 symbol) |
| Run-dir artifacts | changed | research/plan/tier-a/worklog/context-pack/receipts |

## Gates

**Corrected 2026-08-31.** This table previously read `NOT_RUN / implementation pending` across the
board. That was false: it was never updated after Slice 1 landed. Actual state at integrated head
`186cea472`, evidence head `3130fb52b` — every receipt `gitHead == actualGitHead`, each checked for
non-empty `stdout.bytes` against the known `deno task` cache-replay trap.

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | **PASS** | scoped `check` (`^packages/(kv\|cli)/`) 303-byte stdout, 31,193 ms; `lint` 352-byte; `fmt-check` 301-byte |
| Fitness | **PASS** | `check:assets-barrel` exit 0 — this gate is `gen && git diff --exit-code`, so zero-byte stdout is legitimately clean, verified by confirming no regenerated-but-uncommitted carrier remains; `docs:exports-drift` PASS; `check:mcp-export-corpus` PASS, 7678 symbols = `main`'s 7677 +1 (`createLazyKv`) |
| Runtime | **PASS** | Previously recorded `N/A / forbidden` — wrong: the template and generated-output change *does* require `scaffold.runtime` evidence. Opted into the explicit CI gate via `e2e-cli-gate` (local Aspire is topology-parked). Run `33357314826` at head `7bd87da5c`: `scaffold-runtime (aspire + docker + postgres)` **success**, `scaffold-runtime-sqlite (aspire + sqlite + garnet)` **success**, `scaffold-static (deno-only)` **success**. Before the label, every scaffold lane reported `skipping`. |
| Consumer | **PASS** | `packages/kv` tests 80 passed / 3 ignored / 0 failed, 288-byte stdout; `deno.lock` byte-identical `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |
| IMPL-EVAL | **PASS** | separate-session OpenHands GLM 5.3 Flash · `max` at `3130fb52b`, base `0274c0a7` — comment `5473634548` |

## Open Questions

- Slice 2 questions are deliberately deferred; none blocks Slice 1.

## Drift and Debt

- Drift: RTK binary unavailable; focused raw commands are the documented fallback.
- Debt: existing KV AP-1 test-file debt is not touched or deepened.

## Commits

- PR #1820 is open and non-draft; its commit list and per-slice comments are the commit trail.
