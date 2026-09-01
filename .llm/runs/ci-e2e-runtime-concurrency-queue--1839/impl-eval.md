# IMPL-EVAL — #1839 / PR #1846 — e2e-cli runtime-tier queue admission (`queue: max`)

| Field | Value |
| ----- | ----- |
| Run ID | `ci-e2e-runtime-concurrency-queue--1839` |
| Evaluated head | `a8f3f9e81a303837c6ab1a8dbf6d29c6033d0e3c` (verified `git rev-parse HEAD`, rc=0; equals PR #1846 `headRefOid`) |
| Base | `main` = merge-base = `6c195acaf3f7e650c4235fc3fbc51232e210e7a4` (rc=0) |
| Generator (per `supervisor.md`) | OpenAI GPT-5.6 Sol (Codex), session `01a058a0-…`, effort high |
| Evaluator (this session) | `z-ai/glm-5.3-flash` via Claude Code on OpenRouter — separate session, opposite family to the generator; the phase-bound GLM 5.3 Flash IMPL evaluator binding on this transport. Route justification is the supervisor's record; observed identity recorded here per `evaluator/protocol.md`. |
| Date | 2026-09-01 |
| Artifact written | this file only — no other file under `.llm/runs/**` or the source tree was created, edited, or removed |

## Scope of this verdict — read first

- **Standing ruling applied, not overturned:** the standalone no-op simulation demonstrates GitHub's
  `queue: max` behaviour generally; it does **not** satisfy acceptance box 1 (three or more PRs
  carrying `e2e-cli-gate`, arriving within one minute, each executing **both modified runtime tiers**
  to real conclusions). Box 1 is **deferred until the current Aspire runtime queue drains** and was
  neither run nor requested here.
- This verdict **covers** boxes 2, 3, 4, scope/lock hygiene, and the process inputs. It **does not
  cover** box 1; box 5 is covered only in its simulation-grade component (see below).
- This is an implementation-slice verdict, **not issue closure**. The close-gate stays blocked until
  the deferred proof exists (see Merge/close-gate note).
- Verdict vocabulary: the brief allows `PASS` / `FAIL_IMPL`; protocol `FAIL_IMPL` ≈ `FAIL_FIX`. The
  finding set below contains no `FAIL_FIX`-grade defect.

## Independent verification (real captured exits: `out=$(cmd 2>&1); rc=$?`)

| # | Check | Command / source | rc | Result |
| - | ----- | ---------------- | -- | ------ |
| 1 | Head identity | `git rev-parse HEAD`; `gh pr view 1846 --json headRefOid` | 0 | `a8f3f9e81a303837c6ab1a8dbf6d29c6033d0e3c`; PR head matches; tree clean |
| 2 | Base identity | `git rev-parse main`; `git merge-base main HEAD` | 0 | both `6c195acaf…`; the three run commits sit directly on it |
| 3 | Scope | `git diff --name-status -M main...HEAD` | 0 | `M .github/workflows/e2e-cli.yml` + 8 new files under `.llm/runs/ci-e2e-runtime-concurrency-queue--1839/` — nothing else |
| 4 | Lock hygiene | `git diff main...HEAD -- deno.lock \| wc -l` | 0 | 0 diff lines; byte-identical |
| 5 | Whitespace | `git diff --check main...HEAD` | 0 | clean |
| 6 | Scratch-workflow containment | `ls .github/workflows/e2e-runtime-queue-simulation-1839.yml` | 2 (absent) | the simulation workflow exists only on throwaway branches; not in the PR diff — as the plan requires |
| 7 | Workflow shape | `deno eval` + `jsr:@std/yaml` parse | 0 | both tier jobs carry exactly `{group, cancel-in-progress: false, queue: "max"}`; top level keeps the per-ref group with `cancel-in-progress: true`; six jobs as expected. (The generator's Ruby probe was exit 127; this parse supplies the missing structural evidence.) |
| 8 | Diff shape | `git diff main...HEAD -- .github/workflows/e2e-cli.yml` | 0 | 11 added lines: 9-line header "Queue policy" paragraph + one `queue: max` line per tier block. No group key, no `cancel-in-progress`, no other line touched |
| 9 | Syntax/semantics of `queue: max` | GitHub workflow-syntax docs; changelog 2026-05-07 | n/a (docs) | `queue` is valid at **job level**; accepts `single` (default) or `max`; `max` = up to 100 `pending` per group; **`queue: max` with `cancel-in-progress: true` is a validation error** — both blocks here are `false`, so coherent |
| 10 | Live acceptance of the same shape | `gh api repos/rickylabs/netscript/actions/runs/{33414867389,33414868688,33414870475}` | 0 ×3 | all three simulation runs `completed/success`; path = the standalone simulation workflow; branch/SHA match `simulation-evidence.md` exactly |
| 11 | Serialization (box 2) | `gh api …/runs/<id>/jobs` timestamps | 0 ×3 | intervals 16:34:40–16:35:13, 16:35:16–16:35:49, 16:35:52–16:36:27 UTC; each `started_at` ≥ prior `completed_at` — **zero overlap, independently re-derived here**, not copied from the run artifacts |
| 12 | Head immutability (box 3) | `gh api repos/rickylabs/netscript/branches/<sim-branch>` | 0 ×3 | remote branch heads today are `8f4d1ad3…`, `38d62b36…`, `9427c83d…` — identical to each run's triggering `head_sha`; no push ever occurred |
| 13 | Distinguishability | docs: "the queued job or workflow will be `pending`" | n/a | a deferred run displays `pending`/`queued`, not a terminal conclusion; `lane-visibility` `needs` the runtime jobs, so it stays in progress while any tier is pending — the workflow cannot publish a green summary over an unexecuted runtime lane |
| 14 | Process inputs | `worklog.md` § Plan Gate; PR body | n/a | `PLAN-EVAL: N/A` justified and recorded **before** implementation (protocol rule 2 satisfied); Design checkpoint present; commit trail S0/S1/S2 with hashes on PR #1846; archetype N/A justified (CI workflow infrastructure, not package/plugin) |

### The boundary question (asked explicitly)

The docs state: *"When the queue is full, any additional jobs or workflow runs are canceled."* So at
the 100-pending bound the **new arrival is cancelled immediately at admission** — the oldest pending
entry is *not* evicted (that replace-one-pending behaviour is the default `single` mode this fix
removes). Consequence: the header's claim that `cancelled` means only explicit cancellation,
timeout, or per-ref supersession is **true only below the bound**. At the boundary, `cancelled` can
once more mean "your runtime gate never executed, silently", indistinguishable from an explicit
cancellation in the run list. See F-1 for disposition; the header's own scoping phrase ("Within that
documented bound") keeps the sentence technically accurate as written.

Timeout note: the header lists `timeout` as a legitimate in-bound `cancelled` source. Job
`timeout-minutes` is enforced by the runner during execution; a `pending` job has no runner, so queue
wait cannot trip it. The docs section defining `timeout-minutes` was not retrievable in this session
(page truncated), so this is recorded as reasoning, not a docs quote.

## Findings by severity

| ID | Severity | Finding | Disposition |
| -- | -------- | ------- | ----------- |
| F-1 | minor | At the 100-pending bound, a new arrival is cancelled at admission — a silent, indistinguishable runtime-gate rejection returns at the boundary; the header claim holds only below the bound. | **Accept, non-blocking.** The scoped wording is accurate and the bound ("one running plus up to 100 pending") matches the docs exactly; the plan's open-decision sweep explicitly deferred >100 capacity with rationale ("acceptance requires three or more and the practical lane is far below the bound"). Future: one boundary line in the header when any workflow next touches this paragraph. |
| F-2 | minor | PR #1846's `acceptance-evidence` block maps `box-index: 1` to the no-op simulation runs; the standing ruling holds that this evidence does **not** satisfy box 1. | **Recorded here.** Box 1 is deferred, not satisfied. The owner/close-gate must not treat box 1 as evidenced, and `Closes #1839` must not auto-close the issue until the deferred multi-PR proof is attached. I am read-only over the PR surface and have not altered the body. |
| F-3 | info | A push to a queued PR still destroys its queued entry: the top-level per-ref group (`e2e-cli-e2e-cli-<ref>`, `cancel-in-progress: true`) supersedes on `synchronize`, evicting the pending tier job. `queue: max` never **requires** a push (box 3 holds); pushes can still **cancel** deferral. | **Accept.** Disclosed in the header as per-ref supersession. The deferred 3-PR proof is a fresh exercise on its own heads, so it is naturally unaffected. |
| F-4 | info | Tier-A per-slice review was folded into the owner-controlled evaluation handoff (`supervisor.md` routes the review lane to "later evaluation handoff"; drift entry recorded, severity minor, action accept). | **Accept.** This session is the independent opposite-family review; no lane self-certified. |
| F-5 | info | The same default one-pending shape (no `queue`) remains in `e2e-cli-prod-local.yml`, `e2e-cli-prod.yml`, `pages.yml`, `release-canary.yml`, `openhands-phase-eval.yml` per the run's read-only scan; untouched here. | **Accept.** Explicitly out of scope ("No other workflow concurrency cleanup"); flagged for owner triage in `research.md`. |

## Acceptance-box coverage

| Box | Status |
| --- | ------ |
| 1 — three or more `e2e-cli-gate` PRs within one minute, both runtime tiers executed to real conclusions, zero `cancelled` | **DEFERRED — not satisfied, not evaluated here.** Standing ruling; scheduled after the current Aspire runtime queue drains. Do not run it now. |
| 2 — concurrent execution still prevented (timestamp-asserted, not configuration-asserted) | **Covered — PASS.** Mutex shape unchanged (group keys + `cancel-in-progress: false` preserved; only `queue: max` added; groups are repo-wide literals with no ref interpolation, so at most one running job per tier). Intervals independently re-derived from the API with zero overlap. |
| 3 — a deferred run reaches its slot without any push to its head branch | **Covered — PASS.** The mechanism defers admission *within the same run*: the run was created at trigger time with its head SHA, waits as `pending`, and is admitted in FIFO wait order — no redispatch, no head movement. Independently verified: simulation branch heads are byte-identical to their triggering SHAs today. A redispatch-based fix would have been rejected here for trading a CI defect for an evidence defect. |
| 4 — mechanism documented in the header | **Covered — PASS** with the F-1 boundary caveat. Judged as claims: "separate repo-wide mutexes" true; "one running plus up to 100 pending" matches the docs exactly; "stays visibly pending and resumes on the same run and head SHA without a redispatch or push" matches docs + live evidence; the `cancelled` enumeration is accurate within the stated bound. |
| 5 — regression evidence attached (run IDs + per-job conclusions for the multi-PR case) | **Partially covered.** Simulation-grade run IDs, conclusions, timestamps, and head SHAs are attached and were re-verified here; the multi-PR evidence is deferred together with box 1. |

## Evaluator-side hygiene note

During verification, the evaluator's `deno eval` JSR fetch (`jsr:@std/yaml@1`, check 7) transiently
added four `@std/yaml` entries to `deno.lock` in this worktree. The change was attributed (4 added
lines, `jsr:@std/yaml@1` only), reverted with `git restore deno.lock` (rc=0), and re-verified as a
0-line diff against the evaluated head before committing. `deno.lock` is byte-identical to `main` at
the pushed head; no other evaluator side effect occurred.

## Push-time addendum (evaluator)

During this evaluation the PR branch advanced by one commit: `0d4ccd12b docs(harness): defer exact
runtime queue proof`. It touches run-dir artifacts only — the diff against the evaluated head changes
**0 lines** of `.github/workflows/e2e-cli.yml` and `deno.lock`, and the simulation evidence's run
IDs, conclusions, and timestamps are unchanged (only relabeled "Simulation assertions"). This
verdict was rendered against evaluated head `a8f3f9e81` for the workflow change and remains valid on
that content.

The landing commit additionally records that the simulation supplies neither the actual-tier
timestamp (box 2), actual-PR immutable-head (box 3), nor per-runtime-job conclusion (box 5) evidence —
those belong to the deferred exact three-arrival runtime proof in `exact-runtime-proof-procedure.md`.
Consistent with that, this verdict's box-2 and box-3 PASS rows are **mechanism-level**: the mutex
shape and no-push admission properties of the change itself, with serialization and head immutability
independently re-derived on the same-shape simulation. The real-tier corroboration remains deferred,
exactly as recorded above.

## Merge / close-gate note

Do not transition PR #1846 to ready-for-review or merge it on this verdict. The close-gate requires
box 1 checked with linked evidence; until the deferred multi-PR proof exists (scheduled after the
current runtime queue drains), `Closes #1839` must not be allowed to auto-close the issue. The
interim one-runtime-PR-at-a-time admission rule (D-191/D-192) retires when the fix lands, as issue
#1839 directs.

VERDICT: PASS
