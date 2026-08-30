# Research — fix-agentic-sender-lease-recovery--1751

## Re-baseline

- Carried-in source: Issue #1751's two first-hand reproductions and testable obligations in the
  owner brief. The failures were accepted as grounding evidence; they were not replayed against a
  live sender registry.
- Re-derived against `main` @ `5197e70b716eafb82fbb12ddb9a910c248ddb86a` (2026-08-31).
- Branch state: `fix/agentic-sender-lease-recovery` is exactly at the baseline, has no upstream, and
  was clean before this run directory was created.
- What changed vs the carried-in evidence: no contradiction. Current code contains both mechanisms
  that explain the reports: a stored `sessionId` is treated as active without a thread probe, and
  resume success is derived only from the child process exit code.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| R1 | Sender ownership has a strict, privacy-safe schema and atomic create/replace/release operations. Release is lease-token checked, which is a useful compare-and-swap boundary for repair. | `.llm/tools/agentic/runtime/sender-ownership.ts:3-17`; `.llm/tools/agentic/runtime/adapters/local-sender-ownership-adapter.ts:29-62` |
| R2 | The current staleness observation has only two booleans: one PID sample and `sessionActive`. If both are false, it immediately returns `stale`; there is no `unknown` state or evidence provenance. | `.llm/tools/agentic/runtime/sender-ownership.ts:19-32,48-70` |
| R3 | Launch maps `sessionActive` to `Boolean(existing.sessionId)`. Therefore every surviving active record is permanently blocked even if the owner process and live Codex writer are gone. | `.llm/tools/agentic/codex/launch-codex-slice.ts:376-390` |
| R4 | The dangerous mutation is currently automatic: any record classified `stale` is deleted by the launch path before a new lease is created. No reason receipt is written. | `.llm/tools/agentic/codex/launch-codex-slice.ts:376-401` |
| R5 | PID liveness is one `Deno.kill(pid, 0)` call. `NotFound` becomes false; other errors throw. It has no debounce or finite `unknown` result. | `.llm/tools/agentic/runtime/adapters/local-sender-ownership-adapter.ts:64-72` |
| R6 | Existing rollout primitives already expose `working`, `idle`, `stalled`, `dead`, and `refused`, and resolve an exact thread-id rollout. However `resolveCodexRollout` swallows inventory/read races and returns `null`, so it cannot distinguish proven absence from an unknown observation for an eviction decision. | `.llm/tools/agentic/codex/codex-rollout-live.ts:1-18,160-260` |
| R7 | Elapsed time is intentionally not death evidence: an incomplete quiet rollout becomes `stalled`. `stalled` therefore must preserve the lease. | `.llm/tools/agentic/codex/codex-rollout-live.ts:160-215`; `.llm/tools/agentic/codex/codex-rollout-live_test.ts:15-31` |
| R8 | The installed Codex 0.151.0 app-server schema provides read-only `thread/read { threadId, includeTurns? }`. Returned runtime states are `active`, `idle`, `notLoaded`, or `systemError`; a JSON-RPC not-found response can be represented separately as absent. This is the authoritative thread-state signal the current launcher lacks. | `codex --version`; ephemeral `codex app-server generate-json-schema --experimental` inspection of `v2/ThreadReadParams.json` and `v2/ThreadReadResponse.json` |
| R9 | `codex-resume.ts` prints stdout/stderr but exits 0 whenever the child exits 0. It does not inspect the known thread-store rejection, so `thread-store conflict: already has an active writer` can be printed while the wrapper reports success. | `.llm/tools/agentic/codex/codex-resume.ts:141-168` |
| R10 | The multi-turn runner already treats a non-zero resume result as a failed/retryable turn. Correcting the wrapper exit code propagates naturally; no runner-specific workaround is needed. | `.llm/tools/agentic/codex/run-codex-slice.ts:135-205` |
| R11 | `agentic:runtime` already owns guarded repair commands and has write/env permissions. Adding `repair sender-lease` beneath it avoids a new root task and therefore avoids `deno.json`. | `deno.json:75`; `.llm/tools/agentic/runtime/cli/agentic-runtime.ts:17-21,96-159` |
| R12 | No open `arch-debt.md` entry concerns sender leases, sender ownership, or resume rejection. This internal `.llm/tools` slice does not touch a package/plugin public export or JSR surface. | Focused `rg` over `.llm/harness/debt/arch-debt.md`; doctrine verdict denominator in `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |
| R13 | Leaf #1774 is live in another worktree. The owner identifies `deno.json` and `.llm/tools/agentic/README.md` as shared files. This plan avoids `deno.json`; the README change is isolated to the last slice and must be reconciled after #1774. | `git worktree list --porcelain`; owner brief |

## Signal Contract Research

No signal can authorize eviction alone.

| Signal | Finite evidence | What it proves alone | What it cannot prove alone |
| --- | --- | --- | --- |
| Owner PID | two `alive` / `dead` / `unknown` samples separated by the named debounce interval | Any `alive` sample proves the recorded PID currently exists. Two `dead` samples prove only that the recorded owner PID was absent across the interval. | It cannot prove whether Codex retained or restarted the thread, and PID reuse can create a conservative false-live. |
| Rollout | exact `present` snapshot (`threadId`, `cwd`, live state), proven `absent` from a readable inventory, or `unknown` | `working` proves an incomplete turn; `idle`/`dead`/`refused` proves the trusted rollout has a terminal last turn; proven absence says no exact artifact was found. | A terminal or absent file cannot prove the app-server has no active writer. `stalled` is not terminal. |
| Thread state | `active`, `idle`, `not_loaded`, `absent`, or `unknown` from `thread/read` | `active` proves a live writer; `idle`/`not_loaded`/`absent` proves no active writer at the probe instant. | It cannot prove the durable lease owner PID is dead or that the rollout belongs to the same worktree. |

The safe stale conjunction is therefore: exact valid local record + debounced PID absence + an
inactive/absent exact rollout + a non-active thread state, with no mismatch, conflict, parse error,
or unknown. Conflicting evidence is `indeterminate`, never stale.

## jsr-audit surface scan

- N/A. The planned implementation is internal repo tooling under `.llm/tools/agentic`; it changes
  no `packages/**` or `plugins/**` export, `mod.ts`, package `deno.json`, JSDoc surface, or publish
  shape.

## Open questions resolved by the plan

- **Should launch automatically remove a stale record?** No. Detection may recommend repair, but
  eviction is an explicit guarded `agentic:runtime repair sender-lease` apply operation.
- **Does an old timestamp or stalled rollout permit eviction?** No. Elapsed time never contributes
  stale evidence; `stalled` preserves the lease.
- **What if the record is foreign, invalid, lacks a usable session id, or any probe errors?** Fail
  closed with no mutation.
- **What counts as resume success?** Child exit 0 and no recognized thread/resume rejection. The
  known rejection is a non-zero wrapper result even when the child incorrectly exits 0.
- **How is the rejection exit tested?** A subprocess test captures `Deno.Command(...).output().code`
  and combined output directly. No `cmd | tail` or other pipeline is allowed.
