# Worklog — 0.0.6 runtime / public-surface lane

## 2026-08-12 — Stage A, bootstrap

**Identity / worktree proof.**

| Check | Command | Result |
| --- | --- | --- |
| Branch | `git rev-parse --abbrev-ref HEAD` | `chore/release-0.0.6-features-orchestration` |
| HEAD | `git rev-parse --short HEAD` | `01aa12b67` |
| Tree | `git status --porcelain` | clean at open |
| Remote | `git fetch origin main` | `origin/main@01aa12b67` — lane starts at tip |
| Runtime | `deno task agentic:runtime doctor` | `no_change (schema 1.0)`; components 18; **sessions 0** |

**Correction to the line above.** `doctor`'s `sessions: 0` counts *desired-state runtime controller*
sessions, **not** live Codex threads. A later `deno task agentic:codex-status` showed a sibling lane
working in `/home/codex/repos/ns006-1374-compilegate` plus three idle `agy` sessions elsewhere. No
collision occurred — this lane uses its own fresh worktrees — but "sessions: 0" must not be read as
"nothing is running", and is not cited as such anywhere else in this run.

**Issue re-baseline (live bodies fetched, not recalled).**

| Issue | State | Milestone | Labels | Acceptance boxes |
| --- | --- | --- | --- | --- |
| #1405 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `status:triage`, `priority:p2` | 5, all unticked |
| #1398 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `area:telemetry`, `status:triage`, `priority:p1` | 4, all unticked |

Both still carry `status:triage` and no assignee — neither has been started by another lane.

**Predecessor state.** PR #1395 merged 2026-08-09T01:25:15Z; PR #1402 merged 2026-08-09T05:11:32Z.
Both are ancestors of the baseline, so #1398 is being planned against the landed envelope and the
landed reconnect supervisor, not against their PR branches.

**Evaluator-transport precondition.** `gh pr view 1524` → **OPEN**, `mergedAt: null`. Its own DoD
still has `Bounded live DeepSeek smoke` and `Repository default variable is updated` unticked. The
brief's OpenHands eval route is conditional on #1524 passing/landing, so this run falls back to
fresh local sessions. Recorded as `drift.md` D-2; re-checked before each eval dispatch.

**Research.** #1405 researched in-session (small, fully specified) →
`slices/research-1405.md`, both defects confirmed at exact call sites with a line-cited call-site
table for `#failActive`. #1398 research delegated to a Claude Opus sub-agent (read-only, `drift.md`
D-1 records the lane override) — report pending.

## 2026-08-12 — #1398 research returned early (budget), root cause found

The delegated research sub-agent was **stopped on token budget** mid-pass and asked for concise
findings rather than killed, so its evidence survived. Report: `slices/research-1398.md`.

It found the root cause and, importantly, found that **the repo already records it**: the two Flow-B
OTEL gates are deferred against #1398 with the reason "workers-combined does not install the stream
mutation hook" (`packages/cli/e2e/suites/scaffold/capability-suites.ts:23-34`). The workers API
service installs the hook (`plugins/workers/services/src/main.ts:67`); the background entrypoints
that generated projects actually run never do (`plugins/workers/bin/runtime.ts:89-152`).

The report's honest **unverified list** is carried into `plan.md` as blocking slice S0 rather than
being smoothed over — the first item (does `workers-combined` actually receive the streams env)
decides whether the fix is a hook installation or something larger.

**Orchestrator-verified fact** (not delegated, checked in-session, because the whole plan turns on
it): `job-dispatcher.ts:44` derives `parentContext` from the stored trace headers and passes it to
`traceJobExecution` at `:108`, so `job.execute` shares its trace id with the record's stored
`traceparent`; and `instrumentation.ts:160` starts the publish span on the **ambient** context. That
pair is what lets every published execution record join the `job.execute` trace, including the
pre-span `create()` record — which is the sharp edge the research flagged.

