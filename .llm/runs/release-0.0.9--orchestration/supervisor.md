# Supervisor identity — release 0.0.9 milestone run

- **Coordinator:** claude-opus-5-5, effort xhigh, run label `mc009d`. Launched by the owner through the `/swarm` brief on #2474 (relaunch after the herdr restore). Profile: milestone-coordinator (harness, pinned by the dispatcher).
- **Tracking issue:** #2474. Reference-only umbrella; the run-record PR uses `Refs #2474` until the run closes.
- **Milestone:** 0.0.9 (milestone 30). Baseline main `30c800958dbf512a4951d640f08748703a8b59e3` (2026-10-30).
- **Plan authority:** `Milestone 0.0.9 Plan 2026-10-30` (vault-ready copy in the planning folder) and the Cockpit handover of 2026-10-30; both win over the planning draft.
- **Scope:** every open 0.0.9 issue except label `epic:design-system` (19 issues, the Fresh UI design-system lane) and #2474 itself: 53 issues.
- **Lanes:** `fixes`, `features`, `internals`, `docs` are logical lane roles held inside the coordinator session, with no separate orchestrator sessions.

## Owner mandate (rules this run enforces)
1. Golden rules, in order, in every brief and review: the idiomatic NetScript way (in-repo MCP `find_guidance` first); SOLID; performance; the Doctrine.
2. Dispatch every issue as its own leaf through orchid (a `/swarm` comment on that issue, `approval: bypass`, unique brief). Implementers: Codex gpt-6.1-sol, effort by difficulty. Reviewers: cross-family (Opus 5.5 for Codex work) at the exact head. At most 5 builders at once and 6 launches per hour. Leaf PR bodies say `Refs`, never `Fixes`/`Closes`.
3. Merge only when the author posted READY, a cross-family MERGE verdict exists at the exact head, CI is fully green, and the diff makes sense. Squash-merge with the full head sha. Never force-push. Never merge design-system work.
4. Eric cuts every canary and the stable release. The coordinator posts readiness on #2474 the moment a canary is truly ready (dates are deadlines, not estimates) and keeps the other lanes moving.
5. Status on #2474 at least twice a day. Questions for Eric go there with a recommendation; never wait silently.
6. Never print secrets, tokens, operator paths, host names, ports or session ids publicly; never restart ai-agents, herdr, orchid, forwarders or Tailscale; never kill by pattern; no milestone or label change without Eric's yes.

## PLAN-EVAL decision
Eric ordered dispatch to start immediately (Cockpit relay, 2026-10-30 ~22:35Z) after approving the dates. Wave 1 (#2438, #2165, #2187, #2144, #2396) was dispatched on a green milestone validator, with the opposite-family PLAN-EVAL (Codex gpt-6.1-sol high, read-only) launched in parallel. Its findings apply from wave 2 on; a FAIL on a wave-1 item is re-steered on that leaf's issue. Recorded in `drift.md`.

**Outcome:** round 1 CHANGES (4 blockers, all fixed); round 2 RESOLVED all four and raised 2 new fixable blockers (#2151 proof made conditional on slice 3; #2159 requires a crash-safe atomic commit, not release-on-failure). Both were repaired in flight at round 2, per the feature-tier PLAN-EVAL policy (max 2 roundtrips, repair in flight at round 2), before either brief was posted. Plan treated as **APPROVED with in-flight repair**. Receipts: `receipts/plan-eval-{1,2}.md`.

## Decisions log
- 2026-10-30 22:30Z: Step 0 artifacts written at baseline `30c800958`; validator green with live PR reconciliation.
- 22:37Z: H01 #2438 dispatched first (Cockpit: "start with #2438").
- 22:38Z: #2165, #2187, #2144, #2396 dispatched. #2396 adopts PRs #2421–#2423 (no duplicate).
