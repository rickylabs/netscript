# Drift Log — beta5-impl--supervisor (append-only)

| Date | Severity | Drift | Resolution |
| --- | --- | --- | --- |
| 2026-07-06 | note | Owner routing override (ROUTING-ADJUSTMENTS.md) in force: Opus 4.8 high for UI/complex impl, Codex always high, docs authoring Claude-only, ONE IMPL-EVAL loop per PR, merge-on-green grant (charter). | Recorded in supervisor.md; applies run-wide. |
| 2026-07-06 | note | Local main carried 3 unpushed beta.3 run-artifact commits; rebased onto origin/main 1c175990. Will push with this run's artifact commits. | Rebase clean. |

## 2026-07-06 — significant: #219 lane rescope (validation-only → FA-fix slice + gate)

The plan assumed #219 needed no fresh implementation (FA1/FA2/gzip merged) and would close via
the Step-3 eis-chat gate. The owner-mandated eis-chat seam analysis (committed report §3)
falsified this: eis-chat consumes ZERO of `@netscript/fresh/ai` because (1) FA1/FA2 hardcode the
`/ai/chat` stream subpath with no override, and (2) FA2 sanitizes headers only after fetch
resolves, missing the decode-time crash flavor of the #219 gzip mislabel. The 3 identity
workaround sites are not removable as-is. Action: spawned Tier-D fix slice
`fix/219-fresh-ai-proxy` (subpath override + identity-encoding proxy + mislabel repro test);
#219 still closes only via the Step-3 gate. #479 docs must not present FA2 as "the fix" until
this lands.

## 2026-07-06 ~03:00 CEST — Codex usage-limit exhaustion (severity: significant)

All four in-flight WSL Codex turns died on "You've hit your usage limit … try again at
6:17 AM": resume-303 (#483 finish), resume-402-caveats (#489 caveat round, no fix commits
landed — worktree still 65de8dca), launch-rev490 + launch-rev491 (adversarial reviews,
no verdicts posted). Weekly quota was already at 86% at wave launch.

Mitigation (lane overrides, per lane-policy "lanes are configuration" + blocked-lane rule):
- Adversarial reviews #490/#491 rerouted to two Claude Opus sub-agents (read-only, fresh
  sessions, work on Windows worktrees ns-rev490/ns-rev491 materialized via reverse-bundle;
  verdicts returned to supervisor who posts them). Generator≠reviewer preserved; the
  mobile-visibility requirement applies to implementation lanes, not read-only review.
- Implementation lanes #303/#402 stay on Codex: detached timer (/home/codex/resume-quota.sh)
  re-issues both `codex exec resume … -c model_reasoning_effort=high` turns at 06:19 CEST.
- #348 (S12) launch remains held until quota margin is confirmed post-reset. OWNER-BATCH:
  Codex weekly quota is now the program's binding constraint.

## 2026-07-06 ~05:15Z — Codex quota outage #2 (hard, until Jul 7 03:52) — Opus implementation fallback [significant]

Both post-merge steers (#483 re-export fix on thread 019f3492…, #490 main-reconcile on thread
019f34cb…) bounced with "usage limit … try again at Jul 7th 3:52 AM" — the Codex lane is dead for
the remainder of this overnight run. Fallback per lane-policy (lanes are configuration): two
bounded Opus 4.8 sub-agents implement the fixes in Windows worktrees (ns-rev483, ns-fix490);
supervisor reviews, bundle-pushes, and comments. Mobile visibility for these two slices is lost —
recorded here; owner-batch updated. T2 #403 lane decision also affected.

- 2026-07-06 (moderate): IMPL-EVAL #493 dispatched WITHOUT `--model` — trigger fell back to repo-default
  Kimi K2.6 instead of lane-policy qwen 3.7 max. Owner asked, accepted the Kimi run as fine ("no big
  deal"); eval left in place. Future dispatches carry explicit `--model openrouter/qwen/qwen3.7-max`.
- 2026-07-06 (moderate): Step-3 gate issue filing (8 issues) denied by permission classifier after
  owner's "do not change anything" message (scoped to #493's eval, read broadly by the classifier).
  Not routed around; bodies staged in scratchpad/issues/i1..i8.md, filing command staged; surfaced to
  owner live.
