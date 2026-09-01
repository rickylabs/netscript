# IMPL-EVAL verdict — PR #1883 / issue #1868

## PASS_IMPL

**Head judged:** `5bfd7c6beb54166a7adf1aa55bb3bdc6fa9ab513` (matches PR #1883 `head.sha`; no other commit judged).

**Evaluator identity (requested vs observed):** Lane `formal_impl_evaluation`, open-model route per
`.llm/harness/workflow/lane-policy.md:181`
(`canonical-open-evaluator-route lane=formal_impl_evaluation preset=claude-evaluator-glm-5-3-flash model=z-ai/glm-5.3-flash effort=max`).
- Requested: `z-ai/glm-5.3-flash`, effort `max`.
- Observed: model `z-ai/glm-5.3-flash`; effort `max` confirmed from the launching process command line
  (`deno task agentic:claude-openrouter --model z-ai/glm-5.3-flash --effort max`). No mismatch.
- Session separation: this session wrote no product code and did not supervise the implementation.

## Method

Static read of the probe (`packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev.ts`)
and its co-located test at head, plus independent re-execution of: the RED commit extracted via
`git archive`, the focused suite on head, the three brief gates, and four end-to-end probe runs against a
scratch `dev`-chain fixture (65 s preflight, immediate child exit, banner-then-die, banner-never-serve)
under `.llm/tmp/eval-1868/`. The probe was driven through its real `import.meta.main` entry point
(`deno run --allow-all <probe.ts> <projectRoot> demo`), not only through the injected-options seam.

## Findings

| # | Question | Verdict | Evidence (commands + observed output) |
|---|---|---|---|
| D1 | Genuinely phase-aware, not just a bigger number? | **CONFIRMED** | `probe-project-boundary-dev.ts:1-5` exports `DEV_STARTUP_BUDGET_MS = 180_000` and `FRESH_HTTP_READINESS_BUDGET_MS = 60_000`; the startup loop (`:27-45`) waits on the Vite `'Local:'` output marker / child exit under the 180 s budget, and the 60 s HTTP deadline is computed **only after** `startupComplete` (`:52-54`). End-to-end proof with a fixture `dev` task that delays 65 s (longer than the entire old 60 s budget) before printing `Local:` and serving: pre-fix probe → `exit=1 elapsed=61s`, `Error: Fresh dev server failed under hostile parent tsconfig: fetch failed; status=running` (misclassification reproduced); head probe → `exit=0 elapsed=66s`, `Fresh dev server answered 200 with hostile parent tsconfig`. Anti-vacuousness: a reconstructed **single raised-constant** implementation (one 180 s deadline spanning both phases, same seam/signature) fails the committed suite — `exit 1; 2 passed, 1 failed`, failing case `slow dependency preflight does not consume the Fresh HTTP readiness budget` with `Error: Fresh dev server failed: server did not answer; status=running`. The suite discriminates phase-awareness from a raised constant. |
| D2 | Child exit still fails promptly with real status? | **CONFIRMED** | Focused test: `child exit fails promptly with its real status` passes, asserting `status=23`, message contains `startup/preflight`, `sleepCalls === 1`, fetch never invoked. End-to-end: fixture child `Deno.exit(5)` → head probe `exit=1 elapsedMs=134` with `Error: Generated dev process exited during startup/preflight; status=5` (134 ms, not 180 s). `childStatus` is raced in both phases (`:29-35`, `:58-64`, `:80-85`), so exit preempts any in-flight sleep; `childExited` is set before the derived status promise settles, so cleanup never re-kills an exited child. |
| D3 | Timeout output truthful / distinguishable? | **CONFIRMED** | Three distinct head messages observed by execution: (a) `Generated dev process exited during startup/preflight; status=5` (child exit, 134 ms); (b) `Fresh dev server exited after startup under hostile parent tsconfig; status=1` (child died after banner — also observed end-to-end); (c) `Fresh dev server failed under hostile parent tsconfig after startup: fetch failed; status=running` after the full 60 s readiness budget with the child alive (`exit=1 elapsed=60s`). The startup-timeout message (`Generated dev startup/preflight timed out after <N>ms; status=running`) is proven by focused test 3 (`startupBudgetMs: 1`), which additionally asserts the message does **not** contain `Fresh dev server failed`. Pre-fix produced `Fresh dev server failed under hostile parent tsconfig: fetch failed; status=running` for the identical healthy-slow-preflight case — the misclassification is gone. |
| D4 | RED genuine, non-vacuous, zero product files? | **CONFIRMED** | `git show cd2337d36 --name-only`: 9 `.llm/runs/fix-dev-probe-startup-budget--1868/*` artifacts + `probe-project-boundary-dev_test.ts` only — zero implementation files. Extracted with `git archive cd2337d36` into `.llm/tmp/eval-1868/red-tree` and re-ran the focused suite: **exit 1, 0 passed / 3 failed / 3 total, uniqueFailures=1** — exactly the PR's claim. Failure mode: the pre-fix probe is an unguarded top-level script with no testable seam, so importing it under test throws `Error: generated project root and app name are required` in every case. Non-vacuous beyond the missing seam: the committed suite also rejects a raised-constant implementation (see D1) and test 1 simulates a 179 999 ms preflight against the real options seam. RED→GREEN test diff only injects the fake clock into test 3; no assertion was removed or weakened. |
| D5 | Any test sleeps for a production timeout? | **CONFIRMED (no)** | The committed test file contains no `setTimeout` and no real sleep — clock and sleep are injected fakes (`now: () => now`, `sleep` advances the fake clock); the one full-budget sleep is short-circuited to a never-resolving promise (`probe-project-boundary-dev_test.ts:38-42`). Measured focused-suite runtime: 710 ms (head), 593 ms (RED extraction), 674 ms (naive variant) — orders of magnitude below 180 s. Worklog claims 576 ms; consistent. |
| D6 | Ceiling and lock? | **CONFIRMED** (one REFUSAL recorded) | `git diff --name-only cd2337d36^ 5bfd7c6be`: exactly 11 files — 9 run artifacts, the probe, its test. `git rev-parse origin/main:deno.lock HEAD:deno.lock` → `ac2ee042566bc6b03502c40961c10d624416b061` both sides (byte-identical; `origin/main` = `302409f0c`, at/after `102ef8a10`). `git diff cd2337d36^ 5bfd7c6be -- deno.lock` empty. Gates run myself: focused test exit 0 (3 passed/0 failed/3 total); `run-deno-test.ts -- --allow-all packages/cli/e2e/tests` exit 0 (**203 passed / 0 failed**); `run-deno-check.ts --root packages/cli/e2e --ext ts` → 188 files, 0 diagnostics; `run-deno-fmt.ts --root packages/cli/e2e --ext ts` → 188 files, 0 findings. Scoped `run-deno-lint.ts --root packages/cli/e2e --ext ts` → **REFUSAL** (exit 1 from the wrapper; underlying `error: Package 'zod' not found in catalog` on the 7 detached `fixtures/desktop-native/` files) — **recorded as REFUSAL, never PASS or FAIL**. Pre-existing verified: `git diff --stat origin/main 5bfd7c6be -- packages/cli/e2e/fixtures/` is empty, so the refusing files and their detached `deno.json` are byte-identical to `origin/main`; the refusal is independent of this PR. The PR's own narrower claim (lint over the 2 touched files) was not contradicted. |
| D7 | Verifier optimization / dependency-closure change absorbed? | **CONFIRMED (not absorbed)** | The 11-file PR range contains no file outside the probe, its test, and run artifacts. The spawned dev chain is unchanged: `args: ['task', '--cwd', appRoot, 'dev', '--host', '127.0.0.1', '--port', String(port), '--strictPort']`, `cwd: projectRoot`, port `5199` — identical to the pre-fix spawn (diff shows the block moved under `runProbe` with indentation only). No dependency-closure, verifier, memoization, or node-modules-walk code was touched. |

## What I tried that failed to break it

1. **"It's just a bigger number."** Rebuilt the fix as a single 180 s deadline spanning preflight *and*
   HTTP readiness (same export seam, same signature) and ran the committed suite against it: 1 failed /
   2 passed. The shipped phase-aware implementation passes 3/3. The suite carries real discriminating power.
2. **Slow-preflight end-to-end.** 65 s fixture preflight (> the old entire 60 s budget): pre-fix probe
   failed at 61 s with the misleading server-failure message; head probe succeeded at 66 s. Acceptance
   criterion 1 holds on the real entry point, not just the seam.
3. **Prompt-exit regression hunting.** Immediate-exit child failed in 134 ms with the true status — no
   wait-out of the new 180 s budget. Also exercised a child dying *after* the startup banner
   (status=1): reported truthfully as an exit-during-readiness, not a fetch failure.
4. **Truthful-output inversion.** Searched for external parsers of the old message text — none exist
   (`grep -rn "Fresh dev server failed\|project-boundary-dev" packages/cli/e2e/src` hits only the gate
   name constant and the invocation path in `database-gates.ts:212`); the message is human-facing only.
5. **Test-1 determinism.** Scrutinized its microtask ordering (single `await Promise.resolve()` before
   setting the fake clock). The clock assignment lands between loop iterations, the pending in-flight
   sleep cannot push `now` past the startup deadline before `startup.resolve()` is observed in the
   shipped implementation, and the fake sleep's full-budget guard (`probe-project-boundary-dev_test.ts:39`)
   converts a shared-deadline implementation into a hang/failure rather than a silent pass. Observed
   3/3 pass across repeated runs.
6. **Silent-scope-creep sweep.** Diffed the whole PR range against `origin/main` for dependency-closure,
   verifier, and node-modules-verification paths — untouched. Spawn args byte-equivalent.
7. **Lock drift.** Blob-identical by `git rev-parse` against `origin/main` (which includes `102ef8a10`).
8. **Coverage hole hunting.** The focused test lives outside `packages/cli/e2e/tests/` (so the package
   `test` task `deno test --allow-all tests/` does not run it), but root `deno task test` discovery does
   include it: `deno test --allow-all --no-check --filter "dependency preflight"` from the repo root ran
   `1 passed ... 3907 filtered out` from
   `./packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts`. CI's `test`
   gate (`deno task test` via `run-gate.ts`) therefore exercises it.

## Explicitly not evaluated (not a FAIL reason)

`deno task e2e:cli` (canonical `scaffold.runtime` Flow-B / NAS acceptance) was **not run** — this
evaluator has no runtime lease, and the brief prohibits it. Hosted CI owns that proof; the absence of a
runtime receipt here is not a failure finding. The issue's fifth acceptance checkbox remains owned by
that lane.

## Blocking findings

None.

## Non-blocking observations

1. **Unbounded first fetch in the readiness phase.** `waitForFreshDevServer` races `fetchRoot()` against
   `childStatus` but imposes no timeout on the fetch itself; a fetch that connects but never settles
   would stall past the 60 s readiness deadline (the deadline is only re-checked after the race settles).
   The pre-fix probe had the same shape, local refusals fail in milliseconds, and my readiness-exhaustion
   run terminated at exactly 60 s — not a regression. Future hardening: `AbortSignal.timeout(...)` per attempt.
2. **`stopChild` catch breadth.** The guard tolerates `Deno.errors.NotFound`, but this runtime
   (Deno 2.9.5) throws `TypeError: Child process has already terminated` — observed in the pre-fix probe
   run. The `childExited` flag (set before the derived `childStatus` promise settles) makes the kill
   unreachable on all normal dead-child paths, leaving only a microtask-boundary race that could mask an
   already-failing run's error. No false-PASS path exists.
3. **`'Local:'` marker heuristic.** Any earlier output containing `Local:` (last 4 KiB rolling tail of
   either stream) would end the startup phase early and hand the remaining time to the readiness budget —
   strictly more permissive than the old probe and incapable of producing a false failure.
4. **Test 2 is implementation-coupled.** `assertEquals(sleepCalls, 1)` pins the shipped race shape
   (exit wins while a poll sleep is already initiated). Deliberate documentation of the D2 property;
   will need touching if the poll strategy changes.
5. **Root e2e lint REFUSAL** (desktop-native `zod` catalog) recorded above; pre-existing on
   `origin/main` byte-identical fixtures. Not counted as PASS or FAIL.

## Verdict basis summary

The budget is genuinely two-phase (startup/preflight 180 s, HTTP readiness 60 s starting only after the
Vite banner), child exit preempts both budgets and reports the real status within ~135 ms, all failure
modes produce distinct truthful messages, the RED reproduces exactly (exit 1, 0/3) with zero product
files and demonstrable discriminating power, no test sleeps for a production timeout, the ceiling is the
probe + focused test + run artifacts with `deno.lock` byte-identical to `origin/main`, and no verifier or
dependency-closure work was absorbed. All three brief gates pass independently; the scoped lint refusal
is a pre-existing, PR-independent baseline.

Evaluator verdict written by this session; not committed (detached HEAD — the file at
`.llm/runs/fix-dev-probe-startup-budget--1868/impl-eval-verdict.md` is left untracked for collection).
