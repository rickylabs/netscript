use harness

# Slice brief — #1227 quickstart `aspire restore` has no retry coverage

**Codex · GPT-5.6 Sol · medium** (`normal_implementation`). **P0 — this blocks 0.0.6 Canary.4.**
The diagnosis is complete; implement and prove it.

| Field | Value |
| --- | --- |
| Issue | **#1227** (reopened, `priority:p0`, `status:plan`) |
| Worktree | `/home/codex/repos/ns006-1227` |
| Branch | `fix/1227-quickstart-restore-retry` |
| Base | `main@7aa4aadfd` (current main, already checked out) |

## SKILL

- `netscript-cli` — the `e2e:cli` gate/suite surface.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The defect

`v0.0.6-canary.3` **published cleanly** (35/35), then its pinned production E2E failed
([run `31606532698`](https://github.com/rickylabs/netscript/actions/runs/31606532698)), job
`scaffold-runtime (published JSR CLI)`, step 15 *"Quickstart walk E2E"*:

```
FAILED GATE: quickstart.4-aspire-restore-start
  aspire restore failed (6): Failed to prepare: A task was canceled.
FAILED GATE: quickstart.pgdata-integrity-after-teardown
  NotFound: No such file or directory (os error 2): readfile '.llm/tmp/cli-e2e/…'
```

**The full scaffold runtime E2E passed. `quickstart.1/2/3` passed. Only step 4 failed.** The restore
hung **exactly 180 s** inside the bundled NuGet restore of the same five packages, then was externally
terminated → exit 6. Aspire log `cli_20260812T143425_97132e38` shows **no product-code error** — NuGet
restore start, then termination.

**This is a recurrence of #1227, not a flake.** Its original mitigation covered
`runtime.aspire-restore`. `packages/cli/e2e/src/application/gates/quickstart/aspire-walk.ts` carries
timeout markers *naming this issue* — `quickstart.aspire.restore.timeout:#1227` and siblings — yet
runs `aspire restore` as a **single attempt bounded by `timeoutMs`** (`:32-34`), with **no retry**.
The mitigation landed where the failure was first observed, not across the class.

`quickstart.pgdata-integrity-after-teardown` is **secondary**: it reads a fixture path the aborted
start never created. One root cause, two red gates.

## LOCKED decisions

- **D1 — use the existing centralized retry mechanism. Do not hand-roll retry semantics.**
  `packages/cli/e2e/src/domain/gate-definition.ts` already defines everything needed:
  - `GateFailureClass` includes **`'timeout'`** and **`'canceled'`** — exactly this failure's classes.
  - `CommandGateRetryPolicy { classes: readonly GateFailureClass[]; maxRetries: 1 | 2 }`.
  - `retry?: CommandGateRetryPolicy` on the command-gate definition (`:74`).
  - `GateAttempt` records `attempt`, `failureClass`, `exitCode`.

  **You are its first consumer** — `retry:` is currently used by **zero** gates. If it turns out the
  runner does not honour the policy end to end, **stop and report**; do not work around it with a
  local loop.
- **D2 — apply it to the quickstart restore path** so the classes retried are `timeout` and
  `canceled`. Attempts stay **bounded** — `maxRetries` is typed `1 | 2`, so the bound is enforced by
  the type; do not widen it.
- **D3 — parity, not novelty.** Match the runtime path's semantics. If the runtime path also carries
  NuGet cache coverage that quickstart lacks, mirror it rather than inventing a different approach.
  State what you found on the runtime side and what you mirrored.
- **D4 — PGDATA teardown reports honestly.** `quickstart.pgdata-integrity-after-teardown` must
  **skip or report clearly when setup state was never created**, instead of failing on a missing
  path. A root failure should produce **one** signal, not a cascade. Use the existing `'skipped'`
  verdict (`GateVerdict`) where that is the honest outcome — do not make it pass silently.
- **D5 — scope.** Do not change publish/release logic, do not touch other gates' retry behaviour, and
  do not alter the 180 s timeout value without saying why.

## Required tests — RED → GREEN, both classes

The negative case must be demonstrated, not asserted:

1. **Canceled / exit-6** — a restore attempt that fails as `canceled` with exit 6 is **retried** up to
   the bound and the gate passes when a later attempt succeeds. **Prove RED → GREEN**: show the test
   failing without the retry policy wired, then passing with it.
2. **Timeout** — same for the `timeout` class.
3. **Bounded attempts** — a restore that fails *every* attempt performs **exactly** `maxRetries + 1`
   attempts and then fails. This is what stops a retry policy from becoming an unbounded hang; assert
   the attempt count, not just the final verdict.
4. **PGDATA teardown semantics (D4)** — when setup state was never created, the gate **skips or
   reports that explicitly** and does **not** emit a second failure. Assert the verdict and the
   message.

State in your report which test fails without which change — a test that passes before your fix is
not evidence.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno task --cwd packages/cli test
deno task quality:gate
```

Check whether `quality:gate`'s roots cover `packages/cli/e2e`; they demonstrably omit some packages
(#1542). If not covered, run an explicit target scan and say so.

**Do not run `deno task e2e:cli`** — it is expensive, serialised across this lane, and a live run is
not what proves this fix. The unit-level RED→GREEN evidence is. **Do not re-run the canary.**

## Commit trail

**One draft PR** against `main`. Title:
`fix(e2e): retry quickstart aspire restore on timeout and cancellation`.
Body per `netscript-pr` with **`Closes #1227`** in `## Scope`, plus your pasted RED→GREEN evidence and
attempt-count proof. Map #1227's acceptance with `box-index` entries; **do not emit an empty
`acceptance-evidence` entry list** (#1561).

Labels `type:fix`, `area:tooling`, `gate:e2e`, `priority:p0`, `status:impl`, milestone `0.0.6`.
Push by explicit refspec; post `[PHASE: IMPL]` with commit hash and real gate output.

**Watch `deno.lock`.** This lane has twice shipped an incomplete lock. If your change adds a
dependency, the lock delta is whatever Deno **deterministically generates** — never hand-reduced. If
the lock moves without you adding a dependency, **stop and report** before committing.

## Evaluation

Normal **automatic IMPL-EVAL** on draft → ready, which the orchestrator triggers. If the final diff is
genuinely deterministic and trivially verifiable, the orchestrator may instead apply the documented
`impl-eval:skip` — **that is the orchestrator's call, not yours.** No manual OpenHands, no Fable.

## Reporting contract

Report: which mechanism you used and where it was already defined, the exact test names with which
change each one is RED without, verbatim gate output, the attempt-count proof, and **anything you
could not do or that surprised you** — especially if the runner does not honour `retry:` as the types
suggest.

Do **not** flip the PR to ready, do **not** merge, and do **not** dispatch a canary.
