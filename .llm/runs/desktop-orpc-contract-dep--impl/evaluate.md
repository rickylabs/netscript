# Evaluation: desktop fixture oRPC contract dependency (IMPL-EVAL)

Evaluator session: OpenHands IMPL-EVAL, 2026-09-02, model openrouter/z-ai/glm-5.3-flash (OpenRouter).
Reasoning effort is NOT attested (the OpenHands adapter does not expose effort identity).
Evaluated head: 45fbef54e360181d86358d91523e6a5467257ed0. Trusted base: 13bb9415e7f41ba24239940d17b8e7ad1162889c.
Branch head f8df31782 (post-dating the trigger head) was verified separately in throwaway worktrees and via CI read-back; it does not change the verdict.

## Prior evaluator deltas resolved by this pass

- "desktop-native-linux runtime acceptance unevidenced" (prior FAIL_FIX): RESOLVED. Run 33636093184
  is SUCCESS at exactly 45fbef54e (head verified on the run object, not the rollup). Run 33638728013
  is SUCCESS at f8df31782.
- "queue: max reversion" (prior finding 5): WITHDRAWN. The three-dot PR diff
  (merge-base(13bb9415e,45fbef54e)=37452f11f...45fbef54e) contains no workflow files. The apparent
  revert was an artifact of diffing against #1923's own merge commit (two-dot) instead of the
  merge-base.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL handled before implementation | PASS | plan.md D4 records PLAN-EVAL: N/A with justification; worklog slice 0 logs it before slice 1. Bounded repair; contract fully specified. FAIL_PLAN not applicable (plan is sound and implementation matches it). |
| Design checkpoint present | PASS | worklog "## Design" (Archetype 6, surface, vocabulary, ports, one-slice plan). |
| Commit slices match design | PASS | Slice 1 matches the design slice row; no speculative seams (three-dot diff touches exactly the planned five surfaces). |
| Scope/overlay compliance | PASS | packages/sdk/src/internal/transport-policy.ts untouched by the diff — no workaround/rollback of #1889 centralization. No plugins surface. |
| Archetype + debt handling | PASS | Archetype 6 owned harness; no debt delta; arch-debt.md unchanged and no new violation introduced. |

## Static Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| deno check (changed driver) | PASS | exit 0 at f8df31782 worktree: packages/cli/e2e/src/adapters/native-desktop/fixture-contract-driver.ts |
| deno fmt --check (changed driver) | PASS | exit 0 |
| deno lint (changed driver) | PASS | exit 0 |
| Wired guard as static lane | PASS | root deno.json check.dependencies includes check:desktop-native-fixture; check-test green at f8df31782 (run 33638728013). |

## Fitness Gates (measured by this evaluator, not accepted from prose)

- Positive, evaluated head: deno task check:desktop-native-fixture at 45fbef54e -> exit 0;
  "desktop fixture import map satisfies 14 reachable SDK modules; 0 unmapped specifiers."
- Non-vacuity, evaluated head: removing the '@orpc/contract' line from the PREPARED-map synthesis in
  packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts (line ~39) -> exit 1; restored ->
  exit 0. This probes the map the packaged app actually ships.
- Non-vacuity, branch head f8df31782: removing '@orpc/contract' from the committed fixture map
  packages/cli/e2e/fixtures/desktop-native/deno.json line 18 -> exit 1, naming
  "@orpc/contract — imported by packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts";
  restored -> exit 0. All probes ran in throwaway worktrees; evaluated tree left pristine
  (git status --porcelain = 0; deno.lock untouched; worktrees removed afterward).
- Novel-specifier probe: injecting `import probe from "@netscript/nonexistent-probe";` into
  packages/sdk/src/desktop/mod.ts -> exit 1 naming it; restored -> exit 0. A first attempt using a
  side-effect-only import (import "@netscript/nonexistent-probe";) exited 0 and is recorded as a
  guard regex calibration limitation (LOW, below), not as a guard pass.

## Runtime / Consumer Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| desktop-native-linux (deb + signed updater) at evaluated head | PASS | run 33636093184, head_commit 45fbef54e..., conclusion SUCCESS (API-read) |
| desktop-native-linux at branch head | PASS | run 33638728013, head f8df31782, conclusion SUCCESS (job 100276290969, 13:56:06Z-13:59:13Z) |
| Ordinary-PR lane includes the guard | PASS | required check lane green at f8df31782; check task wiring verified in deno.json |
| Lock hygiene | PASS | git diff 37452f11f 45fbef54e -- deno.lock = 0 lines; vs origin/main = 0 lines |

