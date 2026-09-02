# IMPL-EVAL Summary — PR #1930 (fix(sdk): guard desktop fixture oRPC contract import)

## OPENHANDS_VERDICT: FAIL_FIX

**Head under evaluation:** 45fbef54e360181d86358d91523e6a5467257ed0 · Trusted base:
13bb9415e7f41ba24239940d17b8e7ad1162889c (= merge of #1923, one commit after the run's merge-base
37452f11f5045f0f5a98e07d802bcc2a2e94333b). Branch head f8df31782 ("fix(e2e): make the desktop
fixture import-map guard actually detect the defect") post-dates the trigger head; it was verified
separately in throwaway worktrees and via CI read-back and does not change the verdict.

## Summary

IMPL-EVAL for the desktop-fixture @orpc/contract repair (issue #1926), Archetype 6, no overlays.
The implementation is functionally correct, runtime-accepted at both heads, lock-clean, and
doctrine-clean. What blocks PASS is run-artifact bookkeeping: the worklog/context-pack gate tables
still say "pending" at the head that would merge, and the plan-vs-implementation drift (including
the vacuous first guard) is unrecorded. Verdict FAIL_FIX per verdict-definitions.md. Reasoning
effort is NOT attested (OpenHands adapter limitation) — no max claim is made.

## What this evaluator measured (not accepted from prose)

**Guard correctness (the heart of the fix)**

- Positive at evaluated head: `deno task check:desktop-native-fixture` at 45fbef54e → exit 0
  ("satisfies 14 reachable SDK modules; 0 unmapped specifiers").
- Non-vacuity at evaluated head: removing '@orpc/contract' from the PREPARED-map synthesis in
  fixture-workspace.ts → exit 1; restored → exit 0. The checked-in map alone is discarded by
  prepareDesktopFixture, so only the prepared-map probe is decisive there.
- Non-vacuity at f8df31782: removing '@orpc/contract' from the committed fixture map
  (packages/cli/e2e/fixtures/desktop-native/deno.json) → exit 1, naming
  `@orpc/contract — imported by packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`;
  restored → exit 0. Novel-specifier probe: `import probe from "@netscript/nonexistent-probe";`
  in packages/sdk/src/desktop/mod.ts → exit 1 naming it; restored → exit 0.
- All probes ran in throwaway worktrees; evaluated tree left pristine
  (git status --porcelain = 0, deno.lock untouched, worktrees removed). A first probe attempt that
  used a side-effect-only import exited 0 and is recorded as a guard-regex calibration limitation
  (LOW), not as a guard pass.

**Static** — deno check / fmt --check / lint on the changed driver at f8df31782: exit 0 each.
Root `deno.json` `check.dependencies` includes `check:desktop-native-fixture`; the required
check-test lane ran green at f8df31782.

**Runtime** — desktop-native-linux (deb + signed updater) SUCCESS at exactly 45fbef54e (run
33636093184, head verified on the run object, not the rollup) and SUCCESS at f8df31782 (run
33638728013). This resolves the prior attempt's blocking runtime-evidence finding.

**Hygiene/scope** — deno.lock diff vs base and vs origin/main: 0 lines. transport-policy.ts
untouched (no #1889 rollback). No plugins surface. No doctrine debt delta (arch-debt.md unchanged).

**PR-diff correctness** — the three-dot PR diff
(git diff $(git merge-base 13bb9415e 45fbef54e)...45fbef54e --name-only) contains no workflow
files: only the eight run-dir artifacts, deno.json, and the three fixture/guard files. The prior
attempt's "queue: max reversion" finding was a two-dot diff artifact of comparing against #1923's
own merge commit and is WITHDRAWN.

## Findings (severity-ranked)

1. HIGH — Run-artifact gate records are stale at the evaluated head and remain stale at f8df31782:
   worklog.md "## Gate Results" says "Pending implementation." (Progress also still lists slice 0 as
   pending), and context-pack.md "## Gates" lists Static/Fitness/Runtime/Consumer all "pending /
   implementation not started". The evidence exists (CI runs above; guard probes) but a resume or
   audit gets none of it from the artifacts, failing the last PASS criterion in
   verdict-definitions.md ("docs and run artifacts are updated enough for resume"). Required: one
   commit on the branch backfilling measured evidence into worklog.md Gate Results and
   context-pack.md Gates (guard probe results, static gates, run IDs/SHAs) and correcting the
   Progress line.
2. MEDIUM — Plan-vs-implementation drift is unrecorded: plan.md validation rows specify guard
   semantics the shipped guard contradicts (delete-from-checked-in-map probe and `deno check`
   orchestration; the staged map is synthesized from the workspace root and the checked-in map is
   discarded; the shipped guard asserts fixture-map coverage directly). Neither plan.md nor drift.md
   records the design change, and the vacuous first guard attempt (exit 0 both sides, per
   45fbef54e's own commit message, fixed by f8df31782) is not recorded anywhere in the run
   artifacts. Required: update the plan rows or add a drift.md entry, including the vacuous-guard
   history.
3. LOW (non-blocking) — Guard regex scans value-import `from` forms only; side-effect-only bare
   imports (`import "x"`) are invisible to it (evaluator probe: exit 0). #1926's defect class is
   covered; candidate hardening slice, not this repair.
4. LOW (non-blocking) — Tier-A slice-review receipt is not recorded in run artifacts;
   supervisor.md records the review mechanism (cloud evaluator automation + ci:full at
   ready-for-review), so this is a recording gap only.
5. INFO — Close-gate run 33638727913 FAIL on #1930 (unticked PR-body DoD boxes) is expected at this
   stage, not a defect. Tick the boxes only after findings 1–2 land and with run links; then
   status:ready-merge per netscript-pr. Issue #1926's main-branch-run criterion stays open until
   post-merge by construction.
6. INFO — Base-relatedness: 13bb9415e is a sibling of the head's merge base (37452f11f), not an
   ancestor; the only separating commit (#1923) touches two workflow files, a workflow test, and
   run artifacts — zero overlap with this branch's changed surface, so the trusted base remains
   valid for protocol reading and for evaluating the change.

## Acceptance criteria (issue #1926)

4 of 5 evidenced at head (root cause statement, green desktop-native-linux run on a main-facing
branch carrying #1889 at 45fbef54e and re-proven at f8df31782, fix confined to the packaging/import
surface, scheduling recommendation recorded). The main-branch-run criterion cannot exist pre-merge
and is correctly left open; the close-gate FAIL on #1930 reflects exactly that.

## PLAN-EVAL verdict check

FAIL_PLAN was considered and rejected: plan.md is complete and sound, PLAN-EVAL: N/A is justified
in D4 and logged in worklog slice 0, and the implementation matches the plan's contract. The defects
found are implementation-of-artifacts (stale gate tables, unrecorded drift), not plan defects, so
the verdict vocabulary maps them to FAIL_FIX, not FAIL_PLAN.

## Changes

None — evaluator session (measurement-only). Deliverables: this summary,
.llm/runs/desktop-orpc-contract-dep--impl/evaluate.md (full evaluation), and the PR verdict comment.
No push (evaluators do not push); the generator's bookkeeping commit (findings 1–2) is the required
follow-up.

## Responses to review comments or issue comments

- Prior evaluator attempt (same run, FAIL_FIX): its runtime-evidence finding is resolved by run
  33636093184 SUCCESS at exactly 45fbef54e; its "queue: max reversion" finding is withdrawn after
  three-dot diff verification; its plan-eval.md-absent and slice-review-receipt findings are carried
  (the latter as LOW-4).
- Generator packet (2026-09-02T13:55Z): claims re-measured and hold; its open item "exact-head run
  at f8df31782 should be read before merge" is resolved (run 33638728013 SUCCESS).
- Close-gate: expected while DoD boxes are unticked; tick only after findings 1–2 land, with run
  links, then status:ready-merge per netscript-pr.

## Remaining risks

- Guard regex calibration gap for side-effect-only bare imports (LOW; hardening slice candidate).
- Main-branch desktop-native run remains open until post-merge, per the issue.
- Drift record gaps (findings 1–2) must be closed by the generator before ready-merge; until then a
  resume from run artifacts alone would understate the run's actual gate status.

## Run metadata

Evaluator: OpenHands IMPL-EVAL, model openrouter/z-ai/glm-5.3-flash (OpenRouter), 2026-09-02,
run ID desktop-orpc-contract-dep--impl. Full evidence tables in evaluate.md (same directory as the
run's plan/worklog/context-pack).

OPENHANDS_VERDICT: FAIL_FIX