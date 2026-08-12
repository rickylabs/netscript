# Context pack — 0.0.6 runtime / public-surface lane

Closing summary. The lane is **complete**: both owned issues landed on `main`. Read this first if
resuming or auditing; everything below is traceable to a named artifact.

| Field | Value |
| --- | --- |
| Run id | `release-0.0.6-features--orchestration` |
| Profile | `.llm/harness/workflow/milestone-run.md` (topical lane) |
| Supervisor | Claude · Opus 5 · high |
| Control branch / PR | `chore/release-0.0.6-features-orchestration` / **#1525** (evidence only, closes nothing) |
| Baseline | `origin/main@01aa12b67` |
| Status | **Complete** — 2/2 issues merged, 2 follow-ups filed |

## Outcome

| Issue | PR | Merge | Gate record |
| --- | --- | --- | --- |
| #1405 durable producer rejection taxonomy | #1528 | `8ff1bcb8f` | `slices/pre-merge-gate-1528.md` |
| #1398 job executions → durable job stream | #1536 | `d7e2b67b2` | `slices/pre-merge-gate-1536.md` |

Both auto-closed `COMPLETED` via closing keywords; `status:shipped` on each issue and PR.

## What changed, in one paragraph each

**#1405** — two settled write **reason strings** misdescribed the state that produced them: a write
rejected during the graceful close-drain reported `producer-failed` (the producer was healthy and
closing), and a non-retryable append on attempt 1 reported `retry-exhausted` (nothing was exhausted).
Fixed by making the closing intent observable to the rejection selector and by branching `#failActive`
on `isRetryable`, adding exactly one public member, `transport-refused`. The façade's duplicate
selector was deleted so the two cannot drift apart again — that drift was the defect's origin. No
change to which writes are accepted, rejected, or delivered.

**#1398** — job executions were never published to the durable job stream because the workers **API
service** installed the execution-state mutation hook while the **background** entrypoints that
generated projects actually run never did. Fixed by installing the hook on the worker and combined
runtimes and publishing inside `context.with(extractContext({traceparent, tracestate}), …)` so the
publish span joins the `job.execute` trace — including the pre-span `create()` record, which is the
trap that would otherwise fail TC-14 silently. The two E2E gates deferred against this issue were
un-deferred and now pass live.

## Evidence chain

- **#1398 acceptance was made mechanical.** Its observational criterion was bound to two gates the
  repo had already deferred against this issue. Both now pass **by name** on both CI runtime tiers at
  the merging head: postgres `94073971396` (`passed=88 failed=0 skipped=0`), sqlite `94073971501`
  (`passed=83 failed=0 skipped=0`).
- **PLAN-EVAL** #1398: PASS, MiniMax M3, separate session — `plan-eval.md`. Findings F1/F2 folded in.
- **IMPL-EVAL** #1405: PASS, DeepSeek V4 Flash 0731 — `slices/evaluate-1405.md`. Superseded as
  *policy* by D-3 after the fact, not retracted.
- **IMPL-EVAL** #1398: PASS, Qwen 3.8 Max via the **automatic dispatcher** —
  `slices/evaluate-1398.md`.
- Merge order and every time-costing failure: `cut-trace.md`. Lessons and mistakes:
  `retrospective.md`.

## Open items leaving this lane

| Item | Where |
| --- | --- |
| `quality:gate` roots omit published packages — **both merge records here rest on explicit target scans, not the repo gate** | **#1542** (0.0.7) |
| Undeclared `@netscript/plugin-streams-core` imports — filed **unverified**, `publish:dry-run` evidence is its first acceptance box | **#1543** (0.0.7) |
| Canary and stable cut | **root's**, not this lane — nothing was published here |

## Drift index

D-1 research sub-agent lane override · D-2 evaluator transport fallback · **D-3** IMPL-EVAL waived
for the small deterministic class · **D-4** phase evaluation moved to the automatic dispatcher ·
**D-5** label-driven eval trigger contract. Full text in `drift.md`.

## Artifact hygiene note

The two raw evaluator JSONL streams (2.4 MB combined) were **untracked** and moved to
`.llm/tmp/` scratch, which `.gitignore` excludes. They were 2.4 MB of a 2.5 MB run dir, against a
96 K largest-artifact precedent in the 0.0.5 run. Their substance is preserved verbatim in
`plan-eval.md` and `slices/evaluate-1405.md`, each carrying run id, duration, event count, and
`is_error`. Nothing was deleted — the files remain on disk locally.
