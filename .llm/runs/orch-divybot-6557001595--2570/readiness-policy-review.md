# Supplemental IMPL-EVAL: readiness against the workflow policy (head 5842e30)

**Code verdict: PASS, unchanged.** No source changed, so I did not re-review it.

**Runtime: UNPROVEN, unchanged.** The local `scaffold.runtime` run exited 1 at `preflight.aspire`: Docker was unavailable and .NET was missing. That is an environment failure, not a code failure, and it is not a runtime PASS.

## 1. I'm withdrawing my earlier "no policy skip" claim for the runtime lane

The policy text does not support it.

- **The runtime lanes are not required checks.** `.github/workflows/e2e-cli.yml` lines 110–113 say: "These lanes are deliberately not required branch-protection checks. Required checks live in ci.yml … Release gates (publish, e2e-cli-prod*) have no skip."
- **Ordinary PRs don't run them, by a cost policy that has nothing to do with drafts.**
  - Lines 30–34: "these additive runtime/native lanes do not run on ordinary PRs. `e2e-cli-gate` opts a PR into the scaffold lanes … `ci:full` opts into both."
  - Lines 89–92: "Ordinary PRs schedule no runner in this workflow."
- **The gate expression has two separate conditions** (`classify.if`, lines 141–148):
  - line 144 is the draft guard;
  - lines 145–148 are the opt-in label gate: `e2e-cli-gate`, `desktop-native-gate` or `ci:full`, or a non-PR event.
- **The runtime jobs inherit that skip.** `scaffold-runtime` (line 309) and `scaffold-runtime-sqlite` only run if `needs.classify.result != 'skipped'`.

The terminal SKIPPED results in run 41308972670 (classify, scaffold-runtime, scaffold-runtime-sqlite) came from a draft event, so both conditions were false at once. That observation alone cannot isolate the label gate. However, the label gate is deterministic: on any later non-draft event with no labels, lines 145–148 are still false, so classify and both runtime tiers will still skip.

That is a genuine cost policy that applies regardless of draft status. It satisfies the owner's "skipped by workflow policy" branch for the runtime lane, and it is consistent with the owner's separate rule to run the runtime command or report UNPROVEN.

My earlier report was wrong to treat runtime UNPROVEN as something that blocks READY. Runtime stays UNPROVEN, is reported as such, and no longer blocks READY.

## 2. READY is still forbidden, for a different reason

The required checks themselves have not run yet. They were skipped because the PR is a draft, and that is not a policy skip.

- `.github/workflows/ci.yml` lines 29–30: "Draft PR pushes schedule no jobs. The full required-context set materializes on `ready_for_review` and every later non-draft PR event."
- Every required job is guarded on draft status:

  | Job | Line |
  |---|---|
  | `close-gate` | 62 |
  | classify | 115 |
  | `check-test-shard` | 181 |
  | `check-test` aggregator | 361 |
  | `quality` | 375 |
  | visibility | 612 |

- The real policy skip inside `ci.yml` (lines 18–26) is a step-level short-circuit that reports **SUCCESS**, and only after classify has succeeded. A job-level SKIPPED caused by the draft guard is not that.
- In `s4-workflow-policy-state.json`, `check-test`, `quality`, `close-gate` and ci classify are all SKIPPED for the draft reason. Code quality, Fresh UI quality, public-surface-diff and pr-metadata-gates are draft-skipped the same way. "Utility docs browser and style policy" was still IN_PROGRESS when the state was captured.

**What is missing:** the required set for head 5842e30 — at least `check-test`, `quality` and `close-gate`, plus any other contexts the `main-branch-protection` ruleset requires — must run on a non-draft event and finish green. A step-level policy short-circuit counts as green. The docs browser job must also finish. Local gate receipts don't replace these checks.

## 3. Next proof path

`ci.yml` has no `workflow_dispatch` trigger (lines 37–43), so the required contexts can only appear through `ready_for_review` or a later non-draft PR event.

**What would make READY truthful:**
1. Move the PR out of draft (`ready_for_review`). Add no labels.
2. Wait for the required set on 5842e30 to finish green.
3. Confirm the e2e-cli run for that non-draft event shows classify and both runtime tiers SKIPPED. That proves the label-policy skip on its own, without the draft guard.
4. Post READY on #2570 with the head, a statement that runtime is UNPROVEN, and the anchors above.

**Manual dispatch of e2e-cli is not needed for READY.** It is the authorized way to upgrade runtime from UNPROVEN to proven, if wanted.

**One process hazard for the supervisor.** The dispatcher text says the orchestrator auto-merges once CI is green. The owner's instruction is "STOP at READY; Cockpit merges." Leaving draft could therefore trigger a merge before READY is posted. The supervisor should settle which merge path applies before the transition. This session does not mark the PR ready.

## Recommendation

**Not READY now.** The runtime lane is no longer the blocker: its non-opt-in skip is a valid policy skip, and runtime stays reported as UNPROVEN. The blocker is that the required `ci.yml` checks were skipped only because of the draft, and they have not yet run and passed on head 5842e30.
