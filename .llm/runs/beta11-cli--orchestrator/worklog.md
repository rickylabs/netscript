# Worklog — beta11-cli--orchestrator

## Design

Supervisor-level design checkpoint. Each phase group produces its own nested Design checkpoint at
group launch; this section fixes the supervisor's surface.

1. **Public surface (of the run)**: the milestone-13 board executed — merged PRs closing
   #826/#804/#802/#818/#814/#815(/#816), the `feat/desktop-frontend` integration PR closing
   #840's sub-issues, and the #824 seed-run draft board awaiting owner ratification.
2. **Domain vocabulary**: phase groups G1–G14 (plan.md table); waves 1–4; lanes per
   lane-policy.md; stop-lines 1–5 (supervisor.md).
3. **Ports**: agentic suite (`deno task agentic:*`) for all Codex lanes; `claude-openrouter` /
   `claude-print` for formal evals; GitHub API via `resolveGithubToken` (no gh CLI on this host).
4. **Constants**: group IDs, branch names, and lane assignments as tabled in plan.md — briefs
   reference them, never restate routing.
5. **Commit slices (supervisor)**: S0 run-dir bootstrap + plan PR (this) → then one supervisor
   sign-off commit per group event (launch brief, slice review, merge, eval verdict), in wave
   order. Group-internal slices live in the groups' own PRs.
6. **Deferred scope**: plan.md § Deferred scope.
7. **Contributor path**: read `phase-registry.md` for live status → the group's nested run dir →
   its draft PR commit trail.

## Log

- 2026-07-17 · Bootstrap: kickoff read; harness docs loaded (activation, run-loop, lane-policy,
  supervisor, seed-run); live milestone 13 verified via API (15 open / 5 closed; strays #818,
  #814–#816, #804, #802 folded into plan); `supervisor.md` written; issue bodies archived to
  `issue-bodies.md`; research.md + plan.md written. Next: plan PR + PLAN-EVAL (hard stop).
- 2026-07-17 · PLAN-EVAL PASS (open-model Qwen, session f4666eee, separate session) — recorded on
  PR #846. Wave 1 launched via `agentic:launch-codex-slice` (daemon-attached, route verdicts
  `matched`): G1 #826 Sol·low (thread 019f720b-8290…, wt-g1-826), G2 #841 Sol·high (thread
  019f720b-8d75…, wt-g2-841, plan-first), G4 #452 Sol·medium (thread 019f720b-9692…, wt-g4-452,
  plan-first). Integration branch `feat/desktop-frontend` pushed @ ca72db14. Gotchas hit + handled:
  inherited origin/main upstream (unset; explicit-refspec push rule), narrow fetch refspec
  (explicit fetch of the integration branch). G2/G4 stop at their group Plan & Design for the
  nested Plan-Gate; G1 is a single-scope fix on run-loop directly.
