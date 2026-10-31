# Native service policy: current checkpoint

As of 2026-10-28, root has accepted the **U2 and U4 source checkpoints** and authorized their
commit, push and draft upstream PR. Independent IMPL evaluation, all-gates acceptance, EIS adoption,
release and merge remain outstanding. The original planning artifacts and failed verdict stay
intact; historical authorization/status text in them is superseded only by the explicit root
acceptance records below.

Read these current authorities first:

1. [Root U4 source acceptance](root-u4-source-acceptance.md),
   [U4 factual/rescope addendum](root-u4-factual-addendum.md),
   [U4 checkpoint and gates](u4-checkpoint.md), and
   [Root U2 source acceptance](root-u2-source-acceptance.md).
2. [Root accepted PLAN recheck](root-plan-recheck-acceptance.md),
   [accepted revision 5 plan](plan.md), [decisions](decisions.md),
   [independent PASS recheck](plan-eval-recheck1.md).
3. [U4 audited evidence manifest](evidence/u4-astra-20261028/manifest.json),
   [pre-acceptance U4 handoff](evidence/u4-astra-20261028/handoff.md),
   [U2 checkpoint and gates](u2-checkpoint.md),
   [audited evidence manifest](evidence/u2-astra-20261028/manifest.json), and the preserved
   [pre-acceptance implementation handoff](evidence/u2-astra-20261028/handoff.md).
4. [Original PLAN FAIL](plan-eval.md) and [prior drafts](prior-drafts/) for the revision history.

The run began at `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` in the isolated
`C:/Users/ericc/source/repos/netscript-native-service-policy-008` worktree. Native Astra handled
U2/U4 through the supported subagent seam after root dispatch; the prepared Fable fallback runner
was never launched. The earlier app-server/WSL diagnostic does not disqualify the native seam.

U4's preapproved 14-line debt delta is included only in the accepted U4 checkpoint, after its
bounded implementation. U2 remains commit `a4060f030af6ae98139cc7d0c8331161ed697a6a`. The twelve U4
source/test/doc owners include one narrowly authorized consumer oracle migration. Qualification
repairs are a separate prospective scope, requiring root review before implementation. No
dependency, lock, generated tooling, user worktree or product configuration change is included.