## 2026-08-12 — #1405 slice dispatched (Tier-D, mobile-visible)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-1405` (fresh leaf) |
| Branch | `fix/1405-durable-producer-rejection-taxonomy` @ `01aa12b67`, **no upstream by design** |
| Thread id | `019ff4f0-0e1c-7333-8138-bbb107e4f1b3` |
| Rollout | `/home/codex/.codex/sessions/2026/08/12/rollout-2026-08-12T09-46-40-019ff4f0-0e1c-7333-8138-bbb107e4f1b3.jsonl` |
| Requested route | openai · gpt-5.6-sol · low |
| Observed route | openai · gpt-5.6-sol · low — **verdict: matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| Steering | `codex exec resume 019ff4f0-0e1c-7333-8138-bbb107e4f1b3 -- "<follow-up>"` |
| Brief | `slices/implement-1405.md` (staged to `/home/codex/ns006-1405-brief.md`) |

Launched through `deno task agentic:launch-codex-slice` after a clean `--dry-run`; the first dry-run
**failed git-safety** because the leaf branch tracked `origin/main`, which was cleared before launch
(push is explicit-refspec only). Watching with `agentic:codex-watch --mode turn` on that thread —
event-driven, not polled.

The brief locks both reason decisions (reuse `producer-stopping`; add exactly one new member
`transport-refused`), names the gates as deliverables including the mandatory `quality:gate`,
pre-empts the known `deno fmt` rewrap hazard, and forbids the agent from merging or flipping to
ready.

## 2026-08-12 — #1405 slice landed on its branch; Tier-A review done

Codex thread `019ff4f0-0e1c-7333-8138-bbb107e4f1b3` completed its turn (detected by
`agentic:codex-watch --mode turn`, not by polling). Commit `c491c6989`, pushed by explicit refspec,
**draft PR #1528** open against `main` carrying `Closes #1405`, a fenced `acceptance-evidence` block
mapping all five boxes, and a DoD whose last two boxes (IMPL-EVAL, orchestrator review) are
correctly left unticked.

**Independent re-verification (not read off the slice report):**

| Check | Command | Result |
| --- | --- | --- |
| Package suite | `deno task --cwd packages/plugin-streams-core test` | **33 passed, 0 failed** |
| Negative case | both fixes reverted, suite re-run | **29 passed, 5 failed** — the guards fire |
| Restore | `git checkout` + re-run | 33/33, clean tree |

The negative-case run is the `milestone-run.md` gate-integrity rule applied: a guard enters only
with its predicate demonstrated. 0.0.4 shipped two guards that could never fire and looked correct;
this one was checked rather than assumed.

**Diff conforms to the locked decisions.** `transport-refused` is the only public-surface addition;
close-drain reuses `producer-stopping`; `#failActive` branches on `isRetryable`; the conflated
connect guard is split. The façade's duplicate `stateRejection()` was **deleted** and both write
entry points delegate to `supervisor.writeRejectionReason()` — so the two selectors that drifted
apart to produce this defect can no longer drift again.

**Two advisory findings, neither blocking** (posted to #1528): the reverted-state failure arrives as
an uncaught-error cascade rather than four individual assertion failures; and `arch:check` carries
`WARN=1` because the supervisor file is now 515 lines against a 500-line advisory cap (`FAIL=0`).

**A defect in my own brief, surfaced by the implementer.** The brief's gate list named
`deno test packages/plugin-streams-core`, which exits 1 with 19 `NotCapable` failures for want of
`--allow-env`. The slice reported the red with its cause instead of hiding it and used the
package-declared task. The brief was wrong; corrected before the #1398 brief goes out.

**IMPL-EVAL dispatched** — separate session, separate worktree `/home/codex/repos/ns006-1405-impleval`
at `c491c6989`, DeepSeek V4 Flash 0731 max (small-impl evaluator lane, local fallback transport per
D-2). Its prompt (`slices/impl-eval-1405-prompt.md`) directs it at the highest-value failure mode —
whether a genuinely failed producer can now be masked as merely closing, which would be a worse
defect than the one being fixed — and requires it to revert each fix **individually** to prove each
test fails for its own reason.
