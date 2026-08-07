use harness

# Canary.15 W1-A — publish-budget and residue safety

You are the sole implementation writer and PR supervisor for W1-A. Work only in
`/home/codex/repos/ns005-c15-w1a-publish-safety` on branch
`fix/release-publish-budget-residue`, freshly based on `origin/main` at
`d6db645a89d830e6c36e838e8e1dac98fc84fde5`.

## SKILL

- `netscript-harness` — maintain the proportional run artifacts, commit trail, and gate evidence.
- `netscript-pr` — create one small draft PR directly against `main`, close #1312 and #1148 correctly, and maintain labels/milestone.
- `netscript-tools` — use trustworthy wrapper-sourced gates and preserve worktree/lock hygiene.
- `netscript-deno-toolchain` — use repository-native dependency/publication inspection; never registry curl loops.
- `netscript-release` — preserve canary immutability, OIDC-only publishing, publish-readiness, and release-gate semantics.
- `codex-wsl-remote` — keep this daemon-attached thread mobile-visible and respect one active writer.
- `rtk` — compress exploratory reads; do not use filtered output as final gate evidence.
- `jsr-audit` — apply the publication-safety rubric where this release-tooling change affects JSR behavior.

## Authoritative scope

Implement the tightly connected W1-A cluster only:

- #1312: make the canary lane check remaining JSR publish-attempt budget before minting a version; fail clearly before partial publication; distinguish partial-publish reporting from a pinned-E2E failure; document exact reset semantics and the chosen cadence response; document the policy for a partially published canary.
- #1148: widen the release-version residue scan to generated source assets that can embed the release version; demonstrate a seeded stale generated `.ts` negative case; retain documented exclusions for `.llm/tmp`, `.llm/runs`, `.data`, and `release/baselines`; measure and record scan cost/rationale.

Read both current issue bodies and current `origin/main` before locking the implementation. Treat their acceptance boxes as exact. Inspect existing release tools/tests/docs first and keep the change as small as possible. Do not absorb W1-B, W1-C, Billing Run, release publication, or orchestration machinery.

The owner explicitly authorized proportional pacing: this small W1 cluster may skip PLAN-EVAL. Record that written waiver in `supervisor.md`, `plan.md`, `worklog.md`, and `drift.md`; research/design artifacts and independent IMPL-EVAL are still mandatory.

## Required lifecycle

1. Confirm this worktree is clean except for the pre-staged run skeleton, has no upstream, and is exactly at the declared base. Do not touch any other worktree. In particular, never reuse or clean `/home/codex/repos/ns005-t2a-refresh.6hYJaW`, `/home/codex/repos/ns005-t2b-refresh.DMBKiM`, or any pre-existing residue/publish branch.
2. Preserve this worktree's `deno.lock`: do not stage, restore, delete, or regenerate it; never run reload/cache-clearing commands.
3. Re-query issues #1312/#1148 and research current code. Complete the run artifacts under `.llm/runs/fix-release-publish-budget-residue--w1a/`, including a concrete Design checkpoint and selected gate set.
4. Make the run bootstrap the first commit. Push with an explicit refspec (the branch intentionally has no upstream), then open one DRAFT PR with head `fix/release-publish-budget-residue` and base `main` in the same session. The body must use `Closes #1312` and `Closes #1148`, include truthful unchecked DoD boxes, the run-dir link, slices, validation, drift/debt, and fenced `acceptance-evidence` mappings as evidence becomes available.
5. Apply milestone `0.0.5` and namespaced labels including exactly one `status:` (`status:impl` while implementing), plus appropriate `type:`, `area:`, `priority:`, `wave:`, and `gate:` labels. Reconcile both issues to the active lifecycle without deleting unrelated labels.
6. Implement contract/tests first, then code/docs. Keep one or a few reviewable commit slices. After each slice, run its focused gate, commit, push explicitly, post the structured PR slice comment, and update `worklog.md` plus `context-pack.md` in the same slice.
7. Run the smallest trustworthy full gate set for changed release/tooling surfaces. Use wrapper-sourced type/lint/fmt evidence, focused tests, relevant release-readiness/dry-run/dependency/JSR gates, and record raw exit codes. Never publish locally. Do not run the expensive full CLI runtime E2E unless the changed surface or current-head CI proves it necessary.
8. Perform a substantive self-inspection but do not self-certify: do not write IMPL-EVAL PASS, do not mark ready for review, and do not merge. Stop only after implementation and generator gates are green, the draft PR/head is current, all run artifacts and slice comments are pushed, and you leave a concise handoff naming PR number, head SHA, changed files, gate receipts, residual risks, and the exact independent IMPL-EVAL command/route the orchestrator should run.

OpenHands is paused. Never trigger it. Repair only an actual current-head failing gate. Never repeat a valid PASS.
