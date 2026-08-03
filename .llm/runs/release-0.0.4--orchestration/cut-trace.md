# Observed case — the 0.0.4 cut

Instrumentation of the **first real execution** of the milestone-orchestrator pattern, recorded
during the run rather than reconstructed afterwards (epic #1120, D2). The cadence in
`workflow/canary-cadence.md` is derived from this trace; where a rule here has no supporting
observation, it is marked as such rather than inferred.

Milestone `0.0.4` (number 22) created 2026-08-03T05:41Z. Orchestration began 08:34 local. Trace
extracted from `git log origin/main`, not from the orchestrator's recollection.

## What actually merged, in order

| # | Time (local) | Commit | PR | Closed |
| --- | --- | --- | --- | --- |
| 1 | 10:19 | `4634afe56` | #1077 | #1074 #1056 #1048 |
| 2 | 10:28 | `2d58481e4` | #1075 | #1064 #1065 #1066 |
| 3 | 10:40 | `ab0fa13fe` | #1076 | #1067 #1014 #1015 #1017 #1022 |
| 4 | 11:04 | `e5bae2858` | #1079 | #1068 #1069 #1070 #1020 |
| 5 | 11:36 | `ec10d18b8` | #1086 | #1082 #1089 |
| 6 | 11:41 | `4833a1676` | #1078 | #1071 |
| 7 | 11:46 | `89636592c` | #1081 | #1016 #1021 #1039 |
| 8 | 12:58 | `2babb35d5` | #1091 | #1013 |
| 9 | 13:32 | `a8a129feb` | #1088 | #1011 #1012 |
| 10 | 13:38 | `d0802e150` | #1094 | #1087 #1084 #1080 #1083 |
| 11 | 14:59 | `0b05217cc` | #1092 | #1061 |

**11 PRs, 42 issues closed, ~6h40m from first merge to last.**

## The clustering the cadence should formalise

Merge times cluster, and the clusters are the dispatch waves — not a scheme imposed afterwards:

- **Cluster A — 10:19→10:40 (21 min):** merges 1–3, wave-1 supervisors. 11 issues.
- **Cluster B — 11:04→11:46 (42 min):** merges 4–7, wave 2 plus the queue-jumping lane fix. 10 issues.
- **Cluster C — 12:58→14:59 (2h01m):** merges 8–11, wave 3 plus hardening. 8 issues.

**Derived rule:** the natural canary boundary is the **wave boundary** — the point at which a
dispatched group of supervisors has all landed. It requires no new vocabulary because the waves
already exist in the plan, and the trace shows merges self-cluster there without being forced.

**Counter-observation that constrains the rule:** merge 5 (#1086) was *not* part of wave 2. It was
dispatched mid-wave because #1089 blocked the owner's docs-audit lane, and it merged between two
wave-2 PRs. A cadence that defines a canary as "exactly the PRs dispatched in wave N" would have
mis-labelled it. The boundary must be **temporal and content-derived** (what had landed when the
canary was cut), not **plan-derived** (what was supposed to be in it).

## Priority inversion actually observed

- **#1089** jumped the entire queue: it blocked an external lane, was folded into an already-open PR
  (#1086) rather than given its own, and shipped ~1h after being filed.
- **#1013** was deliberately sequenced *after* #1075 despite sharing a surface, to avoid a
  five-issue PR on the release's most critical code.
- **#1024/#1061** were split *out* of #1078 mid-flight when close-gate revealed 15 unchecked boxes
  across issues that had no implementation.

All three are re-planning events inside a single milestone. The cadence must absorb them; none of
them broke the wave structure, because the wave is a dispatch unit, not a contract.

## Failure modes that cost real time — these become gates, not prose

| Observed | Cost | Becomes |
| --- | --- | --- |
| Codex quota exhausted mid-release | hard stop until a reset was redeemed | provider quota is a planned resource, checked before dispatch |
| Gemini/OpenRouter lane billed credit on the wrong transport | $7.43 | transport is verified against what the owner pays for, before dispatch |
| Supervisors went idle at a red `close-gate` without escalating | 4 occurrences | the gate is briefed as a **deliverable**, not a checkpoint |
| Two scaffold E2Es run concurrently | 2 false failures chased as defects | expensive gates are serialised across slices |
| `--dry-run` created a session (claimed) | ~0 — disproved by test | claims about tooling are reproduced before filing |
| A merged PR body contradicted what shipped | owner audit + #1105 | PR body is checked against the diff before merge |

## What the orchestrator checked by hand at every merge

This list was built incrementally as each miss was discovered; it is the empirical pre-merge gate:

1. `close-gate` result — the only automated proof that issue acceptance was verified.
2. Unticked `- [ ]` count on every issue the PR closes.
3. New `deno-lint-ignore` / `as unknown as` / `@ts-ignore` in the diff, **excluding `.llm/runs/**`**
   (run artifacts quote these strings; so does the quality scanner's own source — both produce false
   positives).
4. That named expensive gates reported `SUCCESS` and not `SKIPPED`/`CANCELLED` — *"clean" repeatedly
   meant "nothing ran"*.
5. The single decisive claim per issue, re-verified independently (e.g. the Redis regression test
   drives the real adapter, not a fake; the `llms.txt` router is generated and leads the file).
6. **Added after #1079:** changed-file audit for `packages/**` and `plugins/**` on a docs-lane PR.
7. **Added after #1088:** the PR body's own checklist matches what shipped.

## Cut-time obligations discovered late

- **#1083** — `ServiceStreamProducerOptions.assertResolvable` was removed from
  `@netscript/plugin-streams-core` in #1076. The issue is **closed**, but its deliverable is a
  **release note**, which does not exist until the cut. A closed issue whose payload is a note is
  invisible at cut time unless something carries it forward. This is the class of item that is
  dropped when a cut is busy.
- Issues moved out of the milestone (#1004, #1085, #1024, #829, #742, #734, PRs #778/#775) each
  carry a written reason on the issue. The cut notes should reflect the moves, not just the closes.

## Scope drift, measured

The milestone began at 31 items. **Six new issues were filed by the orchestrator during the run**
(#1074, #1080, #1083, #1084, #1085, #1087) — all defects found by running the harness hard, not
speculative work. Two were p0/p1 blockers for the release's own stated purpose.

The definition of done moved during the run. That was correct, and it needs an explicit checkpoint
rather than happening silently.