## Acceptance Criteria (issue #1926) at Evaluated Head

| Criterion | Status |
| --- | --- |
| Root cause precisely stated | PASS — path-mapped fixture graph bypasses packages/sdk/deno.json; #1889 moved transport-policy.ts (imports @orpc/contract) onto the desktop-reachable graph; the packaged bundle's import map is the named surface. |
| desktop-native-linux passes on a main-facing branch carrying #1889 | PASS at 45fbef54e (and re-proven at f8df31782). |
| Fix lives in the packaging/import surface | PASS — dependency declarations + prepared-workspace guard; no transport-policy rollback. |
| main-branch green run after fix lands | PENDING — cannot exist pre-merge; correctly left open. |
| Scheduling recommendation for desktop-native | PASS — recorded in plan "Open-Decision Sweep" + worklog "Deferred Scope". |

## Findings (severity-ranked)

1. HIGH — Run-artifact gate records are stale at the evaluated head and remain stale at f8df31782:
   worklog.md "## Gate Results" says "Pending implementation." and Progress still lists slice 0 as
   pending; context-pack.md "## Gates" lists Static/Fitness/Runtime/Consumer all "pending /
   implementation not started". The underlying evidence exists (CI runs above; guard probes) but a
   resume or audit gets none of it from the artifacts, which fails the last PASS criterion in
   verdict-definitions.md ("docs and run artifacts are updated enough for resume"). Required: one
   commit on the branch backfilling measured evidence into worklog.md Gate Results and context-pack.md
   Gates (guard probe results, static gates, run IDs/SHAs) and correcting the Progress line.
2. MEDIUM — Plan-vs-implementation drift is unrecorded: plan.md validation rows specify guard
   semantics the shipped guard contradicts (delete-from-checked-in-map probe and deno check
   orchestration; the staged map is synthesized from the workspace root and the checked-in map is
   discarded; the shipped guard asserts fixture-map coverage directly). Neither plan.md nor drift.md
   records the design change, and the vacuous first guard attempt (exit 0 both sides, per 45fbef54e's
   own commit message, fixed by f8df31782) is not recorded anywhere in the run artifacts. Required:
   update the plan rows or add a drift.md entry, including the vacuous-guard history.
3. LOW (non-blocking) — Guard regex scans value-import `from` forms only; side-effect-only bare
   imports (import "x") are invisible to it (evaluator probe: exit 0). #1926's defect class is
   covered; candidate hardening slice, not this repair.
4. LOW (non-blocking) — Tier-A slice-review receipt is not recorded in run artifacts; supervisor.md
   records the review mechanism (cloud evaluator automation + ci:full at ready-for-review), so this
   is a recording gap only.
5. INFO — Close-gate run 33638727913 FAIL on #1930 (unticked PR-body DoD boxes) is expected at this
   stage, not a defect. Tick the boxes only after findings 1-2 land and with run links; then
   status:ready-merge per netscript-pr. Issue #1926's main-branch criterion stays open until
   post-merge by construction.
6. INFO — Base-relatedness: 13bb9415e is a sibling of the head's merge base (37452f11f), not an
   ancestor; the only separating commit (#1923) touches two workflow files, a workflow test, and run
   artifacts — zero overlap with this branch's changed surface, so the trusted base remains valid for
   protocol reading and for evaluating the change.

## False-Done Sweep

- The generator's original guard was vacuous (exit 0 both sides) and its own 45fbef54e commit message
  admits it; f8df31782 fixes the probe target. This evaluator re-proved non-vacuity at both heads
  (see Fitness Gates). Residual defect is the unrecorded history (finding 2), not the shipped code.
- No profile false-done state present in the shipped implementation itself.

## Result

The plan is valid and the implementation is functionally correct, runtime-accepted at both heads,
lock-clean, and doctrine-clean. What blocks PASS is artifact bookkeeping: stale worklog/context-pack
gate tables (finding 1) and unrecorded plan/drift history (finding 2). FAIL_PLAN was considered and
rejected — the plan is not incomplete or unsound; the defects are implementation-of-artifacts, i.e.
FAIL_FIX per verdict-definitions.md. Required remediation is one bookkeeping commit; no code changes
are required by this evaluation.

OPENHANDS_VERDICT: FAIL_FIX